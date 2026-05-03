import { prisma } from "@/lib/prisma";

const CHALLENGE_TTL_MS = 5 * 60 * 1000;

export interface ChallengeData {
  id: string;
  challenge: string;
  userId?: string;
}

export async function createChallenge(
  challenge: string,
  userId?: string,
): Promise<ChallengeData> {
  const record = await prisma.challenge.create({
    data: {
      challenge,
      userId: userId ?? null,
      expires: new Date(Date.now() + CHALLENGE_TTL_MS),
    },
  });
  return { id: record.id, challenge: record.challenge, userId: record.userId ?? undefined };
}

export async function consumeChallenge(
  challengeId: string,
  userId?: string,
): Promise<ChallengeData | null> {
  const record = await prisma.challenge.findUnique({
    where: { id: challengeId },
  });

  if (!record || record.expires <= new Date()) {
    if (record) {
      await prisma.challenge.delete({ where: { id: challengeId } }).catch(() => {});
    }
    return null;
  }

  if (userId && record.userId && record.userId !== userId) {
    return null;
  }

  await prisma.challenge.delete({ where: { id: challengeId } });

  return { id: record.id, challenge: record.challenge, userId: record.userId ?? undefined };
}

export async function cleanupExpiredChallenges(): Promise<number> {
  const result = await prisma.challenge.deleteMany({
    where: { expires: { lte: new Date() } },
  });
  return result.count;
}
