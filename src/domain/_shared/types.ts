export type DomainId = string;
export type ISODateTime = string;
export type CurrencyCode = string;
export type Money = { amount: number; currency: CurrencyCode };
export type CorrelationId = string;
export type CausationId = string;

export type DomainEvent<TType extends string, TPayload> = {
  id: DomainId;
  type: TType;
  occurredAt: ISODateTime;
  aggregateId: DomainId;
  correlationId: CorrelationId;
  causationId?: CausationId;
  payload: TPayload;
};
