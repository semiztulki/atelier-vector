import {readFile,writeFile} from 'node:fs/promises';
const html=await readFile('dist/index.html','utf8');
await writeFile('index.html',html.replace('href="./style.css','href="./dist/style.css').replace('src="./vendor/pdf.min.js','src="./dist/vendor/pdf.min.js').replace('src="./app.js','src="./dist/app.js'));
await writeFile('.nojekyll','');
