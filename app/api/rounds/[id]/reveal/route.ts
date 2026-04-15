import { findRound, updateRound } from "@/lib/roundStore";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  const round = await findRound(id);

  if (!round) {
    return NextResponse.json({ error: "Round not found" }, { status: 404 });
  }

  await updateRound(id, {
    status: "REVEALED",
    revealedAt: new Date(),
  });

  return NextResponse.json({
    serverSeed: round.serverSeed,
  });
}
