import { runPlinkoEngine } from "@/lib/engine";
import { createCombinedSeed, createCommit } from "@/lib/fairness";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const serverSeed = searchParams.get("serverSeed")!;
  const clientSeed = searchParams.get("clientSeed")!;
  const nonce = searchParams.get("nonce")!;
  const dropColumn = Number(searchParams.get("dropColumn"));

  const commitHex = createCommit(serverSeed, nonce);

  const combinedSeed = createCombinedSeed(serverSeed, clientSeed, nonce);

  const engineResult = runPlinkoEngine(combinedSeed, 12, dropColumn);

  return NextResponse.json({
    commitHex,
    combinedSeed,
    pegMapHash: engineResult.pegMapHash,
    binIndex: engineResult.binIndex,
  });
}
