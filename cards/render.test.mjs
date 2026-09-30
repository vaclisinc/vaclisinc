import test from 'node:test';
import assert from 'node:assert/strict';
import { wrap, fit, layoutTopics, renderRepoCard } from './render.mjs';
const measure = text => [...text].length * 7;
test('long words, Chinese, and emoji wrap without exceeding the allocated area',()=>{
 for(const text of ['A'.repeat(150),'中文描述與音樂工具'.repeat(10),'🎹 '.repeat(70)]) {
  const lines=wrap(text,70,measure);
  assert.ok(lines.length<=3);
  assert.ok(lines.every(line=>measure(line)<=70));
  assert.ok(lines.at(-1).endsWith('…'));
 }
 assert.equal(fit('short',70,measure),'short');
});
test('topic overflow is represented by an accurate count in two rows',()=>{
 const topics=Array.from({length:20},(_,i)=>`very-long-topic-${i}`);
 const tags=layoutTopics(topics,measure);
 const visible=tags.filter(t=>!t.label.startsWith('+'));
 assert.equal(tags.at(-1).label,`+${topics.length-visible.length}`);
 assert.ok(tags.every(t=>t.x>=22 && t.x+t.width<=378 && t.y<=114));
 assert.deepEqual(layoutTopics([],measure),[]);
 assert.equal(layoutTopics(['audio','audio'],measure).length,1);
});
test('repository text cannot inject SVG markup; both themes retain fixed dimensions',()=>{
 for(const theme of ['light','dark']) {
  const svg=renderRepoCard({name:'<script>alert(1)</script>',full_name:'owner/<repo>',description:'A & B <img onload="bad">',topics:['a&b'],language:null,stars:0,forks:0},{theme,measure});
  assert.ok(svg.includes('width="400" height="176"'));
  assert.ok(!svg.includes('<script>'));
  assert.ok(!svg.includes('<img'));
  assert.ok(svg.includes('A &amp; B'));
  assert.ok(!svg.includes('undefined'));
 }
});
