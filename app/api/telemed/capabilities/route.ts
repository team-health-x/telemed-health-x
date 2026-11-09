import {telemedApiOrigin} from '../../../lib/telemed-api-origin';
export const dynamic='force-dynamic';
const maintenance={enabled:false,maintenance:true,message:'Telemed ปิดปรับปรุงชั่วคราว กรุณาติดต่อคลินิก'};
export async function GET(){
  try{const origin=telemedApiOrigin('catalog');if(!origin)throw new Error('No API');
    const response=await fetch(new URL('/api/v1/public/telemed/capabilities',origin),{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(8000)});
    const body:unknown=await response.json();
    if(!response.ok || !body || typeof body!=='object' || !('status' in body) || body.status!=='0000' || !('data' in body) || !body.data || typeof body.data!=='object'
      || !('enabled' in body.data) || typeof body.data.enabled!=='boolean')throw new Error('No capability');
    return Response.json({...maintenance,enabled:body.data.enabled,maintenance:!body.data.enabled},{headers:{'Cache-Control':'no-store'}});
  }catch{return Response.json(maintenance,{status:503,headers:{'Cache-Control':'no-store'}});}
}
