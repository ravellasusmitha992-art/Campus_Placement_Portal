const INTERVIEW_STATUSES = ['SCHEDULED', 'ATTEMPTED', 'COMPLETED', 'CANCELLED'];

const interviewState = {
  records: [],
  loading: false
};

const interviewElements = {
  body: document.getElementById('interviewsBody'),
  search: document.getElementById('interviewSearch'),
  status: document.getElementById('interviewStatusFilter'),
  clear: document.getElementById('clearInterviewFilters'),
  resultCount: document.getElementById('interviewResultCount')
 };

interviewElements.search.addEventListener('input', renderInterviews);
interviewElements.status.addEventListener('change', renderInterviews);
interviewElements.clear.addEventListener('click', clearInterviewFilters);
interviewElements.body.addEventListener('change', event => {
  const select = event.target.closest('.interview-status-select');
  if (!select) return;
  updateInterviewStatus(Number(select.dataset.interviewId), select.value);
});

async function loadInterviews() {
  if (!requireRole('admin')) return;

  interviewState.loading = true;
  interviewElements.resultCount.textContent = 'Loading interviews…';
  renderInterviewMessage('Loading interviews…', true);

  try {
    const records = await api('/interviews');
    if (!Array.isArray(records)) {
      throw new Error('The interviews response was not a list.');
    }

    interviewState.records = records;
    interviewState.loading = false;
    updateInterviewSummary(records);
    renderInterviews();
  } catch (error) {
    interviewState.records = [];
    interviewState.loading = false;
    updateInterviewSummary([]);
    interviewElements.resultCount.textContent = 'Could not load interviews';
    renderInterviewMessage('Interviews could not be loaded. Please try again.', false, true);
    toast(error.message || 'Unable to load interviews.');
  }
}

function updateInterviewSummary(records) {
  const count = status => records.filter(interview =>
    String(interview.status || '').toUpperCase() === status
  ).length;

  document.getElementById('totalInterviews').textContent = records.length.toLocaleString();
  document.getElementById('scheduledInterviews').textContent = count('SCHEDULED').toLocaleString();
  document.getElementById('completedInterviews').textContent = count('COMPLETED').toLocaleString();
  document.getElementById('cancelledInterviews').textContent = count('CANCELLED').toLocaleString();
}

function clearInterviewFilters() {
  interviewElements.search.value = '';
  interviewElements.status.value = '';
  renderInterviews();
  interviewElements.search.focus();
}

function renderInterviews() {
  if (interviewState.loading) return;

  const query = interviewElements.search.value.trim().toLocaleLowerCase();
  const statusFilter = interviewElements.status.value;
  const records = interviewState.records.filter(interview => {
    const status = String(interview.status || '').toUpperCase();
    const searchable = [
      interview.student,
      interview.rollNumber,
      interview.company,
      interview.round
    ].join(' ').toLocaleLowerCase();
    return (!statusFilter || status === statusFilter)
      && (!query || searchable.includes(query));
  });

  interviewElements.resultCount.textContent = interviewState.records.length
    ? `Showing ${records.length.toLocaleString()} of ${interviewState.records.length.toLocaleString()} interviews`
    : 'No interviews yet';

  if (!records.length) {
    const hasFilters = Boolean(query || statusFilter);
    renderInterviewMessage(
      hasFilters ? 'No interviews match these filters.' : 'Scheduled interviews will appear here.',
      false
    );
    return;
  }

  interviewElements.body.innerHTML = records.map(renderInterviewRow).join('');
}

function renderInterviewRow(interview) {
  const student = String(interview.student || 'Unknown student');
  const company = String(interview.company || '—');
  const status = String(interview.status || '').toUpperCase();
  const id = Number(interview.id);
  const disabled = Number.isSafeInteger(id) ? '' : ' disabled';
  const rollNumber = interview.rollNumber
    ? `<small>${escapeInterviewValue(interview.rollNumber)}</small>`
    : '';
  const meetingLink = safeInterviewLink(interview.meetingLink);
  const detail = interview.venue
    ? `<span class="interview-type">${escapeInterviewValue(interview.type || '')} · ${escapeInterviewValue(interview.venue)}</span>`
    : (interview.type ? `<span class="interview-type">${escapeInterviewValue(interview.type)}</span>` : '');
  const meetingAnchor = meetingLink
    ? `<a class="interview-meeting-link" href="${escapeInterviewValue(meetingLink)}" target="_blank" rel="noopener noreferrer">Join meeting ↗</a>`
    : '';

  return `<tr>
    <td>
      <div class="interview-student">
        <span class="interview-student-avatar" aria-hidden="true">${escapeInterviewValue(interviewInitials(student))}</span>
        <span class="interview-student-identity"><strong>${escapeInterviewValue(student)}</strong>${rollNumber}</span>
      </div>
    </td>
    <td>
      <div class="interview-company">
        <span class="interview-company-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M4 20V8.5L12 4l8 4.5V20M2.5 20h19M9 20v-6h6v6M8 9h.01M12 9h.01M16 9h.01" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
        <strong>${escapeInterviewValue(company)}</strong>
      </div>
    </td>
    <td><span class="interview-round">${escapeInterviewValue(interview.round || '—')}</span></td>
    <td><span class="interview-date">${escapeInterviewValue(formatInterviewDate(interview.interviewDate))}</span>${detail}</td>
    <td><span class="interview-time">${escapeInterviewValue(interview.interviewTime || '—')}</span>${meetingAnchor}</td>
    <td>
      <div class="interview-status-control">
        <span class="interview-status interview-status--${interviewStatusClass(status)}">${escapeInterviewValue(status.replace(/_/g, ' '))}</span>
        <label class="visually-hidden" for="interview-status-${escapeInterviewValue(interview.id)}">Update status for ${escapeInterviewValue(student)}</label>
        <select class="interview-status-select" id="interview-status-${escapeInterviewValue(interview.id)}" data-interview-id="${escapeInterviewValue(interview.id)}" aria-label="Update status for ${escapeInterviewValue(student)}"${disabled}>
          ${INTERVIEW_STATUSES.map(value => `<option value="${value}"${status === value ? ' selected' : ''}>${formatInterviewStatus(value)}</option>`).join('')}
        </select>
      </div>
    </td>
  </tr>`;
}

function renderInterviewMessage(message, loading, error = false) {
  const stateClass = loading ? 'is-loading' : error ? 'is-error' : '';
  const content = loading
    ? `<span class="interview-spinner" aria-hidden="true"></span><span>${escapeInterviewValue(message)}</span>`
    : `<span class="interview-empty-icon" aria-hidden="true">${interviewCalendarIcon()}</span><strong>${error ? 'Unable to load interviews' : 'No interviews found'}</strong><span>${escapeInterviewValue(message)}</span>`;

  interviewElements.body.innerHTML = `<tr><td class="interview-table-message" colspan="6"><div class="interview-empty-state ${stateClass}">${content}</div></td></tr>`;
}

function interviewCalendarIcon() {
  return '<svg viewBox="0 0 24 24" fill="none"><rect x="3.5" y="5" width="17" height="16" rx="2.5" stroke="currentColor" stroke-width="1.7"/><path d="M7.5 3v4M16.5 3v4M3.5 9.5h17M8 13h3M8 16.5h6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>';
}

function interviewInitials(name) {
  return String(name || '').trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => part.charAt(0)).join('').toUpperCase() || '?';
}

function interviewStatusClass(status) {
  return {
    SCHEDULED: 'scheduled',
    ATTEMPTED: 'attempted',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  }[status] || 'default';
}

function formatInterviewStatus(status) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function formatInterviewDate(value) {
  if (!value) return '—';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
}

function safeInterviewLink(value) {
  if (!value) return '';
  try {
    const url = new URL(String(value), window.location.href);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : '';
  } catch (error) {
    return '';
  }
}

function escapeInterviewValue(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

async function updateInterviewStatus(id, value) {
  if (!Number.isSafeInteger(id) || id < 1 || !INTERVIEW_STATUSES.includes(value)) {
    toast('Unable to update this interview status.');
    return;
  }

  const select = interviewElements.body.querySelector(`[data-interview-id="${id}"]`);
  if (select) select.disabled = true;

  try {
    await api('/interviews/' + id + '/status?value=' + encodeURIComponent(value), { method: 'PUT' });
    toast('Interview status updated');
    await loadInterviews();
  } catch (error) {
    const interview = interviewState.records.find(record => Number(record.id) === id);
    if (select) {
      if (interview) select.value = String(interview.status || 'SCHEDULED').toUpperCase();
      select.disabled = false;
    }
    toast(error.message || 'Unable to update interview status.');
  }
}
