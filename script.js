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

// ====== JS: วางต่อท้ายไฟล์ JS เดิม ======
(function(){
  const STORAGE_KEY = 'auditRecords';
  const form = document.getElementById('auditForm');
  const listEl = document.getElementById('recordList');
  const emptyMsg = document.getElementById('emptyMsg');
  const cancelBtn = document.getElementById('cancelEditBtn');
  const saveBtn = document.getElementById('saveBtn');
  let editIndex = null; // null = กำลังเพิ่มใหม่, number = กำลังแก้ไข index นั้น

  function getRecords(){
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  }
  function saveRecords(records){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }

  function renderList(){
    const records = getRecords();
    listEl.innerHTML = '';
    emptyMsg.style.display = records.length ? 'none' : 'block';

    records.forEach((r, idx) => {
      const card = document.createElement('div');
      card.className = 'record-card';
      card.innerHTML = `
        <div class="record-info">
          <span><b>ครั้งที่:</b> ${r.round || '-'}</span>
          <span><b>รหัสสาขา:</b> ${r.code || '-'}</span>
          <span><b>สาขา:</b> ${r.branch || '-'}</span>
          <span><b>จังหวัด:</b> ${r.province || '-'}</span>
          <span><b>วันที่ตรวจ:</b> ${r.date || '-'}</span>
          <span><b>ผู้ตรวจสอบ:</b> ${r.auditor1 || '-'} ${r.auditor2 ? '/ ' + r.auditor2 : ''}</span>
          <span><b>ผจก.เขต:</b> ${r.manager || '-'}</span>
        </div>
        <div class="record-actions">
          <button class="edit-btn" data-idx="${idx}">แก้ไข</button>
          <button class="delete-btn" data-idx="${idx}">ลบ</button>
        </div>
      `;
      listEl.appendChild(card);
    });

    listEl.querySelectorAll('.edit-btn').forEach(btn=>{
      btn.addEventListener('click', ()=> loadForEdit(parseInt(btn.dataset.idx)));
    });
    listEl.querySelectorAll('.delete-btn').forEach(btn=>{
      btn.addEventListener('click', ()=> deleteRecord(parseInt(btn.dataset.idx)));
    });
  }

  function loadForEdit(idx){
    const records = getRecords();
    const r = records[idx];
    if(!r) return;
    document.getElementById('f-round').value = r.round || '';
    document.getElementById('f-code').value = r.code || '';
    document.getElementById('f-branch').value = r.branch || '';
    document.getElementById('f-province').value = r.province || '';
    document.getElementById('f-date').value = r.date || '';
    document.getElementById('f-auditor1').value = r.auditor1 || '';
    document.getElementById('f-auditor2').value = r.auditor2 || '';
    document.getElementById('f-manager').value = r.manager || '';

    editIndex = idx;
    saveBtn.textContent = 'บันทึกการแก้ไข';
    cancelBtn.style.display = 'inline-block';
    form.scrollIntoView({behavior:'smooth'});
  }

  function deleteRecord(idx){
    if(!confirm('ต้องการลบรายการนี้ใช่หรือไม่?')) return;
    const records = getRecords();
    records.splice(idx, 1);
    saveRecords(records);
    renderList();
  }

  function resetForm(){
    form.reset();
    editIndex = null;
    saveBtn.textContent = 'บันทึก';
    cancelBtn.style.display = 'none';
  }

  cancelBtn.addEventListener('click', resetForm);

  form.addEventListener('submit', function(e){
    e.preventDefault();

    const record = {
      round: document.getElementById('f-round').value.trim(),
      code: document.getElementById('f-code').value.trim(),
      branch: document.getElementById('f-branch').value.trim(),
      province: document.getElementById('f-province').value.trim(),
      date: document.getElementById('f-date').value,
      auditor1: document.getElementById('f-auditor1').value.trim(),
      auditor2: document.getElementById('f-auditor2').value.trim(),
      manager: document.getElementById('f-manager').value.trim(),
    };

    const records = getRecords();

    if(editIndex !== null){
      records[editIndex] = record; // แก้ไขของเดิม
    } else {
      records.unshift(record); // เพิ่มใหม่ ไว้บนสุด
    }

    saveRecords(records);
    renderList();
    resetForm();
  });

  renderList();
})();

// ====== JS: จัดการบันทึกผลการตรวจสอบ ======
(function(){
  const form = document.getElementById('resultForm');
  if(!form) return;

  form.addEventListener('submit', function(e){
    e.preventDefault();

    const rows = form.querySelectorAll('tbody tr[data-row]');
    const results = [];

    rows.forEach(row => {
      const key = row.dataset.row;
      const checkedRadio = row.querySelector('input[type="radio"]:checked');
      const status = checkedRadio ? checkedRadio.value : '';
      const issue = row.querySelector('.issue-text').value.trim();
      const cause = row.querySelector('.cause-text').value.trim();

      results.push({ key, status, issue, cause });
    });

    // เก็บผลพร้อมเวลา (ผูกกับการตรวจรอบนี้ได้ภายหลัง เช่น เชื่อมกับ auditRecords)
    const payload = {
      savedAt: new Date().toISOString(),
      results
    };

    const all = JSON.parse(localStorage.getItem('auditResults') || '[]');
    all.unshift(payload);
    localStorage.setItem('auditResults', JSON.stringify(all));

    alert('บันทึกผลการตรวจสอบเรียบร้อยแล้ว');
  });
})();

// ====== JS เพิ่มเติม: ปุ่มเพิ่มบรรทัด bullet + รวบรวมข้อมูลตอนบันทึก ======
(function(){
  // ปุ่ม + เพิ่มบรรทัด
  document.querySelectorAll('.btn-add-line').forEach(btn=>{
    btn.addEventListener('click', function(){
      const targetId = this.dataset.target;
      const container = document.getElementById(targetId);
      const row = document.createElement('div');
      row.className = 'bullet-row';
      row.innerHTML = `
        <span class="bullet-dot">•</span>
        <input type="text" class="bullet-input" placeholder="พิมพ์ข้อความ...">
      `;
      container.appendChild(row);
      row.querySelector('.bullet-input').focus();
    });
  });

  // ตั้งค่าวันที่เริ่มต้นเป็นวันนี้ให้ทุกช่อง date (แก้ไขได้)
  document.querySelectorAll('.date-input').forEach(input=>{
    if(!input.value){
      const today = new Date().toISOString().split('T')[0];
      input.value = today;
    }
  });
})();

// ====== ปรับ JS บันทึกเดิม ให้ดึงข้อมูลส่วนใหม่ไปด้วย ======
// แทนที่ event listener submit เดิมของ #resultForm ด้วยอันนี้
(function(){
  const form = document.getElementById('resultForm');
  if(!form) return;

  form.addEventListener('submit', function(e){
    e.preventDefault();

    const rows = form.querySelectorAll('tbody tr[data-row]');
    const results = [];
    rows.forEach(row => {
      const key = row.dataset.row;
      const checkedRadio = row.querySelector('input[type="radio"]:checked');
      const status = checkedRadio ? checkedRadio.value : '';
      const issue = row.querySelector('.issue-text').value.trim();
      const cause = row.querySelector('.cause-text').value.trim();
      results.push({ key, status, issue, cause });
    });

    const suggestions = Array.from(document.querySelectorAll('#auditorSuggestList .bullet-input'))
      .map(i => i.value.trim()).filter(v => v);

    const branchComments = Array.from(document.querySelectorAll('#branchCommentList .bullet-input'))
      .map(i => i.value.trim()).filter(v => v);

    const signatureBlocks = Array.from(document.querySelectorAll('.signature-block'));
    const signatures = signatureBlocks.map(block => {
      const role = block.querySelector('.sign-role').textContent.replace(/[()]/g,'').trim();
      const name = block.querySelector('.sign-input').value.trim();
      const date = block.querySelector('.date-input').value;
      return { role, name, date };
    });

    const payload = {
      savedAt: new Date().toISOString(),
      results,
      suggestions,
      branchComments,
      signatures
    };

    const all = JSON.parse(localStorage.getItem('auditResults') || '[]');
    all.unshift(payload);
    localStorage.setItem('auditResults', JSON.stringify(all));

    alert('บันทึกผลการตรวจสอบเรียบร้อยแล้ว');
  });
})();
