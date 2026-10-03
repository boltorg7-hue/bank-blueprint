import type {DomainEvent} from "../../_shared/types";
export type OnboardingStartedEvent=DomainEvent<"onboarding.case.started",{customerId:string}>;
export type OnboardingCompletedEvent=DomainEvent<"onboarding.case.completed",{customerId:string;approved:boolean}>;
export type OnboardingEvent=OnboardingStartedEvent|OnboardingCompletedEvent;
