// for now api move to seprate project API
import {
  createCommit,
  generateNonce,
  generateServerSeed,
} from "@/lib/fairness";
import { createRound } from "@/lib/roundStore";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const serverSeed = generateServerSeed();
    const nonce = generateNonce();

    const commitHex = createCommit(serverSeed, nonce);

    const round = await createRound({
      status: "CREATED",
      serverSeed,
      nonce,
      commitHex,
      rows: 12,
    });

    return NextResponse.json({
      roundId: round.id,
      commitHex,
      nonce,
    });
  } catch (error) {
    console.error("Failed to create round", error);

    return NextResponse.json(
      { error: "Failed to create round. Check the database connection." },
      { status: 500 },
    );
  }
}
