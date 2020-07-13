export type Payment = {

  // The business ID
  bid?: string;

  // List of payments IDs that have already made and verified
  paymentsIds?: string[];

  // Account expiring time
  validUntil?: number;

  // Has free account
  freeAccount?: boolean;

}
