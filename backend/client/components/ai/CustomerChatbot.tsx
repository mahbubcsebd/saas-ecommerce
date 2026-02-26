'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Bot, Loader2, MessageSquare, Minimize2, Send, User, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface ProductContext {
    name: string;
    price: number;
    description: string;
    category?: { name: string };
    stock: number;
}

export const CustomerChatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: 'Hello! 👋 I\'m your AI assistant. How can I help you today? I can assist with product search, order tracking, and store policies.',
            timestamp: new Date(),
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [sessionId, setSessionId] = useState('');

    // Auto-scroll to bottom
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Generate a session ID on load if not exists
        let sid = localStorage.getItem('chatSessionId');
        if (!sid) {
            sid = uuidv4();
            localStorage.setItem('chatSessionId', sid);
        }
        setSessionId(sid);
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage: Message = {
            id: uuidv4(),
            role: 'user',
            content: input,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            // Check if user is asking for order tracking
            const isTracking = input.toLowerCase().includes('track') || input.toLowerCase().includes('order');
            const endpoint = isTracking && input.match(/ORD-\d+|[0-9a-f]{24}/)
                ? `${process.env.NEXT_PUBLIC_API_URL}/api/ai/customer/track-order`
                : `${process.env.NEXT_PUBLIC_API_URL}/api/ai/customer/chat`;

            const payload = isTracking && input.match(/ORD-\d+|[0-9a-f]{24}/)
                ? { orderId: input.match(/ORD-\d+|[0-9a-f]{24}/)?.[0], sessionId, language: 'en' }
                : { message: userMessage.content, sessionId, language: 'en' };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (data.success) {
                const aiMessage: Message = {
                    id: uuidv4(),
                    role: 'assistant',
                    content: data.data.response || data.data.message || 'I processed your request.',
                    timestamp: new Date(),
                };
                setMessages(prev => [...prev, aiMessage]);
            } else {
                 setMessages(prev => [...prev, {
                    id: uuidv4(),
                    role: 'assistant',
                    content: 'Sorry, I encountered an issue. Please try again.',
                    timestamp: new Date(),
                }]);
            }

        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                id: uuidv4(),
                role: 'assistant',
                content: 'Network error. Please try again later.',
                timestamp: new Date(),
            }]);
        } finally {
            setLoading(false);
            if (inputRef.current) inputRef.current.focus();
        }
    };

    if (!isOpen) {
        return (
            <Button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg p-0 z-50 animate-bounce-slow"
                size="icon"
            >
                <MessageSquare className="h-8 w-8 text-white" />
            </Button>
        );
    }

    if (isMinimized) {
         return (
            <div className="fixed bottom-6 right-6 z-50 bg-white rounded-lg shadow-xl border w-72 flex items-center justify-between p-3 cursor-pointer" onClick={() => setIsMinimized(false)}>
                 <div className="flex items-center gap-2">
                     <div className="bg-primary/10 p-2 rounded-full">
                         <Bot className="h-5 w-5 text-primary" />
                     </div>
                     <span className="font-semibold text-sm">AI Assistant</span>
                 </div>
                 <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setIsMinimized(false); }}>
                     <Minimize2 className="h-4 w-4 rotate-180" />
                 </Button>
            </div>
         );
    }

    return (
        <Card className="fixed bottom-6 right-6 w-[380px] h-[600px] shadow-2xl z-50 flex flex-col border-primary/20 animate-in slide-in-from-bottom-10 fade-in duration-300">
            <CardHeader className="bg-primary text-primary-foreground p-4 flex flex-row items-center justify-between space-y-0 rounded-t-lg">
                <div className="flex items-center gap-2">
                    <Bot className="h-6 w-6" />
                    <div>
                        <CardTitle className="text-base">Shop Assistant</CardTitle>
                        <p className="text-xs text-primary-foreground/80 flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                            Online
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20" onClick={() => setIsMinimized(true)}>
                        <Minimize2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20" onClick={() => setIsOpen(false)}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 overflow-hidden relative bg-slate-50">
                <ScrollArea className="h-full p-4" ref={scrollRef}>
                    <div className="flex flex-col gap-4 pb-4">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={cn(
                                    "flex gap-2 max-w-[80%]",
                                    msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                                )}
                            >
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                    msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-white border shadow-sm text-primary"
                                )}>
                                    {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                                </div>
                                <div className={cn(
                                    "p-3 rounded-2xl text-sm shadow-sm",
                                    msg.role === 'user'
                                        ? "bg-primary text-primary-foreground rounded-tr-none"
                                        : "bg-white border text-foreground rounded-tl-none"
                                )}>
                                   <div dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br/>') }} />
                                   <span className="text-[10px] opacity-70 block mt-1 text-right">
                                       {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                   </span>
                                </div>
                            </div>
                        ))}
                        {loading && (
                             <div className="flex gap-2 mr-auto max-w-[80%]">
                                <div className="w-8 h-8 rounded-full bg-white border shadow-sm text-primary flex items-center justify-center shrink-0">
                                    <Bot className="h-4 w-4" />
                                </div>
                                <div className="bg-white border p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce"></span>
                                </div>
                            </div>
                        )}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>

                 {/* Quick Prompts */}
                 {messages.length === 1 && (
                    <div className="absolute bottom-4 left-4 right-4 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                        <Button variant="outline" size="sm" className="whitespace-nowrap bg-white/90 backdrop-blur" onClick={() => { setInput('Order tracking'); if(inputRef.current) inputRef.current.focus(); }}>
                            📦 Track Order
                        </Button>
                        <Button variant="outline" size="sm" className="whitespace-nowrap bg-white/90 backdrop-blur" onClick={() => { setInput('Best selling products'); handleSend(); }}>
                            🔥 Popular Items
                        </Button>
                        <Button variant="outline" size="sm" className="whitespace-nowrap bg-white/90 backdrop-blur" onClick={() => { setInput('Shipping policy'); handleSend(); }}>
                            🚚 Shipping Info
                        </Button>
                    </div>
                 )}
            </CardContent>

            <CardFooter className="p-3 bg-white border-t">
                <form
                    className="flex w-full gap-2"
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                >
                    <Input
                        placeholder="Ask anything..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={loading}
                        ref={inputRef}
                        className="rounded-full focus-visible:ring-primary/20"
                    />
                    <Button type="submit" size="icon" disabled={loading || !input.trim()} className="rounded-full shrink-0">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </form>
            </CardFooter>
        </Card>
    );
};
