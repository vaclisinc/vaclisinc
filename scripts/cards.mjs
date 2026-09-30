import { readFile, writeFile, mkdir, rename, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { serve } from './serve.mjs';
const root = new URL('../', import.meta.url);
const repos = JSON.parse(await readFile(new URL('cards/repos.json',root),'utf8'));
const pending = new Set(['vaclisinc/AMTFlow']); // User deferred until public.
const dataURL = new URL('cards/data.json',root);
const data = JSON.parse(await readFile(dataURL,'utf8'));
if (!process.argv.includes('--offline')) {
  for (const repo of repos) {
    const response = await fetch(`https://api.github.com/repos/${repo}`,{
      headers:{Accept:'application/vnd.github+json','User-Agent':'vaclis-profile-cards',...(process.env.GITHUB_TOKEN ? {Authorization:`Bearer ${process.env.GITHUB_TOKEN}`} : {})},
      signal:AbortSignal.timeout(30000)
    });
    if(response.status===404 && pending.has(repo)) { console.log(`Deferred: ${repo}`); continue; }
    if(!response.ok) throw new Error(`${repo}: GitHub HTTP ${response.status}. Existing files preserved; use --offline for cached data.`);
    const d = await response.json();
    if(d.private) throw new Error(`${repo}: refusing to export private repository metadata`);
    data[repo]={full_name:d.full_name,name:d.name,description:d.description,language:d.language,stars:d.stargazers_count,forks:d.forks_count,topics:d.topics||[],archived:d.archived,fetchedAt:new Date().toISOString()};
  }
}
let fontCSS='';
for(const weight of [400,600]) {
 const font=await readFile(new URL(`profile/fonts/hanken-${weight}.ttf`,root));
 fontCSS+=`@font-face{font-family:'Hanken Grotesk';font-style:normal;font-weight:${weight};src:url(data:font/ttf;base64,${font.toString('base64')}) format('truetype');}`;
}
const output=fileURLToPath(new URL('assets/cards/',root));
const temp=`${output}.pending/`;
const {server,url}=await serve(); let browser;
try {
 await mkdir(temp,{recursive:true});
 browser=await chromium.launch();
 const page=await browser.newPage();
 await page.goto(url);
 await page.evaluate(async()=>{await Promise.all([...document.fonts].map(font=>font.load()));await document.fonts.ready;});
 let readme=await readFile(new URL('README.md',root),'utf8');
 const files=[];
 for(const repo of repos) {
  if(!data[repo] || data[repo].unavailable) { console.log(`Skipped: ${repo} (no public snapshot)`); continue; }
  const slug=repo.replace('/','--');
  for(const theme of ['light','dark']) {
   const svg=await page.evaluate(async({repo,theme,fontCSS})=>{
    const {renderRepoCard}=await import('/cards/render.mjs');
    const ctx=document.createElement('canvas').getContext('2d');
    const measure=(text,size,weight)=>{ctx.font=`${weight} ${size}px 'Hanken Grotesk', sans-serif`;return ctx.measureText(text).width;};
    return renderRepoCard(repo,{theme,fontCSS,measure});
   },{repo:data[repo],theme,fontCSS});
   const filename=`${slug}-${theme}.svg`;files.push(filename);
   await writeFile(temp+filename,svg);
   const [owner,name]=repo.split('/');
   const pattern=new RegExp(`https://github-stats-extended\\.vercel\\.app/api/pin/\\?username=${owner}&amp;repo=${name}&amp;[^"\\s]+?theme=${theme}_github_repocard`,'g');
   readme=readme.replace(pattern,`assets/cards/${filename}`);
  }
  console.log(`${repo}: ${data[repo].topics.length} topics, 400 × 152`);
 }
 await mkdir(output,{recursive:true});
 for(const file of files) await rename(temp+file,output+file);
 await writeFile(dataURL,JSON.stringify(data,null,2)+'\n');
 await writeFile(new URL('README.md',root),readme);
} finally {
 await browser?.close();await new Promise(resolve=>server.close(resolve));await rm(temp,{recursive:true,force:true});
}
