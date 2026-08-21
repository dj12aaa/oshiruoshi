import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT=path.dirname(fileURLToPath(import.meta.url));
const PORT=Number(process.env.PORT||4173);
const HOST=process.env.HOST||'127.0.0.1';
const MOCK=process.argv.includes('--real-api')?false:true;
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml; charset=utf-8','.txt':'text/plain; charset=utf-8','.webmanifest':'application/manifest+json; charset=utf-8'};

function loadEnv(file){
  const p=path.join(ROOT,file);if(!fs.existsSync(p))return;
  for(const line of fs.readFileSync(p,'utf8').split(/\r?\n/)){
    const s=line.trim();if(!s||s.startsWith('#'))continue;const i=s.indexOf('=');if(i<1)continue;
    const k=s.slice(0,i).trim(),v=s.slice(i+1).trim().replace(/^['"]|['"]$/g,'');if(!(k in process.env))process.env[k]=v;
  }
}
loadEnv('.env.local');loadEnv('.env');

const verified=JSON.parse(fs.readFileSync(path.join(ROOT,'data/verified-listings.json'),'utf8'));
const now=()=>new Date().toISOString();
const yen=(n)=>Number(n||0);
function qTerms(q){return String(q||'').toLowerCase().split(/\s+/).filter(Boolean)}
function score(i,q){const h=[i.title,i.series,i.character,i.type,i.collab,...(i.tags||[])].filter(Boolean).join(' ').toLowerCase();return qTerms(q).reduce((n,t)=>n+(h.includes(t)?10:0),0)}
function direct(source,q){const e=encodeURIComponent(q||'推し活 グッズ');if(source==='メルカリ')return`https://jp.mercari.com/search?keyword=${e}`;if(source==='Yahoo!フリマ')return`https://paypayfleamarket.yahoo.co.jp/search/${e}`;if(source==='Yahoo!オークション')return`https://auctions.yahoo.co.jp/search/search/${e}/0/`;if(source==='Yahoo!ショッピング')return`https://shopping.yahoo.co.jp/search?p=${e}`;return`https://search.rakuten.co.jp/search/mall/${e}/`}
function apiPreviewItems(q){
  const label=q||'五条悟 アクスタ';
  return [
    {id:'local-yahoo-1',source:'Yahoo!ショッピング',title:`${label} 公式ショップ商品プレビュー`,series:label.split(/\s+/)[0]||'推し活',character:label.split(/\s+/)[0]||'',type:'アクスタ',collab:'ローカル確認',price:1980,shipping:0,fee:0,status:'販売中',condition:'新品',image:'https://local-preview.invalid/yahoo/item-1',imageVerified:true,url:direct('Yahoo!ショッピング',label),verifiedAt:now(),origin:'official-api',shop:'Yahoo!ショッピング / ローカルプレビュー',tags:qTerms(label),_score:50},
    {id:'local-rakuten-1',source:'楽天市場',title:`${label} 楽天市場商品プレビュー`,series:label.split(/\s+/)[0]||'推し活',character:label.split(/\s+/)[0]||'',type:'アクスタ',collab:'ローカル確認',price:2280,shipping:0,fee:0,status:'販売中',condition:'新品',image:'https://local-preview.invalid/rakuten/item-1',imageVerified:true,url:direct('楽天市場',label),verifiedAt:now(),origin:'official-api',shop:'楽天市場 / ローカルプレビュー',tags:qTerms(label),_score:48}
  ];
}
function localItems(q){
  const base=verified.map(x=>({...x,_score:score(x,q)})).filter(x=>!q||x._score>0);
  return [...apiPreviewItems(q),...base].sort((a,b)=>(b._score||0)-(a._score||0)||yen(a.price)-yen(b.price));
}
function providers(items){
  const count=s=>items.filter(x=>x.source===s).length;
  return {public:{sources:{mercari:{ok:true,count:count('メルカリ')},yahooFlea:{ok:true,count:count('Yahoo!フリマ')},yahooAuction:{ok:true,count:count('Yahoo!オークション')}}},yahooShopping:{ok:true,count:count('Yahoo!ショッピング')},rakuten:{ok:true,count:count('楽天市場')},localPreview:true};
}
function sendJson(res,status,obj){const body=JSON.stringify(obj,null,2);res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','access-control-allow-origin':'*'});res.end(body)}
function localSearchPayload(q){const items=localItems(q);return {query:q,items,direct:['メルカリ','Yahoo!フリマ','Yahoo!オークション','Yahoo!ショッピング','楽天市場'].map(source=>({source,url:direct(source,q)})),providers:providers(items),generatedAt:now(),aliasVersion:'local-preview-all-visible',queryVariants:[q||'五条悟 アクスタ'],notice:'ローカル確認用データです。外部APIキーなしでも全UIを確認できます。'};}
function imageSvg(source){const safe=String(source||'OSHIRU').replace(/[<>&]/g,'');return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff1f4"/><stop offset="1" stop-color="#eef2ff"/></linearGradient></defs><rect width="800" height="800" rx="56" fill="url(#g)"/><circle cx="400" cy="310" r="118" fill="#d91f48" opacity=".12"/><text x="400" y="330" text-anchor="middle" font-size="72" font-family="system-ui,sans-serif" font-weight="800" fill="#d91f48">OSHIRU</text><text x="400" y="430" text-anchor="middle" font-size="38" font-family="system-ui,sans-serif" fill="#334155">${safe}</text><text x="400" y="500" text-anchor="middle" font-size="28" font-family="system-ui,sans-serif" fill="#64748b">LOCAL PREVIEW</text></svg>`}

function injectLocal(html){
  if(!html.includes('local-all-visible.js'))html=html.replace('</head>','<link rel="stylesheet" href="/local-preview.css"></head>');
  if(!html.includes('local-all-visible.js'))html=html.replace('</body>','<script src="/local-all-visible.js" defer></script></body>');
  return html;
}
function staticFileFor(urlPath){
  if(urlPath==='/')return 'index.html';
  if(urlPath==='/latest-goods')return 'latest-goods.html';
  if(urlPath==='/__local'||urlPath==='/local-preview')return 'local-preview.html';
  const clean=decodeURIComponent(urlPath.split('?')[0]).replace(/^\/+/, '');
  return clean||'index.html';
}
function safePath(rel){const p=path.resolve(ROOT,rel);return p.startsWith(ROOT+path.sep)||p===ROOT?p:null}

async function invokeVercel(moduleFile,req,res,urlOverride){
  try{
    const mod=await import(pathToFileURL(path.join(ROOT,moduleFile)).href+'?local='+Date.now());
    const fn=mod.default;if(typeof fn!=='function')throw new Error('handler_missing');
    const fakeReq=Object.assign(req,{url:urlOverride||req.url,query:Object.fromEntries(new URL(urlOverride||req.url,'http://local').searchParams.entries()),body:req.body});
    const wrapper={
      setHeader:(k,v)=>res.setHeader(k,v),status(code){res.statusCode=code;return wrapper},json(v){if(!res.headersSent)res.setHeader('content-type','application/json; charset=utf-8');res.end(JSON.stringify(v));return wrapper},send(v){res.end(v);return wrapper},end(v){res.end(v);return wrapper}
    };
    await fn(fakeReq,wrapper);
  }catch(err){console.error('[local-handler]',moduleFile,err);sendJson(res,500,{error:'local_handler_failed',detail:String(err?.message||err)});}
}

const server=http.createServer(async(req,res)=>{
  const u=new URL(req.url,'http://local');
  if(u.pathname==='/api/status'&&MOCK)return sendJson(res,200,{yahooShopping:true,rakuten:true,rakutenAffiliate:true,yahooAffiliate:true,vision:true,localPreview:true});
  if(u.pathname==='/api/public-config'&&MOCK)return sendJson(res,200,{contactEmail:process.env.PUBLIC_CONTACT_EMAIL||'local-preview@example.invalid',localPreview:true});
  if((u.pathname==='/api/search'||u.pathname==='/api/live-search')&&MOCK)return sendJson(res,200,localSearchPayload(u.searchParams.get('q')||''));
  if(u.pathname==='/api/suggest'&&MOCK){const q=u.searchParams.get('q')||'';return sendJson(res,200,{items:[{kind:'character',name:q||'五条悟'},{kind:'media',name:'呪術廻戦'},{kind:'keyword',name:'アクスタ'},{kind:'keyword',name:'サンリオ'}],metadataSource:'local-preview',generatedAt:now()});}
  if(u.pathname==='/api/vision-search'&&MOCK)return sendJson(res,200,{query:'画像検索プレビュー',items:localItems('五条悟 アクスタ'),providers:providers(localItems('五条悟 アクスタ')),localPreview:true});
  if(u.pathname==='/api/image-proxy'&&MOCK){const source=u.searchParams.get('source')==='rakuten'?'楽天市場':'Yahoo!ショッピング';res.writeHead(200,{'content-type':'image/svg+xml; charset=utf-8','cache-control':'no-store'});return res.end(imageSvg(source));}
  if(u.pathname==='/robots.txt'&&MOCK){res.writeHead(200,{'content-type':'text/plain; charset=utf-8'});return res.end('User-agent: *\nAllow: /\nDisallow: /api/\n');}
  if(u.pathname==='/sitemap.xml'&&MOCK){res.writeHead(200,{'content-type':'application/xml; charset=utf-8'});return res.end(`<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>http://${HOST}:${PORT}/</loc></url><url><loc>http://${HOST}:${PORT}/latest-goods</loc></url></urlset>`);}

  if(/^\/(guide|compare|discover|character)\//.test(u.pathname)){
    const [,section,slug]=u.pathname.split('/');
    return invokeVercel('api/seo-v2.js',req,res,`/api/seo-v2?section=${encodeURIComponent(section)}&slug=${encodeURIComponent(slug||'')}`);
  }
  if(u.pathname.startsWith('/api/')&&!MOCK){const name=u.pathname.slice('/api/'.length);const f=`api/${name}.js`;if(fs.existsSync(path.join(ROOT,f)))return invokeVercel(f,req,res);}

  const rel=staticFileFor(u.pathname),p=safePath(rel);
  if(!p||!fs.existsSync(p)||fs.statSync(p).isDirectory()){res.writeHead(404,{'content-type':'text/html; charset=utf-8'});return res.end(fs.existsSync(path.join(ROOT,'404.html'))?fs.readFileSync(path.join(ROOT,'404.html')):'Not found');}
  const ext=path.extname(p);let data=fs.readFileSync(p);
  if(ext==='.html')data=Buffer.from(injectLocal(data.toString('utf8')));
  res.writeHead(200,{'content-type':MIME[ext]||'application/octet-stream','cache-control':'no-store'});res.end(data);
});

server.listen(PORT,HOST,()=>{
  console.log(`\nOSHIRU local preview: http://${HOST}:${PORT}/`);
  console.log(`All screens index:    http://${HOST}:${PORT}/__local`);
  console.log(`Mode: ${MOCK?'offline mock APIs (all UI visible)':'real API handlers'}`);
  console.log('Stop: Ctrl+C\n');
});
