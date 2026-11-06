(() => {
  const links = [
    { file: 'admin-dashboard.html', label: 'Dashboard', icon: '<path d="m3.5 10 8.5-7 8.5 7M5.5 9v11h13V9M9 20v-6h6v6"/>' },
    { file: 'manage-students.html', label: 'Students', icon: '<path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>' },
    { file: 'manage-companies.html', label: 'Companies', icon: '<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V4h8v3M3 12h18M10 12v2h4v-2"/>' },
    { file: 'manage-drives.html', label: 'Placement drives', icon: '<path d="M4 20V8.5L12 4l8 4.5V20M2.5 20h19M9 20v-6h6v6"/>' },
    { file: 'manage-applications.html', label: 'Applications', icon: '<path d="M7 3.75h7l4 4V20a.75.75 0 0 1-.75.75h-10.5A.75.75 0 0 1 6 20V4.5a.75.75 0 0 1 .75-.75Z"/><path d="M14 4v4h4M9 12h6M9 15.5h6"/>' },
    { file: 'manage-interviews.html', label: 'Interviews', icon: '<rect x="3.5" y="5" width="17" height="16" rx="2.5"/><path d="M7.5 3v4M16.5 3v4M3.5 9.5h17M8 13h3M8 16.5h6"/>' },
    { file: 'manage-results.html', label: 'Results', icon: '<path d="M12 3 14.8 8.7l6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"/>' },
    { file: 'notifications-admin.html', label: 'Notifications', icon: '<path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4"/>' }
   ];

  const header = document.querySelector('.topbar');
  const main = document.querySelector('main');
  if (!header || !main) return;

  document.body.classList.add('admin-shell');
  const activeFile = location.pathname.split('/').pop() || 'admin-dashboard.html';
  const toggle = document.createElement('button');
  toggle.className = 'admin-menu-toggle';
  toggle.type = 'button';
  toggle.setAttribute('aria-label', 'Open admin navigation');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', 'adminSidebar');
  toggle.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';
  header.insertBefore(toggle, header.firstChild);

  const sidebar = document.createElement('aside');
  sidebar.className = 'admin-sidebar';
  sidebar.id = 'adminSidebar';
  sidebar.setAttribute('aria-label', 'Admin navigation');
  sidebar.innerHTML = '<p class="admin-sidebar-label">Workspace</p><nav>' + links.map(link =>
    '<a href="' + link.file + '"' + (link.file === activeFile ? ' aria-current="page"' : '') + '><svg viewBox="0 0 24 24" aria-hidden="true">' + link.icon + '</svg><span>' + link.label + '</span></a>'
  ).join('') + '</nav><div class="admin-sidebar-foot">Campus Placement Portal<br>Administration</div>';

  const backdrop = document.createElement('div');
  backdrop.className = 'admin-sidebar-backdrop';
  backdrop.setAttribute('aria-hidden', 'true');
  document.body.append(sidebar, backdrop);

  const breadcrumb = document.createElement('nav');
  breadcrumb.className = 'admin-breadcrumb';
  breadcrumb.setAttribute('aria-label', 'Breadcrumb');
  const activeLink = links.find(link => link.file === activeFile);
  breadcrumb.innerHTML = '<a href="admin-dashboard.html">Admin</a><span aria-hidden="true">/</span><span aria-current="page">' + (activeLink ? activeLink.label : 'Workspace') + '</span>';
  main.insertBefore(breadcrumb, main.firstChild);

  const closeMenu = () => {
    document.body.classList.remove('admin-sidebar-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open admin navigation');
  };
  toggle.addEventListener('click', () => {
    const open = document.body.classList.toggle('admin-sidebar-open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close admin navigation' : 'Open admin navigation');
  });
  backdrop.addEventListener('click', closeMenu);
  sidebar.addEventListener('click', event => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeMenu();
  });
})();
