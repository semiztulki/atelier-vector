import {build} from 'esbuild';
import {copyFile,mkdir,writeFile} from 'node:fs/promises';
await mkdir('dist/vendor',{recursive:true});
await writeFile('scripts/vendor-entry.js',`export {default as DOMPurify} from 'dompurify'; export {jsPDF} from 'jspdf'; import 'svg2pdf.js'; export {default as QRCode} from 'qrcode'; export * as opentype from 'opentype.js'; export {PDFDocument} from 'pdf-lib'; export {unzipSync} from 'fflate';`);
await build({entryPoints:['scripts/vendor-entry.js'],bundle:true,format:'esm',minify:true,outfile:'dist/vendor/tools.js',legalComments:'linked'});
await copyFile('node_modules/pdfjs-dist/build/pdf.min.js','dist/vendor/pdf.min.js');
await copyFile('node_modules/pdfjs-dist/build/pdf.worker.min.js','dist/vendor/pdf.worker.min.js');
console.log('Browser dependencies bundled locally.');

await import('./publish-root.mjs');
