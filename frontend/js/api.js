const API='http://localhost:8081/api';
async function api(path,options={}){
 const opts={...options,headers:{...(options.headers||{})}};
 if(opts.body && !(opts.body instanceof FormData)){opts.headers['Content-Type']='application/json';opts.body=JSON.stringify(opts.body)}
 const r=await fetch(API+path,opts);
 let data; try{data=await r.json()}catch(e){data={success:r.ok,message:await r.text()}}
 if(!r.ok || data.success===false) throw new Error(data.message||('HTTP '+r.status));
 return data;
}
function session(){try{return JSON.parse(localStorage.getItem('placementUser')||'null')}catch(e){return null}}
function saveSession(u){localStorage.setItem('placementUser',JSON.stringify(u))}
function logout(){localStorage.removeItem('placementUser');location.href='login.html'}
function requireRole(role){const u=session();if(!u||u.role!==role){location.href='login.html';return null}return u}
function toast(msg){const el=document.getElementById('toast');if(el){el.textContent=msg;el.style.display='block';setTimeout(()=>el.style.display='none',2800)}}
