import React,{useEffect,useRef} from 'react';

export default function AccountConstruction(){
  const host=useRef(null);
  useEffect(()=>{
    let disposed=false,cleanup;
    import('./construction/createAccountScene').then(({createAccountScene})=>{
      if(disposed)return;
      try{cleanup=createAccountScene(host.current);}catch{host.current.dataset.renderer='fallback';}
    }).catch(()=>{if(!disposed&&host.current)host.current.dataset.renderer='fallback';});
    return()=>{disposed=true;cleanup?.();};
  },[]);
  return <div ref={host} className="account-construction" aria-hidden="true">
    <svg className="account-construction-fallback" viewBox="0 0 400 340" fill="none" stroke="#30497d" strokeWidth="1"><path d="m20 255 180-65 180 65-180 65Zm25 8 180-65m-150 76 180-65M110 286l180-65m-140 80 180-65M65 239l180 65M110 222l180 65M155 206l180 65" opacity=".25"/>{[0,1,2,3].map(level=><g key={level} transform={`translate(0 ${-level*48})`}><path d="m80 245 160-50 85 43-160 52Zm0-5 160-50 85 43-160 52Zm0 0v-47m85 92v-47m75-48v-47m85 90v-47M134 228v-47m85 92v-47M186 211v-47m85 92v-47"/></g>)}</svg>
  </div>;
}
