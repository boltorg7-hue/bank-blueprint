import type {
  AdminExternalTransferDto,
  AdminExternalTransferPageDto,
} from "@/features/admin/types/admin";

export type AdminTransferDocumentReviewHistoryDto = {
  id: string;
  actorName: string;
  decision: "ACCEPT" | "REQUEST_REPLACEMENT";
  previousStatus: string;
  newStatus: string;
  reasonCode: string | null;
  createdAt: string;
};

export type AdminTransferDocumentDto = {
  id: string;
  requirementId: string | null;
  documentType: string;
  originalFilename: string | null;
  status: string;
  rejectionReasonCode: string | null;
  uploadedAt: string;
  reviewedAt: string | null;
  history: AdminTransferDocumentReviewHistoryDto[];
};

export type AdminExternalTransferWithDocumentsDto = AdminExternalTransferDto & {
  documents: AdminTransferDocumentDto[];
};

export type AdminExternalTransferReviewPageDto = Omit<
  AdminExternalTransferPageDto,
  "items"
> & {
  items: AdminExternalTransferWithDocumentsDto[];
};
