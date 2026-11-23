export function getIdGenerator(initialId: number = 0): () => number {
  let id = initialId;
  return () => id++;
}
