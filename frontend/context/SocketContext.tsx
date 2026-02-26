"use client";

import { useSession } from "next-auth/react";
import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    unreadCount: number;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
    unreadCount: 0,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { data: session } = useSession();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (session?.accessToken) {
            const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || "http://localhost:8000";

            const socketInstance = io(socketUrl, {
                auth: {
                    token: session.accessToken,
                },
                transports: ['websocket', 'polling'],
            });

            socketInstance.on("connect", () => {
                console.log("🔌 Socket connected");
                setIsConnected(true);
                socketInstance.emit("notification:count");
            });

            socketInstance.on("disconnect", () => {
                console.log("🔌 Socket disconnected");
                setIsConnected(false);
            });

            socketInstance.on("notification:count", (data: { count: number }) => {
                setUnreadCount(data.count);
            });

            socketInstance.on("notification:new", () => {
                socketInstance.emit("notification:count");
            });

            setSocket(socketInstance);

            return () => {
                socketInstance.disconnect();
            };
        } else {
            // Disconnect if no session
            if (socket) {
                socket.disconnect();
                setSocket(null);
                setIsConnected(false);
            }
        }
    }, [session?.accessToken]);

    return (
        <SocketContext.Provider value={{ socket, isConnected, unreadCount }}>
            {children}
        </SocketContext.Provider>
    );
};
