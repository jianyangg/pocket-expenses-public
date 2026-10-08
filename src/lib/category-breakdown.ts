import type {Expense} from "./budget";
import {expenseCategory} from "./money-flow";
export const spendingCategories=[
 {key:"groceries",label:"Groceries"},{key:"shopping",label:"Shopping & dining"},{key:"subscriptions",label:"Subscriptions"},{key:"transit",label:"Transit"},{key:"investments",label:"Investing"}
] as const;
export type SpendingCategory=typeof spendingCategories[number]['key'];
export function categoryBreakdown(expenses:Expense[],month:string,category:SpendingCategory){
 const rows=expenses.filter(e=>e.date.startsWith(month)&&expenseCategory(e)===category).sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id));
 return {rows,total:rows.reduce((n,e)=>n+e.amount,0)};
}
