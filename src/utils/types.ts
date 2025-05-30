export interface IdentifyRequest {
  email?: string;
  phoneNumber?: string;
}

export interface ConsolidatedContact {
  primaryContatctId: number;
  emails: string[];
  phoneNumbers: string[];
  secondaryContactIds: number[];
}

export interface ApiResponse {
  contact: ConsolidatedContact;
}

export interface ErrorResponse {
  error: string;
  details?: any;
}

export interface CreateContactInput {
  email?: string;
  phoneNumber?: string;
  linkedId?: number;
  linkPrecedence: "PRIMARY" | "SECONDARY";
}

export interface LinkingAnalysis {
  needsNewContact: boolean;
  primaryContactId?: number;
  shouldLinkPrimaries: boolean;
  contactsToLink?: number[];
}
