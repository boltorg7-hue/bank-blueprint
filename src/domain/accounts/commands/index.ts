import type { CommandContext, CommandResult } from "../../_shared/commands";
import type { Account } from "../types";
export type CreateAccountCommand = { customerId: string; currency: string };
export type CreateAccountHandler = (command: CreateAccountCommand, context: CommandContext) => Promise<CommandResult<Account>>;
