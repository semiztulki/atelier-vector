import test from 'node:test';
import assert from 'node:assert/strict';
import {parsePath,pathString,splitSegment,alignDelta,distribute,snapBox,PT_MM} from '../dist/geometry.js';
test('physical units: 72 PDF points are exactly one inch',()=>assert.equal(72*PT_MM,25.4));
test('paths preserve relative segments, smooth controls and subpaths',()=>{const p=parsePath('m10 20 h10 v5 c1 2 3 4 5 6 s3 4 5 6 z m2 3 l4 5');assert.deepEqual(p[1],{type:'L',v:[20,20]});assert.deepEqual(p[4],{type:'C',v:[27,33,28,35,30,37]});assert.deepEqual(p[6],{type:'M',v:[12,23]});assert.deepEqual(parsePath(pathString(p)),p);});
test('splitting a cubic preserves its endpoints and the curve midpoint',()=>{const p=parsePath('M0 0 C0 10 10 10 10 0');splitSegment(p,1);assert.deepEqual(p[1].v,[0,5,2.5,7.5,5,7.5]);assert.deepEqual(p[2].v,[7.5,7.5,10,5,10,0]);});
test('alignment uses page centre and key-object edges',()=>{assert.deepEqual(alignDelta({x:10,y:20,width:30,height:40},{x:0,y:0,width:210,height:297},'cx'),[80,0]);assert.deepEqual(alignDelta({x:10,y:20,width:30,height:40},{x:5,y:7,width:4,height:9},'bottom'),[0,-44]);});
test('distribution keeps outer objects fixed and makes equal gaps',()=>{const b=[{x:0,width:10},{x:25,width:20},{x:100,width:10}];assert.deepEqual(distribute(b,'x'),[0,20,0]);});
test('snapping respects tolerance and closest candidate',()=>{const r=snapBox({x:9.9,y:20,width:10,height:10},[10,10.2],[99],.3);assert.ok(Math.abs(r.x.delta-.1)<1e-9);assert.equal(r.y,null);});
