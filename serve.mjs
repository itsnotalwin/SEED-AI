import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, relative, sep } from 'node:path';
const root = resolve(import.meta.dirname);
const mime = { '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml' };
const port = Number(process.env.PORT || 4173);
const server = createServer(async (req,res) => {
  try {
    const url = new URL(req.url, `http://localhost:${port}`);
    const path = resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
    const rel = relative(root,path);
    if (rel.startsWith('..'+sep) || rel === '..' || rel.startsWith('.git') || !['.html','.js','.css','.json','.svg'].includes(extname(path))) {res.writeHead(404);res.end('Not found');return;}
    const s = await stat(path); if (!s.isFile()) throw new Error('Not file');
    const body = await readFile(path);
    res.writeHead(200, {'Content-Type':mime[extname(path)],'Content-Length':body.length,'Cache-Control':'no-store'});
    res.end(body);
  } catch {res.writeHead(404);res.end('Not found');}
});
server.listen(port,()=>console.log(`SEED AI running at http://localhost:${port}`));
