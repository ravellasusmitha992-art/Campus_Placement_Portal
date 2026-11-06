async function loadInterviewDrives() {
  const select = document.getElementById('driveId');
  if (!requireRole('admin')) return;

  try {
    const rows = await api('/drives');
    if (!Array.isArray(rows)) {
      throw new Error('The placement drives response was not a list.');
    }

    select.innerHTML = '<option value="">Select a placement drive</option>' + rows.map(drive =>
      `<option value="${escapeInterviewHtml(drive.id)}">${escapeInterviewHtml(drive.company)} — ${escapeInterviewHtml(drive.jobRole)}</option>`
    ).join('');
    select.disabled = rows.length === 0;
    if (!rows.length) {
      select.innerHTML = '<option value="">No placement drives available</option>';
      toast('Create a placement drive before scheduling interviews.');
     }
  } catch (error) {
    select.innerHTML = '<option value="">Could not load placement drives</option>';
    select.disabled = true;
    toast(error.message || 'Unable to load placement drives.');
  }
}

function toggleInterviewTarget() {
  const target = document.getElementById('targetType').value;
  document.getElementById('studentField').style.display = target === 'INDIVIDUAL' ? '' : 'none';
  document.getElementById('studentsField').style.display = target === 'SPECIFIC' ? '' : 'none';
  document.getElementById('interviewBranchField').style.display = target === 'BRANCH' ? '' : 'none';
  document.getElementById('interviewRangeField').style.display = target === 'RANGE' ? 'grid' : 'none';
  document.getElementById('studentRollNumber').required = target === 'INDIVIDUAL';
  document.getElementById('studentIds').required = target === 'SPECIFIC';
  document.getElementById('interviewBranch').required = target === 'BRANCH';
  document.getElementById('interviewFrom').required = target === 'RANGE';
  document.getElementById('interviewTo').required = target === 'RANGE';
}

function interviewBody() {
  const target = document.getElementById('targetType').value;
  const body = {
    driveId: Number(document.getElementById('driveId').value),
    targetType: target === 'INDIVIDUAL' ? 'SPECIFIC' : target,
    round: document.getElementById('round').value.trim(),
    interviewDate: document.getElementById('interviewDate').value,
    interviewTime: document.getElementById('interviewTime').value,
    type: document.getElementById('type').value,
    venue: document.getElementById('venue').value.trim(),
    meetingLink: document.getElementById('meetingLink').value.trim()
  };

  if (target === 'INDIVIDUAL') {
    body.studentRollNumbers = [document.getElementById('studentRollNumber').value.trim()].filter(Boolean);
  }
  if (target === 'SPECIFIC') {
    body.studentRollNumbers = document.getElementById('studentIds').value.split(',').map(value => value.trim()).filter(Boolean);
  }
  if (target === 'BRANCH') {
    body.branch = document.getElementById('interviewBranch').value.trim();
  }
  if (target === 'RANGE') {
    body.fromRollNumber = document.getElementById('interviewFrom').value.trim();
    body.toRollNumber = document.getElementById('interviewTo').value.trim();
  }

  return body;
}

async function previewInterviewSelection() {
  const form = document.getElementById('interviewForm');
  if (!form.reportValidity()) return;

  const button = document.querySelector('.preview-button');
  button.disabled = true;
  renderInterviewPreviewLoading();

  try {
    const body = interviewBody();
    const rows = await api('/interviews/preview', { method: 'POST', body });
    if (!Array.isArray(rows)) {
      throw new Error('The student preview response was not a list.');
    }
    renderInterviewPreview(await getSchedulableInterviewStudents(body, rows));
  } catch (error) {
    renderInterviewPreviewError(error.message || 'Unable to preview students.');
    toast(error.message || 'Unable to preview students.');
  } finally {
    button.disabled = false;
  }
}

async function getSchedulableInterviewStudents(body, students) {
  const [applications, interviews] = await Promise.all([
    api('/applications/drive/' + encodeURIComponent(body.driveId)),
    api('/interviews')
  ]);
  if (!Array.isArray(applications) || !Array.isArray(interviews)) {
    throw new Error('Could not verify student applications for this drive.');
  }

  const applicationByStudent = new Map(applications.map(application => [
    Number(application.studentId),
    application
  ]));
  const scheduledRounds = new Set(interviews.map(interview =>
    `${Number(interview.applicationId)}:${String(interview.round || '').trim()}`
  ));

  return students.filter(student => {
    const application = applicationByStudent.get(Number(student.id));
    if (!application) return false;
    const roundKey = `${Number(application.id)}:${String(body.round || '').trim()}`;
    return !scheduledRounds.has(roundKey);
  });
}

function renderInterviewPreviewLoading() {
  const preview = document.getElementById('preview');
  preview.className = 'interview-preview';
  preview.innerHTML = '<span class="preview-icon" aria-hidden="true"><span class="preview-spinner"></span></span><span class="preview-copy"><strong>Finding students</strong><span>Checking the selected target group…</span></span>';
}

function renderInterviewPreview(rows) {
  const preview = document.getElementById('preview');
  if (!rows.length) {
    preview.className = 'interview-preview';
    preview.innerHTML = '<span class="preview-icon" aria-hidden="true">' + interviewPeopleIcon() + '</span><span class="preview-copy"><strong>No matching students</strong><span>No matching students or applications were found for this drive.</span></span>';
    return;
  }

  const students = rows.map(student =>
    `<span class="preview-student"><span class="preview-student-mark" aria-hidden="true">${escapeInterviewHtml(interviewInitials(student.name))}</span><strong>${escapeInterviewHtml(student.name)}</strong><small>${escapeInterviewHtml(student.rollNumber)}</small></span>`
  ).join('');

  preview.className = 'interview-preview has-results';
  preview.innerHTML = `<span class="preview-icon" aria-hidden="true">${interviewPeopleIcon()}</span><span class="preview-copy"><strong>${rows.length.toLocaleString()} student${rows.length === 1 ? '' : 's'} selected</strong><span>These students will be included in this interview schedule.</span><span class="preview-student-list">${students}</span></span>`;
}

function renderInterviewPreviewError(message) {
  const preview = document.getElementById('preview');
  preview.className = 'interview-preview has-error';
  preview.innerHTML = `<span class="preview-icon" aria-hidden="true">${interviewPeopleIcon()}</span><span class="preview-copy"><strong>Could not preview students</strong><span>${escapeInterviewHtml(message)}</span></span>`;
}

function interviewPeopleIcon() {
  return '<svg viewBox="0 0 24 24" fill="none"><path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm10 9v-1.5a3.5 3.5 0 0 0-2.5-3.35M16 3.15a4 4 0 0 1 0 7.7" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}

function interviewInitials(name) {
  return String(name || '').trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => part.charAt(0)).join('').toUpperCase() || '?';
}

function escapeInterviewHtml(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

async function scheduleBulkInterview(event) {
  event.preventDefault();
  const form = event.target;
  const submitButton = form.querySelector('[type="submit"]');

  if (!form.reportValidity()) return;

  const body = interviewBody();
  submitButton.disabled = true;

  try {
    const rows = await api('/interviews/preview', { method: 'POST', body });
    if (!Array.isArray(rows)) {
      throw new Error('The student preview response was not a list.');
    }
    const schedulableRows = await getSchedulableInterviewStudents(body, rows);
    if (!schedulableRows.length) {
      renderInterviewPreview(schedulableRows);
      toast('No matching students/applications found');
      return;
    }

    renderInterviewPreview(schedulableRows);
    if (!confirm('Schedule interview for ' + schedulableRows.length + ' student(s)?')) return;

    const result = await api('/interviews/bulk', { method: 'POST', body });
    toast(result.message || 'Interviews scheduled');
    form.reset();
    toggleInterviewTarget();
    document.getElementById('preview').className = 'interview-preview';
    document.getElementById('preview').innerHTML = '<span class="preview-icon" aria-hidden="true">' + interviewPeopleIcon() + '</span><span class="preview-copy"><strong>Student preview</strong><span>No students selected. Choose your target group and preview the invite list.</span></span>';
    await loadInterviews();
  } catch (error) {
    toast(error.message || 'Unable to schedule interviews.');
  } finally {
    submitButton.disabled = false;
  }
}
