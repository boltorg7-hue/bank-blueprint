import type {DocumentLifecycleStatus} from "../../statements/types";
export type CustomerDocumentType="ACCOUNT_STATEMENT"|"TRANSFER_RECEIPT"|"TRANSACTION_RECEIPT"|"BANK_LETTER"|"ACCOUNT_CERTIFICATE";
export type CustomerDocumentDto={reference:string;documentType:CustomerDocumentType;title:string;status:DocumentLifecycleStatus;sourceType:string;sourceReference:string|null;accountReference:string|null;fileName:string|null;mimeType:string;sizeBytes:number|null;version:number;generatedAt:string|null;createdAt:string};
export type CustomerDocumentPageDto={items:CustomerDocumentDto[];hasNext:boolean;nextCursor:string|null};
export type DocumentDownloadDto={url:string;fileName:string;expiresInSeconds:number};
export type DocumentFilter="ALL"|"STATEMENTS"|"RECEIPTS"|"LETTERS";
export const DOCUMENT_REFERENCE_PATTERN=/^DOC-\\d{4}-\\d{8}$/;
export const DOCUMENT_TYPE_LABELS:Record<CustomerDocumentType,string>={ACCOUNT_STATEMENT:"Relevé de compte",TRANSFER_RECEIPT:"Reçu de virement",TRANSACTION_RECEIPT:"Reçu d'opération",BANK_LETTER:"Courrier bancaire",ACCOUNT_CERTIFICATE:"Attestation de compte"};
export const DOCUMENT_STATUS_LABELS:Record<DocumentLifecycleStatus,string>={GENERATING:"En préparation",READY:"Disponible",FAILED:"Échec",SUPERSEDED:"Remplacé"};
export function documentTypesForFilter(filter:DocumentFilter):CustomerDocumentType[]|null{switch(filter){case"STATEMENTS":return["ACCOUNT_STATEMENT"];case"RECEIPTS":return["TRANSFER_RECEIPT","TRANSACTION_RECEIPT"];case"LETTERS":return["BANK_LETTER","ACCOUNT_CERTIFICATE"];default:return null;}}
