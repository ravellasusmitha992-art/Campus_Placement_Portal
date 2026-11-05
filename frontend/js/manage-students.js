const STUDENTS_PER_PAGE = 10;

const studentState = {
  records: [],
  page: 1,
  loading: false
};

const studentElements = {
  body: document.getElementById('studentsBody'),
  search: document.getElementById('studentSearch'),
  department: document.getElementById('departmentFilter'),
  cgpa: document.getElementById('cgpaFilter'),
  clear: document.getElementById('clearFilters'),
  resultCount: document.getElementById('studentResultCount'),
  pagination: document.getElementById('studentPagination'),
  paginationStatus: document.getElementById('paginationStatus'),
  previous: document.getElementById('previousPage'),
  next: document.getElementById('nextPage')
};

studentElements.search.addEventListener('input', resetAndRenderStudents);
studentElements.department.addEventListener('change', resetAndRenderStudents);
studentElements.cgpa.addEventListener('change', resetAndRenderStudents);
studentElements.clear.addEventListener('click', clearStudentFilters);
studentElements.previous.addEventListener('click', () => changeStudentPage(-1));
studentElements.next.addEventListener('click', () => changeStudentPage(1));

loadStudents();

async function loadStudents() {
  if (!requireRole('admin')) return;

  studentState.loading = true;
  studentElements.resultCount.textContent = 'Loading students…';
  renderStudentMessage('Loading student records…');
  setStudentSummaryDefaults();

  try {
    const records = await api('/students');
    if (!Array.isArray(records)) {
      throw new Error('The student records response was not a list.');
    }

    studentState.records = records;
    studentState.page = 1;
    studentState.loading = false;
    updateStudentSummary(records);
    populateDepartmentFilter(records);
    renderStudents();
    loadEligibleStudentCount(records);
  } catch (error) {
    studentState.loading = false;
    studentState.records = [];
    studentElements.resultCount.textContent = 'Could not load students';
    showStudentLoadError(error);
    toast(error.message || 'Unable to load student records.');
  }
}

async function loadEligibleStudentCount(records) {
  const countElement = document.getElementById('eligibleStudents');
  const noteElement = document.getElementById('eligibilityNote');

  countElement.textContent = '…';
  noteElement.textContent = 'Checking drive criteria…';

  try {
    const drives = await api('/drives');
    if (!Array.isArray(drives)) {
      throw new Error('The placement drives response was not a list.');
    }

    const eligibleCount = records.filter(student =>
      drives.some(drive => meetsDriveCriteria(student, drive))
    ).length;

    countElement.textContent = eligibleCount.toLocaleString();
    noteElement.textContent = 'Meets at least one drive’s criteria';
  } catch (error) {
    countElement.textContent = '—';
    noteElement.textContent = 'Drive criteria unavailable';
    toast(error.message || 'Unable to load placement drive criteria.');
  }
}

function meetsDriveCriteria(student, drive) {
  if (!student || !drive || !drive.eligibleDepartments || !student.department) return false;

  const cgpa = finiteNumber(student.cgpa);
  const tenth = finiteNumber(student.tenthPercentage);
  const twelfth = finiteNumber(student.twelfthPercentage);
  const backlogs = finiteNumber(student.backlogs);
  const minCgpa = finiteNumber(drive.minCgpa);
  const minTenth = finiteNumber(drive.minTenthPercentage);
  const minTwelfth = finiteNumber(drive.minTwelfthPercentage);
  const maxBacklogs = finiteNumber(drive.maxBacklogs);

  if ([cgpa, tenth, twelfth, backlogs, minCgpa, minTenth, minTwelfth, maxBacklogs].some(value => value === null)) {
    return false;
  }

  const departments = drive.eligibleDepartments
    .split(',')
    .map(department => department.trim().toLocaleLowerCase())
    .filter(Boolean);

  return cgpa >= minCgpa
    && tenth >= minTenth
    && twelfth >= minTwelfth
    && backlogs <= maxBacklogs
    && departments.includes(String(student.department).trim().toLocaleLowerCase())
    && student.graduationYear != null
    && String(student.graduationYear) === String(drive.graduationYear);
}

function finiteNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function setStudentSummaryDefaults() {
  document.getElementById('totalStudents').textContent = '—';
  document.getElementById('eligibleStudents').textContent = '—';
  document.getElementById('backlogStudents').textContent = '—';
  document.getElementById('averageCgpa').textContent = '—';
  document.getElementById('eligibilityNote').textContent = 'Checking drive criteria…';
}

function updateStudentSummary(records) {
  const cgpas = records.map(student => finiteNumber(student.cgpa)).filter(value => value !== null);
  const average = cgpas.length ? cgpas.reduce((sum, cgpa) => sum + cgpa, 0) / cgpas.length : null;
  const backlogCount = records.filter(student => {
    const backlogs = finiteNumber(student.backlogs);
    return backlogs !== null && backlogs > 0;
  }).length;

  document.getElementById('totalStudents').textContent = records.length.toLocaleString();
  document.getElementById('backlogStudents').textContent = backlogCount.toLocaleString();
  document.getElementById('averageCgpa').textContent = average === null ? '—' : average.toFixed(2);
}

function populateDepartmentFilter(records) {
  const selectedDepartment = studentElements.department.value;
  const departments = [...new Set(
    records
      .map(student => String(student.department || '').trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
  )];

  studentElements.department.replaceChildren(new Option('All departments', ''));
  departments.forEach(department => {
    studentElements.department.add(new Option(department, department));
  });

  if (departments.includes(selectedDepartment)) {
    studentElements.department.value = selectedDepartment;
  }
}

function getFilteredStudents() {
  const query = studentElements.search.value.trim().toLocaleLowerCase();
  const department = studentElements.department.value.toLocaleLowerCase();
  const cgpaRange = studentElements.cgpa.value;

  return studentState.records.filter(student => {
    const matchesQuery = !query || [student.rollNumber, student.name, student.email]
      .some(value => String(value || '').toLocaleLowerCase().includes(query));
    const matchesDepartment = !department
      || String(student.department || '').trim().toLocaleLowerCase() === department;
    const cgpa = finiteNumber(student.cgpa);
    const matchesCgpa = !cgpaRange
      || (cgpa !== null && (
        (cgpaRange === 'high' && cgpa >= 8)
        || (cgpaRange === 'mid' && cgpa >= 7 && cgpa < 8)
        || (cgpaRange === 'low' && cgpa < 7)
      ));

    return matchesQuery && matchesDepartment && matchesCgpa;
  });
}

function resetAndRenderStudents() {
  studentState.page = 1;
  renderStudents();
}

function clearStudentFilters() {
  studentElements.search.value = '';
  studentElements.department.value = '';
  studentElements.cgpa.value = '';
  studentState.page = 1;
  renderStudents();
  studentElements.search.focus();
}

function changeStudentPage(amount) {
  studentState.page += amount;
  renderStudents();
}

function renderStudents() {
  if (studentState.loading) return;

  const filteredStudents = getFilteredStudents();
  const pageCount = Math.max(1, Math.ceil(filteredStudents.length / STUDENTS_PER_PAGE));
  studentState.page = Math.min(Math.max(studentState.page, 1), pageCount);

  if (filteredStudents.length === 0) {
    studentElements.resultCount.textContent = studentState.records.length
      ? 'No matching students'
      : '0 students';
    studentElements.pagination.hidden = true;
    renderStudentEmptyState(studentState.records.length > 0);
    return;
  }

  const start = (studentState.page - 1) * STUDENTS_PER_PAGE;
  const pageStudents = filteredStudents.slice(start, start + STUDENTS_PER_PAGE);
  studentElements.body.replaceChildren(...pageStudents.map(createStudentRow));
  studentElements.resultCount.textContent = `${filteredStudents.length.toLocaleString()} ${
    filteredStudents.length === 1 ? 'student' : 'students'
  }`;

  const hasPagination = filteredStudents.length > STUDENTS_PER_PAGE;
  studentElements.pagination.hidden = !hasPagination;
  if (hasPagination) {
    const first = start + 1;
    const last = Math.min(start + STUDENTS_PER_PAGE, filteredStudents.length);
    studentElements.paginationStatus.textContent = `Showing ${first}–${last} of ${filteredStudents.length}`;
    studentElements.previous.disabled = studentState.page === 1;
    studentElements.next.disabled = studentState.page === pageCount;
  }
}

function createStudentRow(student) {
  const row = document.createElement('tr');
  row.className = 'student-row';

  const rollCell = document.createElement('td');
  rollCell.append(createBadge(student.rollNumber || '—', 'student-roll-badge'));

  const identityCell = document.createElement('td');
  const identity = document.createElement('div');
  identity.className = 'student-identity';
  const avatar = document.createElement('span');
  avatar.className = 'student-avatar';
  avatar.setAttribute('aria-hidden', 'true');
  avatar.textContent = studentInitials(student.name);

  const identityCopy = document.createElement('div');
  identityCopy.className = 'student-identity-copy';
  const name = document.createElement('div');
  name.className = 'student-name';
  name.textContent = student.name || 'Name not provided';
  const email = document.createElement('div');
  email.className = 'student-email';
  email.textContent = student.email || 'Email not provided';
  identityCopy.append(name, email);
  identity.append(avatar, identityCopy);
  identityCell.append(identity);

  const departmentCell = document.createElement('td');
  departmentCell.append(createBadge(student.department || 'Not specified', 'student-department-badge'));

  const cgpaCell = document.createElement('td');
  const cgpa = finiteNumber(student.cgpa);
  const cgpaClass = cgpa === null
    ? 'student-cgpa-badge'
    : cgpa >= 8
      ? 'student-cgpa-badge student-cgpa-badge--high'
      : cgpa >= 7
        ? 'student-cgpa-badge student-cgpa-badge--mid'
        : 'student-cgpa-badge student-cgpa-badge--low';
  cgpaCell.append(createBadge(cgpa === null ? 'N/A' : cgpa.toFixed(2), cgpaClass));

  const backlogCell = document.createElement('td');
  const backlogs = finiteNumber(student.backlogs);
  let backlogText = 'Not recorded';
  let backlogClass = 'student-backlog-badge';
  if (backlogs !== null && backlogs === 0) {
    backlogText = 'No Backlogs';
    backlogClass += ' student-backlog-badge--none';
  } else if (backlogs !== null && backlogs > 0) {
    backlogText = `${backlogs} ${backlogs === 1 ? 'Backlog' : 'Backlogs'}`;
    backlogClass += ' student-backlog-badge--has';
  }
  backlogCell.append(createBadge(backlogText, backlogClass));

  row.append(rollCell, identityCell, departmentCell, cgpaCell, backlogCell);
  return row;
}

function createBadge(text, className) {
  const badge = document.createElement('span');
  badge.className = className;
  badge.textContent = text;
  return badge;
}

function studentInitials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return parts.length === 1
    ? parts[0].slice(0, 2)
    : `${parts[0][0]}${parts[parts.length - 1][0]}`;
}

function renderStudentMessage(message, isError = false) {
  const cell = document.createElement('td');
  cell.className = `student-table-message${isError ? ' student-error-message' : ''}`;
  cell.colSpan = 5;
  cell.textContent = message;
  const row = document.createElement('tr');
  row.append(cell);
  studentElements.body.replaceChildren(row);
  studentElements.pagination.hidden = true;
}

function renderStudentEmptyState(hasRecords) {
  const cell = document.createElement('td');
  cell.className = 'student-table-message';
  cell.colSpan = 5;

  const title = document.createElement('span');
  title.className = 'student-message-title';
  title.textContent = hasRecords ? 'No students match these filters' : 'No student records yet';
  const description = document.createElement('span');
  description.textContent = hasRecords
    ? 'Try another search or clear the selected filters.'
    : 'Registered students will appear here.';
  cell.append(title, description);

  if (hasRecords) {
    const clearButton = document.createElement('button');
    clearButton.className = 'btn secondary student-retry';
    clearButton.type = 'button';
    clearButton.textContent = 'Clear filters';
    clearButton.addEventListener('click', clearStudentFilters);
    cell.append(document.createElement('br'), clearButton);
  }

  const row = document.createElement('tr');
  row.append(cell);
  studentElements.body.replaceChildren(row);
}

function showStudentLoadError(error) {
  const cell = document.createElement('td');
  cell.className = 'student-table-message student-error-message';
  cell.colSpan = 5;
  const title = document.createElement('span');
  title.className = 'student-message-title';
  title.textContent = 'Student records could not be loaded';
  const detail = document.createElement('span');
  detail.textContent = error.message || 'Check your connection and try again.';
  const retry = document.createElement('button');
  retry.className = 'btn secondary student-retry';
  retry.type = 'button';
  retry.textContent = 'Try again';
  retry.addEventListener('click', loadStudents);
  cell.append(title, detail, document.createElement('br'), retry);

  const row = document.createElement('tr');
  row.append(cell);
  studentElements.body.replaceChildren(row);
  studentElements.pagination.hidden = true;
}
