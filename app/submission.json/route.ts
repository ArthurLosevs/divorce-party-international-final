import { buildSubmission } from '@/lib/submission';
import { validateSubmission } from '@/lib/validation';
export const dynamic='force-static';
export function GET(){const s=buildSubmission();const errors=validateSubmission(s);if(errors.length)return Response.json({error:'Submission integrity validation failed',details:errors},{status:500});return new Response(JSON.stringify(s,null,2),{headers:{'Content-Type':'application/json; charset=utf-8','X-Submission-Status':s.certification.status,'X-Schema-Status':'PROVISIONAL-INTERNAL','Cache-Control':'no-cache'}});}
