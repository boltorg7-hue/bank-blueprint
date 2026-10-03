import type { CommandContext, CommandResult } from "../../_shared/commands";
import type { Customer } from "../types";
export type CreateCustomerCommand = { email: string; displayName: string };
export type CreateCustomerHandler = (command: CreateCustomerCommand, context: CommandContext) => Promise<CommandResult<Customer>>;
