import type {CommandContext,CommandResult} from "../../_shared/commands";import type {Notification} from "../types";
export type SendNotificationCommand={customerId:string;channel:"email"|"sms"|"push"|"in_app";template:string};
export type SendNotificationHandler=(command:SendNotificationCommand,context:CommandContext)=>Promise<CommandResult<Notification>>;
