import type { CustomerDocumentDto } from "../types";
export type DocumentSummary = Pick<CustomerDocumentDto, "reference" | "documentType" | "status">;
