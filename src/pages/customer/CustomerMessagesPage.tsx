import { useEffect, useState } from 'react';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { ConversationList } from '@/components/chat/ConversationList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';
import { markAsRead, createConversation, type Conversation } from '@/api/chat';
import { getVerifiedSellers, type Seller } from '@/api/products';
import { MessageSquare, Plus, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export function CustomerMessagesPage() {
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
    const [isNewChatDialogOpen, setIsNewChatDialogOpen] = useState(false);
    const [sellers, setSellers] = useState<Seller[]>([]);
    const [isLoadingSellers, setIsLoadingSellers] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

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

    const handleSelectConversation = (conversation: Conversation | null) => {
        setActiveConversation(conversation);
        setIsMobileViewingChat(true);
    };

    const handleBack = () => {
        setActiveConversation(null);
        setIsMobileViewingChat(false);
    };

    const handleOpenNewChat = async () => {
        setIsNewChatDialogOpen(true);
        setIsLoadingSellers(true);

        try {
            if (token) {
                const response = await getVerifiedSellers(token);
                if (response.success && response.sellers) {
                    setSellers(response.sellers);
                }
            }
        } catch (error) {
            console.error('Error loading sellers:', error);
        } finally {
            setIsLoadingSellers(false);
        }
    };

    const handleStartConversation = async (sellerId: string) => {
        if (!token) return;

        try {
            const response = await createConversation(token, sellerId);
            if (response.success && response.conversation) {
                await refreshConversations();
                setActiveConversation(response.conversation);
                setIsNewChatDialogOpen(false);
                setIsMobileViewingChat(true);
            }
        } catch (error) {
            console.error('Error starting conversation:', error);
        }
    };

    const filteredSellers = sellers.filter((seller) =>
        seller?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        seller?.marketLocation?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Filter out sellers who already have conversations
    const existingSellerIds = new Set(conversations.map((c) => c.seller?._id).filter(Boolean));
    const newSellers = filteredSellers.filter((s) => s && !existingSellerIds.has(s._id));

    return (
        <CustomerLayout noPadding>
            <div className="h-[calc(100vh-64px)] lg:h-screen flex">
                {/* Conversation List - Hidden on mobile when viewing chat */}
                <div
                    className={`w-full md:w-80 lg:w-96 border-r flex-shrink-0 overflow-hidden ${isMobileViewingChat ? 'hidden md:block' : 'block'
                        }`}
                >
                    <div className="h-full flex flex-col">
                        <div className="p-4 border-b">
                            <div className="flex items-center justify-between mb-1">
                                <h1 className="text-lg font-semibold">Messages</h1>
                                <Button size="sm" variant="outline" onClick={handleOpenNewChat}>
                                    <Plus className="h-4 w-4 mr-1" />
                                    New Chat
                                </Button>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Chat with sellers from your local markets
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
                            <p className="text-muted-foreground max-w-sm mb-4">
                                Start a conversation with sellers to ask about products, availability, or place custom orders.
                            </p>
                            <Button onClick={handleOpenNewChat}>
                                <Plus className="h-4 w-4 mr-2" />
                                Start New Conversation
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* New Chat Dialog */}
            <Dialog open={isNewChatDialogOpen} onOpenChange={setIsNewChatDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Start a New Conversation</DialogTitle>
                        <DialogDescription>
                            Select a seller to start chatting with
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <Input
                            placeholder="Search sellers..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />

                        <div className="max-h-64 overflow-y-auto space-y-2">
                            {isLoadingSellers ? (
                                <div className="text-center py-4 text-muted-foreground">
                                    Loading sellers...
                                </div>
                            ) : newSellers.length === 0 ? (
                                <div className="text-center py-4 text-muted-foreground">
                                    {searchQuery
                                        ? 'No sellers found matching your search'
                                        : 'No new sellers available'}
                                </div>
                            ) : (
                                newSellers.map((seller) => (
                                    <button
                                        key={seller._id}
                                        onClick={() => handleStartConversation(seller._id)}
                                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <User className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{seller.name}</p>
                                            {seller.marketLocation && (
                                                <p className="text-sm text-muted-foreground truncate">
                                                    {seller.marketLocation}
                                                </p>
                                            )}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </CustomerLayout>
    );
}
