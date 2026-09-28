import type { FeatureCategory } from "@/features/public/content/features";

/** English presentation copy, keyed by the existing category identifiers. */
const translations: Record<string, { label: string; intro: string; items: [string, string][] }> = {
  accounts: { label: "Accounts", intro: "A clear view of your current account and available funds.", items: [["Available balance", "The amount you can use, distinct from your ledger balance."], ["At a glance", "Income, spending and pending transactions in one view."], ["Bank details", "Your account details are hidden by default and available when needed."]] },
  transfers: { label: "Transfers", intro: "Guided transfers, with a summary before confirmation.", items: [["Saved beneficiaries", "Add and find your verified beneficiaries."], ["Clear summary", "Review the amount, applicable fees and timing before confirming."], ["Track progress", "See every step of the transfer until completion."]] },
  activity: { label: "Activity", intro: "Understand your account history at a glance.", items: [["Full history", "Every transaction, with its status and reference."], ["Useful filters", "Filter by period, direction and status."], ["Transaction details", "Review the full context, documents and related messages."]] },
  statements: { label: "Statements", intro: "Digital statements when you need them.", items: [["Periodic statements", "View your account statements online."], ["Download PDF", "A printable document you can keep."], ["Past statements", "Access statements from previous periods."]] },
  documents: { label: "Documents", intro: "A secure place to submit and track your documents.", items: [["Secure submission", "Send requested documents from your account."], ["Review status", "See whether a document is received, under review, accepted or needs action."], ["Organised records", "Find your banking documents in one place."]] },
  messaging: { label: "Messaging", intro: "Conversations connected to your requests.", items: [["Secure messages", "Keep your conversations in your customer account."], ["Relevant context", "Connect a conversation to a transfer, document or question."], ["Conversation history", "Find earlier replies when you need them."]] },
  security: { label: "Security", intro: "Protection you can see and manage.", items: [["Stronger authentication", "An extra check for sign-in and sensitive actions."], ["Sessions and devices", "Review and close active sessions."], ["Security history", "See security events on your account."]] },
  notifications: { label: "Notifications", intro: "Know what matters, when it matters.", items: [["Important updates", "Receive updates about your account and transactions."], ["In one place", "Find all your alerts in your account."], ["Manage your alerts", "Mark notifications as read and archive them."]] },
  profile: { label: "Profile", intro: "Your information, in your hands.", items: [["Personal details", "Review your customer information."], ["Preferences", "Set how you use your account."], ["Stay up to date", "Keep your contact details current."]] },
};

export function englishFeature(category: FeatureCategory): FeatureCategory {
  const text = translations[category.id];
  if (!text) return category;
  return {
    ...category,
    label: text.label,
    intro: text.intro,
    items: category.items.map((item, index) => ({
      title: text.items[index]?.[0] ?? item.title,
      description: text.items[index]?.[1] ?? item.description,
    })),
  };
}