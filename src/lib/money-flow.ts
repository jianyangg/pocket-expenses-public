import type {Budget,Expense} from './budget';
export function moneyFlow(b:Budget,expenses:Expense[]){
 const starting=b.income-b.rent-b.utilities-b.depreciation;
 let groceries=0,wants=0,subscriptions=0,transit=0,investments=0;
 for(const e of expenses){
  if(e.bucket==='fixed')continue;
  if(e.bucket==='investment'){investments+=e.amount;continue;}
  if(e.bucket==='groceries'){groceries+=e.amount;continue;}
  const text=(e.description+' '+e.tags.join(' ')).toLowerCase();
  // These obligations were already reserved above. Other bills are actual spending.
  if(e.bucket==='bill'&&/\b(rent|utilities|utility|electricity|internet)\b/.test(text))continue;
  wants+=e.amount;
  if(/\b(subscription|subscriptions|apple|netflix|spotify|chatgpt|prime video)\b/.test(text))subscriptions+=e.amount;
  if(/\b(transit|transport|transportation|mta|subway|bus|uber|lyft)\b/.test(text))transit+=e.amount;
 }
 return {starting,remaining:starting-groceries-wants-investments,groceries,wants,subscriptions,transit,investments};
}
