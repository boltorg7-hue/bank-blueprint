import type {CommandContext,CommandResult} from "../../_shared/commands";import type {NotificationCenterDto} from "../types";
export type GetNotificationsCommand={};export type GetNotificationsHandler=(command:GetNotificationsCommand,context:CommandContext)=>Promise<CommandResult<NotificationCenterDto>>;
export type UpdateNotificationCommand={id:string;action:"READ"|"ARCHIVE"};export type UpdateNotificationHandler=(command:UpdateNotificationCommand,context:CommandContext)=>Promise<CommandResult<unknown>>;
export type MarkEveryNotificationReadCommand={};export type MarkEveryNotificationReadHandler=(command:MarkEveryNotificationReadCommand,context:CommandContext)=>Promise<CommandResult<unknown>>;
