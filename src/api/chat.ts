import { API_BASE_URL } from '../config/api';

export interface Message {
    _id: string;
    conversation: string;
    sender: {
        _id: string;
        name: string;
        role: 'customer' | 'seller' | 'admin';
    };
    content: string;
    isRead: boolean;
    readAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface Conversation {
    _id: string;
    participants: string[];
    customer: {
        _id: string;
        name: string;
        email: string;
    };
    seller: {
        _id: string;
        name: string;
        email: string;
        marketLocation: string;
    };
    lastMessage: {
        _id: string;
        content: string;
        createdAt: string;
    } | null;
    lastMessageAt: string;
    unreadCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface ConversationsResponse {
    success: boolean;
    message?: string;
    conversations?: Conversation[];
}

export interface MessagesResponse {
    success: boolean;
    message?: string;
    messages?: Message[];
    hasMore?: boolean;
}

export interface ConversationResponse {
    success: boolean;
    message?: string;
    conversation?: Conversation;
}

export interface MessageResponse {
    success: boolean;
    message?: string | Message;
}

export interface UnreadCountResponse {
    success: boolean;
    unreadCount?: number;
}

// Get all conversations for current user
export async function getConversations(token: string): Promise<ConversationsResponse> {
    const response = await fetch(`${API_BASE_URL}/chat/conversations`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });
    return response.json();
}

// Get messages for a specific conversation
export async function getMessages(
    token: string,
    conversationId: string,
    page: number = 1
): Promise<MessagesResponse> {
    const response = await fetch(
        `${API_BASE_URL}/chat/conversations/${conversationId}/messages?page=${page}`,
        {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        }
    );
    return response.json();
}

// Start a new conversation with a seller
export async function createConversation(
    token: string,
    sellerId: string
): Promise<ConversationResponse> {
    const response = await fetch(`${API_BASE_URL}/chat/conversations`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sellerId }),
    });
    return response.json();
}

// Send a message (fallback for when socket is not connected)
export async function sendMessage(
    token: string,
    conversationId: string,
    content: string
): Promise<MessageResponse> {
    const response = await fetch(`${API_BASE_URL}/chat/messages`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ conversationId, content }),
    });
    return response.json();
}

// Mark messages as read
export async function markAsRead(
    token: string,
    conversationId: string
): Promise<{ success: boolean; message?: string }> {
    const response = await fetch(
        `${API_BASE_URL}/chat/conversations/${conversationId}/read`,
        {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        }
    );
    return response.json();
}

// Get total unread count
export async function getUnreadCount(token: string): Promise<UnreadCountResponse> {
    const response = await fetch(`${API_BASE_URL}/chat/unread`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });
    return response.json();
}
