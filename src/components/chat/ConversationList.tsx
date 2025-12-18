import { cn } from '@/lib/utils';
import { type Conversation } from '@/api/chat';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, User } from 'lucide-react';

interface ConversationListProps {
    conversations: Conversation[];
    activeConversationId: string | null;
    onSelectConversation: (conversation: Conversation) => void;
    isLoading?: boolean;
}

export function ConversationList({
    conversations,
    activeConversationId,
    onSelectConversation,
    isLoading = false,
}: ConversationListProps) {
    const { user } = useAuth();

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            return date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
            });
        } else if (days === 1) {
            return 'Yesterday';
        } else if (days < 7) {
            return date.toLocaleDateString('en-US', { weekday: 'short' });
        } else {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
            });
        }
    };

    const getOtherParticipant = (conversation: Conversation) => {
        return user?.role === 'customer' ? conversation.seller : conversation.customer;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-32">
                <div className="animate-pulse text-muted-foreground">Loading conversations...</div>
            </div>
        );
    }

    if (conversations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-32 text-center p-4">
                <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No conversations yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                    {user?.role === 'customer'
                        ? 'Start a conversation with a seller'
                        : 'Customers will appear here when they message you'}
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col">
            {conversations.map((conversation) => {
                const otherPerson = getOtherParticipant(conversation);
                const isActive = activeConversationId === conversation._id;

                return (
                    <button
                        key={conversation._id}
                        onClick={() => onSelectConversation(conversation)}
                        className={cn(
                            'flex items-start gap-3 p-3 text-left transition-colors hover:bg-accent',
                            isActive && 'bg-accent'
                        )}
                    >
                        {/* Avatar */}
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <span className="font-medium text-sm truncate">
                                    {otherPerson.name}
                                </span>
                                {conversation.lastMessage && (
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                        {formatTime(conversation.lastMessageAt)}
                                    </span>
                                )}
                            </div>

                            {user?.role === 'customer' && conversation.seller.marketLocation && (
                                <p className="text-xs text-muted-foreground truncate">
                                    {conversation.seller.marketLocation}
                                </p>
                            )}

                            <div className="flex items-center justify-between gap-2 mt-0.5">
                                <p className="text-sm text-muted-foreground truncate">
                                    {conversation.lastMessage?.content || 'No messages yet'}
                                </p>
                                {conversation.unreadCount > 0 && (
                                    <Badge variant="default" className="rounded-full h-5 min-w-5 flex items-center justify-center">
                                        {conversation.unreadCount}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
