// Local preview server. Only the preview and its explicit public assets are served.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../..');
const prefixes = [
  'docs/design-previews/evaluation-inspector/',
  'docs/design-previews/foundations/assets/',
  'packages/worlds/src/css/',
  'apps/web/app/worlds/[slug]/[module]/[lesson]/',
  'apps/web/public/scenes/deep-orbit/training-loop/',
  'apps/web/public/characters/deep-orbit/',
];
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.woff2':'font/woff2','.png':'image/png','.md':'text/plain'};
http.createServer((req,res)=>{
  let relative;
  try { relative=decodeURIComponent(new URL(req.url,'http://localhost').pathname).slice(1); } catch { res.writeHead(400).end(); return; }
  const file=path.resolve(root,relative), extension=path.extname(file);
  const normalized=path.relative(root,file).split(path.sep).join('/');
  if (!file.startsWith(root+path.sep) || !prefixes.some((prefix)=>normalized.startsWith(prefix)) || !types[extension]) { res.writeHead(404).end(); return; }
  fs.readFile(file,(error,data)=>{
    if(error){res.writeHead(404).end();return;}
    res.writeHead(200,{'Content-Type':types[extension]+'; charset=utf-8','Cache-Control':'no-store'}).end(data);
  });
}).listen(8768,'127.0.0.1',()=>process.stdout.write('Evaluation preview: http://127.0.0.1:8768/docs/design-previews/evaluation-inspector/index.html\n'));
