const tests=['/robots.txt','/sitemap.xml','/'];
const results={};
for(const p of tests){
  try{const r=await fetch('https://akademiya-rosta-k2ff2icm0-sunnys8s-projects.vercel.app'+p);const t=await r.text();results[p]={status:r.status,len:t.length,hasTitle:t.includes('Akademiya')||t.includes('Академия')};}catch(e){results[p]={error:String(e)};}
}console.log(JSON.stringify(results,null,2));
