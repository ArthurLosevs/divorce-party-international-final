import { buildSubmission } from '@/lib/submission';
import Report from '@/components/Report';
export default function Page(){return <Report submission={buildSubmission()}/>;}
