import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FiHome, FiUsers, FiTruck, FiBox, FiBarChart2, FiSettings, FiLogOut, FiSearch, FiMenu, FiX, FiFileText } from 'react-icons/fi';
import { api } from '../services/api';

const links = [
  { label: 'Dashboard', path: '/', icon: FiHome },
  { label: 'Customers', path: '/customers', icon: FiUsers },
  { label: 'Trips', path: '/trips', icon: FiTruck },
  { label: 'Consignments', path: '/consignments', icon: FiBox },
  { label: 'Freight Bills', path: '/freight-bills', icon: FiFileText },
  { label: 'Reports', path: '/reports', icon: FiBarChart2 },
  { label: 'Settings', path: '/settings', icon: FiSettings },
];

const Layout = () => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: searchResults } = useQuery({
    queryKey: ['global-search', query],
    queryFn: async () => (await api.get('/search', { params: { q: query } })).data,
    enabled: query.trim().length > 1,
  });

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-surface text-slate-900 lg:flex">
      {sidebarOpen && <button className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close menu" />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-primary p-5 text-white transition lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-2xl font-bold">Tanushree Logistics</div>
              <div className="mt-1 text-sm text-slate-300">Logistics Consignment System</div>
            </div>
            <button className="rounded-md p-2 text-slate-200 hover:bg-white/10 lg:hidden" onClick={() => setSidebarOpen(false)} title="Close menu">
              <FiX />
            </button>
          </div>
        </div>

        <nav className="space-y-2 flex-1">
          {links.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-4 py-3 transition ${
                    isActive ? 'bg-white text-primary shadow-lg' : 'text-slate-200 hover:bg-white/10'
                  }`
                }
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="text-xl" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <button
          onClick={handleLogout}
          className="mt-6 flex items-center gap-3 rounded-lg bg-slate-100 px-4 py-3 text-primary hover:bg-slate-200"
        >
          <FiLogOut className="text-xl" />
          Logout
        </button>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:px-6">
          <div className="flex items-center gap-4">
            <button className="rounded-md border border-slate-200 p-2 lg:hidden" onClick={() => setSidebarOpen(true)} title="Open menu">
              <FiMenu />
            </button>
            <div className="relative max-w-2xl flex-1">
              <FiSearch className="pointer-events-none absolute left-3 top-3 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search customer, LR, vehicle, GST, mobile..."
                className="w-full rounded-md border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm"
              />
              {query.length > 1 && searchResults && (
                <div className="absolute left-0 right-0 top-12 z-30 rounded-lg border border-slate-200 bg-white p-3 shadow-xl">
                  {['customers', 'trips', 'consignments'].map((key) => (
                    <div key={key} className="mb-2 last:mb-0">
                      <p className="mb-1 text-xs font-semibold uppercase text-slate-400">{key}</p>
                      {(searchResults[key] || []).slice(0, 3).map((item) => (
                        <button
                          key={item._id}
                          className="block w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-slate-50"
                          onClick={() => {
                            setQuery('');
                            navigate(key === 'trips' ? `/trips/${item._id}` : key === 'consignments' ? `/consignments/${item._id}` : '/customers');
                          }}
                        >
                          {item.companyName || item.tripNumber || item.lrNumber} <span className="text-slate-400">{item.vehicleNumber || item.phone || item.tripId?.tripNumber}</span>
                        </button>
                      ))}
                      {!searchResults[key]?.length && <p className="px-2 py-1 text-xs text-slate-400">No matches</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-900">{user?.name || 'Admin'}</p>
              <p className="text-xs text-slate-500">{user?.role || 'Admin'}</p>
            </div>
          </div>
        </header>
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
