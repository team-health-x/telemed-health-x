import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { isIP } from 'node:net';
import { DemoAuthError } from './demo-auth';

export const OTP_DEVICE_COOKIE = '__Host-telemed_otp_device';
export const OTP_DEVICE_OPTIONS = { httpOnly: true, secure: true, sameSite: 'strict' as const, path: '/', maxAge: 30 * 86400 };
const mac = (key: string, value: string) => createHmac('sha256', key).update(value).digest('hex');
const matches = (expected: string, received: string) => /^[a-f0-9]{64}$/.test(received)
  && timingSafeEqual(Buffer.from(expected), Buffer.from(received));

/** Only an admitted ingress holding its own key can assert the client address.
 * Raw forwarding/device headers are deliberately ignored. Never import into client code.
 */
export function attestOtpCaller(request: Request, origin: string, phone: string,
  purpose: 'login' | 'registration', storedDevice?: string) {
  const key = process.env.TELEMED_OTP_CALLER_HMAC_KEY ?? '';
  const ingressKey = process.env.TELEMED_OTP_INGRESS_HMAC_KEY ?? '';
  const clinic = process.env.TELEMED_CLINIC_ID, branch = process.env.TELEMED_BRANCH_ID;
  if (key.length < 32 || ingressKey.length < 32 || key === ingressKey
    || key === process.env.TELEMED_DEMO_BRIDGE_SECRET || ingressKey === process.env.TELEMED_DEMO_BRIDGE_SECRET
    || !clinic || !branch || !origin.startsWith('https:'))
    throw new DemoAuthError('Trusted OTP caller is not configured', 503);
  const caller = request.headers.get('x-telemed-ingress-caller') ?? '';
  const at = request.headers.get('x-telemed-ingress-at') ?? '';
  const signature = request.headers.get('x-telemed-ingress-signature') ?? '';
  if (!isIP(caller) || !/^\d{13}$/.test(at) || Math.abs(Date.now() - Number(at)) > 60000
    || !matches(mac(ingressKey, JSON.stringify([origin, caller, at])), signature))
    throw new DemoAuthError('Trusted ingress evidence required', 403);
  const [candidate = '', proof = ''] = (storedDevice ?? '').split('.');
  const device = /^[a-f0-9]{48}$/.test(candidate)
    && storedDevice === `${candidate}.${proof}` && matches(mac(key, `otp-device:${candidate}`), proof)
    ? candidate : randomBytes(24).toString('hex');
  const issuedAt = String(Date.now());
  return {
    headers: { 'x-telemed-otp-caller': caller, 'x-telemed-otp-device': device, 'x-telemed-otp-at': issuedAt,
      'x-telemed-otp-signature': mac(key, JSON.stringify([clinic, branch, purpose, phone, caller, device, issuedAt])) },
    deviceCookie: `${device}.${mac(key, `otp-device:${device}`)}`,
  };
}
