import type {DomainId} from "../../_shared/types";
export type OnboardingStatus="started"|"pending_review"|"approved"|"rejected";
export type OnboardingCase={id:DomainId;customerId:DomainId;status:OnboardingStatus;step:string};
