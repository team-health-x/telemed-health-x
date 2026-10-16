// Share only in-flight GETs, never completed responses or payment mutations.
const pending = new Map<string, Promise<unknown>>();

export function getBeamJson<T>(url: string): Promise<T> {
  const existing = pending.get(url);
  if (existing) return existing as Promise<T>;
  const request = (async () => {
    const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(15000) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'โหลดข้อมูลชำระเงินไม่สำเร็จ');
    return result as T;
  })();
  pending.set(url, request);
  void request.finally(() => { if (pending.get(url) === request) pending.delete(url); }).catch(() => {});
  return request;
}
