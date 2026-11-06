async function loadAdmin() { const u = requireRole('admin'); if (!u) return; document.querySelectorAll('[data-user-name]').forEach(e => e.textContent = u.name); try { const s = await api('/admin/stats'); Object.entries(s).forEach(([k, v]) => { const e = document.getElementById(k); if (e) e.textContent = v }); } catch (e) { toast(e.message) } }
async function loadAdminTables() { requireRole('admin'); try { const [students, companies, drives, apps, ints, results] = await Promise.all([api('/students'), api('/companies'), api('/drives'), api('/applications'), api('/interviews'), api('/results')]); renderRows('studentsBody', students, s => [s.rollNumber, s.name, s.email, s.department, s.cgpa, s.backlogs]); renderRows('companiesBody', companies, c => [c.name, c.industry, c.jobRole, c.jobLocation, c.salaryPackage]); renderRows('drivesBody', drives, d => [d.company, d.jobRole, d.driveDate, d.regEndDate, d.status]); renderRows('applicationsBody', apps, a => [a.student, a.rollNumber, a.company, a.role, badge(a.status)]); renderRows('interviewsBody', ints, i => [i.student, i.company, i.round, i.interviewDate + ' ' + i.interviewTime, badge(i.status)]); renderRows('resultsBody', results, r => [r.student, r.company, r.role, r.package + ' LPA', badge(r.status, r.status === 'SELECTED')]); } catch (e) { toast(e.message) } }
function badge(v, green = false) { return '<span class="badge ' + (green ? 'green' : (v === 'REJECTED' ? 'red' : '')) + '">' + v + '</span>' }
function driveStatusBadge(status) {
    const statusClass = {
        REGISTRATION_OPEN: 'status-open',
        ONGOING: 'status-ongoing',
        COMPLETED: 'status-completed'
    }[status] || 'status-default';
    return '<span class="badge ' + statusClass + '">' + status + '</span>';
 }
function renderRows(id, rows, fn) {
    const el = document.getElementById(id);
    if (!el) return;
    if (!rows.length) {
        if (id === 'drivesBody' && document.body.classList.contains('manage-drives-page')) {
            const columnCount = el.closest('table').querySelectorAll('thead th').length;
            el.innerHTML = '<tr><td colspan="' + columnCount + '" class="empty-cell"><div class="drive-empty-state"><span class="drive-empty-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M4 20V8.5L12 4l8 4.5V20M2.5 20h19M9 20v-6h6v6M8 9h.01M12 9h.01M16 9h.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span><strong>No placement drives yet</strong><span>Create your first drive to see it listed here.</span></div></td></tr>';
        } else {
            const columnCount = el.closest('table').querySelectorAll('thead th').length;
            el.innerHTML = '<tr><td colspan="' + columnCount + '" class="empty">No records</td></tr>';
        }
        return;
    }
    el.innerHTML = rows.map(r => '<tr>' + fn(r).map((value, index) => {
        const content = id === 'drivesBody' && index === 4 && document.body.classList.contains('manage-drives-page') ? driveStatusBadge(value) : value;
        return '<td>' + content + '</td>';
    }).join('') + '</tr>').join('');
}
