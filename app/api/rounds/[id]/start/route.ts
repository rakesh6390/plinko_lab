import { runPlinkoEngine } from "@/lib/engine";
import { createCombinedSeed } from "@/lib/fairness";
import { findRound, updateRound } from "@/lib/roundStore";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    const { clientSeed, betCents, dropColumn } = await req.json();

    const round = await findRound(id);

    if (!round || !round.serverSeed) {
      return NextResponse.json({ error: "Round not found" }, { status: 404 });
    }

    const combinedSeed = createCombinedSeed(
      round.serverSeed,
      clientSeed,
      round.nonce,
    );

    const engineResult = runPlinkoEngine(combinedSeed, round.rows, dropColumn);

    const updated = await updateRound(id, {
      status: "STARTED",
      clientSeed,
      combinedSeed,
      pegMapHash: engineResult.pegMapHash,
      dropColumn,
      binIndex: engineResult.binIndex,
      betCents,
      pathJson: engineResult.path,
    });

    if (!updated) {
      return NextResponse.json({ error: "Round not found" }, { status: 404 });
    }

    return NextResponse.json({
      roundId: updated.id,
      pegMapHash: engineResult.pegMapHash,
      binIndex: engineResult.binIndex,
      rows: updated.rows,
      pathJson: engineResult.path,
    });
  } catch (error) {
    console.error("Failed to start round", error);

    return NextResponse.json(
      { error: "Failed to start round. Check the database connection." },
      { status: 500 },
    );
  }
}
