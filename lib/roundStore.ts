import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type RoundData = {
  status: string;
  serverSeed?: string | null;
  nonce: string;
  commitHex: string;
  rows: number;
};

type RoundUpdate = Partial<{
  status: string;
  clientSeed: string;
  combinedSeed: string;
  pegMapHash: string;
  dropColumn: number;
  binIndex: number;
  betCents: number;
  pathJson: Prisma.InputJsonValue;
  revealedAt: Date;
}>;

export type RoundRecord = {
  id: string;
  createdAt: Date;
  status: string;
  nonce: string;
  commitHex: string;
  serverSeed: string | null;
  clientSeed?: string;
  combinedSeed?: string;
  pegMapHash?: string;
  rows: number;
  dropColumn: number | null;
  binIndex: number | null;
  payoutMultiplier: number | null;
  betCents: number | null;
  pathJson: unknown | null;
  revealedAt: Date | null;
};

const globalForRounds = global as unknown as {
  memoryRounds: Map<string, RoundRecord> | undefined;
};

const memoryRounds =
  globalForRounds.memoryRounds ?? new Map<string, RoundRecord>();

if (process.env.NODE_ENV !== "production") {
  globalForRounds.memoryRounds = memoryRounds;
}

const useLocalRounds = process.env.LOCAL_ROUNDS === "1";

export async function createRound(data: RoundData) {
  if (useLocalRounds) {
    return createMemoryRound(data);
  }

  return prisma.round.create({ data });
}

export async function findRound(id: string) {
  if (useLocalRounds) {
    return memoryRounds.get(id) ?? null;
  }

  return prisma.round.findUnique({ where: { id } });
}

export async function updateRound(id: string, data: RoundUpdate) {
  if (useLocalRounds) {
    const round = memoryRounds.get(id);

    if (!round) {
      return null;
    }

    const updated = { ...round, ...data };
    memoryRounds.set(id, updated);
    return updated;
  }

  return prisma.round.update({
    where: { id },
    data,
  });
}

function createMemoryRound(data: RoundData) {
  const round: RoundRecord = {
    id: `local_${crypto.randomUUID()}`,
    createdAt: new Date(),
    ...data,
    serverSeed: data.serverSeed ?? null,
    dropColumn: null,
    binIndex: null,
    payoutMultiplier: null,
    betCents: null,
    pathJson: null,
    revealedAt: null,
  };

  memoryRounds.set(round.id, round);
  return round;
}
