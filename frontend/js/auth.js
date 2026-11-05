document.addEventListener('DOMContentLoaded',()=>{
 const login=document.getElementById('loginForm');
 if(login) login.addEventListener('submit',async e=>{
  e.preventDefault();
  try{
   const role=document.getElementById('role').value;
   const email=document.getElementById('email').value.trim();
   const password=document.getElementById('password').value;
   const r=await api('/auth/login',{method:'POST',body:{email,password,role}});
   saveSession(r.data); location.href=role==='admin'?'admin-dashboard.html':'student-dashboard.html';
  }catch(err){toast(err.message)}
  });
 const reg=document.getElementById('registerForm');
 if(reg) reg.addEventListener('submit',async e=>{
  e.preventDefault();
  const data=Object.fromEntries(new FormData(reg).entries());
  if(data.password!==data.confirmPassword){toast('Password and confirm password do not match');return;}
  data.graduationYear=Number(data.graduationYear); data.tenthPercentage=Number(data.tenthPercentage); data.twelfthPercentage=Number(data.twelfthPercentage); data.cgpa=Number(data.cgpa); data.backlogs=Number(data.backlogs||0);
  try{await api('/auth/register',{method:'POST',body:data});toast('Registration successful. Redirecting...');setTimeout(()=>location.href='login.html',900)}catch(err){toast(err.message)}
 });
});
