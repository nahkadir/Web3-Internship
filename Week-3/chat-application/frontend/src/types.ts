export type ChatUser = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string | { _id: string; name: string; avatar?: string };
  content: string;
  createdAt: string;
};

export type Conversation = {
  id: string;
  type: "private" | "group";
  name?: string;
  members: { _id: string; name: string; avatar?: string }[];
};

export type ConversationListItem = {
  id: string;
  type: "private" | "group";
  name?: string;
  members: { _id: string; name: string; avatar?: string }[];
  lastMessage: { content: string; createdAt: string } | null;
  updatedAt: string;
};
