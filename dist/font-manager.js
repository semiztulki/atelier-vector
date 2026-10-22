import {unzipSync,opentype} from './vendor/tools.js';
import {registerFont,fonts} from './io.js';

export function fontFilesFromZip(bytes) {
  if (bytes.byteLength > 64 * 1024 * 1024) throw Error('Архив шрифтов больше 64 МБ');
  let total=0;
  const files=unzipSync(bytes,{filter:entry=>{
    const wanted=/\.(ttf|otf)$/i.test(entry.name)&&!entry.name.startsWith('__MACOSX/');
    if(!wanted)return false;
    total+=entry.originalSize;
    if(entry.originalSize>32*1024*1024||total>128*1024*1024)throw Error('В архиве слишком большие файлы шрифтов');
    return true;
  }});
  const entries=Object.entries(files);
  const statics=entries.filter(([name])=>!/variablefont|\[[^\]]+\]/i.test(name));
  const selected=statics.length?statics:entries;
  if(!selected.length)throw Error('В ZIP нет файлов TTF или OTF');
  return selected.map(([name,data])=>({name,data}));
}

export function fontName(bytes,fallback='Шрифт') {
  const parsed=opentype.parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));
  const family=parsed.names.fontFamily?.en;
  const style=parsed.names.fontSubfamily?.en;
  return style==='Regular'?(family||fallback):(parsed.names.fullName?.en||family||fallback);
}

function database() {
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open('atelier-personal-fonts',1);
    request.onupgradeneeded=()=>request.result.createObjectStore('fonts',{keyPath:'family'});
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
  });
}

async function rememberFont(family,bytes) {
  const db=await database();
  try {await new Promise((resolve,reject)=>{
    const tx=db.transaction('fonts','readwrite');
    tx.objectStore('fonts').put({family,data:bytes.slice().buffer});
    tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
  });}finally{db.close();}
}

async function activateFont(family,bytes) {
  const face=await new FontFace(family,bytes).load();
  registerFont(bytes,family);
  document.fonts.add(face);
  return family;
}

export async function loadRememberedFonts() {
  let db;
  try {
    db=await database();
    const records=await new Promise((resolve,reject)=>{
      const request=db.transaction('fonts','readonly').objectStore('fonts').getAll();
      request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
    });
    for(const record of records)await activateFont(record.family,new Uint8Array(record.data));
    return records.length;
  }catch{return 0;}finally{db?.close();}
}

export async function loadFontFiles(files) {
  const loaded=[],errors=[];let remembered=true;
  for(const file of files){
    try{
      const bytes=new Uint8Array(await file.arrayBuffer());
      const entries=/\.zip$/i.test(file.name)?fontFilesFromZip(bytes):[{name:file.name,data:bytes}];
      for(const entry of entries){
        try{
          const family=fontName(entry.data,entry.name.replace(/\.[^.]+$/,''));
          await activateFont(family,entry.data);
          loaded.push(family);
          try{await rememberFont(family,entry.data);}catch{remembered=false;}
        }catch(error){errors.push(entry.name+': '+error.message);}
      }
    }catch(error){errors.push(file.name+': '+error.message);}
  }
  return{loaded:[...new Set(loaded)],errors,remembered};
}
