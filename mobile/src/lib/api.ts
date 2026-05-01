import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://api.himup.id/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

// ─── DEMO MODE ────────────────────────────────────────────────────────────────
// Set to true ONLY when building app-demo.apk. Must be false for live builds.
const IS_DEMO_MODE = false;

if (IS_DEMO_MODE) {
  // All fake data lives here — never leaks into the live build
  let fakeTickets: any[] = [
    { id: 6, ticket_number: 'TCK-2026-006', title: 'Monitor screen flickering', description: 'My secondary display is flickering constantly.', priority: 'low', status: 'on_hold', created_at: new Date(Date.now() - 400000000).toISOString(), category: { name: 'Hardware' }, requester: { name: 'John Doe' }, pic: { name: 'Demo Engineer' }, branch: { name: 'HQ' } },
    { id: 5, ticket_number: 'TCK-2026-005', title: 'VPN connection dropping', description: 'Users in remote office complain about VPN drops.', priority: 'high', status: 'in_progress', created_at: new Date(Date.now() - 7200000).toISOString(), category: { name: 'Network' }, requester: { name: 'Remote User' }, pic: { name: 'Demo Engineer' }, branch: { name: 'Remote' } },
    { id: 4, ticket_number: 'TCK-2026-004', title: 'New laptop setup', description: 'Please setup the new MacBook for the incoming hire.', priority: 'low', status: 'open', created_at: new Date(Date.now() - 3600000).toISOString(), category: { name: 'Hardware' }, requester: { name: 'HR Dept' }, pic: null, branch: { name: 'HQ' } },
    { id: 3, ticket_number: 'TCK-2026-003', title: 'Server upgrade needed', description: 'We need to upgrade the RAM on the main DB server.', priority: 'critical', status: 'closed', created_at: new Date(Date.now() - 172800000).toISOString(), updated_at: new Date(Date.now() - 100000000).toISOString(), category: { name: 'Server' }, requester: { name: 'Admin' }, pic: { name: 'SysAdmin' }, branch: { name: 'Data Center' }, comments: [{ id: 2, body: 'Approved.', created_at: new Date().toISOString(), user: { name: 'Manager' } }] },
    { id: 2, ticket_number: 'TCK-2026-002', title: 'Printer jam on Floor 3', description: 'The main laser printer is flashing red and has a paper jam.', priority: 'medium', status: 'in_progress', created_at: new Date(Date.now() - 86400000).toISOString(), category: { name: 'Hardware' }, requester: { name: 'Bob Jones' }, pic: { name: 'Demo Engineer' }, branch: { name: 'HQ' } },
    { id: 1, ticket_number: 'TCK-2026-001', title: 'WiFi router down in HR Dept', description: 'The router on the 3rd floor is completely unresponsive.', priority: 'high', status: 'open', created_at: new Date().toISOString(), category: { name: 'Network' }, requester: { name: 'Alice Smith' }, pic: null, branch: { name: 'HQ' }, comments: [{ id: 1, body: 'I will check this right now.', created_at: new Date().toISOString(), user: { name: 'Demo Engineer' } }] },
  ];

  const fakeAssets: any[] = [
    { id: 1, asset_tag: 'AST-LTP-001', name: 'MacBook Pro M3 Max', status: 'active', asset_type: { name: 'Laptop' }, brand: { name: 'Apple' }, branch: { name: 'HQ' }, serial_number: 'C02XXX', purchase_date: '2024-01-15', purchase_cost: 35000000 },
    { id: 2, asset_tag: 'AST-NET-042', name: 'Cisco Switch 48-port', status: 'maintenance', asset_type: { name: 'Networking' }, brand: { name: 'Cisco' }, branch: { name: 'Data Center' }, serial_number: 'CSX999', notes: 'Scheduled for firmware upgrade' },
    { id: 3, asset_tag: 'AST-MON-012', name: 'Dell UltraSharp 32"', status: 'stock', asset_type: { name: 'Monitor' }, brand: { name: 'Dell' }, branch: { name: 'HQ' }, serial_number: 'DUM123' },
    { id: 4, asset_tag: 'AST-SRV-001', name: 'Dell PowerEdge R740', status: 'active', asset_type: { name: 'Server' }, brand: { name: 'Dell' }, branch: { name: 'Data Center' }, serial_number: 'SVR999' },
    { id: 5, asset_tag: 'AST-LTP-099', name: 'Lenovo ThinkPad X1', status: 'disposed', asset_type: { name: 'Laptop' }, brand: { name: 'Lenovo' }, branch: { name: 'HQ' }, serial_number: 'LNV123', notes: 'Broken screen, disposed.' },
  ];

  let fakeMaint: any[] = [
    { id: 1, title: 'Annual Server Dusting', status: 'pending', description: 'Full internal cleaning and dust removal for server rack equipment.', scheduled_date: '2026-05-10', created_at: new Date().toISOString(), asset: { id: 4, name: 'Dell PowerEdge R740', asset_tag: 'AST-SRV-001' } },
    { id: 2, title: 'Screen Replacement', status: 'completed', description: 'Replace cracked LCD screen on the unit.', cost: 850000, created_at: new Date(Date.now() - 400000000).toISOString(), asset: { id: 5, name: 'Lenovo ThinkPad X1', asset_tag: 'AST-LTP-099' } },
    { id: 3, title: 'Network Switch Firmware', status: 'approved', description: 'Upgrade firmware to latest stable version.', scheduled_date: '2026-05-05', created_at: new Date(Date.now() - 86400000).toISOString(), asset: { id: 2, name: 'Cisco Switch 48-port', asset_tag: 'AST-NET-042' } },
    { id: 4, title: 'Battery Replacement', status: 'rejected', description: 'Battery swelling detected, needs replacement.', created_at: new Date(Date.now() - 172800000).toISOString(), asset: { id: 1, name: 'MacBook Air', asset_tag: 'AST-LTP-MB1' } },
  ];

  // Simulate a new ticket arriving 12 seconds after app load
  setTimeout(() => {
    fakeTickets.unshift({
      id: 99, ticket_number: 'TCK-2026-099', title: 'URGENT: Database Server Offline',
      description: 'The production database server cannot be reached!',
      priority: 'critical', status: 'open', created_at: new Date().toISOString(),
      category: { name: 'Server' }, requester: { name: 'System Monitor' }, pic: null, branch: { name: 'Data Center' },
    });
  }, 12000);

  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;

    config.adapter = async (config) => {
      await new Promise(r => setTimeout(r, 600));
      const path = config.url || '';
      const method = config.method?.toLowerCase();

      // Auth
      if (path.includes('/login')) {
        return { data: { token: 'fake-jwt-token-12345', user: { id: 1, name: 'Demo Engineer', email: JSON.parse(config.data || '{}').email || 'engineer@demo.com', role: { id: 3, name: 'IT Staff', slug: 'it_operations_staff' }, department: { id: 1, name: 'IT Operations' }, branch: { id: 1, name: 'Headquarters' } } }, status: 200, statusText: 'OK', headers: {}, config, request: {} };
      }
      if (path.includes('/user')) {
        return { data: { id: 1, name: 'Demo Engineer', email: 'engineer@demo.com', role: { id: 3, name: 'IT Staff', slug: 'it_operations_staff' }, department: { id: 1, name: 'IT Operations' }, branch: { id: 1, name: 'Headquarters' } }, status: 200, statusText: 'OK', headers: {}, config, request: {} };
      }

      // Ticket detail
      const ticketDetailMatch = path.match(/\/tickets\/(\d+)$/);
      if (ticketDetailMatch) return { data: fakeTickets.find(t => t.id === Number(ticketDetailMatch[1])) || fakeTickets[0], status: 200, statusText: 'OK', headers: {}, config, request: {} };

      // Asset detail
      const assetDetailMatch = path.match(/\/assets\/(\d+)$/);
      if (assetDetailMatch) return { data: fakeAssets.find(a => a.id === Number(assetDetailMatch[1])) || fakeAssets[0], status: 200, statusText: 'OK', headers: {}, config, request: {} };

      // Maintenance detail
      const maintDetailMatch = path.match(/\/asset-maintenances\/(\d+)$/);
      if (maintDetailMatch) return { data: fakeMaint.find(m => m.id === Number(maintDetailMatch[1])) || fakeMaint[0], status: 200, statusText: 'OK', headers: {}, config, request: {} };

      // POST: comment
      const commentMatch = path.match(/\/tickets\/(\d+)\/comments/);
      if (method === 'post' && commentMatch) {
        const ticket = fakeTickets.find(t => t.id === Number(commentMatch[1]));
        if (ticket) {
          const body = typeof config.data === 'string' ? JSON.parse(config.data).body : config.data?.body;
          const userStr = localStorage.getItem('himup-mobile-auth');
          let userName = 'Demo Engineer';
          try { userName = JSON.parse(userStr || '{}').state?.user?.name || userName; } catch {}
          if (!ticket.comments) ticket.comments = [];
          ticket.comments.push({ id: Date.now(), body: body || '', created_at: new Date().toISOString(), user: { name: userName } });
        }
        return { data: { message: 'Comment added' }, status: 200, statusText: 'OK', headers: {}, config, request: {} };
      }

      // PATCH: status
      const statusMatch = path.match(/\/tickets\/(\d+)\/status/);
      if (method === 'patch' && statusMatch) {
        const ticket = fakeTickets.find(t => t.id === Number(statusMatch[1]));
        if (ticket) { ticket.status = typeof config.data === 'string' ? JSON.parse(config.data).status : config.data?.status; ticket.updated_at = new Date().toISOString(); }
        return { data: { message: 'Status updated' }, status: 200, statusText: 'OK', headers: {}, config, request: {} };
      }

      // POST: take ownership
      const ownershipMatch = path.match(/\/tickets\/(\d+)\/take-ownership/);
      if (method === 'post' && ownershipMatch) {
        const ticket = fakeTickets.find(t => t.id === Number(ownershipMatch[1]));
        let userName = 'Demo Engineer';
        try { userName = JSON.parse(localStorage.getItem('himup-mobile-auth') || '{}').state?.user?.name || userName; } catch {}
        if (ticket) { ticket.pic = { name: userName }; ticket.status = 'in_progress'; ticket.updated_at = new Date().toISOString(); }
        return { data: { message: 'Ownership taken' }, status: 200, statusText: 'OK', headers: {}, config, request: {} };
      }

      // POST: maintenance create
      if (method === 'post' && path.match(/^\/asset-maintenances$/)) {
        const payload = typeof config.data === 'string' ? JSON.parse(config.data) : config.data || {};
        const asset = fakeAssets.find(a => a.id === Number(payload.asset_id));
        const newMaint: any = { id: Date.now(), title: payload.title || 'New Request', description: payload.description || '', status: 'pending', scheduled_date: payload.scheduled_date || null, cost: null, created_at: new Date().toISOString(), asset: asset ? { id: asset.id, name: asset.name, asset_tag: asset.asset_tag } : { name: 'Unknown Asset' } };
        fakeMaint.unshift(newMaint);
        return { data: newMaint, status: 201, statusText: 'Created', headers: {}, config, request: {} };
      }

      // POST: maintenance approve/reject
      const maintApproveMatch = path.match(/\/asset-maintenances\/(\d+)\/approve/);
      const maintRejectMatch = path.match(/\/asset-maintenances\/(\d+)\/reject/);
      if (method === 'post' && maintApproveMatch) { const m = fakeMaint.find(x => x.id === Number(maintApproveMatch[1])); if (m) m.status = 'approved'; return { data: { message: 'Approved' }, status: 200, statusText: 'OK', headers: {}, config, request: {} }; }
      if (method === 'post' && maintRejectMatch) { const m = fakeMaint.find(x => x.id === Number(maintRejectMatch[1])); if (m) m.status = 'rejected'; return { data: { message: 'Rejected' }, status: 200, statusText: 'OK', headers: {}, config, request: {} }; }

      // Tickets list
      if (path.includes('/tickets')) return { data: { data: fakeTickets, meta: { current_page: 1, last_page: 1, total: fakeTickets.length }, open_count: fakeTickets.filter(t => t.status === 'open').length, in_progress_count: fakeTickets.filter(t => t.status === 'in_progress').length, closed_count: fakeTickets.filter(t => t.status === 'closed').length }, status: 200, statusText: 'OK', headers: {}, config, request: {} };

      // Assets list
      if (path.includes('/assets')) return { data: { data: fakeAssets, meta: { current_page: 1, last_page: 1, total: fakeAssets.length }, stats: { total: fakeAssets.length, active: 2, maintenance: 1, retired: 1 } }, status: 200, statusText: 'OK', headers: {}, config, request: {} };

      // Maintenance list
      if (path.includes('/asset-maintenances')) return { data: { data: fakeMaint, meta: { current_page: 1, last_page: 1, total: fakeMaint.length } }, status: 200, statusText: 'OK', headers: {}, config, request: {} };

      // Notifications
      if (path.includes('/notifications')) return { data: { data: [{ id: 1, data: { message: 'New ticket assigned: WiFi router down' }, created_at: new Date().toISOString(), read_at: null }, { id: 2, data: { message: 'Maintenance AST-NET-042 approved' }, created_at: new Date(Date.now() - 3600000).toISOString(), read_at: new Date().toISOString() }] }, status: 200, statusText: 'OK', headers: {}, config, request: {} };

      return { data: { data: [] }, status: 200, statusText: 'OK', headers: {}, config, request: {} };
    };

    return config;
  });
}

// ─── LIVE: attach token + handle 401 ──────────────────────────────────────────
api.interceptors.request.use((config) => {
  if (!IS_DEMO_MODE) {
    const token = localStorage.getItem('auth_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
