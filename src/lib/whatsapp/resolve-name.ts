import { prisma } from "../prisma";

/**
 * Resolves a WhatsApp LID or phone number to a User's first name.
 * If no match is found, returns the original input.
 */
export async function resolveContactName(lidOrName: string): Promise<string> {
  if (!lidOrName) return "Tanpa Nama";
  
  try {
    // Strip out @lid or @s.whatsapp.net from the input before querying
    // This handles both "1109" and "1109@lid" correctly
    const cleanId = lidOrName.split('@')[0];

    // If there's no number left, fallback
    if (!cleanId) return lidOrName;

    const userMatch = await prisma.user.findFirst({
      where: {
        OR: [
          { whatsapp_jid: { contains: cleanId } },
          { lidMappings: { some: { lid: { contains: cleanId } } } }
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
