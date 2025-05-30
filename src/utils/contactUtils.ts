import { Contact, LinkType } from "../generated/prisma";
import { ConsolidatedContact } from "./types";

export const needsNewSecondaryContact = (
  existingContacts: Contact[],
  email?: string,
  phoneNumber?: string
): { needed: boolean; primaryContactId?: number } => {
  if (existingContacts.length === 0) {
    return { needed: false };
  }

  // Check if the exact combination already exists
  const exactMatch = existingContacts.find(
    (contact) => contact.email === email && contact.phoneNumber === phoneNumber
  );

  if (exactMatch) {
    return { needed: false };
  }

  // Find if there's a matching contact with either email or phone
  const partialMatch = existingContacts.find(
    (contact) => contact.email === email || contact.phoneNumber === phoneNumber
  );

  if (!partialMatch) {
    return { needed: false };
  }

  // Check if this would introduce new information
  const hasNewEmail = email && !existingContacts.some((c) => c.email === email);
  const hasNewPhone =
    phoneNumber && !existingContacts.some((c) => c.phoneNumber === phoneNumber);

  if (hasNewEmail || hasNewPhone) {
    // Find the primary contact ID
    const primaryContactId = findPrimaryContactId(
      existingContacts,
      partialMatch
    );
    return { needed: true, primaryContactId };
  }

  return { needed: false };
};

export const findPrimaryContactId = (
  existingContacts: Contact[],
  referenceContact: Contact
): number => {
  if (referenceContact.linkPrecedence === LinkType.PRIMARY) {
    return referenceContact.id;
  }

  if (referenceContact.linkedId) {
    const primary = existingContacts.find(
      (c) => c.id === referenceContact.linkedId
    );
    if (primary) {
      return primary.id;
    }
  }

  // Fallback: find any primary in the list
  const primary = existingContacts.find(
    (c) => c.linkPrecedence === LinkType.PRIMARY
  );
  return primary ? primary.id : referenceContact.id;
};

export const consolidateContacts = (
  contacts: Contact[]
): ConsolidatedContact => {
  if (contacts.length === 0) {
    throw new Error("No contacts to consolidate");
  }

  // Find the primary contact (oldest one with PRIMARY precedence)
  const primaryContact = contacts
    .filter((c) => c.linkPrecedence === LinkType.PRIMARY)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];

  if (!primaryContact) {
    throw new Error("No primary contact found");
  }

  // Get all secondary contacts
  const secondaryContacts = contacts
    .filter(
      (c) =>
        c.linkPrecedence === LinkType.SECONDARY &&
        c.linkedId === primaryContact.id
    )
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  // Collect all unique emails and phone numbers
  const allEmails = collectUniqueEmails([primaryContact, ...secondaryContacts]);
  const allPhoneNumbers = collectUniquePhoneNumbers([
    primaryContact,
    ...secondaryContacts,
  ]);

  return {
    primaryContatctId: primaryContact.id,
    emails: allEmails,
    phoneNumbers: allPhoneNumbers,
    secondaryContactIds: secondaryContacts.map((c) => c.id),
  };
};

const collectUniqueEmails = (contacts: Contact[]): string[] => {
  const emailSet = new Set<string>();
  const emails: string[] = [];

  // Add primary contact's email first
  if (contacts[0]?.email) {
    emails.push(contacts[0].email);
    emailSet.add(contacts[0].email);
  }

  // Add other unique emails
  contacts.slice(1).forEach((contact) => {
    if (contact.email && !emailSet.has(contact.email)) {
      emails.push(contact.email);
      emailSet.add(contact.email);
    }
  });

  return emails;
};

const collectUniquePhoneNumbers = (contacts: Contact[]): string[] => {
  const phoneSet = new Set<string>();
  const phones: string[] = [];

  // Add primary contact's phone first
  if (contacts[0]?.phoneNumber) {
    phones.push(contacts[0].phoneNumber);
    phoneSet.add(contacts[0].phoneNumber);
  }

  // Add other unique phone numbers
  contacts.slice(1).forEach((contact) => {
    if (contact.phoneNumber && !phoneSet.has(contact.phoneNumber)) {
      phones.push(contact.phoneNumber);
      phoneSet.add(contact.phoneNumber);
    }
  });

  return phones;
};

export const validateContactData = (contact: Contact): boolean => {
  // A contact must have at least email or phone
  if (!contact.email && !contact.phoneNumber) {
    return false;
  }

  // Secondary contacts must have a linkedId
  if (contact.linkPrecedence === LinkType.SECONDARY && !contact.linkedId) {
    return false;
  }

  // Primary contacts should not have a linkedId
  if (contact.linkPrecedence === LinkType.PRIMARY && contact.linkedId) {
    return false;
  }

  return true;
};

export const areContactsRelated = (
  contact1: Contact,
  contact2: Contact
): boolean => {
  // Same email or same phone number means they're related
  if (contact1.email && contact1.email === contact2.email) {
    return true;
  }

  if (contact1.phoneNumber && contact1.phoneNumber === contact2.phoneNumber) {
    return true;
  }

  return false;
};

export const getContactChain = (
  contacts: Contact[],
  primaryId: number
): number[] => {
  const chain = [primaryId];

  const secondaryContacts = contacts
    .filter((c) => c.linkedId === primaryId)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  chain.push(...secondaryContacts.map((c) => c.id));

  return chain;
};

export const formatContactForLog = (contact: Contact): string => {
  return `Contact(id=${contact.id}, email=${contact.email || "null"}, phone=${
    contact.phoneNumber || "null"
  }, precedence=${contact.linkPrecedence}, linkedId=${
    contact.linkedId || "null"
  })`;
};
