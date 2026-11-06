 const APPLICATION_STATUSES = [
  ['APPLIED', 'Applied'],
  ['UNDER_REVIEW', 'Under review'],
  ['SHORTLISTED', 'Shortlisted'],
  ['INTERVIEW_SCHEDULED', 'Interview scheduled'],
  ['INTERVIEW_NOT_SCHEDULED', 'Interview not scheduled'],
  ['REJECTED', 'Rejected'],
  ['SELECTED', 'Selected']
];

const applicationState = {
  records: [],
  loading: false
};

const applicationElements = {
  body: document.getElementById('applicationsBody'),
  search: document.getElementById('applicationSearch'),
  status: document.getElementById('applicationStatusFilter'),
  dateSort: document.getElementById('applicationDateSort'),
  clear: document.getElementById('clearApplicationFilters'),
  resultCount: document.getElementById('applicationResultCount')
};

applicationElements.search.addEventListener('input', renderApplications);
applicationElements.status.addEventListener('change', renderApplications);
applicationElements.dateSort.addEventListener('change', renderApplications);
applicationElements.clear.addEventListener('click', clearApplicationFilters);
applicationElements.body.addEventListener('change', event => {
  const select = event.target.closest('.application-status-select');
  if (!select) return;
  updateApp(Number(select.dataset.applicationId), select.value);
});

loadApplications();

async function loadApplications() {
  if (!requireRole('admin')) return;

  applicationState.loading = true;
  applicationElements.resultCount.textContent = 'Loading applications…';
  renderApplicationMessage('Loading applications…', true);

  try {
    const records = await api('/applications');
    if (!Array.isArray(records)) {
      throw new Error('The applications response was not a list.');
    }

    applicationState.records = records;
    applicationState.loading = false;
    updateApplicationSummary(records);
    renderApplications();
  } catch (error) {
    applicationState.records = [];
    applicationState.loading = false;
    updateApplicationSummary([]);
    applicationElements.resultCount.textContent = 'Could not load applications';
    renderApplicationMessage('Applications could not be loaded. Please try again.', false, true);
    toast(error.message || 'Unable to load applications.');
  }
}

function updateApplicationSummary(records) {
  const count = status => records.filter(application =>
    String(application.status || '').toUpperCase() === status
  ).length;

  document.getElementById('totalApplications').textContent = records.length.toLocaleString();
  document.getElementById('appliedApplications').textContent = count('APPLIED').toLocaleString();
  document.getElementById('shortlistedApplications').textContent = count('SHORTLISTED').toLocaleString();
  document.getElementById('interviewApplications').textContent = count('INTERVIEW_SCHEDULED').toLocaleString();
  document.getElementById('selectedApplications').textContent = count('SELECTED').toLocaleString();
}

function clearApplicationFilters() {
  applicationElements.search.value = '';
  applicationElements.status.value = '';
  applicationElements.dateSort.value = 'newest';
  renderApplications();
  applicationElements.search.focus();
}

function renderApplications() {
  if (applicationState.loading) return;

  const query = applicationElements.search.value.trim().toLocaleLowerCase();
  const statusFilter = applicationElements.status.value;
  const direction = applicationElements.dateSort.value === 'oldest' ? 1 : -1;
  const records = applicationState.records
    .filter(application => {
      const status = String(application.status || '').toUpperCase();
      const student = String(application.student || '').toLocaleLowerCase();
      const company = String(application.company || '').toLocaleLowerCase();
      return (!statusFilter || status === statusFilter)
        && (!query || student.includes(query) || company.includes(query));
    })
    .sort((left, right) => direction * (applicationTimestamp(left) - applicationTimestamp(right)));

  applicationElements.resultCount.textContent = applicationState.records.length
    ? `Showing ${records.length.toLocaleString()} of ${applicationState.records.length.toLocaleString()} applications`
    : 'No applications yet';

  if (!records.length) {
    const hasFilters = Boolean(query || statusFilter);
    renderApplicationMessage(
      hasFilters ? 'No applications match these filters.' : 'Applications will appear here when students apply.',
      false
    );
    return;
  }

  applicationElements.body.innerHTML = records.map(renderApplicationRow).join('');
}

function renderApplicationRow(application) {
  const student = String(application.student || 'Unknown student');
  const company = String(application.company || '—');
  const role = String(application.role || '—');
  const status = String(application.status || 'APPLIED').toUpperCase();
  const id = Number(application.id);
  const disabled = Number.isSafeInteger(id) ? '' : ' disabled';
  const rollNumber = application.rollNumber
    ? `<span class="student-roll">${escapeHtml(application.rollNumber)}</span>`
    : '';
  const companyLink = safeApplicationLink(application.applicationLink);
  const registrationDetails = formatRegistrationDetails(application.registrationDetails);
  const link = companyLink
    ? `<a class="company-registration-link" href="${escapeHtml(companyLink)}" target="_blank" rel="noopener noreferrer">Company registration <span aria-hidden="true">↗</span></a>`
    : '';

  return `<tr>
    <td>
      <div class="application-student">
        <span class="student-avatar" aria-hidden="true">${escapeHtml(getInitials(student))}</span>
        <span class="student-identity"><strong>${escapeHtml(student)}</strong>${rollNumber}</span>
      </div>
    </td>
    <td>
      <div class="application-company">
        <span class="company-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M4 20V8.5L12 4l8 4.5V20M2.5 20h19M9 20v-6h6v6M8 9h.01M12 9h.01M16 9h.01" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
        <strong>${escapeHtml(company)}</strong>
      </div>
    </td>
    <td><span class="application-role">${escapeHtml(role)}</span></td>
    <td><span class="application-date">${escapeHtml(formatApplicationDate(application.appliedDate))}</span></td>
    <td>
      <div class="application-details">
        ${registrationDetails ? `<span class="registration-details">${registrationDetails}</span>` : '<span class="details-empty">No extra details</span>'}
        ${link}
      </div>
    </td>
    <td><span class="application-status application-status--${statusClass(status)}">${escapeHtml(status.replace(/_/g, ' '))}</span></td>
    <td>
      <label class="visually-hidden" for="application-status-${escapeHtml(application.id)}">Update status for ${escapeHtml(student)}</label>
      <select class="application-status-select" id="application-status-${escapeHtml(application.id)}" data-application-id="${escapeHtml(application.id)}" aria-label="Update status for ${escapeHtml(student)}"${disabled}>
        ${APPLICATION_STATUSES.map(([value, label]) => `<option value="${value}"${status === value ? ' selected' : ''}>${label}</option>`).join('')}
      </select>
    </td>
  </tr>`;
}

function formatRegistrationDetails(details) {
  if (details === null || details === undefined || details === '') return '';

  let value = details;
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch (error) {
      return escapeHtml(value);
    }
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    const entries = Object.entries(value).filter(([, entryValue]) =>
      entryValue !== null && entryValue !== undefined && String(entryValue).trim() !== ''
    );
    if (!entries.length) return '';
    return entries.map(([key, entryValue]) =>
      `<span><b>${escapeHtml(formatDetailLabel(key))}:</b> ${escapeHtml(String(entryValue))}</span>`
    ).join('');
  }

  return escapeHtml(Array.isArray(value) ? value.join(', ') : String(value));
}

function formatDetailLabel(value) {
  return String(value)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/^./, first => first.toUpperCase());
}

function safeApplicationLink(value) {
  if (!value) return '';
  try {
    const url = new URL(String(value), window.location.href);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : '';
  } catch (error) {
    return '';
  }
}

function getInitials(name) {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map(part => part.charAt(0)).join('').toUpperCase() || '?';
}

function formatApplicationDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
}

function applicationTimestamp(application) {
  const timestamp = new Date(application.appliedDate || '').getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function statusClass(status) {
  return {
    APPLIED: 'blue',
    UNDER_REVIEW: 'orange',
    SHORTLISTED: 'green',
    REJECTED: 'red',
    INTERVIEW_SCHEDULED: 'purple',
    INTERVIEW_NOT_SCHEDULED: 'gray',
    SELECTED: 'emerald'
  }[status] || 'gray';
}

function renderApplicationMessage(message, loading, error = false) {
  const stateClass = loading ? 'is-loading' : error ? 'is-error' : '';
  const content = loading
    ? `<span class="application-spinner" aria-hidden="true"></span><span>${escapeHtml(message)}</span>`
    : `<span class="application-empty-icon" aria-hidden="true">
         <svg viewBox="0 0 24 24" fill="none">
           <path d="M7 3.75h7l4 4V20a.75.75 0 0 1-.75.75h-10.5A.75.75 0 0 1 6 20V4.5a.75.75 0 0 1 .75-.75Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>
           <path d="M14 4v4h4M9 12h6M9 15.5h6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
         </svg>
       </span><strong>${escapeHtml(error ? 'Unable to load applications' : 'No applications found')}</strong><span>${escapeHtml(message)}</span>`;

  applicationElements.body.innerHTML = `<tr><td class="application-table-message ${stateClass}" colspan="7"><div class="application-empty-state">${content}</div></td></tr>`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

async function updateApp(id, value) {
  if (!Number.isSafeInteger(id) || id < 1) {
    toast('Unable to update this application.');
    return;
  }

  const select = applicationElements.body.querySelector(`[data-application-id="${id}"]`);
  if (select) select.disabled = true;

  try {
    await api('/applications/' + id + '/status?value=' + encodeURIComponent(value), { method: 'PUT' });
    toast('Application updated');
    await loadApplications();
  } catch (error) {
    const application = applicationState.records.find(record => Number(record.id) === id);
    if (select) {
      if (application) select.value = String(application.status || 'APPLIED').toUpperCase();
      select.disabled = false;
    }
    toast(error.message || 'Unable to update application status.');
  }
}
