async function loadPlacements(){
    const u = requireRole('student');
    if(!u) return;

    const el = document.getElementById('placements');
    if(!el) return;

    try{
        const rows = await api('/drives');

        el.innerHTML = rows.map(d => `
            <div class="card">
                <h3>${d.company} — ${d.jobRole}</h3>

                <p>
                    ${d.jobLocation} ·
                    ${d.salaryPackage} LPA ·
                    ${d.driveDate}
                </p>

                <p class="muted">
                    Registration: ${d.regStartDate} to ${d.regEndDate}
                </p>

                <span class="badge">${d.status}</span>

                <div class="actions">
                    ${d.applicationLink
                        ? `<a class="btn secondary"
                             href="${d.applicationLink}"
                             target="_blank"
                             rel="noopener noreferrer">
                             Company Registration
                           </a>`
                        : ''
                    }
                </div>
            </div>
        `).join('');

    }catch(e){
        toast(e.message);
    }
}