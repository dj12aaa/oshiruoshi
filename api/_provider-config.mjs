// Capabilities and configuration are not successful network health checks.
export const INTEGRATION_VERSION='2026-09-07.21';
const present=value=>Boolean(String(value||'').trim());

export function yahooAffiliateId(value=''){
  try{
    const raw=String(value).trim();
    const url=new URL(/^https?%3a/i.test(raw)?decodeURIComponent(raw):raw);
    if(!['http:','https:'].includes(url.protocol)||url.hostname!=='ck.jp.ap.valuecommerce.com'||url.pathname!=='/servlet/referral'||url.username||url.password||url.port||url.hash)return null;
    if(!/^\d+$/.test(url.searchParams.get('sid')||'')||!/^\d+$/.test(url.searchParams.get('pid')||'')||url.searchParams.get('vc_url')!=='')return null;
    return url.href;
  }catch{return null}
}

export function yahooSearchParams(query,env=process.env){
  const params=new URLSearchParams({appid:env.YAHOO_CLIENT_ID||'',query,results:'30',image_size:'300',in_stock:'true'});
  const affiliate=yahooAffiliateId(env.YAHOO_AFFILIATE_ID);
  if(affiliate){params.set('affiliate_type','vc');params.set('affiliate_id',affiliate)}
  return params;
}

export function providerCapabilities(env=process.env){
  const api=(id,name,required,affiliateKey)=>({id,name,mode:'official-api',implemented:true,configured:required.every(key=>present(env[key])),connection:'not-checked',affiliate:affiliateKey?(present(env[affiliateKey])?'configured':'not-configured'):'not-supported'});
  const yahoo=api('yahooShopping','Yahoo!ショッピング',['YAHOO_CLIENT_ID'],'YAHOO_AFFILIATE_ID');
  if(present(env.YAHOO_AFFILIATE_ID)&&!yahooAffiliateId(env.YAHOO_AFFILIATE_ID))yahoo.affiliate='invalid';
  const external=(id,name,note)=>({id,name,mode:'external-search',implemented:false,configured:false,connection:'not-connected',affiliate:'not-connected',note});
  return[
    yahoo,api('rakuten','楽天市場',['RAKUTEN_APP_ID','RAKUTEN_ACCESS_KEY'],'RAKUTEN_AFFILIATE_ID'),
    external('amazon','Amazon','Creators APIは利用資格・認証情報の確認とadapter接続が必要です。現在は外部検索のみです。'),
    external('mercari','メルカリ','一般出品の横断取得APIは未接続です。Mercari Shops APIの自店舗データとは区別しています。'),
    external('yahooFlea','Yahoo!フリマ','一般出品の公式APIは未接続です。過去の確認情報と外部検索を提供します。'),
    external('yahooAuction','Yahoo!オークション','一般出品の公式APIは未接続です。過去の確認情報と外部検索を提供します。'),
    external('google','Google','外部Web検索です。商品の在庫・価格取得APIとしては利用していません。')
  ];
}

export function knownAmount(value){
  if(value==null||typeof value==='boolean'||String(value).trim()==='')return null;
  const amount=Number(value);return Number.isFinite(amount)&&amount>=0?amount:null;
}

export function yahooLinkInfo(value){
  try{
    const url=new URL(value);
    if(!['http:','https:'].includes(url.protocol))return{url:'#',canonicalUrl:null,affiliate:false};
    const affiliate=url.hostname==='ck.jp.ap.valuecommerce.com'&&url.pathname==='/servlet/referral';
    let canonicalUrl=affiliate?null:url.href;
    if(affiliate){
      try{
        const target=new URL(url.searchParams.get('vc_url'));
        if(['http:','https:'].includes(target.protocol)&&/(^|\.)yahoo\.co\.jp$/.test(target.hostname))canonicalUrl=target.href;
      }catch{}
    }
    return{url:url.href,canonicalUrl,affiliate};
  }catch{return{url:'#',canonicalUrl:null,affiliate:false}}
}
