import type {CommandContext,CommandResult} from "../../_shared/commands";import type {CustomerAccountDetailsDto,CustomerAccountSummaryDto,DashboardSummaryDto} from "../types";
export type GetCustomerAccountsCommand={};export type GetCustomerAccountsHandler=(command:GetCustomerAccountsCommand,context:CommandContext)=>Promise<CommandResult<CustomerAccountSummaryDto[]>>;
export type GetAccountDetailsCommand={reference:string};export type GetAccountDetailsHandler=(command:GetAccountDetailsCommand,context:CommandContext)=>Promise<CommandResult<CustomerAccountDetailsDto|null>>;
export type GetDashboardSummaryCommand={};export type GetDashboardSummaryHandler=(command:GetDashboardSummaryCommand,context:CommandContext)=>Promise<CommandResult<DashboardSummaryDto>>;
