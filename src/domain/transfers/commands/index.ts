import type { CommandContext, CommandResult } from "../../_shared/commands";
import type { Transfer } from "../types";
export type CreateTransferCommand = { sourceAccountId: string; destinationAccountId: string; amount: number; currency: string };
export type CreateTransferHandler = (command: CreateTransferCommand, context: CommandContext) => Promise<CommandResult<Transfer>>;
