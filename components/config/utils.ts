/** 新条目 id：取当前最大 id + 1。 */
export function nextId(items: readonly { id: number }[]): number {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1
}
