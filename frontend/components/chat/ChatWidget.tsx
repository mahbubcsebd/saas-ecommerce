'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useSocket } from '@/context/SocketContext';
import { format } from 'date-fns';
import {
  CheckCheck,
  FileIcon,
  Loader2,
  MessageCircle,
  Paperclip,
  Pencil,
  Reply,
  Send,
  Smile,
  Trash2,
  X,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import React, { useEffect, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
// import { toast } from "react-hot-toast";

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { socket, isConnected } = useSocket();
  const { data: session } = useSession();

  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [conversation, setConversation] = useState<any>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Advanced features state
  const [replyTo, setReplyTo] = useState<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isOpen && session && !conversation) {
      initChat();
    }
  }, [isOpen, session]);

  useEffect(() => {
    if (!socket || !conversation) return;

    socket.emit('chat:join', conversation.id);

    const handleNewMessage = (message: any) => {
      if (message.conversationId === conversation.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
        if (isOpen && message.senderId !== session?.user?.id) {
          socket.emit('chat:read', {
            conversationId: conversation.id,
            messageId: message.id,
          });
        }
      }
    };

    const handleUpdated = (message: any) => {
      setMessages((prev) => prev.map((m) => (m.id === message.id ? message : m)));
    };

    const handleDeleted = ({ messageId }: any) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, isDeleted: true, message: 'Deleted' } : m))
      );
    };

    const handleReacted = ({ messageId, reactions }: any) => {
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, reactions } : m)));
    };

    const handleReadStatus = ({ messageId }: any) => {
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, isRead: true } : m)));
    };

    socket.on('chat:message:new', handleNewMessage);
    socket.on('chat:message:updated', handleUpdated);
    socket.on('chat:message:deleted', handleDeleted);
    socket.on('chat:message:reacted', handleReacted);
    socket.on('chat:read', handleReadStatus);

    socket.on('chat:typing', ({ userId }: any) => {
      if (userId !== session?.user?.id) setIsTyping(true);
    });

    socket.on('chat:stop-typing', ({ userId }: any) => {
      if (userId !== session?.user?.id) setIsTyping(false);
    });

    return () => {
      socket.off('chat:message:new');
      socket.off('chat:message:updated');
      socket.off('chat:message:deleted');
      socket.off('chat:message:reacted');
      socket.off('chat:read');
      socket.off('chat:typing');
      socket.off('chat:stop-typing');
    };
  }, [socket, conversation, isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    const handler = () => setIsOpen(true);
    if (typeof window !== 'undefined') window.addEventListener('open-chat', handler as any);
    return () => {
      if (typeof window !== 'undefined') window.removeEventListener('open-chat', handler as any);
    };
  }, []);

  const initChat = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chat/conversations/get-or-create`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
          },
          body: JSON.stringify({}),
        }
      );
      const data = await res.json();
      if (data.success) {
        setConversation(data.data);
        fetchMessages(data.data.id);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (id: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chat/conversations/${id}/messages`,
        {
          headers: {
            ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
          },
        }
      );
      const data = await res.json();
      if (data.success) {
        setMessages(data.data);
        if (data.data.length > 0) {
          const last = data.data[data.data.length - 1];
          if (!last.isRead && last.senderId !== session?.user?.id) {
            socket?.emit('chat:read', {
              conversationId: id,
              messageId: last.id,
            });
          }
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const onDrop = (acceptedFiles: File[]) => {
    setPendingFiles((prev) => [...prev, ...acceptedFiles]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
  });

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const sendMessage = async () => {
    if ((!input.trim() && pendingFiles.length === 0) || !socket || !conversation) return;

    if (editingId) {
      socket.emit('chat:edit', { messageId: editingId, message: input });
      setEditingId(null);
      setInput('');
      return;
    }

    // Upload files if any
    let attachments: string[] = [];
    if (pendingFiles.length > 0) {
      setUploading(true);
      const formData = new FormData();
      pendingFiles.forEach((file) => formData.append('files', file));

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session?.accessToken ? `Bearer ${session.accessToken}` : ''}`,
          },
          body: formData,
        });
        const data = await res.json();
        if (data.success) {
          attachments = data.data.map((f: any) => f.url);
          socket.emit('chat:message', {
            conversationId: conversation.id,
            message:
              input || (attachments.length === 1 ? pendingFiles[0].name : 'Sent multiple files'),
            replyToId: replyTo?.id || null,
            attachments: attachments,
            type:
              attachments.length > 0
                ? pendingFiles[0].type.startsWith('image/')
                  ? 'IMAGE'
                  : 'FILE'
                : 'TEXT',
          });
        }
      } catch (error) {
        toast.error('Upload failed');
      } finally {
        setUploading(false);
      }
    } else {
      socket.emit('chat:message', {
        conversationId: conversation.id,
        message: input,
        replyToId: replyTo?.id || null,
        type: 'TEXT',
      });
    }

    setInput('');
    setReplyTo(null);
    setPendingFiles([]);
    socket.emit('chat:stop-typing', conversation.id);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setPendingFiles((prev) => [...prev, ...Array.from(files)]);
  };

  const handleReact = (messageId: string, emoji: string) => {
    socket?.emit('chat:react', { messageId, emoji });
  };

  if (!session) return null;

  return (
    <div className="fixed bottom-6 right-6 z-100">
      {!isOpen ? (
        <Button
          size="icon"
          className="h-14 w-14 rounded-full shadow-2xl bg-blue-600 hover:bg-blue-700 transition-all scale-110"
          onClick={() => setIsOpen(true)}
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      ) : (
        <Card className="w-80 sm:w-96 h-[550px] flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.2)] border-0 overflow-hidden animate-in slide-in-from-bottom-10 rounded-2xl">
          <CardHeader className="bg-blue-600 text-white p-4 flex flex-row items-center justify-between shadow-md z-10">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-9 w-9 border-2 border-white/20">
                  <AvatarFallback>S</AvatarFallback>
                </Avatar>
                <span
                  className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-blue-600 ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}
                ></span>
              </div>
              <div>
                <h3 className="font-bold text-sm leading-none mb-1">Live Support</h3>
                <p className="text-[10px] opacity-80 uppercase tracking-wider font-semibold">
                  {isConnected ? 'Active Now' : 'Reconnecting...'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/10 rounded-full"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </CardHeader>
          <CardContent
            className="flex-1 p-0 overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-900/50 relative"
            {...getRootProps()}
          >
            <input {...getInputProps()} />
            {isDragActive && (
              <div className="absolute inset-0 bg-blue-600/10 backdrop-blur-[1px] z-50 flex items-center justify-center border-2 border-dashed border-blue-600 m-2 rounded-xl pointer-events-none">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl flex flex-col items-center gap-2 animate-in zoom-in-95 duration-200">
                  <div className="h-12 w-12 bg-blue-600/10 rounded-full flex items-center justify-center">
                    <Paperclip className="h-6 w-6 text-blue-600" />
                  </div>
                  <p className="font-bold text-sm">Drop here</p>
                </div>
              </div>
            )}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-20 px-6 space-y-2">
                  <p className="font-bold text-slate-800 dark:text-white">
                    Hi {session.user.name?.split(' ')[0]}! 👋
                  </p>
                  <p className="text-sm text-slate-500">
                    Our team typically responds in a few minutes.
                  </p>
                </div>
              ) : (
                messages.map((m, index) => {
                  const isOwn = m.senderId === session.user.id;
                  const showSeen = isOwn && m.isRead && index === messages.length - 1;
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`group relative flex items-end gap-2 max-w-[85%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        <div className="flex flex-col gap-0.5">
                          {m.replyTo && (
                            <div
                              className={`text-[10px] p-2 mb-[-6px] rounded-t-xl opacity-60 line-clamp-1 border-l-2 ${isOwn ? 'bg-blue-100 dark:bg-blue-900/20 border-blue-600 text-blue-900' : 'bg-slate-200 border-slate-400'}`}
                            >
                              {m.replyTo.message}
                            </div>
                          )}
                          <div
                            className={`relative p-3 rounded-2xl text-[13px] shadow-sm transition-all ${
                              isOwn
                                ? 'bg-blue-600 text-white rounded-tr-none'
                                : 'bg-white dark:bg-slate-800 rounded-tl-none border border-slate-200/50'
                            } ${m.isDeleted ? 'italic opacity-50' : ''}`}
                          >
                            {m.type === 'IMAGE' ? (
                              <img
                                src={m.attachments[0]}
                                alt="img"
                                className="rounded-lg max-w-full"
                              />
                            ) : m.type === 'FILE' ? (
                              <a
                                href={m.attachments[0]}
                                target="_blank"
                                className="flex items-center gap-2 underline"
                              >
                                <FileIcon className="h-4 w-4" /> {m.message}
                              </a>
                            ) : (
                              m.message
                            )}

                            {m.reactions?.length > 0 && (
                              <div
                                className={`absolute -bottom-2.5 ${isOwn ? 'right-0' : 'left-0'} flex gap-1`}
                              >
                                {m.reactions.map((r: any, i: number) => (
                                  <div
                                    key={i}
                                    className="bg-white border text-[9px] rounded-full px-1 shadow-sm font-bold"
                                  >
                                    {r.emoji} {r.userIds.length}
                                  </div>
                                ))}
                              </div>
                            )}

                            {!m.isDeleted && (
                              <div
                                className={`absolute top-1/2 -translate-y-1/2 ${isOwn ? 'right-[calc(100%+8px)]' : 'left-[calc(100%+8px)]'} hidden group-hover:flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-full shadow-lg z-10 border border-slate-200/50 animate-in fade-in zoom-in-95 duration-200 before:content-[''] before:absolute ${isOwn ? 'before:-right-4 before:left-0' : 'before:-left-4 before:right-0'} before:top-0 before:bottom-0 before:bg-transparent`}
                              >
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 rounded-full hover:bg-slate-100"
                                  onClick={() => setReplyTo(m)}
                                >
                                  <Reply className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 rounded-full hover:bg-slate-100"
                                  onClick={() => handleReact(m.id, '❤️')}
                                >
                                  <Smile className="h-3.5 w-3.5" />
                                </Button>
                                {isOwn && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 rounded-full hover:bg-slate-100"
                                      onClick={() => {
                                        setEditingId(m.id);
                                        setInput(m.message);
                                      }}
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 rounded-full hover:bg-red-50 text-red-500"
                                      onClick={() => socket?.emit('chat:delete', m.id)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-[9px] opacity-40 uppercase font-bold tracking-tighter">
                          {format(new Date(m.createdAt), 'hh:mm a')}
                        </span>
                        {showSeen && (
                          <span className="text-[9px] text-blue-600 font-bold flex items-center gap-0.5">
                            <CheckCheck className="h-2 w-2" /> Seen
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              {isTyping && (
                <div className="flex gap-2 items-center">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback>S</AvatarFallback>
                  </Avatar>
                  <div className="bg-white dark:bg-slate-800 py-2 px-3 rounded-2xl rounded-tl-none flex gap-1 shadow-sm border border-slate-100">
                    <span className="h-1.5 w-1.5 bg-blue-600 rounded-full animate-bounce"></span>
                    <span className="h-1.5 w-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="h-1.5 w-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>

          <CardFooter className="p-3 border-t bg-white dark:bg-slate-900 shadow-[0_-5px_15px_rgba(0,0,0,0.02)]">
            <div className="flex flex-col w-full gap-2">
              {replyTo && (
                <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border-l-4 border-blue-600 text-[11px] shadow-inner mb-2 animate-in slide-in-from-bottom-2">
                  <span className="truncate flex-1">Replying to: {replyTo.message}</span>
                  <X
                    className="h-3 w-3 cursor-pointer ml-2 hover:text-red-500"
                    onClick={() => setReplyTo(null)}
                  />
                </div>
              )}

              {/* Pending Files Queue */}
              {pendingFiles.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border shadow-inner mb-2 animate-in slide-in-from-bottom-2">
                  {pendingFiles.map((file, i) => (
                    <div
                      key={i}
                      className="relative group w-14 h-14 rounded-lg overflow-hidden bg-white dark:bg-slate-700 border border-slate-200/50"
                    >
                      {file.type.startsWith('image/') ? (
                        <img
                          src={URL.createObjectURL(file)}
                          alt="preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-0.5">
                          <FileIcon className="h-5 w-5 opacity-40" />
                          <span className="text-[7px] truncate w-full text-center px-1 font-medium">
                            {file.name}
                          </span>
                        </div>
                      )}
                      <button
                        onClick={() => removePendingFile(i)}
                        className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-2 w-2" />
                      </button>
                    </div>
                  ))}
                  {uploading && (
                    <div className="w-14 h-14 flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    </div>
                  )}
                </div>
              )}
              <div className="flex gap-2 items-center">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  multiple
                  onChange={handleFileUpload}
                />
                <div className="flex items-center gap-0.5 relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-slate-400 hover:text-blue-600"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="h-4.5 w-4.5" />
                  </Button>
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-9 w-9 ${showEmojiPicker ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-blue-600'}`}
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    >
                      <Smile className="h-4.5 w-4.5" />
                    </Button>
                    {showEmojiPicker && (
                      <div className="absolute bottom-full left-0 mb-2 p-1.5 bg-white dark:bg-slate-800 border rounded-xl shadow-2xl z-50 animate-in slide-in-from-bottom-2 grid grid-cols-4 gap-1 min-w-[140px]">
                        {[
                          '❤️',
                          '👍',
                          '😊',
                          '😂',
                          '😮',
                          '😢',
                          '🔥',
                          '👏',
                          '🤝',
                          '🙌',
                          '✨',
                          '⭐',
                        ].map((emoji) => (
                          <button
                            key={emoji}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-base transition-transform hover:scale-125"
                            onClick={() => {
                              setInput((prev) => prev + emoji);
                              setShowEmojiPicker(false);
                            }}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <Input
                  placeholder={editingId ? 'Update message...' : 'Message...'}
                  className="flex-1 h-10 rounded-full bg-slate-50 dark:bg-slate-800 border-0 focus-visible:ring-1 focus-visible:ring-blue-600 text-sm shadow-none px-3"
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    socket?.emit('chat:typing', conversation.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <Button
                  size="icon"
                  disabled={uploading}
                  className={`h-9 w-9 rounded-full shadow-lg shrink-0 transition-all ${editingId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                  onClick={sendMessage}
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : editingId ? (
                    <X className="h-4.5 w-4.5" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default ChatWidget;
