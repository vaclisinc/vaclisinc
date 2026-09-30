import { createServer } from 'node:http';
import MarkdownIt from 'markdown-it';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const markdown = new MarkdownIt({ html: true });
const root = fileURLToPath(new URL('../', import.meta.url));
const types = { '.svg': 'image/svg+xml', '.mjs': 'text/javascript', '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2' };
export async function serve(port = 0) {
  const server = createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      if (pathname === '/readme' || pathname === '/readme/') {
        const content = markdown.render(await readFile(resolve(root, 'README.md'), 'utf8'));
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><base href="/"><title>README preview · Song-Ze Yu</title><style>
          :root{color-scheme:light dark}*{box-sizing:border-box}body{margin:0;background:light-dark(#fff,#0d1117);color:light-dark(#1f2328,#f0f6fc);font:16px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.markdown-body{max-width:896px;margin:32px auto;padding:24px;border:1px solid light-dark(#d1d9e0,#3d444d);border-radius:6px}img{max-width:100%;height:auto;vertical-align:top}a{color:light-dark(#0969da,#4493f8);text-decoration:none}h2{font-size:24px;line-height:1.25;margin:28px 0 16px;padding-bottom:8px;border-bottom:1px solid light-dark(#d1d9e0,#3d444d)}p{margin:0 0 16px}picture{display:contents}@media(max-width:600px){.markdown-body{border:0;margin:0;padding:16px}h2{font-size:21px}}
        </style></head><body><main class="markdown-body">${content}</main></body></html>`);
        return;
      }
      const file = resolve(root, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
      const allowed = ['profile', 'assets', 'cards', 'vendor'].some(dir => file.startsWith(resolve(root, dir) + sep));
      if (!allowed) { res.writeHead(404).end(); return; }
      res.setHeader('Content-Type', types[extname(file)] || 'application/octet-stream');
      res.end(await readFile(file));
    } catch { res.writeHead(404).end(); }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  });
  return { server, url: `http://127.0.0.1:${server.address().port}/profile/` };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { url } = await serve(Number(process.env.PORT || 4173));
  console.log(`Full README: ${new URL('/readme', url)}\nProfile preview: ${url}\nDark preview: ${url}?theme=dark`);
}
