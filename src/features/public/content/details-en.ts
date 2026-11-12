import type { AccountProduct } from "./accounts";
import type { LegalDocument } from "./legal";

export const accountsEn = {
  products: [{ id: "personal-current", name: "Personal current account", summary: "Your everyday account: real-time balances, transfers and digital statements.", benefits: ["Available balance and complete history", "Transfers to your saved beneficiaries", "Statements to view and download", "Secure messaging with the bank"], pricingSummary: "Full pricing details on the Pricing page.", eligibility: "Adults, subject to identity verification.", ctaLabel: "Open an account", available: true }] satisfies AccountProduct[],
  sections: [
    { title: "Digital access", description: "Access your account on a phone, tablet or computer.", points: ["A consistent experience on every device", "View and close active sessions", "Hide amounts with privacy mode"] },
    { title: "Everyday banking", description: "Your regular banking tasks in just a few steps.", points: ["View balances and transactions", "Make a transfer", "Add a beneficiary", "Download a statement"] },
    { title: "Statements and documents", description: "Your account documents remain available in your secure space.", points: ["PDF account statements", "Submit requested documents", "Track document review"] },
  ],
  business: { title: "Business accounts", description: "Business accounts are not available yet. They will be presented here when defined." },
};

export const securityEn = {
  intro: { title: "Your account security", description: "Your security area lets you update your password, review sessions recorded by the application and follow security events." },
  protections: [
    ["Personal access", "Access to your account is personal and uses your sign-in credentials."],
    ["Contact verification", "Verification steps for your email address and phone number help secure account registration and follow-up."],
    ["Sessions and devices", "Your security area shows sessions recorded by the application and lets you close other sessions."],
    ["Password management", "You can change your password after verifying your current password."],
    ["Account documents", "Submitted documents support the verification steps and the follow-up of your customer file."],
    ["Information privacy", "Your account information is used to manage your relationship with RFC and carry out service-related checks."],
    ["Security history", "Password changes and recorded security events can be reviewed in your account."],
  ],
  responsibilities: ["Choose a unique password used only for RFC.", "Never share your password, PIN or verification code.", "Check the website address before entering your credentials.", "Keep your phone and browser up to date.", "Use your security area to close other sessions if you do not recognize a device."],
  steps: ["Change your password immediately from your customer account.", "Close any active sessions you do not recognize.", "Report the incident through your secure customer messaging.", "If you can no longer access your account, use the public contact form."],
};

export const aboutEn = {
  intro: { title: "A trusted bank built on clarity", description: "RFC provides banking services around a simple question: where is my money, and what happens next?" },
  sections: [
    { title: "Our story", paragraphs: ["RFC began with a simple observation: banking interfaces often do a poor job of explaining what happens to customers' money. Transactions appear, disappear and change status without explanation.", "We are improving our banking services so every transaction can be traced, every check is explained and every document is easy to find."] },
    { title: "Our mission", paragraphs: ["Make banking understandable: provide a faithful view of accounts, remove needless complexity and make daily transactions accessible in a few steps.", "That mission comes with a responsibility to maintain sound financial controls, even when they slow a transaction down."] },
    { title: "Our vision", paragraphs: ["A lasting banking relationship where customers always know what the bank needs from them and what has happened to their request."] },
    { title: "Our approach to banking", paragraphs: ["Balances are never changed directly: they follow double-entry ledger records, keeping what customers see consistent with what the bank records.", "Sensitive processing happens on the bank's systems with an audit trail, not in the browser."] },
    { title: "Technology and innovation", paragraphs: ["The platform is designed for mobile access and accessibility, and works over mobile networks. It operates online without local copies of banking data.", "Innovation means making the product clearer: transfer tracking, guided document requests, digital statements and contextual messaging."] },
    { title: "Security and responsibility", paragraphs: ["Security is part of the product, not an afterthought: stronger authentication, confirmation of sensitive actions, access logs and session management."] },
  ],
  values: [["Trust", "What you see matches what is recorded."], ["Clarity", "Plain language, explicit statuses and no ambiguity."], ["Security", "Customers can see and manage their protections."], ["Responsibility", "Financial controls are applied and documented."], ["Innovation", "Practical product improvements, not slogans."], ["Accessibility", "Usable with a keyboard, screen reader or small screen."], ["Human support", "Every request can become a conversation."]],
  commitment: { title: "Our commitment to customers", points: ["Explain the status of each transaction.", "Specify exactly which documents are needed.", "Never ask for a password or verification code.", "Keep a history of your conversations and documents."] },
  governance: { title: "Governance", description: "Governance information and the legal identity of the operating entity will be published here when officially provided." },
};

const termsTitles = ["Purpose and scope", "Account opening and identity verification", "Services provided", "Online access and credential security", "Transactions and transfers", "Additional checks and verification", "Pricing and fees", "Statements and documents", "Responsibilities", "Term, amendments and closure", "Complaints and mediation", "Applicable law"];
const privacyTitles = ["Data collected", "Purposes of processing", "Use of data", "Recipients and processors", "Retention period", "Data security", "Your rights", "Tracking technologies", "Contact"];
export function englishLegalDocument(document: LegalDocument): LegalDocument {
  const terms = document.slug === "terms";
  const titles = terms ? termsTitles : privacyTitles;
  return { ...document, title: terms ? "Terms and conditions" : "Privacy policy", intro: terms ? "These terms will describe the contractual relationship between the customer and the bank: account opening, use of services, mutual obligations and ending the relationship." : "This policy will describe the data we collect, why we collect it, how long we retain it and your rights.", sections: document.sections.map((section, index) => ({ ...section, title: `${index + 1}. ${titles[index] ?? section.title}` })) };
}
