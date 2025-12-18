import { useEffect, useState } from 'react';
import { SellerLayout } from '@/components/layout/SellerLayout';
import { ConversationList } from '@/components/chat/ConversationList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';
import { markAsRead } from '@/api/chat';
import { MessageSquare } from 'lucide-react';

export function SellerMessagesPage() {
    const { token } = useAuth();
    const {
        conversations,
        activeConversation,
        messages,
        isLoadingConversations,
        isLoadingMessages,
        typingUsers,
        setActiveConversation,
        sendMessage,
        loadMessages,
        startTyping,
        stopTyping,
        refreshConversations,
    } = useChat();

    const [isMobileViewingChat, setIsMobileViewingChat] = useState(false);

    // Load messages when active conversation changes
    useEffect(() => {
        if (activeConversation) {
            loadMessages(activeConversation._id);

            // Mark messages as read
            if (token && activeConversation.unreadCount > 0) {
                markAsRead(token, activeConversation._id).then(() => {
                    refreshConversations();
                });
            }
        }
    }, [activeConversation?._id, token]);

    const handleSelectConversation = (conversation: typeof activeConversation) => {
        setActiveConversation(conversation);
        setIsMobileViewingChat(true);
    };

    const handleBack = () => {
        setActiveConversation(null);
        setIsMobileViewingChat(false);
    };

    return (
        <SellerLayout noPadding>
            <div className="h-[calc(100vh-64px)] lg:h-screen flex">
                {/* Conversation List - Hidden on mobile when viewing chat */}
                <div
                    className={`w-full md:w-80 lg:w-96 border-r flex-shrink-0 overflow-hidden ${isMobileViewingChat ? 'hidden md:block' : 'block'
                        }`}
                >
                    <div className="h-full flex flex-col">
                        <div className="p-4 border-b">
                            <h1 className="text-lg font-semibold">Messages</h1>
                            <p className="text-sm text-muted-foreground">
                                Chat with your customers
                            </p>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <ConversationList
                                conversations={conversations}
                                activeConversationId={activeConversation?._id || null}
                                onSelectConversation={handleSelectConversation}
                                isLoading={isLoadingConversations}
                            />
                        </div>
                    </div>
                </div>

                {/* Chat Window */}
                <div
                    className={`flex-1 min-w-0 ${!isMobileViewingChat && !activeConversation ? 'hidden md:flex' : 'flex'
                        }`}
                >
                    {activeConversation ? (
                        <ChatWindow
                            conversation={activeConversation}
                            messages={messages}
                            isLoading={isLoadingMessages}
                            typingUsers={typingUsers}
                            onSendMessage={sendMessage}
                            onTyping={startTyping}
                            onStopTyping={stopTyping}
                            onBack={handleBack}
                            showBackButton={true}
                        />
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                <MessageSquare className="h-8 w-8 text-primary" />
                            </div>
                            <h2 className="text-xl font-semibold mb-2">Your Messages</h2>
                            <p className="text-muted-foreground max-w-sm">
                                Select a conversation to view messages from your customers.
                                You'll receive messages when customers reach out about your products.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </SellerLayout>
    );
}
