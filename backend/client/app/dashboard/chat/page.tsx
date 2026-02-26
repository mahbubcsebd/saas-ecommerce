"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSocket } from "@/context/SocketContext";
import { format } from "date-fns";
import {
    CheckCheck, FileIcon,
    MessageCircle, MoreVertical, Paperclip,
    Pencil,
    Phone,
    Reply,
    Search, Send,
    Smile,
    Trash2,
    Video,
    X
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
// import { toast } from "react-hot-toast";

export default function ChatPage() {
    const { socket, isConnected } = useSocket();
    const { data: session } = useSession();
    const searchParams = useSearchParams();
    const router = useRouter();

    const [conversations, setConversations] = useState<any[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Advanced features state
    const [replyTo, setReplyTo] = useState<any>(null);
    const [editingMessage, setEditingMessage] = useState<any>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const activeConversation = conversations.find(c => c.id === selectedId);

    useEffect(() => {
        fetchConversations();
    }, []);

    useEffect(() => {
        const id = searchParams.get('id');
        if (id) setSelectedId(id);
    }, [searchParams]);

    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (message: any) => {
            if (message.conversationId === selectedId) {
                setMessages(prev => {
                    if (prev.some(m => m.id === message.id)) return prev;
                    return [...prev, message];
                });
                // Mark as read if active
                socket.emit("chat:read", { conversationId: selectedId, messageId: message.id });
            }

            setConversations(prev => {
                const existingIndex = prev.findIndex(c => c.id === message.conversationId);
                const updated = [...prev];
                if (existingIndex > -1) {
                    updated[existingIndex] = {
                        ...updated[existingIndex],
                        lastMessage: message.type === 'TEXT' ? message.message : `[${message.type}]`,
                        lastMessageAt: message.createdAt
                    };
                    const [item] = updated.splice(existingIndex, 1);
                    return [item, ...updated];
                } else {
                    fetchConversations();
                    return prev;
                }
            });
        };

        const handleUpdatedMessage = (message: any) => {
            setMessages(prev => prev.map(m => m.id === message.id ? message : m));
        };

        const handleDeletedMessage = ({ messageId }: { messageId: string }) => {
            setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isDeleted: true, message: "This message was deleted" } : m));
        };

        const handleReactedMessage = ({ messageId, reactions }: { messageId: string, reactions: any }) => {
            setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions } : m));
        };

        const handleReadStatus = ({ messageId, userId }: { messageId: string, userId: string }) => {
            setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isRead: true, readAt: new Date() } : m));
        };

        socket.on("chat:message:new", handleNewMessage);
        socket.on("chat:message:updated", handleUpdatedMessage);
        socket.on("chat:message:deleted", handleDeletedMessage);
        socket.on("chat:message:reacted", handleReactedMessage);
        socket.on("chat:read", handleReadStatus);

        return () => {
            socket.off("chat:message:new");
            socket.off("chat:message:updated");
            socket.off("chat:message:deleted");
            socket.off("chat:message:reacted");
            socket.off("chat:read");
        };
    }, [socket, selectedId]);

    useEffect(() => {
        if (selectedId) {
            fetchMessages(selectedId);
            if (socket) socket.emit("chat:join", selectedId);
        }
    }, [selectedId, socket]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const fetchConversations = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/conversations`, {
                headers: { ...(session?.accessToken ? { 'Authorization': `Bearer ${session.accessToken}` } : {}) }
            });
            const data = await res.json();
            if (data.success) setConversations(data.data);
        } catch (error) { console.error(error); }
    };

    const fetchMessages = async (id: string) => {
        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/conversations/${id}/messages`, {
                headers: { ...(session?.accessToken ? { 'Authorization': `Bearer ${session.accessToken}` } : {}) }
            });
            const data = await res.json();
            if (data.success) {
                setMessages(data.data);
                if (data.data.length > 0) {
                   const lastMessage = data.data[data.data.length - 1];
                   if (!lastMessage.isRead && lastMessage.senderId !== session?.user?.id) {
                       socket?.emit("chat:read", { conversationId: id, messageId: lastMessage.id });
                   }
                }
            }
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    const onDrop = (acceptedFiles: File[]) => {
        setPendingFiles(prev => [...prev, ...acceptedFiles]);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        noClick: true,
        noKeyboard: true
    });

    const removePendingFile = (index: number) => {
        setPendingFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSendMessage = async () => {
        if ((!input.trim() && pendingFiles.length === 0) || !socket || !selectedId) return;

        if (editingMessage) {
            socket.emit("chat:edit", { messageId: editingMessage.id, message: input });
            setEditingMessage(null);
            setInput("");
            return;
        }

        // Upload files if any
        let attachments: string[] = [];
        if (pendingFiles.length > 0) {
            setUploading(true);
            const formData = new FormData();
            pendingFiles.forEach(file => formData.append('files', file));

            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${session?.accessToken ? `Bearer ${session.accessToken}` : ''}` },
                    body: formData
                });
                const data = await res.json();
                if (data.success) {
                    attachments = data.data.map((f: any) => f.url);

                    // If multiple files and no text, send them individually or as one message?
                    // Usually as one message with multiple attachments if the backend supports it.
                    socket.emit("chat:message", {
                        conversationId: selectedId,
                        message: input || (attachments.length === 1 ? pendingFiles[0].name : "Sent multiple files"),
                        replyToId: replyTo?.id || null,
                        attachments: attachments,
                        type: attachments.length > 0 ? (pendingFiles[0].type.startsWith('image/') ? 'IMAGE' : 'FILE') : 'TEXT'
                    });
                }
            } catch (error) {
                toast.error("Upload failed");
            } finally {
                setUploading(false);
            }
        } else {
            socket.emit("chat:message", {
                conversationId: selectedId,
                message: input,
                replyToId: replyTo?.id || null,
                type: 'TEXT'
            });
        }

        setInput("");
        setReplyTo(null);
        setPendingFiles([]);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        setPendingFiles(prev => [...prev, ...Array.from(files)]);
    };

    const handleReact = (messageId: string, emoji: string) => {
        socket?.emit("chat:react", { messageId, emoji });
    };

    return (
        <div {...getRootProps()} className="flex h-[calc(100vh-140px)] bg-background border rounded-lg overflow-hidden relative">
            <input {...getInputProps()} />
            {isDragActive && (
                <div className="absolute inset-0 bg-primary/10 backdrop-blur-[2px] z-50 flex items-center justify-center border-2 border-dashed border-primary m-2 rounded-lg pointer-events-none">
                    <div className="bg-background p-6 rounded-2xl shadow-xl flex flex-col items-center gap-3 animate-in zoom-in-95 duration-200">
                        <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
                            <Paperclip className="h-8 w-8 text-primary" />
                        </div>
                        <p className="font-bold text-lg">Drop files to send</p>
                    </div>
                </div>
            )}
            {/* Sidebar */}
            <div className="w-80 border-r flex flex-col bg-muted/20">
                <div className="p-4 border-b">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search chats..." className="pl-9 bg-background" />
                    </div>
                </div>
                <ScrollArea className="flex-1">
                    {conversations.map((c) => {
                        const otherParticipant = c.participants.find((p: any) => p.id !== session?.user?.id);
                        return (
                            <div
                                key={c.id}
                                className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-muted/50 transition-colors ${selectedId === c.id ? 'bg-muted' : ''}`}
                                onClick={() => setSelectedId(c.id)}
                            >
                                <div className="relative">
                                    <Avatar>
                                        <AvatarImage src={otherParticipant?.avatar} />
                                        <AvatarFallback>{otherParticipant?.firstName?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    {otherParticipant?.isOnline && (
                                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background"></span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline">
                                        <h4 className="font-medium text-sm truncate">{otherParticipant?.firstName} {otherParticipant?.lastName}</h4>
                                        <span className="text-[10px] text-muted-foreground">
                                            {c.lastMessageAt ? format(new Date(c.lastMessageAt), 'hh:mm a') : ''}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate">{c.lastMessage || 'No messages yet'}</p>
                                </div>
                            </div>
                        );
                    })}
                </ScrollArea>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-background">
                {selectedId ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b flex items-center justify-between bg-white dark:bg-slate-900 border-opacity-50">
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src={activeConversation?.participants.find((p: any) => p.id !== session?.user?.id)?.avatar} />
                                    <AvatarFallback>{activeConversation?.participants.find((p: any) => p.id !== session?.user?.id)?.firstName?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-semibold text-sm">
                                        {activeConversation?.participants.find((p: any) => p.id !== session?.user?.id)?.firstName} {activeConversation?.participants.find((p: any) => p.id !== session?.user?.id)?.lastName}
                                    </h3>
                                    <p className="text-[10px] text-green-500">
                                        {activeConversation?.participants.find((p: any) => p.id !== session?.user?.id)?.isOnline ? 'Online' : 'Offline'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon"><Phone className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon"><Video className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6">
                            {messages.map((m, index) => {
                                const isOwn = m.senderId === session?.user?.id;
                                const showSeen = isOwn && m.isRead && index === messages.length - 1;

                                return (
                                    <div key={m.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                                        <div className={`group relative flex items-end gap-2 max-w-[80%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                                            {!isOwn && (
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src={m.sender?.avatar} />
                                                    <AvatarFallback>{m.sender?.firstName?.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                            )}

                                            <div className="flex flex-col gap-1">
                                                {/* Reply Quote */}
                                                {m.replyTo && (
                                                    <div className={`text-[11px] p-2 mb-[-8px] rounded-lg opacity-60 line-clamp-1 border-l-2 ${isOwn ? 'bg-primary/10 border-primary' : 'bg-muted border-muted-foreground'}`}>
                                                        <span className="font-bold mr-1">@{m.replyTo.sender?.firstName}:</span>
                                                        {m.replyTo.message}
                                                    </div>
                                                )}

                                                <div className={`relative p-3 rounded-2xl text-sm shadow-sm transition-all ${
                                                    isOwn ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-muted rounded-tl-none'
                                                } ${m.isDeleted ? 'italic opacity-50' : ''}`}>

                                                    {m.type === 'IMAGE' ? (
                                                        <img src={m.attachments[0]} alt="attachment" className="rounded-lg max-w-full cursor-pointer hover:opacity-90" onClick={() => window.open(m.attachments[0])} />
                                                    ) : m.type === 'FILE' ? (
                                                        <div className="flex items-center gap-2 p-2 bg-black/5 rounded cursor-pointer" onClick={() => window.open(m.attachments[0])}>
                                                            <FileIcon className="h-5 w-5" />
                                                            <span className="underline truncate max-w-[150px]">{m.message}</span>
                                                        </div>
                                                    ) : (
                                                        <p className="whitespace-pre-wrap">{m.message}</p>
                                                    )}

                                                    {/* Reactions Row */}
                                                    {m.reactions && m.reactions.length > 0 && (
                                                        <div className={`absolute -bottom-3 ${isOwn ? 'right-0' : 'left-0'} flex gap-1`}>
                                                            {m.reactions.map((r: any, i: number) => (
                                                                <div key={i} className="bg-background border rounded-full px-1.5 py-0.5 text-[10px] shadow-sm flex items-center gap-1 cursor-pointer hover:bg-muted" onClick={() => handleReact(m.id, r.emoji)}>
                                                                    <span>{r.emoji}</span>
                                                                    <span className="font-bold">{r.userIds.length}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Action Menu (Visible on Hover) */}
                                                    {!m.isDeleted && (
                                                        <div className={`absolute top-1/2 -translate-y-1/2 ${isOwn ? 'right-[calc(100%+12px)]' : 'left-[calc(100%+12px)]'} hidden group-hover:flex items-center gap-1 bg-background/95 backdrop-blur p-1 rounded-full shadow-lg z-10 border border-muted-foreground/20 animate-in fade-in zoom-in-95 duration-200 before:content-[''] before:absolute before:top-0 before:bottom-0 ${isOwn ? 'before:-right-4 before:left-0' : 'before:-left-4 before:right-0'} before:bg-transparent`}>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted" onClick={() => setReplyTo(m)} title="Reply"><Reply className="h-4 w-4" /></Button>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted" onClick={(e) => { e.stopPropagation(); handleReact(m.id, '❤️'); }} title="React"><Smile className="h-4 w-4" /></Button>
                                                            {isOwn && (
                                                                <>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted" onClick={() => { setEditingMessage(m); setInput(m.message); }} title="Edit"><Pencil className="h-3.5 w-3.5" /></Button>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-red-50 text-red-500" onClick={() => socket?.emit('chat:delete', m.id)} title="Delete"><Trash2 className="h-3.5 w-3.5" /></Button>
                                                                </>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className={`flex items-center gap-1 text-[10px] opacity-60 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                                    {m.isEdited && <span className="mr-1 italic">Edited</span>}
                                                    {format(new Date(m.createdAt), 'hh:mm a')}
                                                </div>
                                            </div>
                                        </div>

                                        {showSeen && (
                                            <div className="flex items-center gap-1 text-[10px] text-primary mt-1">
                                                <CheckCheck className="h-3 w-3" />
                                                Seen
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t bg-muted/20 space-y-2">
                            {/* Reply Preview */}
                            {replyTo && (
                                <div className="flex items-center justify-between p-2 bg-background rounded-lg border-l-4 border-primary animate-in slide-in-from-bottom-2">
                                    <div className="text-xs">
                                        <p className="font-bold">Replying to {replyTo.sender?.firstName}</p>
                                        <p className="text-muted-foreground truncate max-w-[500px]">{replyTo.message}</p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setReplyTo(null)}><X className="h-4 w-4" /></Button>
                                </div>
                            )}

                            {/* Pending Files Queue */}
                            {pendingFiles.length > 0 && (
                                <div className="flex flex-wrap gap-2 p-2 bg-background rounded-lg border shadow-inner animate-in slide-in-from-bottom-2">
                                    {pendingFiles.map((file, i) => (
                                        <div key={i} className="relative group w-20 h-20 rounded-lg overflow-hidden bg-muted border">
                                            {file.type.startsWith('image/') ? (
                                                <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center p-1">
                                                    <FileIcon className="h-8 w-8 opacity-50" />
                                                    <span className="text-[8px] truncate w-full text-center">{file.name}</span>
                                                </div>
                                            )}
                                            <button onClick={() => removePendingFile(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                    {uploading && (
                                        <div className="w-20 h-20 flex items-center justify-center">
                                            <span className="loader animate-spin border-2 border-primary border-t-transparent rounded-full h-6 w-6"></span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Edit Preview */}
                            {editingMessage && (
                                <div className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border-l-4 border-yellow-500 flex-shrink-0">
                                    <div className="text-xs">
                                        <p className="font-bold text-yellow-600">Editing message</p>
                                        <p className="text-muted-foreground truncate max-w-[500px]">{editingMessage.message}</p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setEditingMessage(null); setInput(""); }}><X className="h-4 w-4" /></Button>
                                </div>
                            )}

                            <div className="flex gap-2 items-center">
                                <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileUpload} />
                                <div className="flex items-center gap-0.5 relative">
                                    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary" onClick={() => fileInputRef.current?.click()}><Paperclip className="h-5 w-5" /></Button>
                                    <div className="relative">
                                        <Button variant="ghost" size="icon" className={`h-9 w-9 ${showEmojiPicker ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-primary'}`} onClick={() => setShowEmojiPicker(!showEmojiPicker)}><Smile className="h-5 w-5" /></Button>
                                        {showEmojiPicker && (
                                            <div className="absolute bottom-full left-0 mb-2 p-2 bg-background border rounded-2xl shadow-2xl z-50 animate-in slide-in-from-bottom-2 grid grid-cols-4 gap-1 min-w-[160px]">
                                                {['❤️', '👍', '😊', '😂', '😮', '😢', '🔥', '👏', '🤝', '🙌', '✨', '⭐'].map(emoji => (
                                                    <button key={emoji} className="p-2 hover:bg-muted rounded-lg text-lg transition-transform hover:scale-125" onClick={() => { setInput(prev => prev + emoji); setShowEmojiPicker(false); }}>
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <Input
                                    placeholder={editingMessage ? "Update message..." : "Type your message..."}
                                    className="bg-background border-none focus-visible:ring-0 px-0 shadow-none text-sm"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                />
                                <Button onClick={handleSendMessage} disabled={uploading} className={`shrink-0 rounded-full h-10 w-10 p-0 ${editingMessage ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-primary hover:bg-primary/90'}`}>
                                    {editingMessage ? (
                                        <X className="h-5 w-5" />
                                    ) : uploading ? (
                                        <span className="animate-spin border-2 border-white border-t-transparent rounded-full h-4 w-4"></span>
                                    ) : (
                                        <Send className="h-5 w-5" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-12">
                        <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                            <MessageCircle className="h-8 w-8" />
                        </div>
                        <h3 className="text-lg font-medium">Select a conversation</h3>
                        <p className="text-sm">Choose a chat from the sidebar to start messaging.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
