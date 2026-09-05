const url='https://akademiya-rosta-k2ff2icm0-sunnys8s-projects.vercel.app/api/chat';
fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:[{role:'user',content:'Привет'}]})}).then(r=>r.json()).then(j=>console.log(JSON.stringify(j,null,2))).catch(e=>console.error(e));
