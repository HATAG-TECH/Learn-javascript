// =======================
// Scroll to Add Student form
// =======================
function scrollToForm() {
  document.getElementById('addstudent').scrollIntoView({behavior: 'smooth'});
}

// =======================
// Profile Picture Preview
// =======================
document.getElementById('photo').addEventListener('change', function(){
  const file = this.files[0];
  if(file){
    const reader = new FileReader();
    reader.onload = e => {
      const img = document.getElementById('preview');
      img.src = e.target.result;
      img.style.display = 'block';
    }
    reader.readAsDataURL(file);
  }
});

// =======================
// Table Variables
// =======================
const studentForm = document.getElementById('studentForm');
const studentTableBody = document.getElementById('studentTable');
const searchInput = document.getElementById('searchInput');
const rowsPerPage = 5;
let currentPage = 1;

// =======================
// Add Student Function
// =======================
studentForm.addEventListener('submit', function(e){
  e.preventDefault();
  const name = document.getElementById('name').value;
  const roll = document.getElementById('rollnumber').value;
  const dept = document.getElementById('department').value;
  const gender = document.querySelector('input[name="sex"]:checked').value;
  const photo = document.getElementById('preview').src || "";

  // Add new row
  const newRow = studentTableBody.insertRow();
  newRow.innerHTML = `<td>${roll}</td><td>${name}</td><td>${dept}</td><td>${gender}</td><td><img src="${photo}" width="50"></td>`;

  alert('Student added successfully!');
  studentForm.reset();
  document.getElementById('preview').style.display = 'none';

  updateChart();
  updateTableView();
});

// =======================
// Search Function
// =======================
searchInput.addEventListener('input', function(){
  const term = this.value.toLowerCase();
  studentTableBody.querySelectorAll('tr').forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(term) ? '' : 'none';
  });
  currentPage = 1;
  renderTable();
});

// =======================
// Sorting Function
// =======================
function sortTable(colIndex) {
  const rows = Array.from(studentTableBody.querySelectorAll('tr')).filter(r => r.style.display !== 'none');
  const isNumeric = !isNaN(rows[0]?.cells[colIndex]?.textContent);
  let asc = true;

  // Toggle sort direction
  if(studentTableBody.dataset.sortCol == colIndex) {
    asc = studentTableBody.dataset.sortOrder !== 'asc';
  }

  rows.sort((a, b) => {
    let valA = a.cells[colIndex].textContent;
    let valB = b.cells[colIndex].textContent;
    if(isNumeric){
      valA = parseInt(valA); valB = parseInt(valB);
    }
    if(valA < valB) return asc ? -1 : 1;
    if(valA > valB) return asc ? 1 : -1;
    return 0;
  });

  studentTableBody.innerHTML = '';
  rows.forEach(r => studentTableBody.appendChild(r));

  studentTableBody.dataset.sortCol = colIndex;
  studentTableBody.dataset.sortOrder = asc ? 'asc' : 'desc';

  renderTable();
}

// =======================
// Pagination Functions
// =======================
function renderTable() {
  const rows = Array.from(studentTableBody.querySelectorAll('tr')).filter(r => r.style.display !== 'none');
  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;

  rows.forEach((row, index) => {
    row.style.display = (index >= start && index < end) ? '' : 'none';
  });

  renderPagination(rows.length);
}

function renderPagination(totalRows) {
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const pagination = document.getElementById('pagination');
  if(!pagination) return;
  pagination.innerHTML = '';

  for(let i=1; i<=totalPages; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    if(i === currentPage) btn.classList.add('active');
    btn.addEventListener('click', () => { currentPage = i; renderTable(); });
    pagination.appendChild(btn);
  }
}

// Refresh table view
function updateTableView() {
  currentPage = 1;
  renderTable();
}

// Initialize table on page load
updateTableView();

// =======================
// Chart.js: Department Distribution
// =======================
const ctx = document.getElementById('deptChart').getContext('2d');
let deptChart = new Chart(ctx, {
  type: 'pie',
  data: {
    labels: ['CS', 'SE', 'IT'],
    datasets: [{
      label: 'Department Distribution',
      data: [0,0,0],
      backgroundColor: ['#36a2eb','#ff6384','#ffcd56']
    }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' }
    }
  }
});

// Update Chart dynamically
function updateChart(){
  const counts = {CS:0, SE:0, IT:0};
  studentTableBody.querySelectorAll('tr').forEach(row => {
    const dept = row.cells[2].textContent;
    if(counts[dept] !== undefined) counts[dept]++;
  });
  deptChart.data.datasets[0].data = [counts.CS, counts.SE, counts.IT];
  deptChart.update();
}

// Initialize chart
updateChart();
