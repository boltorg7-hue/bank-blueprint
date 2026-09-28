import { HELP_ARTICLES, HELP_CATEGORIES, type HelpArticle } from "./help";

const categories = ["Getting started", "Opening an account", "Sign-in and access", "Transfers", "Documents", "Statements", "Security", "Profile", "Contact the bank"];
const articles: [string, string][] = [
  ["What is RFC?", "RFC is a digital bank: current accounts, transfers, transaction tracking, digital statements, documents and secure messaging, available online."],
  ["Which devices can I use with RFC?", "Use an up-to-date browser on your phone, tablet or computer. An internet connection is required; banking data is not stored offline."],
  ["How do I open an account?", "Create your profile, confirm your contact details, provide the required information and verify your identity. Your account is activated after review."],
  ["Which documents do I need?", "A valid identity document is required. Additional documents may be requested depending on your circumstances; the exact list appears in your account."],
  ["How long does approval take?", "Timing depends on the checks needed. You can always see your application status and any required actions in your account."],
  ["How do I sign in?", "Use your email address and password on the sign-in page. An additional verification step may be required."],
  ["I forgot my password. What should I do?", "Use the reset link on the sign-in page. A message will be sent to the email address associated with your account."],
  ["My access is blocked. What should I do?", "After repeated failed attempts, access is temporarily restricted to protect your account. Try again later or contact the bank using the public form."],
  ["How do I make a transfer?", "Choose a beneficiary, enter the amount, review the summary and confirm. You can then follow its progress in your account."],
  ["How do I track a transfer?", "Each transfer shows its steps: request received, checks, execution and funds credited. Checks may leave a transfer pending."],
  ["How do I add a beneficiary?", "Go to Transfers in your customer account. Adding a beneficiary may require a security confirmation."],
  ["How do I submit a requested document?", "Go to Documents in your account. The request specifies what is needed and lets you submit it securely."],
  ["What do the document statuses mean?", "Received: your document arrived. Under review: it is being examined. Accepted: it is approved. Action required: additional information is needed."],
  ["Where can I find my statements?", "In Statements in your customer account, where you can view and download them as PDFs."],
  ["Can I access older statements?", "Yes. Statements for earlier periods remain available in your account."],
  ["How is my account protected?", "Through stronger authentication, confirmation of sensitive actions, management of active sessions and alerts about important events."],
  ["Will RFC ever ask for my password?", "No. The bank will never ask for your password, PIN or verification code by email, phone or message."],
  ["How do I update my contact details?", "Go to Profile in your customer account. Some changes require additional verification."],
  ["How do I contact the bank?", "If you are a customer, use secure messaging in your account to keep your request in context. Otherwise, use the public contact form."],
];
export const HELP_CATEGORIES_EN = HELP_CATEGORIES.map((category, index) => ({ ...category, label: categories[index] ?? category.label }));
export const HELP_ARTICLES_EN: HelpArticle[] = HELP_ARTICLES.map((article, index) => ({ ...article, question: articles[index]?.[0] ?? article.question, answer: articles[index]?.[1] ?? article.answer }));
export const CONTACT_TOPICS_EN = ["Account opening", "Sign-in and access", "Product question", "Security", "Legal information", "Other request"];
