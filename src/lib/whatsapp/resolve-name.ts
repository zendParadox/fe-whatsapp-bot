import { prisma } from "../prisma";

/**
 * Resolves a WhatsApp LID or phone number to a User's first name.
 * If no match is found, returns the original input.
 */
export async function resolveContactName(lidOrName: string): Promise<string> {
  if (!lidOrName) return "Tanpa Nama";
  
  try {
    const userMatch = await prisma.user.findFirst({
      where: {
        OR: [
          { whatsapp_jid: { contains: lidOrName } },
          { lidMappings: { some: { lid: lidOrName } } }
        ]
      },
      select: { name: true }
    });

    if (userMatch && userMatch.name) {
      // Return just the first name to keep things tidy
      return userMatch.name.split(' ')[0];
    }
  } catch (e) {
    console.error("Failed to resolve name for", lidOrName, e);
  }

  return lidOrName;
}
