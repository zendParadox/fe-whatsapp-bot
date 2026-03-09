import { prisma } from "@/lib/prisma";

/**
 * Find all wallets accessible to a user: owned wallets + shared wallets (via WalletMember).
 * Returns a flat array of Wallet objects.
 */
export async function findAccessibleWallets(userId: string) {
  // Get own wallets
  const ownWallets = await prisma.wallet.findMany({
    where: { user_id: userId },
  });

  // Get shared wallets where user is a member (not owner)
  const memberships = await prisma.walletMember.findMany({
    where: { user_id: userId },
    include: { wallet: true },
  });

  const sharedWallets = memberships
    .filter(m => m.wallet.user_id !== userId)
    .map(m => m.wallet);

  return [...ownWallets, ...sharedWallets];
}

/**
 * Find a single wallet by name that is accessible to the user (owned or shared).
 * Case-insensitive match.
 */
export async function findAccessibleWalletByName(userId: string, walletName: string) {
  // Try own wallet first
  const ownWallet = await prisma.wallet.findFirst({
    where: {
      user_id: userId,
      name: { equals: walletName, mode: "insensitive" },
    },
  });

  if (ownWallet) return ownWallet;

  // Try shared wallets
  const membership = await prisma.walletMember.findFirst({
    where: {
      user_id: userId,
      wallet: {
        name: { equals: walletName, mode: "insensitive" },
      },
    },
    include: { wallet: true },
  });

  return membership?.wallet || null;
}
