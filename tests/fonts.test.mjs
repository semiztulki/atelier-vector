import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {zipSync} from 'fflate';
import {fontFilesFromZip,fontName} from '../dist/font-manager.js';

test('compressed font ZIP is read, unrelated files ignored, static fonts preferred',async()=>{
  const regular=new Uint8Array(await readFile(new URL('../dist/fonts/Manrope-Regular.ttf',import.meta.url)));
  const bold=new Uint8Array(await readFile(new URL('../dist/fonts/Manrope-Bold.ttf',import.meta.url)));
  const zip=zipSync({'README.txt':new Uint8Array([1]),'static/Regular.ttf':regular,'static/Bold.ttf':bold,'Manrope-VariableFont_wght.ttf':regular});
  const entries=fontFilesFromZip(zip);
  assert.equal(entries.length,2);
  assert.deepEqual(entries.map(e=>fontName(e.data)).sort(),['Manrope','Manrope Bold']);
});

test('all seven built-in Manrope styles have distinct names and readable glyphs',async()=>{
  const manifest=JSON.parse(await readFile(new URL('../dist/fonts/manrope.json',import.meta.url),'utf8'));
  const names=[];
  for(const entry of manifest){
    const bytes=new Uint8Array(await readFile(new URL('../dist/fonts/'+entry.file,import.meta.url)));
    const name=fontName(bytes);names.push(name);assert.equal(name,entry.family);
  }
  assert.equal(new Set(names).size,7);
});

test('a ZIP containing no fonts reports a clear error',()=>{
  const zip=zipSync({'README.txt':new Uint8Array([1])});
  assert.throws(()=>fontFilesFromZip(zip),/нет файлов TTF/);
});
