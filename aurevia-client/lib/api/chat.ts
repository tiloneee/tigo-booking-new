import axiosInstance from '../axios';

export interface ChatRoom {
  id: string;
  participant1_id: string;
  participant2_id: string;
  participant1: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
  };
  participant2: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
  };
  booking_id?: string;
  booking?: {
    id: string;
    check_in_date: string;
    check_out_date: string;
    status: string;
    hotel_id: string;
  };
  hotel_id?: string;
  last_message_content?: string;
  last_message_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  chat_room_id: string;
  sender_id: string;
  sender: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
  };
  content: string;
  type: 'text' | 'file' | 'image';
  status: 'sent' | 'delivered' | 'read';
  file_url?: string;
  file_name?: string;
  file_size?: number;
  metadata?: Record<string, any>;
  is_edited: boolean;
  edited_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateChatRoomDto {
  participant1_id: string;
  participant2_id: string;
  hotel_id?: string;
  booking_id?: string;
}

export interface SendMessageDto {
  chat_room_id: string;
  content: string;
  type?: 'text' | 'file' | 'image';
  file_url?: string;
  file_name?: string;
  file_size?: number;
  metadata?: Record<string, any>;
}

export interface ChatRoomQueryParams {
  page?: number;
  limit?: number;
  participant_id?: string;
  search?: string;
  booking_id?: string;
}

export interface MessageQueryParams {
  page?: number;
  limit?: number;
  before?: string;
  after?: string;
}

// Create or get a chat room
export const createOrGetChatRoom = async (data: CreateChatRoomDto): Promise<ChatRoom> => {
  const response = await axiosInstance.post('/chat/rooms', data);
  return response.data;
};

// Create chat room from booking
export const createChatRoomFromBooking = async (bookingId: string): Promise<ChatRoom> => {
  const response = await axiosInstance.post(`/chat/rooms/from-booking/${bookingId}`);
  return response.data;
};

// Get user's chat rooms
export const getChatRooms = async (params?: ChatRoomQueryParams) => {
  const response = await axiosInstance.get('/chat/rooms', { params });
  return response.data;
};

// Get specific chat room
export const getChatRoom = async (roomId: string): Promise<ChatRoom> => {
  const response = await axiosInstance.get(`/chat/rooms/${roomId}`);
  return response.data;
};

// Send a message
export const sendMessage = async (data: SendMessageDto): Promise<ChatMessage> => {
  const response = await axiosInstance.post('/chat/messages', data);
  return response.data;
};

// Get messages in a chat room
export const getMessages = async (roomId: string, params?: MessageQueryParams) => {
  const response = await axiosInstance.get(`/chat/rooms/${roomId}/messages`, { params });
  return response.data;
};

// Mark messages as read
export const markMessagesAsRead = async (roomId: string): Promise<void> => {
  await axiosInstance.post(`/chat/rooms/${roomId}/read`);
};

// Delete a message
export const deleteMessage = async (messageId: string): Promise<void> => {
  await axiosInstance.delete(`/chat/messages/${messageId}`);
};

// Get online users in a room
export const getOnlineUsers = async (roomId: string) => {
  const response = await axiosInstance.get(`/chat/rooms/${roomId}/online-users`);
  return response.data;
};
