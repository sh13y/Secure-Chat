export interface User {
    id: string;
    username: string;
}

export interface Message {
    id: string;
    senderId: string;
    receiverId: string;
    content: string;
    timestamp: number;
    encrypted: boolean;
    read: boolean;  // Add read status
}

export interface ChatRoom {
    id: string;
    participants: string[];
    lastMessage?: Message;
}

export interface AuthResponse {
  message: string;
  token: string;
}

export interface SearchUserResponse {
  username: string;
}