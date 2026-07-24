import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FiArrowUpRight, FiPackage, FiPlus, FiTrendingUp, FiTruck, FiUsers } from 'react-icons/fi';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import StatusBadge from '../components/StatusBadge';
import { api } from '../services/api';
import { formatDate } from '../utils/formatters';

const colors = ['#2563eb', '#0f766e', '#f59e0b', '#16a34a'];

const DashboardPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get('/dashboard')).data,
  });

  const stats = [
    { label: 'Total Customers', value: data?.stats?.totalCustomers || 0, icon: FiUsers },
    { label: 'Total Trips', value: data?.stats?.totalTrips || 0, icon: FiTruck },
    { label: 'To Be Gone Trips', value: data?.stats?.toBeGoneTrips || 0, icon: FiArrowUpRight },
    { label: 'Ongoing Trips', value: data?.stats?.ongoingTrips || 0, icon: FiTrendingUp },
    { label: 'Completed Trips', value: data?.stats?.completedTrips || 0, icon: FiPackage },
    { label: 'Total Consignments', value: data?.stats?.totalConsignments || 0, icon: FiPackage },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Live operational summary for customers, trips, and LR consignments.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{item.label}</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-950">{isLoading ? '-' : item.value}</p>
                </div>
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <Icon className="text-xl" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr,1fr]">
        <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold text-slate-950">Monthly Consignments & Trips</h2>
          <div className="mt-5 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.monthly || []} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Line type="monotone" dataKey="consignments" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="trips" stroke="#0f766e" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-lg font-semibold text-slate-950">Trip Status Distribution</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data?.tripStatusDistribution || []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={88} innerRadius={48}>
                    {(data?.tripStatusDistribution || []).map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>
          <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-lg font-semibold text-slate-950">Quick Actions</h2>
            <div className="mt-4 grid gap-3">
              <Link to="/trips" className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 font-semibold text-white"><FiPlus /> Create Trip</Link>
              <Link to="/consignments" className="inline-flex items-center justify-center gap-2 rounded-md bg-accent px-4 py-3 font-semibold text-white"><FiPlus /> Create Consignment</Link>
              <Link to="/customers" className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 px-4 py-3 font-semibold text-slate-700"><FiPlus /> Add Customer</Link>
            </div>
          </section>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Activity title="Recent Trips" rows={data?.recentTrips || []} render={(item) => <><Link className="font-semibold text-accent" to={`/trips/${item._id}`}>{item.tripNumber}</Link><span>{item.vehicleNumber}</span><StatusBadge value={item.status} /></>} />
        <Activity title="Recent Consignments" rows={data?.recentConsignments || []} render={(item) => <><Link className="font-semibold text-accent" to={`/consignments/${item._id}`}>{item.lrNumber}</Link><span>{item.consignerId?.companyName} to {item.consigneeId?.companyName}</span><span>{item.tripId?.tripNumber}</span></>} />
        <Activity title="Recently Added Customers" rows={data?.recentCustomers || []} render={(item) => <><span className="font-semibold text-slate-950">{item.companyName}</span><span>{item.customerCode}</span><span>{formatDate(item.createdAt)}</span></>} />
      </div>
    </div>
  );
};

const Activity = ({ title, rows, render }) => (
  <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200">
    <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
    <div className="mt-4 divide-y divide-slate-100">
      {rows.length ? rows.map((item) => <div key={item._id} className="grid gap-1 py-3 text-sm text-slate-500">{render(item)}</div>) : <p className="py-6 text-sm text-slate-500">No activity yet</p>}
    </div>
  </section>
);

export default DashboardPage;

