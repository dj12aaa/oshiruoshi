import { liveSearch, json, cleanQuery } from './_core.mjs';

export default async function handler(req,res){
  if(req.method!=='GET')return json(res,405,{error:'method_not_allowed'});
  try{
    const u=new URL(req.url,'http://local');
    const q=cleanQuery(u.searchParams.get('q')||'');
    if(!q)return json(res,200,{query:'',items:[],providers:{},generatedAt:new Date().toISOString()});
    return json(res,200,await liveSearch(q));
  }catch(e){
    console.error('live-search',String(e?.message||e));
    return json(res,502,{error:'live_search_failed',items:[]});
  }
}
