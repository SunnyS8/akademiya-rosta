const token = process.env.VERCEL_TOKEN || '';
const teamId = 'sunnys8s-projects';
const projectId = 'akademiya-rosta';

// Try to get the project to find deployment protection settings
fetch(`https://api.vercel.com/v13/projects/${teamId}/${projectId}`, {
  headers: { Authorization: `Bearer ${token}` }
}).then(r => r.json()).then(j => {
  console.log(JSON.stringify(j, null, 2));
}).catch(e => console.error(e));
