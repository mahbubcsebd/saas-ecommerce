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
  Phone,
  Video,
  ThumbsUp,
  MessageCircleCode,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import React, { useEffect, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
// import { toast } from "react-hot-toast";

const playNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    const now = ctx.currentTime;

    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(880.00, now + 0.1); // A5

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.start(now);
    osc.stop(now + 0.45);
  } catch (error) {
    console.error('Failed to play synthesized sound:', error);
  }
};

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { socket, isConnected, chatUnreadCount } = useSocket();
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
    if (!socket || !session) return;

    const handleGlobalNewMessage = (message: any) => {
      // If already open, the local socket listener handles real-time appends
      if (isOpen) return;

      if (message.senderId !== session.user?.id) {
        playNotificationSound();
        if (!conversation) {
          initChat();
        }
        setIsOpen(true);
        toast.info('New Message from Support', {
          description: message.message || 'You received a new message.',
        });
      }
    };

    socket.on('chat:message:new', handleGlobalNewMessage);

    return () => {
      socket.off('chat:message:new', handleGlobalNewMessage);
    };
  }, [socket, session, isOpen, conversation]);

  useEffect(() => {
    if (!socket || !conversation) return;

    socket.emit('chat:join', conversation.id);

    const handleNewMessage = (message: any) => {
      if (message.conversationId === conversation.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });

        // Play notification sound if received from support
        if (message.senderId !== session?.user?.id) {
          playNotificationSound();

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

  const sendThumbsUp = () => {
    if (!socket || !conversation) return;
    socket.emit('chat:message', {
      conversationId: conversation.id,
      message: '👍',
      replyToId: null,
      type: 'TEXT',
    });
  };

  if (!session) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      {!isOpen ? (
        <button
          className="h-14 w-14 rounded-full shadow-[0_8px_30px_rgba(124,58,237,0.4)] bg-gradient-to-br from-[#7C3AED] via-[#8B5CF6] to-[#C084FC] hover:scale-115 active:scale-95 transition-all text-white flex items-center justify-center cursor-pointer border border-white/10 hover:shadow-[0_8px_30px_rgba(124,58,237,0.6)] duration-300 relative group"
          onClick={() => setIsOpen(true)}
        >
          <MessageCircleCode />
          {chatUnreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 h-5.5 w-5.5 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center animate-bounce shadow-md border-2 border-white dark:border-slate-900 px-1">
              {chatUnreadCount}
            </span>
          )}
        </button>
      ) : (
        <Card className="w-80 sm:w-[360px] h-[520px] flex flex-col shadow-[0_12px_40px_rgba(0,0,0,0.6)] border border-slate-900 overflow-hidden animate-in slide-in-from-bottom-8 duration-300 rounded-[18px] bg-black text-white">
          <CardHeader className="bg-black border-b border-slate-900 p-3.5 flex flex-row items-center justify-between shadow-sm z-10">
            <div className="flex items-center gap-3">
              <div className="relative cursor-pointer" onClick={() => toast.info('Support profile details.')}>
                <Avatar className="h-9 w-9 border border-slate-800">
                  <AvatarFallback className="bg-gradient-to-br from-[#7C3AED] to-[#C084FC] text-white font-bold text-sm">S</AvatarFallback>
                </Avatar>
                <span
                  className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-black ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}
                ></span>
              </div>
              <div>
                <h3 className="font-bold text-white text-sm leading-tight">Live Support</h3>
                <p className="text-[10px] text-slate-400 font-semibold tracking-wide">
                  {isConnected ? 'Active now' : 'Connecting...'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-[#8B5CF6] hover:bg-slate-900 rounded-full"
                onClick={() => toast.info('Voice calls are coming soon!')}
              >
                <Phone className="h-4.5 w-4.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-[#8B5CF6] hover:bg-slate-900 rounded-full"
                onClick={() => toast.info('Video calls are coming soon!')}
              >
                <Video className="h-4.5 w-4.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-900 rounded-full"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent
            className="flex-1 p-0 overflow-hidden flex flex-col bg-black relative"
            {...getRootProps()}
          >
            <input {...getInputProps()} />
            {isDragActive && (
              <div className="absolute inset-0 bg-[#8B5CF6]/10 backdrop-blur-[1px] z-50 flex items-center justify-center border-2 border-dashed border-[#8B5CF6] m-2 rounded-xl pointer-events-none">
                <div className="bg-slate-900 p-4 rounded-2xl shadow-xl flex flex-col items-center gap-2 animate-in zoom-in-95 duration-200">
                  <div className="h-12 w-12 bg-[#8B5CF6]/10 rounded-full flex items-center justify-center">
                    <Paperclip className="h-6 w-6 text-[#8B5CF6]" />
                  </div>
                  <p className="font-bold text-sm text-white">Drop to upload</p>
                </div>
              </div>
            )}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-[#8B5CF6]" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-16 px-6 space-y-3">
                  <p className="text-xl font-bold text-white">
                    Hi {session.user.name?.split(' ')[0]}! 👋
                  </p>
                  <p className="text-sm text-slate-400">
                    Ask us anything! Our support team typically responds in a few minutes.
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
                        className={`group relative flex items-end gap-2 max-w-[82%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        <div className="flex flex-col gap-0.5">
                          {m.replyTo && (
                            <div
                              className={`text-[10px] p-2 px-3 mb-[-6px] rounded-t-[14px] opacity-60 line-clamp-1 border-l-2 ${isOwn ? 'bg-slate-900 border-[#8B5CF6] text-[#C084FC]' : 'bg-slate-800 border-slate-600'}`}
                            >
                              {m.replyTo.message}
                            </div>
                          )}
                          <div
                            className={`relative p-3 px-4 rounded-[18px] text-[13.5px] shadow-sm transition-all leading-relaxed ${isOwn
                              ? 'bg-[#7C3AED] text-white rounded-br-sm'
                              : 'bg-slate-900 text-slate-100 rounded-bl-sm border border-slate-800'
                              } ${m.isDeleted ? 'italic opacity-50' : ''}`}
                          >
                            {m.type === 'IMAGE' ? (
                              <img
                                src={m.attachments[0]}
                                alt="attachment"
                                className="rounded-lg max-w-full hover:opacity-95 transition-opacity cursor-zoom-in"
                                onClick={() => window.open(m.attachments[0], '_blank')}
                              />
                            ) : m.type === 'FILE' ? (
                              <a
                                href={m.attachments[0]}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 underline"
                              >
                                <FileIcon className="h-4 w-4" /> {m.message}
                              </a>
                            ) : (
                              m.message
                            )}

                            {m.reactions?.length > 0 && (
                              <div
                                className={`absolute -bottom-2.5 ${isOwn ? 'right-1' : 'left-1'} flex gap-1 z-20`}
                              >
                                {m.reactions.map((r: any, i: number) => (
                                  <div
                                    key={i}
                                    className="bg-slate-900 border border-slate-850 text-[10px] rounded-full px-1.5 py-0.5 shadow-sm font-bold scale-90 text-white"
                                  >
                                    {r.emoji} {r.userIds.length}
                                  </div>
                                ))}
                              </div>
                            )}

                            {!m.isDeleted && (
                              <div
                                className={`absolute top-1/2 -translate-y-1/2 ${isOwn ? 'right-[calc(100%+10px)]' : 'left-[calc(100%+10px)]'} hidden group-hover:flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-full shadow-lg z-30 animate-in fade-in zoom-in-95 duration-200`}
                              >
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 rounded-full hover:bg-slate-800"
                                  onClick={() => setReplyTo(m)}
                                >
                                  <Reply className="h-3.5 w-3.5 text-slate-400" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 rounded-full hover:bg-slate-800 text-red-500"
                                  onClick={() => handleReact(m.id, '❤️')}
                                >
                                  ❤️
                                </Button>
                                {isOwn && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 rounded-full hover:bg-slate-800"
                                      onClick={() => {
                                        setEditingId(m.id);
                                        setInput(m.message);
                                      }}
                                    >
                                      <Pencil className="h-3 w-3 text-slate-400" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 rounded-full hover:bg-red-950/40 text-red-500"
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
                      <div className="flex items-center gap-1.5 mt-1 px-1">
                        <span className="text-[9px] text-slate-500 font-semibold">
                          {format(new Date(m.createdAt), 'hh:mm a')}
                        </span>
                        {showSeen && (
                          <span className="text-[9px] text-[#8B5CF6] font-bold flex items-center gap-0.5">
                            <CheckCheck className="h-2.5 w-2.5" /> Seen
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              {isTyping && (
                <div className="flex gap-2 items-center animate-pulse">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="bg-slate-800 text-[8px] font-bold">S</AvatarFallback>
                  </Avatar>
                  <div className="bg-slate-900 py-2 px-3 rounded-[16px] rounded-tl-none flex gap-1 shadow-sm border border-slate-800">
                    <span className="h-1.5 w-1.5 bg-[#8B5CF6] rounded-full animate-bounce"></span>
                    <span className="h-1.5 w-1.5 bg-[#8B5CF6] rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="h-1.5 w-1.5 bg-[#8B5CF6] rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>

          <CardFooter className="p-3.5 border-t border-slate-900 bg-black shadow-[0_-5px_15px_rgba(0,0,0,0.2)]">
            <div className="flex flex-col w-full gap-2">
              {replyTo && (
                <div className="flex items-center justify-between p-2 px-3 bg-slate-900 rounded-lg border-l-4 border-[#8B5CF6] text-[11px] mb-1 animate-in slide-in-from-bottom-2">
                  <span className="truncate flex-1 text-slate-350">Replying to: {replyTo.message}</span>
                  <X
                    className="h-3.5 w-3.5 cursor-pointer ml-2 hover:text-red-500"
                    onClick={() => setReplyTo(null)}
                  />
                </div>
              )}

              {/* Pending Files Queue */}
              {pendingFiles.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2 bg-slate-900 rounded-lg border border-slate-800 shadow-inner mb-1 animate-in slide-in-from-bottom-2">
                  {pendingFiles.map((file, i) => (
                    <div
                      key={i}
                      className="relative group w-12 h-12 rounded-lg overflow-hidden bg-slate-900 border border-slate-800"
                    >
                      {file.type.startsWith('image/') ? (
                        <img
                          src={URL.createObjectURL(file)}
                          alt="preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-0.5">
                          <FileIcon className="h-4 w-4 opacity-40 text-slate-400" />
                          <span className="text-[6px] truncate w-full text-center px-1 font-medium">
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
                    <div className="w-12 h-12 flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin text-[#8B5CF6]" />
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
                    className="h-9 w-9 text-[#8B5CF6] hover:bg-slate-900 rounded-full"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="h-4.5 w-4.5" />
                  </Button>
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-9 w-9 rounded-full ${showEmojiPicker ? 'text-[#8B5CF6] bg-slate-900' : 'text-[#8B5CF6] hover:bg-slate-900'}`}
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    >
                      <Smile className="h-4.5 w-4.5" />
                    </Button>
                    {showEmojiPicker && (
                      <div className="absolute bottom-full left-0 mb-2 p-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 animate-in slide-in-from-bottom-2 grid grid-cols-4 gap-1 min-w-[150px]">
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
                            className="p-1.5 hover:bg-slate-800 rounded-lg text-base transition-transform hover:scale-125 cursor-pointer"
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
                  placeholder={editingId ? 'Update message...' : 'Aa'}
                  className="flex-1 h-9 rounded-full bg-slate-900 border border-slate-800 focus-visible:ring-1 focus-visible:ring-[#8B5CF6]/20 text-sm shadow-none px-4 text-white placeholder-slate-500"
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

                {!input.trim() && pendingFiles.length === 0 ? (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 rounded-full text-[#8B5CF6] hover:bg-slate-900 hover:text-[#8B5CF6] shrink-0"
                    onClick={sendThumbsUp}
                  >
                    <ThumbsUp className="h-5 w-5 fill-[#8B5CF6]" />
                  </Button>
                ) : (
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={uploading}
                    className="h-9 w-9 rounded-full text-[#8B5CF6] hover:bg-slate-900 shrink-0"
                    onClick={sendMessage}
                  >
                    {uploading ? (
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5 fill-[#8B5CF6]" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default ChatWidget;
