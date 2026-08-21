import { status, json } from './_core.mjs';
export default function handler(req,res){
  const base=status();
  json(res,200,{
    ...base,
    amazon:Boolean(process.env.AMAZON_CREATORS_CLIENT_ID&&process.env.AMAZON_CREATORS_CLIENT_SECRET&&process.env.AMAZON_PARTNER_TAG),
    braveSearch:Boolean(process.env.BRAVE_SEARCH_API_KEY),
    openaiWebFallback:Boolean(process.env.OPENAI_API_KEY)
  });
}
