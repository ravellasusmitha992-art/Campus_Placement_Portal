 const companyState = {
  records: [],
  editingId: null,
  loading: false
};

const companyElements = {
  form: document.getElementById('companyForm'),
  list: document.getElementById('companiesList'),
  search: document.getElementById('companySearch'),
  industry: document.getElementById('industryFilter'),
  location: document.getElementById('locationFilter'),
  clearFilters: document.getElementById('clearCompanyFilters'),
  resultCount: document.getElementById('companyResultCount'),
  submit: document.getElementById('companySubmit'),
  submitText: document.querySelector('#companySubmit span'),
  cancelEdit: document.getElementById('cancelEdit'),
  feedback: document.getElementById('companyFormFeedback'),
  detailsDialog: document.getElementById('companyDetailsDialog'),
  detailsTitle: document.getElementById('detailsTitle'),
  detailsContent: document.getElementById('companyDetailsContent')
};

document.getElementById('logoutButton').addEventListener('click', logout);
companyElements.form.addEventListener('submit', submitCompanyForm);
companyElements.form.addEventListener('input', handleCompanyFieldInput);
companyElements.search.addEventListener('input', renderCompanies);
companyElements.industry.addEventListener('change', renderCompanies);
companyElements.location.addEventListener('change', renderCompanies);
companyElements.clearFilters.addEventListener('click', clearCompanyFilters);
companyElements.cancelEdit.addEventListener('click', resetCompanyForm);
companyElements.list.addEventListener('click', handleCompanyAction);
document.getElementById('closeDetails').addEventListener('click', closeCompanyDetails);
document.getElementById('closeDetailsFooter').addEventListener('click', closeCompanyDetails);
companyElements.detailsDialog.addEventListener('click', event => {
  if (event.target === companyElements.detailsDialog) closeCompanyDetails();
});

loadCompanies();

async function loadCompanies() {
  if (!requireRole('admin')) return;

  companyState.loading = true;
  companyElements.resultCount.textContent = 'Loading companies…';
  renderCompanyState('Loading company records…');
  setCompanyStatistics(null);

  try {
    const records = await api('/companies');
    if (!Array.isArray(records)) {
      throw new Error('The companies response was not a list.');
    }

    companyState.records = records;
    companyState.loading = false;
    populateCompanyFilters(records);
    setCompanyStatistics(records);
    renderCompanies();
  } catch (error) {
    companyState.loading = false;
    companyState.records = [];
    companyElements.resultCount.textContent = 'Could not load companies';
    renderCompanyState(error.message || 'Company records could not be loaded.', true, true);
    toast(error.message || 'Unable to load company records.');
  }
}

function setCompanyStatistics(records) {
  const statistics = {
    totalCompanies: '—',
    totalJobRoles: '—',
    totalIndustries: '—',
    averagePackage: '—'
  };

  if (records) {
    const roles = records.filter(company => normalizeText(company.jobRole)).length;
    const industries = new Set(records.map(company => normalizeText(company.industry)).filter(Boolean));
    const packages = records.map(company => finiteNumber(company.salaryPackage)).filter(value => value !== null);
    const average = packages.length
      ? packages.reduce((sum, value) => sum + value, 0) / packages.length
      : null;

    statistics.totalCompanies = records.length.toLocaleString();
    statistics.totalJobRoles = roles.toLocaleString();
    statistics.totalIndustries = industries.size.toLocaleString();
    statistics.averagePackage = average === null ? '—' : average.toFixed(2);
  }

  Object.entries(statistics).forEach(([id, value]) => {
    document.getElementById(id).textContent = value;
  });
}

async function submitCompanyForm(event) {
  event.preventDefault();
  clearCompanyValidation();
  setCompanyFormFeedback('');

  const formData = new FormData(companyElements.form);
  const payload = Object.fromEntries(formData.entries());
  for (const key of ['name', 'industry', 'jobRole', 'jobLocation', 'website', 'description', 'jobDescription', 'requiredSkills']) {
    payload[key] = String(payload[key] || '').trim();
  }

  const salaryPackage = finiteNumber(payload.salaryPackage);
  let valid = true;
  for (const [field, label] of [
    ['name', 'Company name'],
    ['industry', 'Industry'],
    ['jobRole', 'Job role'],
    ['jobLocation', 'Location']
  ]) {
    if (!payload[field]) {
      setCompanyFieldError(field, `${label} is required.`);
      valid = false;
    }
  }
  if (salaryPackage === null || salaryPackage < 0) {
    setCompanyFieldError('salaryPackage', 'Enter a valid package of 0 or greater.');
    valid = false;
  } else {
    payload.salaryPackage = salaryPackage;
  }
  if (payload.website && !safeWebsiteUrl(payload.website)) {
    setCompanyFieldError('website', 'Enter a valid website URL (http or https).');
    valid = false;
  }
  if (!valid) {
    setCompanyFormFeedback('Please correct the highlighted fields.', 'error');
    companyElements.form.querySelector('[aria-invalid="true"]')?.focus();
    return;
  }

  setCompanyFormBusy(true);
  try {
    if (companyState.editingId === null) {
      await api('/companies', { method: 'POST', body: payload });
      setCompanyFormFeedback('Company created successfully.');
      toast('Company created successfully.');
    } else {
      await api(`/companies/${encodeURIComponent(companyState.editingId)}`, { method: 'PUT', body: payload });
      setCompanyFormFeedback('Company updated successfully.');
      toast('Company updated successfully.');
    }
    resetCompanyForm(false);
    await loadCompanies();
  } catch (error) {
    setCompanyFormFeedback(error.message || 'Unable to save company.', 'error');
    toast(error.message || 'Unable to save company.');
  } finally {
    setCompanyFormBusy(false);
  }
}

function handleCompanyFieldInput(event) {
  const field = event.target;
  if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) return;
  field.removeAttribute('aria-invalid');
  const error = document.getElementById(`${field.name}Error`);
  if (error) error.textContent = '';
  if (companyElements.feedback.dataset.state === 'error') setCompanyFormFeedback('');
}

function clearCompanyValidation() {
  companyElements.form.querySelectorAll('[aria-invalid="true"]').forEach(field => field.removeAttribute('aria-invalid'));
  companyElements.form.querySelectorAll('.company-field-error').forEach(error => {
    error.textContent = '';
  });
}

function setCompanyFieldError(name, message) {
  const field = companyElements.form.elements.namedItem(name);
  const error = document.getElementById(`${name}Error`);
  if (field) field.setAttribute('aria-invalid', 'true');
  if (error) error.textContent = message;
}

function setCompanyFormFeedback(message, state = 'success') {
  companyElements.feedback.textContent = message;
  if (message) {
    companyElements.feedback.dataset.state = state;
  } else {
    delete companyElements.feedback.dataset.state;
  }
}

function setCompanyFormBusy(isBusy) {
  companyElements.submit.disabled = isBusy;
  companyElements.submitText.textContent = isBusy
    ? 'Saving…'
    : companyState.editingId === null
      ? 'Create Company'
      : 'Save Changes';
}

function resetCompanyForm(clearFeedback = true) {
  companyElements.form.reset();
  clearCompanyValidation();
  companyState.editingId = null;
  document.getElementById('companyFormTitle').textContent = 'Add New Company';
  document.getElementById('companyFormSubtitle').textContent =
    'Add a placement partner and the opportunity details students need.';
  companyElements.submitText.textContent = 'Create Company';
  companyElements.cancelEdit.hidden = true;
  if (clearFeedback) setCompanyFormFeedback('');
}

function populateCompanyFilters(records) {
  const selectedIndustry = companyElements.industry.value;
  const selectedLocation = companyElements.location.value;
  populateSelect(companyElements.industry, 'All industries', records.map(company => company.industry));
  populateSelect(companyElements.location, 'All locations', records.map(company => company.jobLocation));
  if ([...companyElements.industry.options].some(option => option.value === selectedIndustry)) {
    companyElements.industry.value = selectedIndustry;
  }
  if ([...companyElements.location.options].some(option => option.value === selectedLocation)) {
    companyElements.location.value = selectedLocation;
  }
}

function populateSelect(select, defaultLabel, values) {
  const uniqueValues = new Map();
  values.map(value => String(value || '').trim()).filter(Boolean).forEach(value => {
    const key = normalizeText(value);
    if (!uniqueValues.has(key)) uniqueValues.set(key, value);
  });

  select.replaceChildren(new Option(defaultLabel, ''));
  [...uniqueValues.values()]
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
    .forEach(value => select.add(new Option(value, value)));
}

function getFilteredCompanies() {
  const query = companyElements.search.value.trim().toLocaleLowerCase();
  const industry = normalizeText(companyElements.industry.value);
  const location = normalizeText(companyElements.location.value);

  return companyState.records.filter(company => {
    const matchesName = !query || String(company.name || '').toLocaleLowerCase().includes(query);
    const matchesIndustry = !industry || normalizeText(company.industry) === industry;
    const matchesLocation = !location || normalizeText(company.jobLocation) === location;
    return matchesName && matchesIndustry && matchesLocation;
  });
}

function clearCompanyFilters() {
  companyElements.search.value = '';
  companyElements.industry.value = '';
  companyElements.location.value = '';
  renderCompanies();
  companyElements.search.focus();
}

function renderCompanies() {
  if (companyState.loading) return;

  const companies = getFilteredCompanies();
  companyElements.resultCount.textContent = `${companies.length.toLocaleString()} ${companies.length === 1 ? 'company' : 'companies'
    }`;

  if (companies.length === 0) {
    renderCompanyState(
      companyState.records.length ? 'No companies match your filters.' : 'No company records yet.',
      false,
      false,
      companyState.records.length > 0
    );
    return;
  }

  companyElements.list.replaceChildren(...companies.map(createCompanyCard));
}

function createCompanyCard(company) {
  const card = document.createElement('article');
  card.className = 'company-card';

  const top = document.createElement('div');
  top.className = 'company-card-top';
  const identity = document.createElement('div');
  identity.className = 'company-card-identity';
  const avatar = document.createElement('span');
  avatar.className = 'company-avatar';
  avatar.setAttribute('aria-hidden', 'true');
  avatar.textContent = companyInitials(company.name);
  const titleGroup = document.createElement('div');
  titleGroup.className = 'company-card-title-group';
  const name = document.createElement('h3');
  name.textContent = company.name || 'Company name unavailable';
  const industry = document.createElement('span');
  industry.className = 'company-industry-badge';
  industry.textContent = company.industry || 'Industry not specified';
  titleGroup.append(name, industry);
  identity.append(avatar, titleGroup);

  const packageBadge = document.createElement('span');
  packageBadge.className = 'company-package-badge';
  const packageValue = finiteNumber(company.salaryPackage);
  packageBadge.textContent = packageValue === null ? 'Package N/A' : `${packageValue.toFixed(1)} LPA`;
  top.append(identity, packageBadge);

  const role = document.createElement('p');
  role.className = 'company-card-role';
  role.textContent = company.jobRole || 'Role not specified';

  const location = document.createElement('p');
  location.className = 'company-card-location';
  location.append(createLocationIcon());
  const locationText = document.createElement('span');
  locationText.textContent = company.jobLocation || 'Location not specified';
  location.append(locationText);

  card.append(top, role, location);
  if (company.description) {
    const description = document.createElement('p');
    description.className = 'company-card-description';
    description.textContent = company.description;
    card.append(description);
  }

  const skills = parseSkills(company.requiredSkills);
  if (skills.length) {
    const skillList = document.createElement('div');
    skillList.className = 'company-skills';
    skills.forEach(skill => {
      const badge = document.createElement('span');
      badge.className = 'company-skill';
      badge.textContent = skill;
      skillList.append(badge);
    });
    card.append(skillList);
  }

  const footer = document.createElement('div');
  footer.className = 'company-card-footer';
  const website = createWebsiteLink(company.website);
  if (website) {
    footer.append(website);
  } else {
    const noWebsite = document.createElement('span');
    noWebsite.className = 'company-website';
    noWebsite.textContent = 'Website not provided';
    footer.append(noWebsite);
  }

  const actions = document.createElement('div');
  actions.className = 'company-actions';
  actions.append(
    createActionButton('View', 'view', company.id),
    createActionButton('Edit', 'edit', company.id),
    createActionButton('Delete', 'delete', company.id, true)
  );
  footer.append(actions);
  card.append(footer);
  return card;
}

function createActionButton(label, action, id, destructive = false) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `company-action${destructive ? ' company-action--delete' : ''}`;
  button.dataset.action = action;
  button.dataset.companyId = id;
  button.textContent = label;
  button.setAttribute('aria-label', `${label} ${companyNameById(id)}`);
  return button;
}

function createLocationIcon() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z');
  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('cx', '12');
  circle.setAttribute('cy', '10');
  circle.setAttribute('r', '2.5');
  svg.append(path, circle);
  return svg;
}

function createWebsiteLink(value) {
  const url = safeWebsiteUrl(value);
  if (!url) return null;

  const link = document.createElement('a');
  link.className = 'company-website';
  link.href = url.href;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = url.hostname;
  link.setAttribute('aria-label', `Visit ${url.hostname}`);
  return link;
}

function safeWebsiteUrl(value) {
  if (!value) return null;
  try {
    const input = /^[a-z][a-z\d+.-]*:\/\//i.test(value) ? value : `https://${value}`;
    const url = new URL(input);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url : null;
  } catch {
    return null;
  }
}

function handleCompanyAction(event) {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const company = companyState.records.find(record => String(record.id) === button.dataset.companyId);
  if (!company) {
    toast('Company record could not be found. Refresh the directory and try again.');
    return;
  }

  if (button.dataset.action === 'view') showCompanyDetails(company);
  if (button.dataset.action === 'edit') editCompany(company);
  if (button.dataset.action === 'delete') deleteCompany(company);
}

function showCompanyDetails(company) {
  companyElements.detailsTitle.textContent = company.name || 'Company details';
  companyElements.detailsContent.replaceChildren();

  const fields = [
    ['Industry', company.industry],
    ['Job role', company.jobRole],
    ['Location', company.jobLocation],
    ['Package', finiteNumber(company.salaryPackage) === null ? '' : `${finiteNumber(company.salaryPackage).toFixed(1)} LPA`],
    ['Website', company.website],
    ['Description', company.description],
    ['Job description', company.jobDescription],
    ['Required skills', parseSkills(company.requiredSkills).join(', ')]
  ];

  fields.filter(([, value]) => value).forEach(([label, value]) => {
    const detail = document.createElement('p');
    detail.className = 'company-detail';
    const detailLabel = document.createElement('span');
    detailLabel.className = 'company-detail-label';
    detailLabel.textContent = label;
    const detailValue = document.createElement('span');
    detailValue.className = 'company-detail-value';
    if (label === 'Website' && safeWebsiteUrl(value)) {
      const link = createWebsiteLink(value);
      detailValue.append(link);
    } else {
      detailValue.textContent = value;
    }
    detail.append(detailLabel, detailValue);
    companyElements.detailsContent.append(detail);
  });

  companyElements.detailsDialog.showModal();
}

function closeCompanyDetails() {
  if (companyElements.detailsDialog.open) companyElements.detailsDialog.close();
}

function editCompany(company) {
  companyState.editingId = company.id;
  for (const key of ['name', 'industry', 'jobRole', 'jobLocation', 'salaryPackage', 'website', 'description', 'jobDescription', 'requiredSkills']) {
    const field = companyElements.form.elements.namedItem(key);
    if (field) field.value = company[key] == null ? '' : company[key];
  }
  clearCompanyValidation();
  setCompanyFormFeedback('');
  document.getElementById('companyFormTitle').textContent = 'Edit Company';
  document.getElementById('companyFormSubtitle').textContent = `Update company information for ${company.name || 'this company'}.`;
  companyElements.submitText.textContent = 'Save Changes';
  companyElements.cancelEdit.hidden = false;
  companyElements.form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  companyElements.form.elements.namedItem('name')?.focus({ preventScroll: true });
}

async function deleteCompany(company) {
  const confirmed = window.confirm(`Delete ${company.name || 'this company'}? This action cannot be undone.`);
  if (!confirmed) return;

  try {
    await api(`/companies/${encodeURIComponent(company.id)}`, { method: 'DELETE' });
    toast('Company deleted successfully.');
    if (String(companyState.editingId) === String(company.id)) resetCompanyForm();
    await loadCompanies();
  } catch (error) {
    toast(error.message || 'Unable to delete company.');
  }
}

function renderCompanyState(message, isError = false, canRetry = false, canClear = false) {
  const state = document.createElement('div');
  state.className = `company-state${isError ? ' company-state-error' : ''}`;
  const title = document.createElement('span');
  title.className = 'company-state-title';
  title.textContent = isError ? 'Company records could not be loaded' : message;
  state.append(title);

  if (isError) {
    const detail = document.createElement('span');
    detail.textContent = message;
    state.append(detail);
  } else if (companyState.records.length === 0 && !companyState.loading) {
    const description = document.createElement('span');
    description.textContent = 'Add a company above to build your directory.';
    state.append(description);
  }

  if (canRetry) state.append(createStateButton('Try again', loadCompanies));
  if (canClear) state.append(createStateButton('Clear filters', clearCompanyFilters));
  companyElements.list.replaceChildren(state);
}

function createStateButton(label, action) {
  const button = document.createElement('button');
  button.className = 'btn secondary';
  button.type = 'button';
  button.style.marginTop = '12px';
  button.textContent = label;
  button.addEventListener('click', action);
  return button;
}

function parseSkills(value) {
  return String(value || '').split(',').map(skill => skill.trim()).filter(Boolean);
}

function companyInitials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'CO';
  return parts.length === 1 ? parts[0].slice(0, 2) : `${parts[0][0]}${parts[parts.length - 1][0]}`;
}

function companyNameById(id) {
  return companyState.records.find(company => String(company.id) === String(id))?.name || 'company';
}

function finiteNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeText(value) {
  return String(value || '').trim().toLocaleLowerCase();
}
