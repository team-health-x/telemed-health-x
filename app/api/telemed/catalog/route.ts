import { telemedApiOrigin } from '../../../lib/telemed-api-origin';
export const dynamic = "force-dynamic";

export async function GET() {
  const origin = telemedApiOrigin('catalog');
  if (!origin) return Response.json({ error: "ยังไม่ได้ตั้งค่าการเชื่อมต่อ Telemed" }, { status: 503 });
  try {
    const url = new URL("/api/v1/public/telemed/catalog", origin);
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error("Catalog unavailable");
    const body = await response.json();
    const catalog = body.status === "0000" ? body.data : undefined;
    if (!catalog || !Array.isArray(catalog.doctors)) throw new Error("Invalid catalog");
    return Response.json(catalog, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "ไม่สามารถโหลดแพทย์และคอร์สได้ กรุณาลองใหม่" }, { status: 503 });
  }
}
