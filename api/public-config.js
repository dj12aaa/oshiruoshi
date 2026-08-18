import { json } from './_core.mjs';
const DEFAULT_CONTACT_EMAIL='a.o.work777@gmail.com';
export default function handler(req,res){json(res,200,{contactEmail:process.env.PUBLIC_CONTACT_EMAIL||DEFAULT_CONTACT_EMAIL});}
