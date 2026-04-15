export function createXorShift32(seed: number) {
  let state = seed >>> 0;

  return function rand(): number {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;

    return (state >>> 0) / 4294967296;
  };
}
