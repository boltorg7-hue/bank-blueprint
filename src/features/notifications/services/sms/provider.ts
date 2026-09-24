export type SmsMessage = { recipient:string; templateKey:string; payload:Record<string,unknown> };
export type SmsResult = { state:"SIMULATED"|"SENT"|"FAILED"; providerReference:string|null; errorCode:string|null };
export interface SmsProvider { send(message:SmsMessage):Promise<SmsResult>; }
