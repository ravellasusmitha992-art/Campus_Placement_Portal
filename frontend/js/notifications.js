const notificationState = {
  students: [],
  sentThisSession: 0
};

const notificationTypeLabels = {
  GENERAL: 'General',
  PLACEMENT: 'Placement',
  INTERVIEW: 'Interview',
  URGENT: 'Urgent',
  ANNOUNCEMENT: 'Announcement'
};

function notificationEscape(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[character]));
}

function notificationStudentName(student) {
  return student.name || student.fullName || student.rollNumber || 'Student';
}

function notificationRollNumber(student) {
  return String(student.rollNumber || '').trim();
}

function populateNotificationDirectory() {
  const departmentSelect = document.getElementById('branch');
  const batchSelect = document.getElementById('batch');
  const studentSelect = document.getElementById('selectedStudents');

  const departments = [...new Set(notificationState.students
    .map(student => String(student.department || '').trim())
    .filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const batches = [...new Set(notificationState.students
    .map(student => student.graduationYear == null ? '' : String(student.graduationYear).trim())
    .filter(Boolean))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  departmentSelect.innerHTML = '<option value="">Select a department</option>' +
    departments.map(department => `<option value="${notificationEscape(department)}">${notificationEscape(department)}</option>`).join('');
  batchSelect.innerHTML = '<option value="">Select a batch</option>' +
    batches.map(batch => `<option value="${notificationEscape(batch)}">${notificationEscape(batch)}</option>`).join('');

  const students = [...notificationState.students].sort((a, b) =>
    notificationStudentName(a).localeCompare(notificationStudentName(b)));
  studentSelect.innerHTML = students.map(student => {
    const rollNumber = notificationRollNumber(student);
    if (!rollNumber) return '';
    const label = `${notificationStudentName(student)} (${rollNumber})`;
    return `<option value="${notificationEscape(rollNumber)}">${notificationEscape(label)}</option>`;
  }).join('');
}

function toggleNotificationTarget() {
  const targetType = document.getElementById('targetType').value;
  const fields = {
    studentField: targetType === 'INDIVIDUAL',
    branchField: targetType === 'BRANCH',
    batchField: targetType === 'BATCH',
    specificField: targetType === 'SPECIFIC',
    rangeField: targetType === 'RANGE'
  };

  Object.entries(fields).forEach(([id, visible]) => {
    document.getElementById(id).style.display = visible ? (id === 'rangeField' ? 'grid' : 'block') : 'none';
  });
  updateNotificationPreview();
}

function getNotificationAudience() {
  const targetType = document.getElementById('targetType').value;
  if (targetType === 'BRANCH') {
    return document.getElementById('branch').value || 'Selected Department';
  }
  if (targetType === 'BATCH') {
    const batch = document.getElementById('batch').value;
    return batch ? `Graduation Batch ${batch}` : 'Specific Batch';
  }
  if (targetType === 'SPECIFIC') {
    const selectedCount = [...document.getElementById('selectedStudents').selectedOptions].length;
    return selectedCount ? `${selectedCount} selected student${selectedCount === 1 ? '' : 's'}` : 'Selected Students';
  }
  if (targetType === 'INDIVIDUAL') {
    return document.getElementById('studentRollNumber').value.trim() || 'Individual Student';
  }
  if (targetType === 'RANGE') {
    const from = document.getElementById('fromRollNumber').value.trim();
    const to = document.getElementById('toRollNumber').value.trim();
    return from && to ? `${from} – ${to}` : 'Roll Number Range';
  }
  return 'All Students';
}

function updateNotificationPreview() {
  const title = document.getElementById('title').value.trim();
  const message = document.getElementById('message').value.trim();
  const type = document.getElementById('notificationType').value;
  const priority = document.getElementById('notificationPriority').value;
  const previewTitle = document.getElementById('previewTitle');
  const previewMessage = document.getElementById('previewMessage');
  const previewIcon = document.getElementById('previewTypeIcon');
  const priorityBadge = document.getElementById('previewPriority');
  const messageCount = document.getElementById('messageCharacterCount');

  previewTitle.textContent = title || 'Your notification title';
  previewMessage.textContent = message || 'Your message will appear here as students receive it.';
  document.getElementById('previewTypeBadge').textContent = type;
  document.getElementById('previewAudience').textContent = getNotificationAudience();
  document.getElementById('previewTypeIcon').setAttribute('aria-label', notificationTypeLabels[type] || 'Notification');
  previewIcon.className = `preview-type-icon preview-type-icon--${type.toLowerCase()}`;
  priorityBadge.textContent = `${priority} PRIORITY`;
  priorityBadge.className = `priority-badge priority-badge--${priority.toLowerCase()}`;
  messageCount.textContent = String(document.getElementById('message').value.length);
}

function getSelectedNotificationRollNumbers() {
  const selected = [...document.getElementById('selectedStudents').selectedOptions].map(option => option.value);
  const entered = document.getElementById('rollNumbers').value.split(',').map(value => value.trim()).filter(Boolean);
  return [...new Set([...selected, ...entered])];
}

function buildNotificationPayload() {
  const targetType = document.getElementById('targetType').value;
  const body = {
    targetType,
    title: document.getElementById('title').value.trim(),
    message: document.getElementById('message').value.trim()
  };

  if (!body.title) throw new Error('Notification title is required.');
  if (!body.message) throw new Error('Notification message is required.');

  if (targetType === 'INDIVIDUAL') {
    body.studentRollNumber = document.getElementById('studentRollNumber').value.trim();
    if (!body.studentRollNumber) throw new Error('Enter a student roll number.');
  } else if (targetType === 'BRANCH') {
    body.branch = document.getElementById('branch').value;
    if (!body.branch) throw new Error('Select a department.');
  } else if (targetType === 'BATCH') {
    const batch = document.getElementById('batch').value;
    if (!batch) throw new Error('Select a graduation batch.');
    const rollNumbers = notificationState.students
      .filter(student => String(student.graduationYear == null ? '' : student.graduationYear) === batch)
      .map(notificationRollNumber)
      .filter(Boolean);
    if (!rollNumbers.length) throw new Error('No students with roll numbers were found for this batch.');
    body.targetType = 'SPECIFIC';
    body.studentRollNumbers = [...new Set(rollNumbers)];
  } else if (targetType === 'SPECIFIC') {
    body.studentRollNumbers = getSelectedNotificationRollNumbers();
    if (!body.studentRollNumbers.length) throw new Error('Select at least one student or enter a roll number.');
  } else if (targetType === 'RANGE') {
    body.fromRollNumber = document.getElementById('fromRollNumber').value.trim();
    body.toRollNumber = document.getElementById('toRollNumber').value.trim();
    if (!body.fromRollNumber || !body.toRollNumber) throw new Error('Enter both ends of the roll number range.');
  } else if (targetType !== 'ALL') {
    throw new Error('Select a supported target audience.');
  }

  return body;
}

function describeNotificationTarget(body) {
  if (body.targetType === 'ALL') return 'all students';
  if (body.targetType === 'BRANCH') return `students in ${body.branch}`;
  if (body.targetType === 'INDIVIDUAL') return `student ${body.studentRollNumber}`;
  if (body.targetType === 'RANGE') return `students from ${body.fromRollNumber} to ${body.toRollNumber}`;
  if (body.studentRollNumbers.length === 1) return '1 selected student';
  return `${body.studentRollNumbers.length} selected students`;
}

async function loadNotificationDirectory() {
  const total = document.getElementById('notificationTotalStudents');
  total.textContent = 'Loading…';
  try {
    const students = await api('/students');
    if (!Array.isArray(students)) throw new Error('Student directory data was not returned in the expected format.');
    notificationState.students = students;
    total.textContent = String(students.length);
    populateNotificationDirectory();
    updateNotificationPreview();
  } catch (error) {
    total.textContent = 'Unavailable';
    toast(`Could not load student directory: ${error.message}`);
  }
}

async function sendNotification(event) {
  if (event) event.preventDefault();
  const button = document.getElementById('sendNotificationButton');

  try {
    const body = buildNotificationPayload();
    const confirmation = `Send “${body.title}” to ${describeNotificationTarget(body)}?`;
    if (!window.confirm(confirmation)) return;

    button.disabled = true;
    button.classList.add('is-sending');
    button.querySelector('span').textContent = 'Sending…';

    const response = await api('/notifications/bulk', { method: 'POST', body });
    notificationState.sentThisSession += 1;
    document.getElementById('notificationSentCount').textContent = String(notificationState.sentThisSession);
    document.getElementById('message').value = '';
    updateNotificationPreview();
    toast(response.message || 'Notification sent successfully.');
  } catch (error) {
    toast(error.message || 'The notification could not be sent.');
  } finally {
    button.disabled = false;
    button.classList.remove('is-sending');
    button.querySelector('span').textContent = 'Send Notification';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (!requireRole('admin')) return;

  ['title', 'message', 'notificationType', 'notificationPriority', 'studentRollNumber', 'branch', 'batch', 'rollNumbers', 'fromRollNumber', 'toRollNumber']
    .forEach(id => document.getElementById(id).addEventListener('input', updateNotificationPreview));
  ['notificationType', 'notificationPriority', 'branch', 'batch']
    .forEach(id => document.getElementById(id).addEventListener('change', updateNotificationPreview));
  document.getElementById('selectedStudents').addEventListener('change', updateNotificationPreview);
  updateNotificationPreview();
  toggleNotificationTarget();
  loadNotificationDirectory();
});
