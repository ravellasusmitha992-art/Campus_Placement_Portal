let placementDriveData = [];

async function loadPlacements() {
    const user = requireRole('student');
    if (!user) return;
    setStudentIdentity(user);
    refreshStudentNotificationBell(user);
    const element = document.getElementById('placements');
    if (!element) return;

    try {
        placementDriveData = await api('/drives');
        renderPlacementList();
        const search = document.getElementById('placementSearch');
        const status = document.getElementById('placementStatusFilter');
        const sort = document.getElementById('placementSort');
        if (search) search.addEventListener('input', renderPlacementList);
        if (status) status.addEventListener('change', renderPlacementList);
        if (sort) sort.addEventListener('change', renderPlacementList);
    } catch (error) {
        toast(error.message);
        element.innerHTML = '<div class="student-empty-state"><strong>Opportunities are temporarily unavailable</strong>Please refresh the page to try again.</div>';
    }
}

function renderPlacementList() {
    const element = document.getElementById('placements');
    if (!element) return;
    const query = (document.getElementById('placementSearch')?.value || '').trim().toLowerCase();
    const status = (document.getElementById('placementStatusFilter')?.value || '').toUpperCase();
    const sort = document.getElementById('placementSort')?.value || 'date';
    const rows = placementDriveData.filter(drive => {
        const text = [drive.company, drive.jobRole, drive.jobLocation, drive.requiredSkills].join(' ').toLowerCase();
        return (!query || text.includes(query)) && (!status || String(drive.status).toUpperCase() === status);
    }).sort((first, second) => {
        if (sort === 'package') return Number(second.salaryPackage || 0) - Number(first.salaryPackage || 0);
        if (sort === 'company') return String(first.company || '').localeCompare(String(second.company || ''));
        return driveTimestamp(first.driveDate) - driveTimestamp(second.driveDate);
    });
    const student = session();
    element.innerHTML = rows.length
        ? rows.map(drive => driveCard(drive, student ? student.id : 0)).join('')
        : '<div class="student-empty-state"><strong>No matching opportunities</strong>Try changing your search or filters, or check back later for new placement drives.</div>';
}

function driveTimestamp(value) {
    const time = Date.parse(value || '');
    return Number.isFinite(time) ? time : Number.MAX_SAFE_INTEGER;
}
