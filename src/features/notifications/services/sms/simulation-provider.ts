import type { SmsProvider } from "./provider";
export const simulationSmsProvider: SmsProvider = { async send() { return { state:"SIMULATED", providerReference:`SMS-SIM-${crypto.randomUUID()}`, errorCode:null }; } };
