import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    type ReactNode,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import {
    type Message,
    type Conversation,
    getConversations,
    getMessages,
    getUnreadCount,
} from '@/api/chat';
import { SOCKET_URL } from '@/config/api';

interface ChatContextType {
    socket: Socket | null;
    isConnected: boolean;
    conversations: Conversation[];
    activeConversation: Conversation | null;
    messages: Message[];
    totalUnreadCount: number;
    isLoadingConversations: boolean;
    isLoadingMessages: boolean;
    setActiveConversation: (conversation: Conversation | null) => void;
    sendMessage: (content: string) => void;
    refreshConversations: () => Promise<void>;
    loadMessages: (conversationId: string) => Promise<void>;
    typingUsers: Set<string>;
    startTyping: () => void;
    stopTyping: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
    const { token, isAuthenticated } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [totalUnreadCount, setTotalUnreadCount] = useState(0);
    const [isLoadingConversations, setIsLoadingConversations] = useState(false);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

    // Initialize socket connection
    useEffect(() => {
        if (isAuthenticated && token) {
            const newSocket = io(SOCKET_URL, {
                auth: { token },
                transports: ['websocket', 'polling'],
            });

            newSocket.on('connect', () => {
                console.log('Socket connected');
                setIsConnected(true);
            });

            newSocket.on('disconnect', () => {
                console.log('Socket disconnected');
                setIsConnected(false);
            });

            newSocket.on('connect_error', (error) => {
                console.error('Socket connection error:', error);
                setIsConnected(false);
            });

            // Handle incoming messages
            newSocket.on('new_message', (data: { message: Message }) => {
                setMessages((prev) => [...prev, data.message]);
            });

            // Handle message notifications (for updating conversation list)
            newSocket.on('message_notification', (data: { conversationId: string; message: Message }) => {
                // Update conversation's last message and unread count
                setConversations((prev) =>
                    prev.map((conv) => {
                        if (conv._id === data.conversationId) {
                            return {
                                ...conv,
                                lastMessage: {
                                    _id: data.message._id,
                                    content: data.message.content,
                                    createdAt: data.message.createdAt,
                                },
                                lastMessageAt: data.message.createdAt,
                                unreadCount: conv.unreadCount + 1,
                            };
                        }
                        return conv;
                    })
                );
                setTotalUnreadCount((prev) => prev + 1);
            });

            // Handle typing indicators
            newSocket.on('user_typing', (data: { userId: string; conversationId: string }) => {
                if (activeConversation?._id === data.conversationId) {
                    setTypingUsers((prev) => new Set(prev).add(data.userId));
                }
            });

            newSocket.on('user_stop_typing', (data: { userId: string; conversationId: string }) => {
                if (activeConversation?._id === data.conversationId) {
                    setTypingUsers((prev) => {
                        const newSet = new Set(prev);
                        newSet.delete(data.userId);
                        return newSet;
                    });
                }
            });

            setSocket(newSocket);

            return () => {
                newSocket.close();
                setSocket(null);
                setIsConnected(false);
            };
        }
    }, [isAuthenticated, token]);

    // Load conversations when authenticated
    useEffect(() => {
        if (isAuthenticated && token) {
            refreshConversations();
            refreshUnreadCount();
        }
    }, [isAuthenticated, token]);

    // Join/leave conversation rooms
    useEffect(() => {
        if (socket && activeConversation) {
            socket.emit('join_conversation', activeConversation._id);

            return () => {
                socket.emit('leave_conversation', activeConversation._id);
            };
        }
    }, [socket, activeConversation]);

    const refreshConversations = useCallback(async () => {
        if (!token) return;

        setIsLoadingConversations(true);
        try {
            const response = await getConversations(token);
            if (response.success && response.conversations) {
                setConversations(response.conversations);
            }
        } catch (error) {
            console.error('Error loading conversations:', error);
        } finally {
            setIsLoadingConversations(false);
        }
    }, [token]);

    const refreshUnreadCount = useCallback(async () => {
        if (!token) return;

        try {
            const response = await getUnreadCount(token);
            if (response.success && response.unreadCount !== undefined) {
                setTotalUnreadCount(response.unreadCount);
            }
        } catch (error) {
            console.error('Error loading unread count:', error);
        }
    }, [token]);

    const loadMessages = useCallback(
        async (conversationId: string) => {
            if (!token) return;

            setIsLoadingMessages(true);
            try {
                const response = await getMessages(token, conversationId);
                if (response.success && response.messages) {
                    setMessages(response.messages);
                }
            } catch (error) {
                console.error('Error loading messages:', error);
            } finally {
                setIsLoadingMessages(false);
            }
        },
        [token]
    );

    const sendMessage = useCallback(
        async (content: string) => {
            if (!activeConversation || !content.trim() || !token) return;

            const trimmedContent = content.trim();

            // Try socket first, fall back to HTTP if not connected
            if (socket && isConnected) {
                socket.emit('send_message', {
                    conversationId: activeConversation._id,
                    content: trimmedContent,
                });
            } else {
                // HTTP fallback
                try {
                    const { sendMessage: sendMessageAPI } = await import('@/api/chat');
                    const response = await sendMessageAPI(token, activeConversation._id, trimmedContent);
                    if (response.success && response.message && typeof response.message !== 'string') {
                        // Add message to local state
                        setMessages((prev) => [...prev, response.message as Message]);
                        // Refresh conversations to update last message
                        refreshConversations();
                    }
                } catch (error) {
                    console.error('Error sending message via HTTP:', error);
                }
            }
        },
        [socket, isConnected, activeConversation, token, refreshConversations]
    );

    const startTyping = useCallback(() => {
        if (!socket || !activeConversation) return;
        socket.emit('typing', { conversationId: activeConversation._id });
    }, [socket, activeConversation]);

    const stopTyping = useCallback(() => {
        if (!socket || !activeConversation) return;
        socket.emit('stop_typing', { conversationId: activeConversation._id });
    }, [socket, activeConversation]);

    const value = {
        socket,
        isConnected,
        conversations,
        activeConversation,
        messages,
        totalUnreadCount,
        isLoadingConversations,
        isLoadingMessages,
        setActiveConversation,
        sendMessage,
        refreshConversations,
        loadMessages,
        typingUsers,
        startTyping,
        stopTyping,
    };

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
}
