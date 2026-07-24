import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FiDownload, FiFileText } from 'react-icons/fi';
import DataTable from '../components/DataTable';
import FormField, { inputClass } from '../components/FormField';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { api, listParams } from '../services/api';
import { formatDate } from '../utils/formatters';

const reportMap = {
  customers: '/reports/customers',
  trips: '/reports/trips',
  vehicles: '/reports/vehicles',
  pending: '/reports/consignments',
  completed: '/reports/consignments',
};

const ReportsPage = () => {
  const [filters, setFilters] = useState({ type: 'customers', startDate: '', endDate: '', status: '' });
  const params = listParams({
    startDate: filters.startDate,
    endDate: filters.endDate,
    status: filters.type === 'pending' ? 'Pending' : filters.type === 'completed' ? 'Delivered' : filters.status,
  });

  const { data: summary } = useQuery({ queryKey: ['reports-summary'], queryFn: async () => (await api.get('/reports/summary')).data });
  const { data } = useQuery({
    queryKey: ['report', filters],
    queryFn: async () => (await api.get(reportMap[filters.type], { params })).data,
  });

  const rows = data?.customers || data?.trips || data?.vehicles || data?.consignments || [];
  const columns = filters.type === 'customers'
    ? [{ key: 'customerCode', label: 'Code' }, { key: 'companyName', label: 'Company' }, { key: 'phone', label: 'Mobile' }, { key: 'city', label: 'City' }]
    : filters.type === 'trips'
      ? [{ key: 'tripNumber', label: 'Trip' }, { key: 'vehicleNumber', label: 'Vehicle' }, { key: 'route', label: 'Route', render: (row) => `${row.from} to ${row.to}` }, { key: 'status', label: 'Status', render: (row) => <StatusBadge value={row.status} /> }]
      : filters.type === 'vehicles'
        ? [{ key: '_id', label: 'Vehicle' }, { key: 'trips', label: 'Trips' }]
        : [{ key: 'lrNumber', label: 'LR' }, { key: 'consigner', label: 'Consigner', render: (row) => row.consignerId?.companyName }, { key: 'trip', label: 'Trip', render: (row) => row.tripId?.tripNumber }, { key: 'bookingDate', label: 'Booking', render: (row) => formatDate(row.bookingDate) }, { key: 'status', label: 'Status', render: (row) => <StatusBadge value={row.status} /> }];

  const exportCsv = () => {
    const csv = [columns.map((column) => column.label).join(','), ...rows.map((row) => columns.map((column) => JSON.stringify(column.render ? String(column.render(row)?.props?.children || '') : row[column.key] || '')).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filters.type}-report.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Generate customer, trip, vehicle, date-wise, pending, and completed reports." action={<button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2.5 font-semibold text-white"><FiDownload /> Export Excel</button>} />
      <section className="grid gap-4 md:grid-cols-4">
        {[
          ['Customers', summary?.customerCount || 0],
          ['Trips', summary?.tripCount || 0],
          ['Pending LR', summary?.pendingConsignments || 0],
          ['Completed LR', summary?.completedConsignments || 0],
        ].map(([label, value]) => <div key={label} className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p></div>)}
      </section>
      <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="mb-5 grid gap-4 lg:grid-cols-4">
          <FormField label="Report Type">
            <select className={inputClass} value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value })}>
              <option value="customers">Customer Report</option>
              <option value="trips">Trip Report</option>
              <option value="vehicles">Vehicle Report</option>
              <option value="pending">Pending Consignments</option>
              <option value="completed">Completed Consignments</option>
            </select>
          </FormField>
          <FormField label="Start Date"><input type="date" className={inputClass} value={filters.startDate} onChange={(event) => setFilters({ ...filters, startDate: event.target.value })} /></FormField>
          <FormField label="End Date"><input type="date" className={inputClass} value={filters.endDate} onChange={(event) => setFilters({ ...filters, endDate: event.target.value })} /></FormField>
          <div className="flex items-end"><button onClick={() => window.print()} className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-slate-200 px-4 py-2.5 font-semibold text-slate-700"><FiFileText /> Export PDF</button></div>
        </div>
        <DataTable columns={columns} rows={rows} emptyText="No report records found" />
      </section>
    </div>
  );
};

export default ReportsPage;
