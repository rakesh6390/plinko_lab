// core engine logic
import { sha256 } from "./crypto";
import { seedToNumber } from "./fairness";
import { createXorShift32 } from "./prng";

function generateBias(rand: () => number): number {
  const bias = 0.5 + (rand() - 0.5) * 0.2;
  return Number(bias.toFixed(6));
}
function generatePegMap(rows: number, rand: () => number) {
  const pegMap: number[][] = [];

  for (let r = 0; r < rows; r++) {
    const row: number[] = [];

    for (let p = 0; p <= r; p++) {
      row.push(generateBias(rand));
    }

    pegMap.push(row);
  }

  return pegMap;
}
function computePath(
  pegMap: number[][],
  rand: () => number,
  dropColumn: number,
  rows: number,
) {
  let pos = 0;
  const path: ("L" | "R")[] = [];

  const adj = (dropColumn - Math.floor(rows / 2)) * 0.01;

  for (let r = 0; r < rows; r++) {
    const pegIndex = Math.min(pos, r);

    let bias = pegMap[r][pegIndex] + adj;

    bias = Math.max(0, Math.min(1, bias));

    const rnd = rand();

    if (rnd < bias) {
      path.push("L");
    } else {
      path.push("R");
      pos++;
    }
  }

  return { path, binIndex: pos };
}
export function runPlinkoEngine(
  combinedSeed: string,
  rows: number,
  dropColumn: number,
) {
  const seedNumber = seedToNumber(combinedSeed);

  const rand = createXorShift32(seedNumber);

  const pegMap = generatePegMap(rows, rand);

  const pegMapHash = sha256(JSON.stringify(pegMap));

  const { path, binIndex } = computePath(pegMap, rand, dropColumn, rows);

  return {
    pegMap,
    pegMapHash,
    path,
    binIndex,
  };
}

/* need to test 1st */
