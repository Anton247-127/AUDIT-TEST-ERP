document.querySelectorAll('.menu-parent').forEach(btn=>{
  btn.addEventListener('click',()=>{
    const target=document.getElementById(btn.dataset.target);
    const isOpen=target.classList.contains('open');
    document.querySelectorAll('.submenu').forEach(s=>s.classList.remove('open'));
    document.querySelectorAll('.menu-parent').forEach(b=>b.classList.remove('open'));
    if(!isOpen){target.classList.add('open');btn.classList.add('open');}
  });
});

const toggleBtn=document.getElementById('menuToggle');
if(toggleBtn){
  toggleBtn.addEventListener('click',()=>{
    document.getElementById('sidebar').classList.toggle('open');
  });
}
