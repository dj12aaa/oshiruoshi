import { snapshotSearch, json } from './_core.mjs';
export default async function handler(req,res){
  try{
    const u=new URL(req.url,'http://local');
    const q=(u.searchParams.get('q')||'').trim();
    if(!q)return json(res,200,{query:'',items:[],providers:{},idle:true});
    json(res,200,await snapshotSearch(q));
  }catch(e){
    json(res,500,{error:'search_failed'});
  }
}
