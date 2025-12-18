import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';

interface ChatInputProps {
    onSend: (message: string) => void;
    onTyping?: () => void;
    onStopTyping?: () => void;
    disabled?: boolean;
    placeholder?: string;
}

export function ChatInput({
    onSend,
    onTyping,
    onStopTyping,
    disabled = false,
    placeholder = 'Type a message...',
}: ChatInputProps) {
    const [message, setMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    }, [message]);

    const handleTyping = () => {
        if (!isTyping) {
            setIsTyping(true);
            onTyping?.();
        }

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set new timeout to stop typing indicator
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            onStopTyping?.();
        }, 1000);
    };

    const handleSend = () => {
        const trimmedMessage = message.trim();
        if (trimmedMessage && !disabled) {
            onSend(trimmedMessage);
            setMessage('');
            setIsTyping(false);
            onStopTyping?.();

            // Reset textarea height
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex items-end gap-2 p-4 border-t bg-background">
            <Textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => {
                    setMessage(e.target.value);
                    handleTyping();
                }}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                className="min-h-[40px] max-h-[120px] resize-none flex-1"
                rows={1}
            />
            <Button
                onClick={handleSend}
                disabled={disabled || !message.trim()}
                size="icon"
                className="shrink-0"
            >
                <Send className="h-4 w-4" />
            </Button>
        </div>
    );
}
