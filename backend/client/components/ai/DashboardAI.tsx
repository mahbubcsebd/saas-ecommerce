'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
    ArcElement,
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Title,
    Tooltip,
} from 'chart.js';
import { BarChart3, Bot, Loader2, Send, Sparkles, TrendingUp, User } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';
import { Bar, Line, Pie } from 'react-chartjs-2';
import ReactMarkdown from 'react-markdown';
// @ts-ignore
import remarkGfm from 'remark-gfm';
import { v4 as uuidv4 } from 'uuid';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

interface ChartConfig {
    label?: string;
    color?: string;
    colors?: string[];
}

interface ChartData {
    type: 'line' | 'bar' | 'pie';
    title: string;
    data: any[];
    xAxis?: string;
    yAxis?: string | string[];
    config?: ChartConfig;
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    data?: any;
    charts?: ChartData[];
}

export const DashboardAI = () => {
    const { data: session } = useSession();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: '👋 **Hello Admin!**\n\nI can help you analyze:\n- 📊 Sales trends & revenue\n- 📦 Product performance\n- 👥 Customer insights\n- 🏪 Inventory status\n- ⭐ Reviews & ratings\n- 🎯 Discount effectiveness\n\nWhat would you like to know?',
            timestamp: new Date(),
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [sessionId, setSessionId] = useState('');

    const scrollRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let sid = sessionStorage.getItem('dashboardSessionId');
        if (!sid) {
            sid = uuidv4();
            sessionStorage.setItem('dashboardSessionId', sid);
        }
        setSessionId(sid);
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

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
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/dashboard/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.accessToken || ''}`
                },
                body: JSON.stringify({ query: userMessage.content, sessionId }),
            });

            const resData = await response.json();

            if (resData.success) {
                const aiMessage: Message = {
                    id: uuidv4(),
                    role: 'assistant',
                    content: resData.data.response,
                    timestamp: new Date(),
                    data: resData.data.data,
                    charts: resData.data.charts,
                };
                setMessages(prev => [...prev, aiMessage]);
            } else {
                setMessages(prev => [...prev, {
                    id: uuidv4(),
                    role: 'assistant',
                    content: '❌ Sorry, I encountered an issue analyzing the data. Please try again.',
                    timestamp: new Date(),
                }]);
            }

        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                id: uuidv4(),
                role: 'assistant',
                content: '🔌 Network error. Please make sure the backend is running.',
                timestamp: new Date(),
            }]);
        } finally {
            setLoading(false);
        }
    };

    const renderChart = (chart: ChartData, index: number) => {
        if (!chart.data || chart.data.length === 0) return null;

        const CHART_COLORS = chart.config?.colors || [
            '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
            '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1'
        ];

        let chartData: any;
        let options: any;

        if (chart.type === 'pie') {
            chartData = {
                labels: chart.data.map((item) => item.label || item[chart.xAxis || 'name']),
                datasets: [{
                    data: chart.data.map((item) => item.value || item[chart.yAxis as string || 'value']),
                    backgroundColor: CHART_COLORS,
                    borderColor: '#ffffff',
                    borderWidth: 2,
                }],
            };

            options = {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right' as const,
                        labels: {
                            padding: 15,
                            font: { size: 11 },
                            usePointStyle: true,
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context: any) => {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value.toLocaleString()} (${percentage}%)`;
                            }
                        }
                    }
                },
            };
        } else {
            const labels = chart.data.map((item) => item[chart.xAxis || 'name'] || item.date);
            const yKeys = Array.isArray(chart.yAxis) ? chart.yAxis : [chart.yAxis || 'value'];

            chartData = {
                labels,
                datasets: yKeys.map((key, idx) => ({
                    label: chart.config?.label || key,
                    data: chart.data.map((item) => item[key as string]),
                    backgroundColor: chart.type === 'bar'
                        ? CHART_COLORS[idx % CHART_COLORS.length] + '20'
                        : CHART_COLORS[idx % CHART_COLORS.length] + '10',
                    borderColor: chart.config?.color || CHART_COLORS[idx % CHART_COLORS.length],
                    borderWidth: 2,
                    fill: chart.type === 'line',
                    tension: 0.4,
                })),
            };

            options = {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: yKeys.length > 1,
                        position: 'top' as const,
                        labels: {
                            padding: 15,
                            font: { size: 11 },
                            usePointStyle: true,
                        }
                    },
                    tooltip: {
                        mode: 'index' as const,
                        intersect: false,
                        callbacks: {
                            label: (context: any) => {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y || 0;
                                return `${label}: ${value.toLocaleString()}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { font: { size: 10 } }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: '#f1f5f9' },
                        ticks: {
                            font: { size: 10 },
                            callback: (value: any) => value.toLocaleString()
                        }
                    }
                },
                interaction: {
                    mode: 'nearest' as const,
                    axis: 'x' as const,
                    intersect: false
                }
            };
        }

        return (
            <div className="mt-3 p-4 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    <h4 className="text-sm font-semibold text-slate-700">{chart.title}</h4>
                </div>
                <div className="h-[280px] w-full">
                    {chart.type === 'bar' && <Bar data={chartData} options={options} />}
                    {chart.type === 'line' && <Line data={chartData} options={options} />}
                    {chart.type === 'pie' && <Pie data={chartData} options={options} />}
                </div>
            </div>
        );
    };

    return (
        <Card className="w-full h-[750px] flex flex-col shadow-lg border-slate-200 bg-gradient-to-br from-white to-slate-50">
            <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-primary/10 p-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-primary to-primary/80 p-2.5 rounded-xl shadow-md">
                            <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                AI Analytics Assistant
                            </CardTitle>
                            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                                <TrendingUp className="h-3 w-3" />
                                Powered by Groq AI (Llama 3.3 70B)
                            </p>
                        </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span>Online</span>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-full p-5" ref={scrollRef}>
                    <div className="flex flex-col gap-6 pb-4">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={cn(
                                    "flex gap-3 max-w-[95%] animate-in fade-in slide-in-from-bottom-2 duration-300",
                                    msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                                )}
                            >
                                <div className={cn(
                                    "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-1 shadow-sm",
                                    msg.role === 'user'
                                        ? "bg-gradient-to-br from-primary to-primary/80 text-white"
                                        : "bg-white border-2 border-primary/20 text-primary"
                                )}>
                                    {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-5 w-5" />}
                                </div>

                                <div className="flex flex-col gap-3 w-full">
                                    <div className={cn(
                                        "p-4 rounded-2xl text-sm shadow-md",
                                        msg.role === 'user'
                                            ? "bg-gradient-to-br from-primary to-primary/90 text-white rounded-tr-sm"
                                            : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm"
                                    )}>
                                        <div className={cn(
                                            "prose prose-sm max-w-none",
                                            msg.role === 'user'
                                                ? "prose-invert"
                                                : "prose-slate prose-headings:font-bold prose-p:text-slate-700"
                                        )}>
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                                                    strong: ({ children }) => <strong className="font-bold text-slate-900">{children}</strong>,
                                                    em: ({ children }) => <em className="italic">{children}</em>,
                                                    ul: ({ children }) => <ul className="list-disc pl-5 space-y-1 my-2">{children}</ul>,
                                                    ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1 my-2">{children}</ol>,
                                                    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                                                    h1: ({ children }) => <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>,
                                                    h2: ({ children }) => <h2 className="text-lg font-bold mt-3 mb-2">{children}</h2>,
                                                    h3: ({ children }) => <h3 className="text-base font-bold mt-2 mb-1">{children}</h3>,
                                                    table: ({ children }) => (
                                                        <div className="overflow-x-auto my-4">
                                                            <table className="min-w-full divide-y divide-slate-200 border border-slate-200 rounded-lg">
                                                                {children}
                                                            </table>
                                                        </div>
                                                    ),
                                                    thead: ({ children }) => (
                                                        <thead className="bg-slate-50">
                                                            {children}
                                                        </thead>
                                                    ),
                                                    tbody: ({ children }) => (
                                                        <tbody className="bg-white divide-y divide-slate-100">
                                                            {children}
                                                        </tbody>
                                                    ),
                                                    tr: ({ children }) => (
                                                        <tr className="hover:bg-slate-50 transition-colors">
                                                            {children}
                                                        </tr>
                                                    ),
                                                    th: ({ children }) => (
                                                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                                            {children}
                                                        </th>
                                                    ),
                                                    td: ({ children }) => (
                                                        <td className="px-4 py-2 text-sm text-slate-600">
                                                            {children}
                                                        </td>
                                                    ),
                                                    code: ({ inline, children }: any) =>
                                                        inline ? (
                                                            <code className="px-1.5 py-0.5 bg-slate-100 text-slate-800 rounded text-xs font-mono">
                                                                {children}
                                                            </code>
                                                        ) : (
                                                            <code className="block p-3 bg-slate-100 text-slate-800 rounded text-xs font-mono overflow-x-auto">
                                                                {children}
                                                            </code>
                                                        ),
                                                    blockquote: ({ children }) => (
                                                        <blockquote className="border-l-4 border-primary/30 pl-4 italic text-slate-600 my-2">
                                                            {children}
                                                        </blockquote>
                                                    ),
                                                }}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                    </div>

                                    {/* Render Charts */}
                                    {msg.charts && msg.charts.length > 0 && (
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                            {msg.charts.map((chart, idx) => (
                                                <div
                                                    key={idx}
                                                    className={cn(
                                                        "animate-in fade-in zoom-in-95 duration-500",
                                                        chart.type === 'pie' ? "lg:col-span-1" : "lg:col-span-2"
                                                    )}
                                                    style={{ animationDelay: `${idx * 100}ms` }}
                                                >
                                                    {renderChart(chart, idx)}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <span className="text-[10px] text-slate-400 px-1">
                                        {msg.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex gap-3 mr-auto max-w-[95%] animate-in fade-in slide-in-from-bottom-2">
                                <div className="w-9 h-9 rounded-xl bg-white border-2 border-primary/20 text-primary flex items-center justify-center shrink-0 shadow-sm">
                                    <Bot className="h-5 w-5" />
                                </div>
                                <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-sm shadow-md flex items-center gap-3">
                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                    <span className="text-sm text-slate-600">Analyzing your data...</span>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                </ScrollArea>
            </CardContent>

            <CardFooter className="p-4 bg-white border-t border-slate-200">
                <form
                    className="flex w-full gap-2"
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                >
                    <Input
                        placeholder="Ask about sales, products, customers, inventory..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={loading}
                        className="bg-slate-50 border-slate-200 focus-visible:ring-primary/20 placeholder:text-slate-400"
                    />
                    <Button
                        type="submit"
                        disabled={loading || !input.trim()}
                        className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md"
                    >
                        <Send className="h-4 w-4 mr-2" />
                        Ask AI
                    </Button>
                </form>
            </CardFooter>
        </Card>
    );
};
