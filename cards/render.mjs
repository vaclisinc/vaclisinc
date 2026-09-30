/* Adapted from github-stats-extended/packages/core/src/cards/repo.ts.
 * MIT; see ../vendor/github-stats-extended/LICENSE and NOTICE.md.
 * Local changes: fixed dimensions, topics, simplified public stats, local fonts.
 */
import { icons } from '../vendor/github-stats-extended/icons.mjs';
export const WIDTH = 400;
export const HEIGHT = 176;
const PAD = 22;
export const escapeXML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const clean = value => String(value ?? '').normalize('NFKC').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').replace(/\s+/g, ' ').trim();
export function fit(text, width, measure) {
  if (measure(text) <= width) return text;
  const chars = [...text];
  while(chars.length && measure(chars.join('') + '…') > width) chars.pop();
  return chars.join('') + '…';
}
export function wrap(text, width, measure, maxLines = 3) {
  let rest = clean(text); const lines = [];
  while (rest && lines.length < maxLines) {
    if (lines.length === maxLines - 1) { lines.push(fit(rest, width, measure)); break; }
    if (measure(rest) <= width) { lines.push(rest); break; }
    const chars = [...rest]; let end = 1;
    while (end < chars.length && measure(chars.slice(0, end + 1).join('')) <= width) end++;
    const chunk = chars.slice(0, end).join('');
    const space = chunk.lastIndexOf(' ');
    if (space > chunk.length / 2) end = [...chunk.slice(0, space)].length;
    lines.push(chars.slice(0, end).join('').trim()); rest = chars.slice(end).join('').trim();
  }
  return lines;
}
export function layoutTopics(topics, measure) {
  const unique = [...new Set(topics.map(clean).filter(Boolean))];
  const tags = []; let x = PAD, row = 0;
  for (let i = 0; i < unique.length; i++) {
    const label = fit(unique[i], WIDTH - PAD * 2 - 20, measure);
    const width = Math.ceil(measure(label)) + 20;
    if (x + width > WIDTH - PAD) { x = PAD; row++; }
    if (row > 1) break;
    tags.push({ label, x, y: 90 + row * 24, width }); x += width + 6;
  }
  if (tags.length < unique.length) {
    let label, width;
    do {
      label = `+${unique.length - tags.length}`; width = Math.ceil(measure(label)) + 20;
      const last = tags.at(-1);
      x = last ? last.x + last.width + 6 : PAD;
      row = last ? Math.round((last.y - 90) / 24) : 0;
      if (x + width <= WIDTH - PAD) break;
      if (row === 0) { x = PAD; row = 1; break; }
      tags.pop();
    } while(true);
    tags.push({ label, x, y: 90 + row * 24, width });
  }
  return tags;
}
export function renderRepoCard(repo, { theme = 'light', measure, fontCSS = '' } = {}) {
  if (typeof measure !== 'function') throw new Error('A font-aware text measurer is required');
  const c = theme === 'dark'
    ? {bg:'#171411',border:'#38322d',text:'#d1ccc7',title:'#9ac9ed',tag:'#243340',muted:'#afa79f'}
    : {bg:'#fcfaf8',border:'#ddd7d1',text:'#514b46',title:'#315b87',tag:'#eaf0f6',muted:'#736c65'};
  const m = (size, weight = 400) => text => measure(text,size,weight);
  const name = fit(clean(repo.name), WIDTH - PAD * 2 - 26, m(17,600));
  const lines = wrap(repo.description || '', WIDTH - PAD * 2, m(13), 2);
  const tags = layoutTopics(repo.topics || [],m(11,600));
  const colors = {Python:'#3572A5',TypeScript:'#3178c6',JavaScript:'#f1e05a',HTML:'#e34c26','Jupyter Notebook':'#DA5B0B',Dart:'#00B4AB'};
  const text = (value,x,y,size=13,weight=400,fill=c.text) => `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${fill}">${escapeXML(value)}</text>`;
  const icon = (key,x,y) => `<svg x="${x}" y="${y}" width="16" height="16" viewBox="0 0 16 16" fill="${c.muted}">${icons[key]}</svg>`;
  let stats = ''; let x = PAD;
  if (repo.language) {
    stats += `<circle cx="${x+5}" cy="149" r="5" fill="${colors[repo.language] || c.muted}"/>` + text(repo.language,x+16,153,12,400,c.muted);
    x += 16 + measure(repo.language,12,400) + 22;
  }
  const count = n => Number(n).toLocaleString('en-US');
  for (const [key,n] of [['star',repo.stars],['fork',repo.forks]]) {
    if (!Number.isFinite(n)) continue;
    const label=count(n); stats+=icon(key,x,141)+text(label,x+21,153,12,400,c.muted); x+=21+measure(label,12,400)+22;
  }
  const aria = `${repo.full_name}. ${clean(repo.description)}. Topics: ${(repo.topics||[]).join(', ') || 'none'}. ${repo.stars} stars, ${repo.forks} forks.`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-labelledby="title desc">
<!-- Derived from github-stats-extended, MIT. Copyright (c) 2020 Anurag Hazra, Abhijit Gupta, martin-mfg. Icons copyright (c) 2026 GitHub Inc. See vendor/github-stats-extended/LICENSE and icons.mjs. -->
<title id="title">${escapeXML(repo.full_name)}</title><desc id="desc">${escapeXML(aria)}</desc>
<style>${fontCSS}text{font-family:'Hanken Grotesk','Segoe UI',sans-serif}</style>
<rect x=".5" y=".5" width="399" height="175" rx="6" fill="${c.bg}" stroke="${c.border}"/>
${icon('contribs',PAD,20)}${text(name,PAD+26,34,17,600,c.title)}
${lines.map((line,i)=>text(line,PAD,58+i*17)).join('\n')}
${tags.map(t=>`<rect x="${t.x}" y="${t.y}" width="${t.width}" height="22" rx="11" fill="${c.tag}"/>${text(t.label,t.x+10,t.y+15,11,600,c.title)}`).join('\n')}
${stats}
</svg>`;
}
