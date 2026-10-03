import type {CommandContext,CommandResult} from "../../_shared/commands";import type {SecurityOverviewDto} from "../types";
export type GetSecurityOverviewCommand={};export type GetSecurityOverviewHandler=(command:GetSecurityOverviewCommand,context:CommandContext)=>Promise<CommandResult<SecurityOverviewDto>>;
export type RegisterSecuritySessionCommand={deviceLabel:string};export type RegisterSecuritySessionHandler=(command:RegisterSecuritySessionCommand,context:CommandContext)=>Promise<CommandResult<{ok:true}>>;
export type CloseOtherSecuritySessionsCommand={};export type RecordPasswordChangedCommand={};
