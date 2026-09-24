import type { CustomerLifecycleState } from "@/types/customer-lifecycle";

export type ProfileOverviewDto = {
  email: string | null;
  emailVerified: boolean;
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  countryOfResidence: string;
  occupation: string;
  phone: string;
  phoneVerified: boolean;
  lifecycleState: CustomerLifecycleState;
  identityStatus: string;
  identityLocked: boolean;
  address: { country: string; addressLine1: string; addressLine2: string; city: string; region: string; postalCode: string };
  accounts: { reference: string; displayName: string; currency: string; status: string; maskedNumber: string; iban: string | null; bic: string | null }[];
};

export type CustomerPreferencesDto = {
  language: "fr" | "en";
  theme: "light" | "dark" | "system";
  privacyModeDefault: boolean;
  smsTransactions: boolean;
  smsSecurity: boolean;
  emailService: boolean;
};
