export type SupportCategory = "ACCOUNT" | "TRANSFER" | "DOCUMENT" | "SECURITY" | "OTHER";
export type SupportStatus = "OPEN" | "WAITING_SUPPORT" | "WAITING_CUSTOMER" | "RESOLVED" | "CLOSED";

export type SupportMessageDto = {
  id: string;
  authorKind: "CUSTOMER" | "STAFF";
  body: string;
  createdAt: string;
};

export type SupportThreadDto = {
  id: string;
  reference: string;
  customerName?: string;
  subject: string;
  category: SupportCategory;
  status: SupportStatus;
  lastMessageAt: string;
  messages: SupportMessageDto[];
};
