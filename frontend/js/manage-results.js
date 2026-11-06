const RESULTS_PER_PAGE = 10;

const publishedResultsState = {
  records: [],
  filtered: [],
  page: 1,
  loading: false,
  view: 'cards'
};

const publishedResultsElements = {
  body: document.getElementById('resultsBody'),
  search: document.getElementById('resultSearch'),
  company: document.getElementById('resultCompanyFilter'),
  department: document.getElementById('resultDepartmentFilter'),
  batch: document.getElementById('resultBatchFilter'),
  status: document.getElementById('resultStatusFilter'),
  sort: document.getElementById('resultSort'),
  clear: document.getElementById('clearResultFilters'),
  count: document.getElementById('resultsCount'),
  pagination: document.getElementById('resultsPagination'),
  paginationStatus: document.getElementById('resultsPaginationStatus'),
  previous: document.getElementById('previousResultsPage'),
  next: document.getElementById('nextResultsPage'),
  featured: document.getElementById('featuredResults'),
  tableCard: document.getElementById('resultsTableCard'),
  cardsView: document.getElementById('resultCardsView'),
  tableView: document.getElementById('resultTableView'),
  dialog: document.getElementById('resultDetailsDialog'),
  dialogContent: document.getElementById('resultDetailsContent')
};

publishedResultsElements.search.addEventListener('input', resetAndRenderPublishedResults);
publishedResultsElements.company.addEventListener('change', resetAndRenderPublishedResults);
publishedResultsElements.department.addEventListener('change', resetAndRenderPublishedResults);
publishedResultsElements.batch.addEventListener('change', resetAndRenderPublishedResults);
publishedResultsElements.status.addEventListener('change', resetAndRenderPublishedResults);
publishedResultsElements.sort.addEventListener('change', resetAndRenderPublishedResults);
publishedResultsElements.clear.addEventListener('click', clearPublishedResultFilters);
publishedResultsElements.previous.addEventListener('click', () => changePublishedResultPage(-1));
publishedResultsElements.next.addEventListener('click', () => changePublishedResultPage(1));
publishedResultsElements.body.addEventListener('click', event => {
  const button = event.target.closest('[data-result-details]');
  if (!button) return;
  showPublishedResultDetails(Number(button.dataset.resultDetails));
});
publishedResultsElements.body.addEventListener('error', event => {
  if (!event.target.matches('.result-company-logo')) return;
  event.target.hidden = true;
  if (event.target.nextElementSibling) event.target.nextElementSibling.hidden = false;
}, true);
publishedResultsElements.featured.addEventListener('error', event => {
  if (!event.target.matches('.result-card-company-logo')) return;
  event.target.hidden = true;
  if (event.target.nextElementSibling) event.target.nextElementSibling.hidden = false;
}, true);
publishedResultsElements.featured.addEventListener('click', event => {
  const button = event.target.closest('[data-result-details]');
  if (!button) return;
  showPublishedResultDetails(Number(button.dataset.resultDetails));
});
publishedResultsElements.cardsView.addEventListener('click', () => setPublishedResultView('cards'));
publishedResultsElements.tableView.addEventListener('click', () => setPublishedResultView('table'));
document.getElementById('exportResultsCsv').addEventListener('click', exportPublishedResultsCsv);
document.getElementById('downloadResultsPdf').addEventListener('click', downloadPublishedResultsPdf);
document.getElementById('closeResultDetails').addEventListener('click', () => publishedResultsElements.dialog.close());
publishedResultsElements.dialog.addEventListener('click', event => {
  if (event.target === publishedResultsElements.dialog) publishedResultsElements.dialog.close();
});

loadPublishedResults();

async function loadPublishedResults() {
  if (!requireRole('admin')) return;

  publishedResultsState.loading = true;
  publishedResultsElements.count.textContent = 'Loading results…';
  renderPublishedResultsMessage('Loading published results…', true);
  publishedResultsElements.featured.hidden = true;
  publishedResultsElements.tableCard.hidden = false;
  publishedResultsElements.pagination.hidden = true;

  try {
    const [results, students, companies] = await Promise.all([
      api('/results'),
      api('/students'),
      api('/companies')
    ]);

    if (!Array.isArray(results) || !Array.isArray(students) || !Array.isArray(companies)) {
      throw new Error('Published results data was not returned in the expected format.');
    }

    const studentById = new Map(students.map(student => [Number(student.id), student]));
    const logoByCompany = new Map(companies.map(company => [
      normalizeResultText(company.name),
      safeCompanyLogo(company.logo)
    ]));

    publishedResultsState.records = results.map(result => {
      const student = studentById.get(Number(result.studentId)) || {};
      return {
        ...result,
        student: result.student || student.name || 'Unknown student',
        rollNumber: student.rollNumber || '',
        department: student.department || '',
        batch: student.graduationYear == null ? '' : String(student.graduationYear),
        companyLogo: logoByCompany.get(normalizeResultText(result.company)) || '',
        normalizedStatus: normalizeResultStatus(result.status)
      };
    });
    publishedResultsState.loading = false;
    publishedResultsState.page = 1;
    populatePublishedResultFilters();
    updatePublishedResultSummary();
    renderPublishedResults();
  } catch (error) {
    publishedResultsState.records = [];
    publishedResultsState.filtered = [];
    publishedResultsState.loading = false;
    updatePublishedResultSummary();
    publishedResultsElements.count.textContent = 'Could not load results';
    renderPublishedResultsMessage('Published results could not be loaded. Please try again.', false, true);
    publishedResultsElements.featured.hidden = true;
    publishedResultsElements.tableCard.hidden = false;
    publishedResultsElements.pagination.hidden = true;
    toast(error.message || 'Unable to load published results.');
  }
}

function normalizeResultText(value) {
  return String(value || '').trim().toLocaleLowerCase();
}

function normalizeResultStatus(value) {
  const status = String(value || 'PENDING').trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (status === 'SELECTED') return 'SELECTED';
  if (status === 'NOT_SELECTED' || status === 'NOTSELECTED' || status === 'REJECTED') return 'NOT_SELECTED';
  if (status === 'SHORTLISTED' || status === 'SHORTLIST') return 'SHORTLISTED';
  if (status === 'PENDING' || status === 'UNDER_REVIEW' || status === 'APPLIED') return 'PENDING';
  return status || 'PENDING';
}

function safeCompanyLogo(value) {
  if (!value) return '';
  try {
    const url = new URL(String(value), window.location.href);
    if (url.protocol === 'http:' || url.protocol === 'https:') return url.href;
    if (url.protocol === 'data:' && /^data:image\//i.test(String(value))) return String(value);
  } catch (error) {
    return '';
  }
  return '';
}

function populatePublishedResultFilters() {
  setPublishedResultOptions(
    publishedResultsElements.company,
    'All companies',
    publishedResultsState.records.map(result => result.company)
  );
  setPublishedResultOptions(
    publishedResultsElements.department,
    'All departments',
    publishedResultsState.records.map(result => result.department)
  );
  setPublishedResultOptions(
    publishedResultsElements.batch,
    'All batches',
    publishedResultsState.records.map(result => result.batch)
  );
}

function setPublishedResultOptions(select, placeholder, values) {
  const selected = select.value;
  const unique = [...new Set(values.map(value => String(value || '').trim()).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' }));
  select.innerHTML = `<option value="">${placeholder}</option>` + unique.map(value =>
    `<option value="${escapeResultHtml(value)}">${escapeResultHtml(value)}</option>`
  ).join('');
  if (unique.includes(selected)) select.value = selected;
}

function updatePublishedResultSummary() {
  const records = publishedResultsState.records;
  const selected = records.filter(result => result.normalizedStatus === 'SELECTED');
  const companies = new Set(records.map(result => normalizeResultText(result.company)).filter(Boolean));
  const highest = records.reduce((maximum, result) => Math.max(maximum, finiteResultPackage(result.package)), 0);
  const students = new Set(records.map(result => String(result.studentId || result.student || '')).filter(Boolean));

  document.getElementById('totalResultStudents').textContent = students.size.toLocaleString();
  document.getElementById('totalSelectedResults').textContent = selected.length.toLocaleString();
  document.getElementById('totalResultCompanies').textContent = companies.size.toLocaleString();
  document.getElementById('highestResultPackage').textContent = records.length ? `${formatResultPackage(highest)} LPA` : '—';
}

function finiteResultPackage(value) {
  const packageValue = Number(value);
  return Number.isFinite(packageValue) ? packageValue : 0;
}

function resetAndRenderPublishedResults() {
  publishedResultsState.page = 1;
  renderPublishedResults();
}

function clearPublishedResultFilters() {
  publishedResultsElements.search.value = '';
  publishedResultsElements.company.value = '';
  publishedResultsElements.department.value = '';
  publishedResultsElements.batch.value = '';
  publishedResultsElements.status.value = '';
  publishedResultsElements.sort.value = 'package-desc';
  publishedResultsState.page = 1;
  renderPublishedResults();
  publishedResultsElements.search.focus();
}

function getFilteredPublishedResults() {
  const query = normalizeResultText(publishedResultsElements.search.value);
  const companyFilter = publishedResultsElements.company.value;
  const departmentFilter = publishedResultsElements.department.value;
  const batchFilter = publishedResultsElements.batch.value;
  const statusFilter = publishedResultsElements.status.value;
  const results = publishedResultsState.records.filter(result => {
    const searchable = [
      result.student,
      result.rollNumber,
      result.company
    ].map(normalizeResultText).join(' ');
    return (!query || searchable.includes(query))
      && (!companyFilter || result.company === companyFilter)
      && (!departmentFilter || result.department === departmentFilter)
      && (!batchFilter || result.batch === batchFilter)
      && (!statusFilter || result.normalizedStatus === statusFilter);
  });

  switch (publishedResultsElements.sort.value) {
    case 'package-asc':
      results.sort((left, right) => finiteResultPackage(left.package) - finiteResultPackage(right.package));
      break;
    case 'student-asc':
      results.sort((left, right) => String(left.student).localeCompare(String(right.student), undefined, { sensitivity: 'base' }));
      break;
    case 'company-asc':
      results.sort((left, right) => String(left.company).localeCompare(String(right.company), undefined, { sensitivity: 'base' }));
      break;
    default:
      results.sort((left, right) => finiteResultPackage(right.package) - finiteResultPackage(left.package));
  }
  return results;
}

function renderPublishedResults() {
  if (publishedResultsState.loading) return;

  const filtered = getFilteredPublishedResults();
  publishedResultsState.filtered = filtered;
  const pageCount = Math.max(1, Math.ceil(filtered.length / RESULTS_PER_PAGE));
  publishedResultsState.page = Math.min(publishedResultsState.page, pageCount);
  const start = (publishedResultsState.page - 1) * RESULTS_PER_PAGE;
  const pageResults = filtered.slice(start, start + RESULTS_PER_PAGE);
  const total = publishedResultsState.records.length;
  const hasFilters = Boolean(
    publishedResultsElements.search.value
    || publishedResultsElements.company.value
    || publishedResultsElements.department.value
    || publishedResultsElements.batch.value
    || publishedResultsElements.status.value
  );

  publishedResultsElements.count.textContent = total
    ? `Showing ${filtered.length.toLocaleString()} of ${total.toLocaleString()} results`
    : 'No results published';

  if (!filtered.length) {
    renderPublishedResultsMessage(
      hasFilters ? 'No results match the selected filters. Try adjusting your search.' : 'Published placement outcomes will appear here.',
      false
    );
    renderPublishedResultCards([]);
    setPublishedResultView(publishedResultsState.view);
    updatePublishedResultPagination(0, 0, pageCount);
    return;
  }

  publishedResultsElements.body.innerHTML = pageResults.map(renderPublishedResultRow).join('');
  renderPublishedResultCards(pageResults);
  setPublishedResultView(publishedResultsState.view);
  updatePublishedResultPagination(start, Math.min(start + RESULTS_PER_PAGE, filtered.length), pageCount);
}

function renderPublishedResultRow(result) {
  const companyLogo = result.companyLogo
    ? `<img class="result-company-logo" src="${escapeResultHtml(result.companyLogo)}" alt="" loading="lazy"><span class="result-company-fallback" aria-hidden="true" hidden>${escapeResultHtml(resultInitials(result.company))}</span>`
    : `<span class="result-company-fallback" aria-hidden="true">${escapeResultHtml(resultInitials(result.company))}</span>`;

  return `<tr>
    <td>
      <div class="result-student">
        <span class="result-avatar" aria-hidden="true">${escapeResultHtml(resultInitials(result.student))}</span>
        <span class="result-student-copy"><strong>${escapeResultHtml(result.student)}</strong><small>${escapeResultHtml(result.rollNumber || 'Roll number unavailable')}</small></span>
      </div>
    </td>
    <td>
      <div class="result-company">
        ${companyLogo}
        <span class="result-company-copy"><strong>${escapeResultHtml(result.company || '—')}</strong><small>${escapeResultHtml(result.joiningDate ? `Joining ${formatResultDate(result.joiningDate)}` : '')}</small></span>
      </div>
    </td>
    <td><span class="result-role">${escapeResultHtml(result.role || '—')}</span></td>
    <td><span class="result-department">${escapeResultHtml(result.department || '—')}</span></td>
    <td><span class="result-batch">${escapeResultHtml(result.batch || '—')}</span></td>
    <td><span class="result-package">${escapeResultHtml(formatResultPackage(result.package))} LPA</span></td>
    <td><span class="result-status result-status--${resultStatusClass(result.normalizedStatus)}">${escapeResultHtml(formatResultStatus(result.normalizedStatus))}</span></td>
    <td><button class="result-details-button" type="button" data-result-details="${escapeResultHtml(result.id)}">View details</button></td>
  </tr>`;
}

function renderPublishedResultCards(results) {
  if (!results.length) {
    const message = publishedResultsState.records.length
      ? 'No results match the selected filters. Try adjusting your search.'
      : 'Published placement outcomes will appear here.';
    publishedResultsElements.featured.innerHTML = `<div class="results-card-empty"><span class="results-empty-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M12 3 14.8 8.7l6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></span><strong>${publishedResultsState.records.length ? 'No matching results' : 'No published results yet'}</strong><span>${escapeResultHtml(message)}</span></div>`;
    publishedResultsElements.featured.hidden = publishedResultsState.view === 'table';
    return;
  }

  publishedResultsElements.featured.hidden = false;
  publishedResultsElements.featured.innerHTML = results.map(result => {
    const companyLogo = result.companyLogo
      ? `<img class="result-card-company-logo" src="${escapeResultHtml(result.companyLogo)}" alt="" loading="lazy"><span class="result-card-company-fallback" aria-hidden="true" hidden>${escapeResultHtml(resultInitials(result.company))}</span>`
      : `<span class="result-card-company-fallback" aria-hidden="true">${escapeResultHtml(resultInitials(result.company))}</span>`;
    return `<article class="published-result-card">
      <div class="published-result-card-top">
        <div class="result-card-company">${companyLogo}<span>${escapeResultHtml(result.company || '—')}</span></div>
        <span class="result-status result-status--${resultStatusClass(result.normalizedStatus)}">${escapeResultHtml(formatResultStatus(result.normalizedStatus))}</span>
      </div>
      <div class="published-result-student">
        <span class="result-card-avatar" aria-hidden="true">${escapeResultHtml(resultInitials(result.student))}</span>
        <span><strong>${escapeResultHtml(result.student)}</strong><small>${escapeResultHtml(result.rollNumber || 'Roll number unavailable')}</small></span>
      </div>
      <p class="published-result-role">${escapeResultHtml(result.role || '—')}</p>
      <div class="published-result-facts">
        <span><small>Package</small><strong class="result-card-package">${escapeResultHtml(formatResultPackage(result.package))} LPA</strong></span>
        <span><small>Department</small><strong>${escapeResultHtml(result.department || '—')}</strong></span>
        <span><small>Batch</small><strong>${escapeResultHtml(result.batch || '—')}</strong></span>
      </div>
      <button class="result-card-details" type="button" data-result-details="${escapeResultHtml(result.id)}">View details <span aria-hidden="true">→</span></button>
    </article>`;
  }).join('');
}

function setPublishedResultView(view) {
  publishedResultsState.view = view === 'table' ? 'table' : 'cards';
  const showTable = publishedResultsState.view === 'table';
  publishedResultsElements.featured.hidden = showTable;
  publishedResultsElements.tableCard.hidden = !showTable;
  publishedResultsElements.cardsView.classList.toggle('is-active', !showTable);
  publishedResultsElements.tableView.classList.toggle('is-active', showTable);
  publishedResultsElements.cardsView.setAttribute('aria-pressed', String(!showTable));
  publishedResultsElements.tableView.setAttribute('aria-pressed', String(showTable));
}

function updatePublishedResultPagination(start, end, pageCount) {
  const total = publishedResultsState.filtered.length;
  const visible = total > RESULTS_PER_PAGE;
  publishedResultsElements.pagination.hidden = !visible;
  publishedResultsElements.paginationStatus.textContent = total
    ? `Showing ${(start + 1).toLocaleString()}–${end.toLocaleString()} of ${total.toLocaleString()}`
    : 'No results to display';
  publishedResultsElements.previous.disabled = publishedResultsState.page <= 1;
  publishedResultsElements.next.disabled = publishedResultsState.page >= pageCount;
}

function changePublishedResultPage(offset) {
  const pageCount = Math.max(1, Math.ceil(publishedResultsState.filtered.length / RESULTS_PER_PAGE));
  const nextPage = publishedResultsState.page + offset;
  if (nextPage < 1 || nextPage > pageCount) return;
  publishedResultsState.page = nextPage;
  renderPublishedResults();
  document.getElementById('results-directory-title').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showPublishedResultDetails(id) {
  const result = publishedResultsState.records.find(item => Number(item.id) === id);
  if (!result) {
    toast('Result details are no longer available.');
    return;
  }

  const details = [
    ['Student', result.student],
    ['Roll Number', result.rollNumber || 'Not available'],
    ['Company', result.company || '—'],
    ['Job Role', result.role || '—'],
    ['Department', result.department || 'Not available'],
    ['Graduation Batch', result.batch || 'Not available'],
    ['Package', `${formatResultPackage(result.package)} LPA`],
    ['Selection Status', formatResultStatus(result.normalizedStatus)],
    ['Joining Date', result.joiningDate ? formatResultDate(result.joiningDate) : 'Not specified']
  ];

  publishedResultsElements.dialogContent.innerHTML = details.map(([label, value], index) =>
    `<div class="result-detail-item${index === 2 || index === 3 ? ' result-detail-item--wide' : ''}"><span>${escapeResultHtml(label)}</span><strong>${escapeResultHtml(value)}</strong></div>`
  ).join('');
  publishedResultsElements.dialog.showModal();
}

function resultStatusClass(status) {
  return {
    SELECTED: 'selected',
    NOT_SELECTED: 'not-selected',
    SHORTLISTED: 'shortlisted',
    PENDING: 'pending'
  }[status] || 'default';
}

function formatResultStatus(status) {
  return {
    SELECTED: 'Selected',
    NOT_SELECTED: 'Not Selected',
    SHORTLISTED: 'Shortlisted',
    PENDING: 'Pending'
  }[status] || String(status || 'Pending').replace(/_/g, ' ').toLowerCase().replace(/^./, first => first.toUpperCase());
}

function formatResultPackage(value) {
  const packageValue = Number(value);
  return Number.isFinite(packageValue) ? packageValue.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—';
}

function formatResultDate(value) {
  if (!value) return '—';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
}

function resultInitials(value) {
  return String(value || '').trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => part.charAt(0)).join('').toUpperCase() || '?';
}

function renderPublishedResultsMessage(message, loading, error = false) {
  const stateClass = loading ? 'is-loading' : error ? 'is-error' : '';
  const content = loading
    ? `<span class="results-spinner" aria-hidden="true"></span><span>${escapeResultHtml(message)}</span>`
    : `<span class="results-empty-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M12 3 14.8 8.7l6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></span><strong>${error ? 'Unable to load published results' : 'No published results yet'}</strong><span>${escapeResultHtml(message)}</span>`;
  publishedResultsElements.body.innerHTML = `<tr><td class="results-table-message" colspan="8"><div class="results-empty-state ${stateClass}">${content}</div></td></tr>`;
}

function escapeResultHtml(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function exportPublishedResultsCsv() {
  const rows = publishedResultsState.filtered;
  if (!rows.length) {
    toast('There are no results to export.');
    return;
  }
  const headings = ['Student', 'Roll Number', 'Company', 'Job Role', 'Department', 'Batch', 'Package (LPA)', 'Selection Status', 'Joining Date'];
  const lines = [headings, ...rows.map(result => [
    result.student,
    result.rollNumber,
    result.company,
    result.role,
    result.department,
    result.batch,
    result.package,
    formatResultStatus(result.normalizedStatus),
    result.joiningDate || ''
  ])].map(row => row.map(csvResultCell).join(','));
  const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'placement-results.csv';
  link.click();
  URL.revokeObjectURL(url);
}

function csvResultCell(value) {
  let text = String(value == null ? '' : value);
  if (/^[\s]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadPublishedResultsPdf() {
  const rows = publishedResultsState.filtered;
  if (!rows.length) {
    toast('There are no results to print.');
    return;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    toast('Allow pop-ups to print or save the results as a PDF.');
    return;
  }

  const body = rows.map(result => `<tr>
    <td>${escapeResultHtml(result.student)}</td>
    <td>${escapeResultHtml(result.rollNumber || '—')}</td>
    <td>${escapeResultHtml(result.company || '—')}</td>
    <td>${escapeResultHtml(result.role || '—')}</td>
    <td>${escapeResultHtml(result.department || '—')}</td>
    <td>${escapeResultHtml(result.batch || '—')}</td>
    <td>${escapeResultHtml(formatResultPackage(result.package))} LPA</td>
    <td>${escapeResultHtml(formatResultStatus(result.normalizedStatus))}</td>
  </tr>`).join('');

  printWindow.document.write(`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Placement Results</title><style>
    body{font:13px Arial,sans-serif;color:#1d2b45;margin:28px}
    h1{font-size:23px;margin:0 0 5px}
    p{color:#667085;margin:0 0 20px}
    table{width:100%;border-collapse:collapse}
    th{background:#18335f;color:#fff;text-align:left;font-size:10px;letter-spacing:.06em;text-transform:uppercase}
    th,td{padding:9px 8px;border:1px solid #dfe5ef}
    tr{break-inside:avoid}
    @media print{body{margin:12mm}th{print-color-adjust:exact;-webkit-print-color-adjust:exact}}
  </style></head><body><h1>Published Placement Results</h1><p>${rows.length} placement result${rows.length === 1 ? '' : 's'} · Generated ${escapeResultHtml(new Date().toLocaleDateString())}</p><table><thead><tr><th>Student</th><th>Roll Number</th><th>Company</th><th>Job Role</th><th>Department</th><th>Batch</th><th>Package</th><th>Status</th></tr></thead><tbody>${body}</tbody></table><script>window.onload=()=>window.print();</script></body></html>`);
  printWindow.document.close();
}
