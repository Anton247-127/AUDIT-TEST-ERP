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


// ====== JS: คำนวณอัตโนมัติทั้งหมด วางต่อท้ายไฟล์ JS เดิม ======
(function(){
  const form = document.getElementById('cashCountForm');
  if(!form) return;

  const qtyInputs = form.querySelectorAll('.qty-input');
  const sumAEl = document.getElementById('sumA');
  const sumCEl = document.getElementById('sumC');
  const sumTotalEl = document.getElementById('sumTotal');
  const sumDiffEl = document.getElementById('sumDiff');
  const sumNetEl = document.getElementById('sumNet');
  const diffBadge = document.getElementById('diffBadge');
  const bahtTextEl = document.getElementById('bahtText');
  const pettyLimitInput = document.getElementById('cc-petty-limit');
  const remainSystemInput = document.getElementById('cc-remain-system');
  const bInput = document.getElementById('cc-B');
  const receiptBody = document.getElementById('receiptBody');
  const addReceiptBtn = document.getElementById('addReceiptRow');

  function fmt(n){
    return (isNaN(n) ? 0 : n).toLocaleString('th-TH', {minimumFractionDigits:2, maximumFractionDigits:2});
  }

  function calcA(){
    let sum = 0;
    qtyInputs.forEach(inp => {
      const denom = parseFloat(inp.dataset.denom) || 0;
      const qty = parseFloat(inp.value) || 0;
      const total = denom * qty;
      sum += total;
      document.getElementById('total-' + inp.dataset.row).textContent = fmt(total);
    });
    sumAEl.textContent = fmt(sum);
    return sum;
  }

  function calcC(){
    let sum = 0;
    receiptBody.querySelectorAll('.receipt-amount').forEach(inp => {
      sum += parseFloat(inp.value) || 0;
    });
    sumCEl.textContent = fmt(sum);
    return sum;
  }

  function recalcAll(){
    const A = calcA();
    const C = calcC();
    const B = parseFloat(bInput.value) || 0;
    const pettyLimit = parseFloat(pettyLimitInput.value) || 0;

    const total = A + B + C;
    sumTotalEl.textContent = fmt(total);

    const remainSystem = pettyLimit - B;
    remainSystemInput.value = fmt(remainSystem);

    const diff = total - pettyLimit;
    sumDiffEl.textContent = fmt(diff);

    if(Math.abs(diff) < 0.01){
      diffBadge.textContent = 'ถูกต้อง';
      diffBadge.className = 'diff-badge ok';
    } else {
      diffBadge.textContent = 'ไม่ถูกต้อง';
      diffBadge.className = 'diff-badge warn';
    }

    sumNetEl.textContent = fmt(total);
    bahtTextEl.textContent = bahtText(total);
  }

  // --- แปลงตัวเลขเป็นคำอ่านภาษาไทย (บาทถ้วน) ---
  function bahtText(number){
    number = Math.round((number || 0) * 100) / 100;
    if(number === 0) return 'ศูนย์บาทถ้วน';

    const txtNumArr = ['ศูนย์','หนึ่ง','สอง','สาม','สี่','ห้า','หก','เจ็ด','แปด','เก้า'];
    const txtDigitArr = ['','สิบ','ร้อย','พัน','หมื่น','แสน','ล้าน'];

    function readNumber(numStr){
      let result = '';
      const len = numStr.length;
      for(let i = 0; i < len; i++){
        const digit = parseInt(numStr[i]);
        const pos = len - i - 1;
        if(digit === 0) continue;
        if(pos === 0 && digit === 1 && len > 1){
          result += 'เอ็ด';
        } else if(pos === 1 && digit === 2){
          result += 'ยี่' + txtDigitArr[1];
        } else if(pos === 1 && digit === 1){
          result += txtDigitArr[1];
        } else {
          result += txtNumArr[digit] + txtDigitArr[pos];
        }
      }
      return result;
    }

    const parts = number.toFixed(2).split('.');
    let baht = parts[0];
    let satang = parts[1];

    let result = '';
    if(parseInt(baht) > 0){
      result += readNumber(baht) + 'บาท';
    }
    if(parseInt(satang) > 0){
      result += readNumber(satang) + 'สตางค์';
    } else {
      result += 'ถ้วน';
    }
    return result;
  }

  // --- Event bindings ---
  qtyInputs.forEach(inp => inp.addEventListener('input', recalcAll));
  bInput.addEventListener('input', recalcAll);
  pettyLimitInput.addEventListener('input', recalcAll);

  function bindReceiptRow(row){
    row.querySelector('.receipt-amount').addEventListener('input', recalcAll);
    row.querySelector('.btn-remove-row').addEventListener('click', () => {
      row.remove();
      recalcAll();
    });
  }
  receiptBody.querySelectorAll('tr').forEach(bindReceiptRow);

  addReceiptBtn.addEventListener('click', () => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><input type="date" class="receipt-date"></td>
      <td><input type="text" class="receipt-no" placeholder="เลขที่"></td>
      <td><input type="text" class="receipt-desc" placeholder="รายละเอียด"></td>
      <td><input type="number" class="receipt-amount" value="0" step="0.01"></td>
      <td><button type="button" class="btn-remove-row" title="ลบแถว">×</button></td>
    `;
    receiptBody.appendChild(row);
    bindReceiptRow(row);
  });

  // ตั้งค่าวันที่วันนี้
  const dateField = document.getElementById('cc-date');
  if(dateField && !dateField.value){
    dateField.value = new Date().toISOString().split('T')[0];
  }

  // --- บันทึกข้อมูล ---
  form.addEventListener('submit', function(e){
    e.preventDefault();

    const denominations = {};
    qtyInputs.forEach(inp => {
      denominations[inp.dataset.row] = parseFloat(inp.value) || 0;
    });

    const receipts = Array.from(receiptBody.querySelectorAll('tr')).map(row => ({
      date: row.querySelector('.receipt-date').value,
      no: row.querySelector('.receipt-no').value.trim(),
      desc: row.querySelector('.receipt-desc').value.trim(),
      amount: parseFloat(row.querySelector('.receipt-amount').value) || 0
    }));

    const payload = {
      savedAt: new Date().toISOString(),
      code: document.getElementById('cc-code').value.trim(),
      branch: document.getElementById('cc-branch').value.trim(),
      date: document.getElementById('cc-date').value,
      custodian: document.getElementById('cc-custodian').value.trim(),
      auditor: document.getElementById('cc-auditor').value.trim(),
      position: document.getElementById('cc-position').value.trim(),
      timeStart: document.getElementById('cc-time-start').value,
      timeEnd: document.getElementById('cc-time-end').value,
      pettyLimit: parseFloat(pettyLimitInput.value) || 0,
      B: parseFloat(bInput.value) || 0,
      denominations,
      receipts,
      diffReason: document.getElementById('cc-diff-reason').value.trim(),
      summary: document.getElementById('cc-summary').value.trim(),
      signAuditor: document.getElementById('sign-auditor').value.trim(),
      signFinance: document.getElementById('sign-finance').value.trim()
    };

    const all = JSON.parse(localStorage.getItem('cashCountRecords') || '[]');
    all.unshift(payload);
    localStorage.setItem('cashCountRecords', JSON.stringify(all));

    alert('บันทึกผลการนับเงินสดย่อยเรียบร้อยแล้ว');
  });

  recalcAll();
})();
