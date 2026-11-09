import {telemedApiOrigin} from './telemed-api-origin';
import {DemoAuthError} from './demo-auth';
// Cookie custody spans the absolute window; backend checks idle expiry and revocation on every use.
export const BACKEND_SESSION_COOKIE_MAX_AGE = 8 * 60 * 60;
export type BackendSession={customer:{customerId:string;name:string;phone:string};expiresAt:number};
function record(value:unknown):Record<string,unknown>{if(!value || typeof value!=='object' || Array.isArray(value))throw new DemoAuthError('Invalid session response',502);return value as Record<string,unknown>;}
export function acceptBackendLogin(value:unknown){
  const row=record(value);
  if(typeof row.customerId!=='string' || !row.customerId.startsWith('TL-') || typeof row.name!=='string' || typeof row.phone!=='string' || !/^0[689]\d{8}$/.test(row.phone)
    || typeof row.sessionToken!=='string' || !/^[A-Za-z0-9_-]{43}$/.test(row.sessionToken) || typeof row.expiresAt!=='number' || !Number.isSafeInteger(row.expiresAt)
    || row.expiresAt<=Date.now() || row.expiresAt>Date.now()+61*60000)throw new DemoAuthError('Invalid session response',502);
  return {customer:{customerId:row.customerId,name:row.name,phone:row.phone},expiresAt:row.expiresAt,token:row.sessionToken};
}
async function upstream(token:string,path:string,method:'GET'|'POST'){
  const origin=telemedApiOrigin(),secret=process.env.TELEMED_DEMO_BRIDGE_SECRET;
  if(!origin || !secret || !/^[A-Za-z0-9_-]{43}$/.test(token))return null;
  return fetch(new URL('/api/v1/telemed/workflow/session'+path,origin),{method,cache:'no-store',redirect:'error',signal:AbortSignal.timeout(10000),headers:{'x-telemed-bridge':secret,'x-telemed-session':token}});
}
export async function backendSession(token:string):Promise<BackendSession|null>{
  try{const response=await upstream(token,'','GET');if(!response?.ok)return null;const envelope=record(await response.json());if(envelope.status!=='0000')return null;
    const data=record(envelope.data),customer=record(data.customer);
    if(typeof customer.customerId!=='string' || !customer.customerId.startsWith('TL-') || typeof customer.name!=='string' || typeof customer.phone!=='string'
      || typeof data.expiresAt!=='number' || !Number.isSafeInteger(data.expiresAt) || data.expiresAt<=Date.now())return null;
    return {customer:{customerId:customer.customerId,name:customer.name,phone:customer.phone},expiresAt:data.expiresAt};
  }catch{return null;}
}
export async function backendLogout(token:string){
  if(!/^[A-Za-z0-9_-]{43}$/.test(token))return;
  try{const response=await upstream(token,'/logout','POST');if(response?.status===401)return;
    if(!response?.ok || record(await response.json()).status!=='0000')throw new Error('Revocation unavailable');
  }catch{throw new DemoAuthError('ยังยืนยันการออกจากระบบไม่ได้ กรุณาลองอีกครั้ง',503);}
}
