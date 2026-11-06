let recruitingCompanies = [];

async function loadCompanies() {
    const user = requireRole('student');
    if (!user) return;
    setStudentIdentity(user);
    refreshStudentNotificationBell(user);
    const element = document.getElementById('companies');
    if (!element) return;
    try {
        recruitingCompanies = await api('/companies');
        renderCompanies();
        const search = document.getElementById('companySearch');
        if (search) search.addEventListener('input', renderCompanies);
    } catch (error) {
        toast(error.message);
        element.innerHTML = '<div class="student-empty-state"><strong>Company information is temporarily unavailable</strong>Please refresh the page to try again.</div>';
      }
}

function renderCompanies() {
    const element = document.getElementById('companies');
    if (!element) return;
    const query = (document.getElementById('companySearch')?.value || '').trim().toLowerCase();
    const rows = recruitingCompanies.filter(company =>
        [company.name, company.industry, company.jobRole, company.jobLocation, company.requiredSkills].join(' ').toLowerCase().includes(query));
    element.innerHTML = rows.length ? rows.map(company => {
        const logoUrl = safeStudentUrl(company.logo);
        const logo = logoUrl && logoUrl !== '#'
            ? '<img class="student-company-logo" src="' + logoUrl + '" alt="' + escapeStudentHtml(company.name) + ' logo" loading="lazy">'
            : '<span class="student-company-mark" aria-hidden="true">' + escapeStudentHtml(initials(company.name)) + '</span>';
        const website = safeStudentUrl(company.website);
        return '<article class="card student-job-card">' + logo +
            '<h2 class="student-card-title">' + escapeStudentHtml(company.name) + '</h2>' +
            '<p class="student-card-meta">' + escapeStudentHtml(company.industry || 'Recruiting partner') + (company.jobLocation ? ' · ' + escapeStudentHtml(company.jobLocation) : '') + '</p>' +
            (company.description ? '<p class="student-card-body">' + escapeStudentHtml(company.description) + '</p>' : '') +
            ((company.jobRole || company.salaryPackage != null) ? '<p><strong>' + escapeStudentHtml(company.jobRole || 'Current opportunities') + '</strong>' + (company.salaryPackage != null ? ' · ' + escapeStudentHtml(company.salaryPackage) + ' LPA' : '') + '</p>' : '') +
            (company.requiredSkills ? '<div class="student-chip-row">' + String(company.requiredSkills).split(/[,;|]/).map(skill => skill.trim()).filter(Boolean).slice(0, 6).map(skill => '<span class="student-chip">' + escapeStudentHtml(skill) + '</span>').join('') + '</div>' : '') +
            (website && website !== '#' ? '<div class="student-card-bottom"><a class="btn secondary" href="' + website + '" target="_blank" rel="noopener noreferrer">Visit website</a></div>' : '') +
            '</article>';
    }).join('') : '<div class="student-empty-state"><strong>No companies match your search</strong>Try a different company, role, or industry.</div>';
}
