let studentPageData = { applications: [], interviews: [], results: [], notifications: [], drives: [] };
let studentFiltersBound = false;

async function loadStudent() {
    const user = requireRole('student');
    if (!user) return;
    setStudentIdentity(user);

    try {
        const [profile, applications, interviews, results, notifications, drives] = await Promise.all([
            api('/students/' + user.id),
            api('/students/' + user.id + '/applications'),
            api('/students/' + user.id + '/interviews'),
            api('/students/' + user.id + '/results'),
            api('/students/' + user.id + '/notifications'),
            api('/drives')
        ]);
        studentPageData = { applications, interviews, results, notifications, drives };
        updateStudentNotificationBell(notifications);
        updateStudentSummary(profile.data, applications, interviews, results, notifications, drives);
        renderDashboard(profile.data, applications, interviews, results, notifications, drives);
        renderStudentApplications(applications);
        renderStudentInterviews(interviews);
        renderStudentResults(results);
        renderStudentNotifications(notifications);
        bindStudentFilters();
    } catch (error) {
        showStudentLoadError(error);
    }
}

function applicationProgress(statusValue) {
    const progress = {
        APPLIED: 25,
        UNDER_REVIEW: 50,
        SHORTLISTED: 72,
        INTERVIEW_SCHEDULED: 86,
        INTERVIEW_NOT_SCHEDULED: 72,
        SELECTED: 100,
        REJECTED: 100
    };
    return progress[String(statusValue || '').toUpperCase()] || 0;
}

function setStudentIdentity(user) {
    const name = user.name || 'Student';
    const initials = name.trim().split(/\s+/).slice(0, 2).map(part => part.charAt(0)).join('').toUpperCase() || 'S';
    document.querySelectorAll('[data-user-name]').forEach(element => { element.textContent = name; });
    document.querySelectorAll('[data-user-avatar]').forEach(element => { element.textContent = initials; });
    document.querySelectorAll('[data-user-roll]').forEach(element => { element.textContent = user.rollNumber || 'Roll number'; });
    document.querySelectorAll('[data-user-department]').forEach(element => { element.textContent = user.department || 'Department'; });
    ensureStudentNotificationBell();
}

function ensureStudentNotificationBell() {
    const meta = document.querySelector('.student-top-meta');
    if (!meta || meta.querySelector('.student-notification-link')) return;
    const link = document.createElement('a');
    link.className = 'student-notification-link';
    link.href = 'notifications.html';
    link.setAttribute('aria-label', 'Notifications');
    link.innerHTML = '<span aria-hidden="true">♧</span><span class="student-notification-count" data-unread-count hidden></span>';
    const name = meta.querySelector('.student-top-name');
    meta.insertBefore(link, name || meta.firstChild);
}

function updateStudentNotificationBell(notifications) {
    ensureStudentNotificationBell();
    const count = notifications.filter(notification => !notification.read).length;
    document.querySelectorAll('[data-unread-count]').forEach(element => {
        element.textContent = count > 99 ? '99+' : String(count);
        element.hidden = count === 0;
        const link = element.closest('a');
        if (link) link.setAttribute('aria-label', count ? count + ' unread notifications' : 'Notifications');
    });
}

async function refreshStudentNotificationBell(user) {
    ensureStudentNotificationBell();
    try {
        updateStudentNotificationBell(await api('/students/' + encodeURIComponent(user.id) + '/notifications'));
    } catch (error) {
        toast(error.message);
    }
}
function updateStudentSummary(profile, applications, interviews, results, notifications, drives) {
    setStudentText('cgpa', profile.cgpa ?? '—');
    setStudentText('appCount', applications.length);
    setStudentText('interviewCount', interviews.filter(isUpcomingInterview).length);
    setStudentText('resultCount', results.length);
    setStudentText('availableJobs', drives.filter(drive => ['REGISTRATION_OPEN', 'UPCOMING'].includes(String(drive.status || '').toUpperCase())).length);
    setStudentText('shortlistedCount', applications.filter(application => String(application.status).toUpperCase() === 'SHORTLISTED').length);
    setStudentText('selectedCount', new Set(results.filter(result => String(result.status).toUpperCase() === 'SELECTED').map(result => result.company)).size);
    setStudentText('applicationsTotal', applications.length);
    setStudentText('applicationsReview', applications.filter(application => ['UNDER_REVIEW', 'INTERVIEW_SCHEDULED'].includes(String(application.status).toUpperCase())).length);
    setStudentText('applicationsShortlisted', applications.filter(application => String(application.status).toUpperCase() === 'SHORTLISTED').length);
    setStudentText('interviewsTotal', interviews.length);
    setStudentText('interviewsUpcoming', interviews.filter(isUpcomingInterview).length);
    setStudentText('interviewsCompleted', interviews.filter(interview => ['COMPLETED', 'ATTEMPTED'].includes(String(interview.status).toUpperCase())).length);
    setStudentText('notificationsTotal', notifications.length);
    setStudentText('notificationsUnread', notifications.filter(notification => !notification.read).length);
    setStudentText('notificationsRead', notifications.filter(notification => notification.read).length);
    setStudentText('resultsTotal', results.length);
    setStudentText('resultsSelected', results.filter(result => String(result.status).toUpperCase() === 'SELECTED').length);
    setStudentText('resultsCompanies', new Set(results.map(result => result.company)).size);
    const progressed = applications.filter(application => ['SHORTLISTED', 'INTERVIEW_SCHEDULED', 'SELECTED'].includes(String(application.status).toUpperCase())).length;
    setStudentText('placementProgressLabel', applications.length ? progressed + ' of ' + applications.length + ' progressed' : '0 applications');
    setStudentText('placementProgressHint', applications.length
        ? 'Applications that have advanced to a shortlist, interview, or selection stage.'
        : 'Your placement activity will appear here as you apply to opportunities.');
    const progressBar = document.getElementById('placementProgressBar');
    if (progressBar) progressBar.style.width = (applications.length ? Math.round(progressed / applications.length * 100) : 0) + '%';
}

function renderDashboard(profile, applications, interviews, results, notifications, drives) {
    renderDrives(drives, profile.id);
    renderActivityList('dashboardInterviews', interviews.filter(isUpcomingInterview).sort(compareInterviewDate).slice(0, 4), interview =>
        activityItem('◷', interview.company, [interview.role, interview.round].filter(Boolean).join(' · '), formatInterviewDate(interview), true));
    renderActivityList('dashboardAnnouncements', notifications.slice(0, 4), notification =>
        activityItem(notification.read ? '♧' : '!', notification.title, notification.message, formatDate(notification.createdDate), !notification.read));
    renderActivityList('dashboardApplications', applications.slice().sort((a, b) => compareDateDesc(a.appliedDate, b.appliedDate)).slice(0, 4), application =>
        activityItem('▤', application.company, application.role + ' · ' + String(application.status || '').replace(/_/g, ' '), formatDate(application.appliedDate), false));
    renderActivityList('dashboardResults', results.slice(0, 4), result =>
        activityItem('✦', result.company, result.role + ' · ' + result.package + ' LPA · ' + result.status, result.joiningDate ? 'Joining ' + formatDate(result.joiningDate) : 'Published result', String(result.status).toUpperCase() === 'SELECTED'));
}

function renderActivityList(id, entries, renderEntry) {
    const element = document.getElementById(id);
    if (!element) return;
    element.innerHTML = entries.length
        ? entries.map(renderEntry).join('')
        : '<div class="student-empty-state"><strong>Nothing to show yet</strong>New updates will appear here when available.</div>';
}

function activityItem(icon, title, detail, date, emphasized) {
    return '<div class="student-activity-item"><span class="student-activity-icon" aria-hidden="true">' + escapeStudentHtml(icon) + '</span><div class="student-activity-copy"><strong>' + escapeStudentHtml(title || 'Update') + (emphasized ? ' <span class="badge">New</span>' : '') + '</strong><span>' + escapeStudentHtml(detail || '') + (date ? ' · ' + escapeStudentHtml(date) : '') + '</span></div></div>';
}

function renderDrives(drives, studentId) {
    const element = document.getElementById('drives');
    if (!element) return;
    const openDrives = drives.filter(drive => ['REGISTRATION_OPEN', 'UPCOMING'].includes(String(drive.status || '').toUpperCase()));
    element.innerHTML = openDrives.length ? openDrives.slice(0, 4).map(drive => driveCard(drive, studentId)).join('') :
        '<div class="student-empty-state"><strong>No open opportunities right now</strong>Check back soon for newly announced placement drives.</div>';
}

function driveCard(drive, studentId) {
    const status = String(drive.status || '').toUpperCase();
    const isOpen = status === 'REGISTRATION_OPEN';
    const unavailableLabel = status === 'UPCOMING' ? 'Registration upcoming'
        : status === 'ONGOING' ? 'Drive in progress'
            : status === 'COMPLETED' ? 'Drive completed' : 'Registration closed';
    const skills = String(drive.requiredSkills || '').split(/[,;|]/).map(skill => skill.trim()).filter(Boolean).slice(0, 5);
    const requirements = [
        drive.minCgpa != null ? 'CGPA ' + drive.minCgpa : '',
        drive.minTenthPercentage != null ? '10th ' + drive.minTenthPercentage + '%' : '',
        drive.minTwelfthPercentage != null ? '12th ' + drive.minTwelfthPercentage + '%' : '',
        drive.maxBacklogs != null ? 'Max backlogs ' + drive.maxBacklogs : ''
    ].filter(Boolean);
    return '<article class="card student-job-card">' +
        '<span class="student-company-mark" aria-hidden="true">' + escapeStudentHtml(initials(drive.company)) + '</span>' +
        '<div class="section-title" style="margin:0 0 8px"><div><h3 class="student-card-title">' + escapeStudentHtml(drive.company) + '</h3><span class="muted">' + escapeStudentHtml(drive.jobRole) + '</span></div>' + statusBadge(status) + '</div>' +
        '<div class="student-card-meta"><span>' + escapeStudentHtml(drive.jobLocation || 'Location not listed') + '</span><span>' + escapeStudentHtml(drive.salaryPackage ?? '—') + ' LPA</span><span>Drive ' + escapeStudentHtml(formatDate(drive.driveDate)) + '</span></div>' +
        '<p class="student-card-body student-drive-description">' + escapeStudentHtml(drive.jobDescription || 'Explore the role details and eligibility requirements for this placement drive.') + '</p>' +
        (requirements.length ? '<div class="student-chip-row">' + requirements.map(value => '<span class="student-chip">' + escapeStudentHtml(value) + '</span>').join('') + '</div>' : '') +
        (skills.length ? '<div class="student-chip-row">' + skills.map(value => '<span class="student-chip">' + escapeStudentHtml(value) + '</span>').join('') + '</div>' : '') +
        '<div class="student-card-bottom"><p class="student-small-note">Registration: ' + escapeStudentHtml(formatDate(drive.regStartDate)) + ' – ' + escapeStudentHtml(formatDate(drive.regEndDate)) + '</p>' +
        '<div class="actions">' + (isOpen ? '<button class="btn" type="button" onclick="openPlacementRegistration(' + Number(drive.id) + ')">Apply now</button>' : '<button class="btn secondary" type="button" disabled>' + unavailableLabel + '</button>') +
        '<button class="btn secondary" type="button" onclick="checkEligibility(' + Number(drive.id) + ',' + Number(studentId) + ')">Check eligibility</button>' +
        (drive.applicationLink ? '<a class="btn secondary" href="' + safeStudentUrl(drive.applicationLink) + '" target="_blank" rel="noopener noreferrer">Company link</a>' : '') +
        '</div></div></article>';
}

function renderStudentApplications(applications) {
    const query = getFilterValue('applicationSearch').toLowerCase();
    const status = getFilterValue('applicationStatusFilter').toUpperCase();
    const sort = getFilterValue('applicationSort') || 'newest';
    const rows = applications.filter(application => {
        const haystack = [application.company, application.role].join(' ').toLowerCase();
        return (!query || haystack.includes(query)) && (!status || String(application.status).toUpperCase() === status);
    }).sort((a, b) => sort === 'oldest' ? compareDateAsc(a.appliedDate, b.appliedDate) : compareDateDesc(a.appliedDate, b.appliedDate));
    renderRows('applicationsBody', rows, 6, 'No applications match these filters.', application => [
        escapeStudentHtml(application.company),
        escapeStudentHtml(application.role),
        escapeStudentHtml(formatDate(application.appliedDate)),
        statusBadge(application.status) + '<div class="student-status-progress" aria-label="Application progress"><span style="width:' + applicationProgress(application.status) + '%"></span></div>',
        '<span title="' + escapeStudentHtml(application.registrationDetails || '') + '">' + escapeStudentHtml(compactDetails(application.registrationDetails)) + '</span>',
        application.applicationLink ? '<a class="student-link" href="' + safeStudentUrl(application.applicationLink) + '" target="_blank" rel="noopener noreferrer">Company registration</a>' : '—'
    ]);
}

function renderStudentInterviews(interviews) {
    const query = getFilterValue('interviewSearch').toLowerCase();
    const status = getFilterValue('interviewStatusFilter').toUpperCase();
    const sort = getFilterValue('interviewSort') || 'soonest';
    const rows = interviews.filter(interview => {
        const haystack = [interview.company, interview.role, interview.round].join(' ').toLowerCase();
        return (!query || haystack.includes(query)) && (!status || String(interview.status).toUpperCase() === status);
    }).sort((a, b) => sort === 'latest' ? compareInterviewDate(b, a) : compareInterviewDate(a, b));
    renderRows('interviewsBody', rows, 7, 'No interviews match these filters.', interview => {
        const date = interview.interviewDate || interview.date;
        const time = interview.interviewTime || interview.time;
        const dateTime = [formatDate(date), time || ''].filter(Boolean).join(' · ');
        const venue = interview.venue ? escapeStudentHtml(interview.venue) : 'Location to be confirmed';
        const meetingLink = interview.meetingLink ? '<br><a class="student-link" href="' + safeStudentUrl(interview.meetingLink) + '" target="_blank" rel="noopener noreferrer">Join online</a>' : '';
        const mode = interview.type ? '<br><span class="student-small-note">' + escapeStudentHtml(interview.type) + '</span>' : '';
        const action = String(interview.status).toUpperCase() === 'SCHEDULED'
            ? '<button class="btn secondary" type="button" onclick="markInterviewAttempted(' + Number(interview.id) + ')">Mark attempted</button>'
            : '—';
        return [escapeStudentHtml(interview.company), escapeStudentHtml(interview.role), escapeStudentHtml(interview.round),
            escapeStudentHtml(dateTime) + (isUpcomingInterview(interview) ? '<br><span class="student-small-note">' + escapeStudentHtml(interviewCountdown(interview)) + '</span>' : ''),
            venue + mode + meetingLink, statusBadge(interview.status), action];
    });
}

function renderStudentResults(results) {
    const query = getFilterValue('resultSearch').toLowerCase();
    const status = getFilterValue('resultStatusFilter').toUpperCase();
    const sort = getFilterValue('resultSort') || 'newest';
    const rows = results.filter(result => {
        const haystack = [result.company, result.role].join(' ').toLowerCase();
        return (!query || haystack.includes(query)) && (!status || String(result.status).toUpperCase() === status);
    }).sort((a, b) => {
        if (sort === 'package') return Number(b.package || 0) - Number(a.package || 0);
        if (sort === 'company') return String(a.company || '').localeCompare(String(b.company || ''));
        return compareDateDesc(a.joiningDate, b.joiningDate);
    });
    renderRows('resultsBody', rows, 5, 'No placement results have been published for your account.', result => [
        escapeStudentHtml(result.company), escapeStudentHtml(result.role), escapeStudentHtml((result.package ?? '—') + ' LPA'),
        statusBadge(result.status), escapeStudentHtml(formatDate(result.joiningDate))
    ]);
}

function renderStudentNotifications(notifications) {
    const query = getFilterValue('notificationSearch').toLowerCase();
    const status = getFilterValue('notificationStatusFilter');
    const rows = notifications.filter(notification => {
        const haystack = [notification.title, notification.message].join(' ').toLowerCase();
        return (!query || haystack.includes(query)) && (!status || (status === 'read') === Boolean(notification.read));
    });
    renderRows('notificationsBody', rows, 5, 'You are all caught up. New updates will appear here.', notification => [
        '<strong>' + escapeStudentHtml(notification.title) + '</strong>',
        escapeStudentHtml(notification.message),
        escapeStudentHtml(formatDate(notification.createdDate)),
        statusBadge(notification.read ? 'READ' : 'UNREAD'),
        notification.read ? '—' : '<button class="btn secondary" type="button" onclick="markNotificationRead(' + Number(notification.id) + ')">Mark read</button>'
    ]);
}

function renderRows(id, rows, columns, emptyMessage, rowCells) {
    const element = document.getElementById(id);
    if (!element) return;
    element.innerHTML = rows.length
        ? rows.map(row => '<tr>' + rowCells(row).map(cell => '<td>' + cell + '</td>').join('') + '</tr>').join('')
        : '<tr><td colspan="' + columns + '" class="empty">' + escapeStudentHtml(emptyMessage) + '</td></tr>';
}

function statusBadge(value) {
    const status = String(value || 'UNKNOWN').toUpperCase();
    const style = ['SELECTED', 'SHORTLISTED', 'COMPLETED', 'REGISTRATION_OPEN', 'READ'].includes(status) ? 'green'
        : ['REJECTED', 'NOT_SELECTED', 'CANCELLED'].includes(status) ? 'red'
            : ['UNDER_REVIEW', 'UPCOMING', 'PENDING'].includes(status) ? 'orange'
                : ['INTERVIEW_SCHEDULED', 'ONGOING', 'ATTEMPTED'].includes(status) ? 'purple' : '';
    return '<span class="badge ' + style + '">' + escapeStudentHtml(status.replace(/_/g, ' ')) + '</span>';
}

function bindStudentFilters() {
    if (studentFiltersBound) return;
    studentFiltersBound = true;
    const groups = [
        [['applicationSearch', 'input'], ['applicationStatusFilter', 'change'], ['applicationSort', 'change'], renderStudentApplications],
        [['interviewSearch', 'input'], ['interviewStatusFilter', 'change'], ['interviewSort', 'change'], renderStudentInterviews],
        [['resultSearch', 'input'], ['resultStatusFilter', 'change'], ['resultSort', 'change'], renderStudentResults],
        [['notificationSearch', 'input'], ['notificationStatusFilter', 'change'], renderStudentNotifications]
    ];
    groups.forEach(group => {
        const callback = group[group.length - 1];
        group.slice(0, -1).forEach(([id, event]) => {
            const element = document.getElementById(id);
            if (element) element.addEventListener(event, () => callback(studentPageData[
                callback === renderStudentApplications ? 'applications' :
                    callback === renderStudentInterviews ? 'interviews' :
                        callback === renderStudentResults ? 'results' : 'notifications'
            ]));
        });
    });
}

async function loadProfile() {
    const user = requireRole('student');
    if (!user) return;
    setStudentIdentity(user);
    refreshStudentNotificationBell(user);
    try {
        const response = await api('/students/' + user.id);
        const student = response.data;
        for (const key of ['rollNumber', 'name', 'email', 'phone', 'department', 'course', 'graduationYear', 'tenthPercentage', 'twelfthPercentage', 'cgpa', 'backlogs', 'skills']) {
            const field = document.getElementById(key);
            if (field) field.value = student[key] ?? '';
        }
        setStudentIdentity(student);
        setProfileCompletion(student);
        const resumeStatus = document.getElementById('resumeStatus');
        if (resumeStatus && student.resume) resumeStatus.textContent = 'A resume PDF is already uploaded to your profile.';

        const form = document.getElementById('profileForm');
        if (form) {
            form.addEventListener('input', () => setProfileCompletion(Object.fromEntries(new FormData(form).entries())));
            form.addEventListener('submit', async event => {
                event.preventDefault();
                const data = Object.fromEntries(new FormData(form).entries());
                for (const key of ['graduationYear', 'tenthPercentage', 'twelfthPercentage', 'cgpa', 'backlogs']) {
                    if (data[key] !== '') data[key] = Number(data[key]);
                }
                try {
                    const updated = await api('/students/' + user.id, { method: 'PUT', body: data });
                    toast('Profile updated');
                    setStudentIdentity(updated.data || data);
                    setProfileCompletion(updated.data || data);
                } catch (error) {
                    toast(error.message);
                }
            });
        }
        const resumeForm = document.getElementById('resumeForm');
        if (resumeForm) resumeForm.addEventListener('submit', async event => {
            event.preventDefault();
            const fileInput = resumeForm.querySelector('input[type="file"]');
            if (!fileInput.files || !fileInput.files.length) {
                toast('Choose a PDF resume to upload');
                return;
            }
            if (fileInput.files[0].type !== 'application/pdf' && !fileInput.files[0].name.toLowerCase().endsWith('.pdf')) {
                toast('Only PDF resumes are allowed');
                return;
            }
            try {
                await api('/students/' + user.id + '/resume', { method: 'POST', body: new FormData(resumeForm) });
                toast('Resume uploaded');
                if (resumeStatus) resumeStatus.textContent = 'Your resume PDF has been uploaded.';
            } catch (error) {
                toast(error.message);
            }
        });
    } catch (error) {
        toast(error.message);
    }
}

function setProfileCompletion(student) {
    const fields = ['rollNumber', 'name', 'email', 'phone', 'department', 'course', 'graduationYear', 'tenthPercentage', 'twelfthPercentage', 'cgpa', 'backlogs', 'skills', 'resume'];
    const filled = fields.filter(key => String(student[key] || '').trim()).length;
    const percent = Math.round(filled / fields.length * 100);
    setStudentText('profileCompletionLabel', percent + '%');
    const bar = document.getElementById('profileCompletionBar');
    if (bar) bar.style.width = percent + '%';
}

async function markInterviewAttempted(id) {
    try {
        await api('/interviews/' + encodeURIComponent(id) + '/status?value=ATTEMPTED', { method: 'PUT' });
        toast('Interview marked as attempted');
        await loadStudent();
    } catch (error) {
        toast(error.message);
    }
}

async function markNotificationRead(id) {
    const user = requireRole('student');
    if (!user) return;
    try {
        await api('/students/' + encodeURIComponent(user.id) + '/notifications/' + encodeURIComponent(id) + '/read', { method: 'PUT' });
        toast('Notification marked as read');
        await loadStudent();
    } catch (error) {
        toast(error.message);
    }
}

async function markAllNotificationsRead() {
    const user = requireRole('student');
    if (!user) return;
    const unread = studentPageData.notifications.filter(notification => !notification.read);
    try {
        await Promise.all(unread.map(notification => api('/students/' + encodeURIComponent(user.id) + '/notifications/' + encodeURIComponent(notification.id) + '/read', { method: 'PUT' })));
        toast(unread.length ? 'All notifications marked as read' : 'You have no unread notifications');
        if (unread.length) await loadStudent();
    } catch (error) {
        toast(error.message);
        await loadStudent();
    }
}

function openPlacementRegistration(driveId) {
    location.href = 'placement-registration.html?driveId=' + encodeURIComponent(driveId);
}

async function checkEligibility(driveId, studentId) {
    try {
        const response = await api('/drives/' + encodeURIComponent(driveId) + '/eligibility/' + encodeURIComponent(studentId));
        toast(response.message || response.data?.message || 'Eligibility checked');
    } catch (error) {
        toast(error.message);
    }
}

function isUpcomingInterview(interview) {
    if (String(interview.status || '').toUpperCase() !== 'SCHEDULED') return false;
    const date = interview.interviewDate || interview.date;
    const time = interview.interviewTime || interview.time || '23:59';
    const timestamp = Date.parse(date + 'T' + time);
    return Number.isFinite(timestamp) && timestamp >= Date.now();
}

function compareInterviewDate(first, second) {
    return interviewTimestamp(first) - interviewTimestamp(second);
}

function interviewTimestamp(interview) {
    const date = interview.interviewDate || interview.date || '';
    const time = interview.interviewTime || interview.time || '00:00';
    const parsed = Date.parse(date + 'T' + time);
    return Number.isFinite(parsed) ? parsed : 0;
}

function interviewCountdown(interview) {
    const remaining = interviewTimestamp(interview) - Date.now();
    if (remaining <= 0) return 'Starting soon';
    const days = Math.floor(remaining / 86400000);
    const hours = Math.floor(remaining % 86400000 / 3600000);
    return days ? 'In ' + days + ' day' + (days === 1 ? '' : 's') : 'In ' + hours + ' hour' + (hours === 1 ? '' : 's');
}

function compactDetails(value) {
    if (!value) return '—';
    const text = String(value);
    return text.length > 58 ? text.slice(0, 55) + '…' : text;
}

function formatInterviewDate(interview) {
    return [formatDate(interview.interviewDate || interview.date), interview.interviewTime || interview.time || ''].filter(Boolean).join(' · ');
}

function formatDate(value) {
    if (!value) return '—';
    const date = new Date(value + (String(value).length === 10 ? 'T00:00:00' : ''));
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function compareDateDesc(first, second) {
    return dateTimestamp(second) - dateTimestamp(first);
}

function compareDateAsc(first, second) {
    return dateTimestamp(first) - dateTimestamp(second);
}

function dateTimestamp(value) {
    const timestamp = Date.parse(value || '');
    return Number.isFinite(timestamp) ? timestamp : 0;
}

function getFilterValue(id) {
    const element = document.getElementById(id);
    return element ? element.value : '';
}

function setStudentText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value == null || value === '' ? '—' : String(value);
}

function initials(value) {
    return String(value || 'C').trim().split(/\s+/).slice(0, 2).map(part => part.charAt(0)).join('').toUpperCase() || 'C';
}

function escapeStudentHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, character => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
}

function safeStudentUrl(value) {
    const url = String(value || '').trim();
    return /^https?:\/\//i.test(url) ? escapeStudentHtml(url) : '#';
}

function showStudentLoadError(error) {
    toast(error.message);
    [['applicationsBody', 6], ['interviewsBody', 7], ['resultsBody', 5], ['notificationsBody', 5]].forEach(([id, columns]) => {
        const element = document.getElementById(id);
        if (element) element.innerHTML = '<tr><td colspan="' + columns + '" class="empty">Unable to load this information. Please refresh to try again.</td></tr>';
    });
    const drives = document.getElementById('drives');
    if (drives) drives.innerHTML = '<div class="student-empty-state"><strong>Opportunities are temporarily unavailable</strong>Please refresh the page to try again.</div>';
}
