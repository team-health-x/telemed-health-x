export const dynamic = 'force-dynamic';
export async function GET() {
  const origin = process.env.TELEMED_WORKFLOW_ORIGIN;
  if (!origin) return Response.json({ error: 'ยังไม่ได้ตั้งค่าช่องทางชำระ' }, { status: 503 });
  try {
    const response = await fetch(new URL('/api/v1/public/telemed/payment-methods', origin), { cache: 'no-store', signal: AbortSignal.timeout(10000) });
    const result = await response.json();
    if (!response.ok || result.status !== '0000' || !Array.isArray(result.data)) throw Error('Invalid response');
    return Response.json(result.data, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return Response.json({ error: 'โหลดช่องทางชำระไม่สำเร็จ กรุณาลองใหม่' }, { status: 503 }); }
}
