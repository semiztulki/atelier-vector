import test from 'node:test';
import assert from 'node:assert/strict';
import {selectionUnits, linkedMembers, expandSelection, groupElements, ungroupElements, remapCloneGroups} from '../dist/selection.js';
const item = group => ({dataset:group?{group}:{}, querySelectorAll:()=>[]});

test('grouping does not reparent imported objects or alter their transforms',()=>{
  const a=item(),b=item();a.parentNode={id:'pdf-layer-a'};b.parentNode={id:'pdf-layer-b'};
  a.transform='scale(2)';b.transform='translate(5 3)';
  groupElements([a,b],'qr');
  assert.equal(a.parentNode.id,'pdf-layer-a');assert.equal(b.parentNode.id,'pdf-layer-b');
  assert.equal(a.transform,'scale(2)');assert.equal(b.transform,'translate(5 3)');
  assert.deepEqual(linkedMembers(a,[a,b]),[a,b]);
});
test('clicking a QR component expands to the entire group, without unrelated objects',()=>{
  const a=item('qr'),b=item('qr'),c=item(),d=item('label');
  assert.deepEqual(expandSelection([b],[a,b,c,d]),[a,b]);
  assert.deepEqual(selectionUnits([a,b,c,d]),[[a,b],[c],[d]]);
});
test('merging and ungrouping leave all component objects available',()=>{
  const a=item('a'),b=item('b');groupElements([a,b],'merged');
  assert.equal(selectionUnits([a,b]).length,1);ungroupElements([a,b]);
  assert.deepEqual(selectionUnits([a,b]),[[a],[b]]);
});
test('duplicate groups receive a new identity and stay independent of their source',()=>{
  const a=item('original'),b=item('original'),c=item('other');let id=0;
  remapCloneGroups([a,b,c],()=>`copy-${++id}`);
  assert.equal(a.dataset.group,b.dataset.group);assert.notEqual(a.dataset.group,'original');
  assert.notEqual(a.dataset.group,c.dataset.group);
});
