'use client';
import {useEffect,useState} from 'react';
export default function TelemedMaintenance(){
  const [maintenance,setMaintenance]=useState(true);
  useEffect(()=>{const controller=new AbortController();let pending=false;
    async function check(){if(pending)return;pending=true;try{const response=await fetch('/api/telemed/capabilities',{cache:'no-store',signal:controller.signal});const data:unknown=await response.json();if(!controller.signal.aborted)setMaintenance(!response.ok || !data || typeof data!=='object' || !('enabled' in data) || data.enabled!==true);}catch{if(!controller.signal.aborted)setMaintenance(true);}finally{pending=false;}}
    void check();const timer=setInterval(()=>void check(),15000);return()=>{controller.abort();clearInterval(timer);};
  },[]);
  return maintenance?<div role="alert" style={{padding:'1rem',textAlign:'center',background:'#fff3cd',color:'#624b00'}}>Telemed ปิดปรับปรุงชั่วคราว กรุณาติดต่อคลินิก</div>:null;
}
