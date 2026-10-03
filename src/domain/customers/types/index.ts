import type {CustomerProfile,CustomerAddress,IdentityVerification,VerificationDocument} from "../../onboarding/types";
export type Customer={id:string;email:string|null;profile:CustomerProfile;address:CustomerAddress|null;verification:IdentityVerification;documents:VerificationDocument[]};
export type CustomerSummary={id:string;email:string|null;firstName:string|null;lastName:string|null;lifecycleState:CustomerProfile["lifecycle_state"];onboardingStep:CustomerProfile["onboarding_step"]};
