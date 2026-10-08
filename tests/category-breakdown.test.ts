import {test} from 'node:test';import assert from 'node:assert/strict';
import {categoryBreakdown} from '../src/lib/category-breakdown';
import {moneyFlow} from '../src/lib/money-flow';import {defaultBudget,type Expense} from '../src/lib/budget';
const row=(id:string,amount:number,bucket:Expense['bucket'],description:string,date='2026-10-08'):Expense=>({id,amount,bucket,description,date,tags:[]});
test('category details reconcile to dashboard including refunds and inferred subscriptions',()=>{
 const rows=[row('shop',5000,'discretionary','Clothes'),row('refund',-1000,'discretionary','Clothes refund'),row('prime',1500,'discretionary','Amazon Prime'),row('old',9000,'discretionary','Old purchase','2026-09-30'),row('rent',100000,'bill','Rent')];
 const result=categoryBreakdown(rows,'2026-10','shopping');
 assert.deepEqual(result.rows.map(e=>e.id),['refund','shop']);assert.equal(result.total,4000);
 assert.equal(result.total,moneyFlow(defaultBudget,rows.filter(e=>e.date.startsWith('2026-10'))).shopping);
 assert.equal(categoryBreakdown(rows,'2026-10','subscriptions').total,1500);
});
test('empty categories show zero and investments stay separate from shopping',()=>{
 const rows=[row('invest',10000,'investment','Investment')];
 assert.equal(categoryBreakdown(rows,'2026-10','shopping').total,0);assert.equal(categoryBreakdown(rows,'2026-10','investments').total,10000);
});
