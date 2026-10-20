import React,{createContext,useContext,useState} from 'react';
const Context=createContext(null);
const initial={workers:[],employers:[],jobs:[],requests:[],applications:[],issues:[],documents:[],assignments:[],notes:[],availability:'Available Now (Melbourne Metro & West)',acknowledged:false,profile:{name:'Alex Morgan',trade:'Construction Labourer',email:'',phone:''},settings:{region:'Victoria Central',notifications:'Enabled'}};
const key='9workforce-local-panel-v1';
export function PanelProvider({children}){
  const [records,setRecords]=useState(()=>{try{return {...initial,...JSON.parse(localStorage.getItem(key)||'{}')}}catch{return initial}});
  const [toast,setToast]=useState('');
  function update(change){setRecords(previous=>{const next=typeof change==='function'?change(previous):{...previous,...change};try{localStorage.setItem(key,JSON.stringify(next));}catch{setToast('Browser storage is full. Please use a smaller document.');return previous}return next});}
  function add(type,fields){const item={...fields,id:crypto.randomUUID(),createdAt:new Date().toISOString()};update(previous=>({...previous,[type]:[item,...previous[type]]}));return item;}
  return <Context.Provider value={{records,update,add,toast,setToast}}>{children}</Context.Provider>;
}
export const usePanel=()=>useContext(Context);
