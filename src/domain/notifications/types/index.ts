import type {DomainId} from "../../_shared/types";
export type NotificationChannel="email"|"sms"|"push"|"in_app";
export type Notification={id:DomainId;customerId:DomainId;channel:NotificationChannel;template:string;read:boolean};
