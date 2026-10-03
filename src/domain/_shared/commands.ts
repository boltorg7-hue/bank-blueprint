import type { DomainId } from "./types";

export type CommandContext = {
  actorId: DomainId;
  correlationId: string;
  idempotencyKey?: string;
};

export type CommandResult<T> = { data: T; eventIds: DomainId[] };
