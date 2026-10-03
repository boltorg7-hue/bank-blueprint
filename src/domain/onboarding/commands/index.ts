import type {CommandContext,CommandResult} from "../../_shared/commands";import type {CustomerContext} from "../types";
export type GetCustomerContextCommand={};export type GetCustomerContextHandler=(command:GetCustomerContextCommand,context:CommandContext)=>Promise<CommandResult<CustomerContext>>;
export type SaveProfileStepCommand=Record<string,unknown>;export type SaveAddressStepCommand=Record<string,unknown>;export type RegisterDocumentCommand=Record<string,unknown>;
export type SubmitVerificationCommand={};export type SubmitVerificationHandler=(command:SubmitVerificationCommand,context:CommandContext)=>Promise<CommandResult<unknown>>;
