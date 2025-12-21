import { useEffect, useRef } from 'react';
import { ChatBubble } from './ChatBubble';
import { ChatInput } from './ChatInput';
import { type Message, type Conversation } from '@/api/chat';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatWindowProps {
    conversation: Conversation;
    messages: Message[];
    isLoading?: boolean;
    typingUsers?: Set<string>;
    onSendMessage: (content: string) => void;
    onTyping?: () => void;
    onStopTyping?: () => void;
    onBack?: () => void;
    showBackButton?: boolean;
}

export function ChatWindow({
    conversation,
    messages,
    isLoading = false,
    typingUsers = new Set(),
    onSendMessage,
    onTyping,
    onStopTyping,
    onBack,
    showBackButton = false,
}: ChatWindowProps) {
    const { user } = useAuth();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    const otherPerson = user?.role === 'customer' ? conversation.seller : conversation.customer;
    const otherPersonName = otherPerson?.name || 'Unknown User';

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
            });
        }
    };

    // Group messages by date
    const messagesByDate = messages.reduce((groups, message) => {
        const date = new Date(message.createdAt).toDateString();
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(message);
        return groups;
    }, {} as Record<string, Message[]>);

    return (
        <div className="flex flex-col h-full w-full bg-background">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b shrink-0">
                {showBackButton && (
                    <Button variant="ghost" size="icon" onClick={onBack}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                )}
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-base truncate">{otherPersonName}</h2>
                    {user?.role === 'customer' && conversation.seller?.marketLocation && (
                        <p className="text-sm text-muted-foreground truncate">
                            {conversation.seller.marketLocation}
                        </p>
                    )}
                </div>
            </div>

            {/* Messages */}
            <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4"
            >
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-pulse text-muted-foreground">Loading messages...</div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <p className="text-muted-foreground">No messages yet</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Say hello to start the conversation!
                        </p>
                    </div>
                ) : (
                    Object.entries(messagesByDate).map(([date, dateMessages]) => (
                        <div key={date} className="space-y-3">
                            {/* Date separator */}
                            <div className="flex items-center justify-center">
                                <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                                    {formatDate(dateMessages[0].createdAt)}
                                </span>
                            </div>

                            {/* Messages for this date */}
                            {dateMessages.map((message) => (
                                <ChatBubble key={message._id} message={message} />
                            ))}
                        </div>
                    ))
                )}

                {/* Typing indicator */}
                {typingUsers.size > 0 && (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <div className="flex gap-1">
                            <span className="animate-bounce" style={{ animationDelay: '0ms' }}>•</span>
                            <span className="animate-bounce" style={{ animationDelay: '150ms' }}>•</span>
                            <span className="animate-bounce" style={{ animationDelay: '300ms' }}>•</span>
                        </div>
                        <span>{otherPersonName} is typing...</span>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <ChatInput
                onSend={onSendMessage}
                onTyping={onTyping}
                onStopTyping={onStopTyping}
                placeholder={`Message ${otherPersonName}...`}
            />
        </div>
    );
}
