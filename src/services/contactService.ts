import { PrismaClient, Contact, LinkType } from "../generated/prisma";
import { ConsolidatedContact, IdentifyRequest } from "../utils/types";
import {
  needsNewSecondaryContact,
  consolidateContacts,
  findPrimaryContactId,
} from "../utils/contactUtils";

const prisma = new PrismaClient();

export const identifyContact = async (
  request: IdentifyRequest
): Promise<ConsolidatedContact> => {
  const { email, phoneNumber } = request;

  // Find existing contacts that match email or phone
  const existingContacts = await findMatchingContacts(email, phoneNumber);

  if (existingContacts.length === 0) {
    // No existing contacts - create new primary contact
    return await createNewPrimaryContact(email, phoneNumber);
  }

  // Check if we need to create a new secondary contact
  const needsNewContact = needsNewSecondaryContact(
    existingContacts,
    email,
    phoneNumber
  );

  if (needsNewContact.needed) {
    await createSecondaryContact(
      email,
      phoneNumber,
      needsNewContact.primaryContactId!
    );
  }

  // Handle linking of separate primary contacts
  await handlePrimaryContactLinking(existingContacts, email, phoneNumber);

  // Get all related contacts and consolidate
  const allRelatedContacts = await getAllRelatedContacts(existingContacts);

  return consolidateContacts(allRelatedContacts);
};

const findMatchingContacts = async (
  email?: string,
  phoneNumber?: string
): Promise<Contact[]> => {
  const whereConditions = [];

  if (email) {
    whereConditions.push({ email });
  }

  if (phoneNumber) {
    whereConditions.push({ phoneNumber });
  }

  if (whereConditions.length === 0) {
    return [];
  }

  return await prisma.contact.findMany({
    where: {
      OR: whereConditions,
      deletedAt: null,
    },
    orderBy: { createdAt: "asc" },
  });
};

const createNewPrimaryContact = async (
  email?: string,
  phoneNumber?: string
): Promise<ConsolidatedContact> => {
  const newContact = await prisma.contact.create({
    data: {
      email,
      phoneNumber,
      linkedId: null,
      linkPrecedence: LinkType.PRIMARY,
    },
  });

  return {
    primaryContatctId: newContact.id,
    emails: newContact.email ? [newContact.email] : [],
    phoneNumbers: newContact.phoneNumber ? [newContact.phoneNumber] : [],
    secondaryContactIds: [],
  };
};

const createSecondaryContact = async (
  email?: string,
  phoneNumber?: string,
  primaryContactId?: number
): Promise<Contact> => {
  return await prisma.contact.create({
    data: {
      email,
      phoneNumber,
      linkedId: primaryContactId,
      linkPrecedence: LinkType.SECONDARY,
    },
  });
};

const handlePrimaryContactLinking = async (
  existingContacts: Contact[],
  email?: string,
  phoneNumber?: string
): Promise<void> => {
  const primaries = existingContacts.filter(
    (c) => c.linkPrecedence === LinkType.PRIMARY
  );

  if (primaries.length <= 1) {
    return; // No linking needed
  }

  // Check if the request links two separate primary contacts
  const emailMatch = primaries.find((c) => c.email === email);
  const phoneMatch = primaries.find((c) => c.phoneNumber === phoneNumber);

  if (emailMatch && phoneMatch && emailMatch.id !== phoneMatch.id) {
    // Two different primary contacts need to be linked
    const olderPrimary = primaries.reduce((oldest, current) =>
      current.createdAt < oldest.createdAt ? current : oldest
    );

    const contactsToUpdate = primaries.filter((c) => c.id !== olderPrimary.id);

    // Update other primaries and their chains to be secondary to the oldest
    for (const contact of contactsToUpdate) {
      await convertPrimaryToSecondary(contact.id, olderPrimary.id);
    }
  }
};

const convertPrimaryToSecondary = async (
  primaryId: number,
  newPrimaryId: number
): Promise<void> => {
  // Update the primary contact to secondary
  await prisma.contact.update({
    where: { id: primaryId },
    data: {
      linkedId: newPrimaryId,
      linkPrecedence: LinkType.SECONDARY,
    },
  });

  // Update all contacts that were linked to this primary
  await prisma.contact.updateMany({
    where: { linkedId: primaryId },
    data: { linkedId: newPrimaryId },
  });
};

const getAllRelatedContacts = async (
  existingContacts: Contact[]
): Promise<Contact[]> => {
  if (existingContacts.length === 0) {
    return [];
  }

  // Get all primary contact IDs
  const primaryIds = new Set<number>();

  existingContacts.forEach((contact) => {
    if (contact.linkPrecedence === LinkType.PRIMARY) {
      primaryIds.add(contact.id);
    } else if (contact.linkedId) {
      primaryIds.add(contact.linkedId);
    }
  });

  // Fetch all contacts related to these primaries
  const allRelatedContacts = await prisma.contact.findMany({
    where: {
      OR: [
        { id: { in: Array.from(primaryIds) } },
        { linkedId: { in: Array.from(primaryIds) } },
      ],
      deletedAt: null,
    },
    orderBy: { createdAt: "asc" },
  });

  return allRelatedContacts;
};

export const disconnectPrisma = async (): Promise<void> => {
  await prisma.$disconnect();
};
