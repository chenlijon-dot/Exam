import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
const root='chapter-bank/science/7-1/unit-04/section-02';
const cases={easy:20,medium:30,hard:50};
test('Unit 4-2 has exactly 100 distinct answered active questions',()=>{
 const ids=new Set(),stems=new Set();
 for(const [level,count] of Object.entries(cases)){
  const data=JSON.parse(readFileSync(root+'/'+level+'.json','utf8'));
  assert.equal(data.questions.length,count);
  assert.equal(data.exam.scoreMode,'percent');
  assert.equal(data.exam.difficulty,'science-7-1-u04-s02-'+level);
  for(const q of data.questions){
   assert.match(q.questionId,/^\d{15}$/);
   assert.equal(q.revision,1);
   assert.equal(q.sourceType,'practice-generated');
   assert.equal(q.lifecycle,'active');
   assert.equal(q.answerVerified,true);
   assert.ok(!ids.has(q.questionId));ids.add(q.questionId);
   assert.ok(!stems.has(q.q));stems.add(q.q);
   assert.equal(q.o.length,4);
   assert.equal(new Set(q.o).size,4);
   assert.ok(Number.isInteger(q.a)&&q.a>=0&&q.a<4);
   assert.ok(q.e.length>=14);
   assert.deepEqual(q.optionCanonicalIndices,[0,1,2,3]);
   assert.ok(q.conceptIds.length>=1);
   if(level==='medium')assert.match(q.q,/＿＿/);
  }
 }
 assert.equal(ids.size,100);
});
test('4-1 remains enabled and 4-2 can open from catalog via its own module',()=>{
 const cat=readFileSync('exam-catalog.js','utf8');
 const nav=readFileSync('exam-navigation-fix.js','utf8');
 const module=readFileSync('exam-science-unit4-2.js','utf8');
 assert.match(cat,/key: 'science-7-1-4-1'.*enabled: true/);
 assert.match(cat,/key: 'science-7-1-4-2'.*enabled: true/);
 assert.match(nav,/loadScienceUnit4Module\(\);loadScienceUnit4Section2Module\(\);/);
 assert.match(module,/SECTION_KEY = 'science-7-1-4-2'/);
 assert.match(module,/section:'section-02'/);
 assert.match(module,/startExam\(context.key\)/);
});
