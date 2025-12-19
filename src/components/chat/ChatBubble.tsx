import { cn } from '@/lib/utils';
import { type Message } from '@/api/chat';
import { useAuth } from '@/contexts/AuthContext';

interface ChatBubbleProps {
    message: Message;
    showSenderName?: boolean;
}

export function ChatBubble({ message, showSenderName = false }: ChatBubbleProps) {
    const { user } = useAuth();
    const isOwn = user?.id === message.sender._id;

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    };

    return (
        <div
            className={cn(
                'flex flex-col max-w-[75%] gap-1',
                isOwn ? 'items-end ml-auto' : 'items-start mr-auto'
            )}
        >
            {showSenderName && !isOwn && (
                <span className="text-xs text-muted-foreground px-2">
                    {message.sender.name}
                </span>
            )}
            <div
                className={cn(
                    'px-4 py-2 rounded-2xl',
                    isOwn
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-muted text-foreground rounded-bl-md'
                )}
            >
                <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
            </div>
            <div className="flex items-center gap-1 px-2">
                <span className="text-xs text-muted-foreground">
                    {formatTime(message.createdAt)}
                </span>
                {isOwn && (
                    <span className="text-xs text-muted-foreground">
                        {message.isRead ? '✓✓' : '✓'}
                    </span>
                )}
            </div>
        </div>
    );
}
