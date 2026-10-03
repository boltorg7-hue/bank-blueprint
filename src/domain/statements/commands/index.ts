import type {CommandContext,CommandResult} from "../../_shared/commands";import type {StatementDetailDto,StatementDto,StatementGenerationRequest} from "../types";
export type ListCustomerStatementsCommand={limit?:number};export type ListCustomerStatementsHandler=(command:ListCustomerStatementsCommand,context:CommandContext)=>Promise<CommandResult<StatementDto[]>>;
export type GetStatementCommand={reference:string};export type GetStatementHandler=(command:GetStatementCommand,context:CommandContext)=>Promise<CommandResult<StatementDetailDto|null>>;
export type RequestAccountStatementCommand=StatementGenerationRequest;export type RequestAccountStatementHandler=(command:RequestAccountStatementCommand,context:CommandContext)=>Promise<CommandResult<StatementDetailDto>>;
