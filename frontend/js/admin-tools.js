async function loadCompanyOptions(){const rows=await api('/companies');const s=document.getElementById('companyId');if(s)s.innerHTML=rows.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}
async function createCompany(e){e.preventDefault();const f=e.target;const b=Object.fromEntries(new FormData(f).entries());b.salaryPackage=Number(b.salaryPackage);try{await api('/companies',{method:'POST',body:b});toast('Company created');f.reset();}catch(err){toast(err.message)}}
async function createDrive(e){e.preventDefault();const f=e.target;const b=Object.fromEntries(new FormData(f).entries());
 for(const k of ['graduationYear','vacancies','maxBacklogs']) b[k]=Number(b[k]);
 for(const k of ['salaryPackage','minCgpa','minTenthPercentage','minTwelfthPercentage']) b[k]=Number(b[k]);
 b.eligibleDepartments=(b.eligibleDepartments||'').split(',').map(x=>x.trim()).filter(Boolean).join(', ');
 if(!b.company) return toast('Company is required');
 if(!b.eligibleDepartments) return toast('Select at least one eligible department');
 try{await api('/drives',{method:'POST',body:b});toast('Placement drive created');f.reset();document.querySelectorAll('.department-checkbox').forEach(x=>x.checked=false);if(typeof updateDepartmentSelection==='function')updateDepartmentSelection();if(typeof loadAdminTables==='function')loadAdminTables();}catch(err){toast(err.message)}}
async function scheduleInterview(e){e.preventDefault();const b=Object.fromEntries(new FormData(e.target).entries());try{await api('/interviews',{method:'POST',body:b});toast('Interview scheduled');e.target.reset()}catch(err){toast(err.message)}}
async function publishResult(e){e.preventDefault();const b=Object.fromEntries(new FormData(e.target).entries());try{await api('/results',{method:'POST',body:b});toast('Result published');e.target.reset()}catch(err){toast(err.message)}}
