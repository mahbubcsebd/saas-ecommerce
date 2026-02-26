"use client";

import { useSession } from "next-auth/react";
import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    unreadCount: number;
    chatUnreadCount: number;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
    unreadCount: 0,
    chatUnreadCount: 0,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { data: session } = useSession();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [chatUnreadCount, setChatUnreadCount] = useState(0);

    useEffect(() => {
        if (session?.accessToken) {
            const socketInstance = io(process.env.NEXT_PUBLIC_API_URL?.split('/api')[0] || "http://localhost:8000", {
                auth: {
                    token: session.accessToken,
                },
                transports: ['websocket', 'polling'],
            });

            socketInstance.on("connect", () => {
                console.log("🔌 Socket connected");
                setIsConnected(true);
                // Get initial counts
                socketInstance.emit("notification:count");
            });

            socketInstance.on("disconnect", () => {
                console.log("🔌 Socket disconnected");
                setIsConnected(false);
            });

            socketInstance.on("notification:count", (data: { count: number }) => {
                setUnreadCount(data.count);
            });

            socketInstance.on("notification:chat-count", (data: { count: number }) => {
                setChatUnreadCount(data.count);
            });

            socketInstance.on("notification:new", (notification: any) => {
                // Refresh counts on new notification
                socketInstance.emit("notification:count");
            });

            setSocket(socketInstance);

            return () => {
                socketInstance.disconnect();
            };
        }
    }, [session?.accessToken]);

    return (
        <SocketContext.Provider value={{ socket, isConnected, unreadCount, chatUnreadCount }}>
            {children}
        </SocketContext.Provider>
    );
};
