export * from "./database";

// Convenience aliases for commonly-used table row types, so consuming
// code can write `Errand` instead of `Database["public"]["Tables"]["errands"]["Row"]`.
import type { Database } from "./database";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Scout = Database["public"]["Tables"]["scouts"]["Row"];
export type Errand = Database["public"]["Tables"]["errands"]["Row"];
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
export type BalanceRequest = Database["public"]["Tables"]["balance_requests"]["Row"];
export type Dispute = Database["public"]["Tables"]["disputes"]["Row"];
export type ChatMessage = Database["public"]["Tables"]["chat_messages"]["Row"];
export type Rating = Database["public"]["Tables"]["ratings"]["Row"];
export type PayoutBatch = Database["public"]["Tables"]["payout_batches"]["Row"];
export type PayoutBatchItem = Database["public"]["Tables"]["payout_batch_items"]["Row"];

export type ErrandStatus = Database["public"]["Enums"]["errand_status"];
export type TrustTier = Database["public"]["Enums"]["trust_tier"];
export type VerificationStatus = Database["public"]["Enums"]["verification_status"];
export type TransactionType = Database["public"]["Enums"]["transaction_type"];
export type DisputeStatus = Database["public"]["Enums"]["dispute_status"];
export type DisputeResolution = Database["public"]["Enums"]["dispute_resolution"];
export type BalanceRequestStatus = Database["public"]["Enums"]["balance_request_status"];
export type PayoutBatchStatus = Database["public"]["Enums"]["payout_batch_status"];
