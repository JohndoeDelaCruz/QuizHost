export function lineWinner(
  cells: (string | null)[],
  rows: number,
  columns: number,
  length: number,
): string | null {
  for (let row = 0; row < rows; row++)
    for (let col = 0; col < columns; col++) {
      const owner = cells[row * columns + col];
      if (!owner) continue;
      for (const [dr, dc] of [
        [0, 1],
        [1, 0],
        [1, 1],
        [1, -1],
      ]) {
        let found = true;
        for (let step = 1; step < length; step++) {
          const r = row + step * dr,
            c = col + step * dc;
          if (
            r < 0 ||
            r >= rows ||
            c < 0 ||
            c >= columns ||
            cells[r * columns + c] !== owner
          ) {
            found = false;
            break;
          }
        }
        if (found) return owner;
      }
    }
  return null;
}
export const GARDEN_ROCKS = [7, 12, 17];
export const GARDEN_STARTS = [0, 24, 4, 20, 2, 22, 10, 14];
export function reachableCells(
  start: number,
  steps: number,
  size = 5,
  rocks = GARDEN_ROCKS,
) {
  const reached = new Map<number, number>([[start, 0]]),
    queue = [start];
  while (queue.length) {
    const cell = queue.shift()!,
      distance = reached.get(cell)!;
    if (distance >= steps) continue;
    const row = Math.floor(cell / size),
      col = cell % size;
    for (const [dr, dc] of [
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0],
    ]) {
      const r = row + dr,
        c = col + dc,
        n = r * size + c;
      if (
        r < 0 ||
        r >= size ||
        c < 0 ||
        c >= size ||
        rocks.includes(n) ||
        reached.has(n)
      )
        continue;
      reached.set(n, distance + 1);
      queue.push(n);
    }
  }
  return [...reached.keys()].filter((cell) => cell !== start);
}
export const SNAKE_LINKS: Record<number, number> = {
  3: 11,
  8: 16,
  15: 23,
  22: 29,
  17: 7,
  25: 13,
  28: 20,
};
export const TRAIL_RED = [7, 13, 18],
  TRAIL_GREEN = [3, 10, 16];
export function wordAnswer(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}
export function usableWord(text: string) {
  const word = wordAnswer(text);
  return word.length > 0 && word.length <= 60 && /[A-Z]/.test(word);
}
