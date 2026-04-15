import crypto from "crypto";
import { sha256 } from "./crypto";

// commitHex = SHA256(serverSeed:nonce)

export function createCommit(serverSeed: string, nonce: string) {
  return sha256(`${serverSeed}:${nonce}`);
}
// combinedSeed = SHA256(serverSeed:clientSeed:nonce)

export function createCombinedSeed(
  serverSeed: string,
  clientSeed: string,
  nonce: string,
) {
  return sha256(`${serverSeed}:${clientSeed}:${nonce}`);
}

export function seedToNumber(seedHex: string): number {
  const first8 = seedHex.slice(0, 8); // first 4 bytes
  return parseInt(first8, 16);
}

// for genrating server seed (need work)
export function generateServerSeed(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function generateNonce(): string {
  return crypto.randomBytes(8).toString("hex");
}
