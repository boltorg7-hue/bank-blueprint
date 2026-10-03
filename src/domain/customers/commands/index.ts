import type {CommandContext,CommandResult} from "../../_shared/commands";import type {CustomerSummary} from "../types";
export type UpdateCustomerProfileCommand={customerId:string;patch:Record<string,unknown>};
export type UpdateCustomerProfileHandler=(command:UpdateCustomerProfileCommand,context:CommandContext)=>Promise<CommandResult<CustomerSummary>>;
