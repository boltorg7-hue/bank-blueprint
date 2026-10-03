import type { DomainEvent } from "./types";

export type EventEnvelope<TType extends string, TPayload> = DomainEvent<TType, TPayload>;
