import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { api } from '../services/api';
import { formatDate } from '../utils/formatters';

const TripDetailsPage = () => {
  const { id } = useParams();
  const { data, isLoading } = useQuery({ queryKey: ['trip', id], queryFn: async () => (await api.get(`/trips/${id}`)).data });
  if (isLoading) return <div className="text-sm text-slate-500">Loading trip details...</div>;
  const { trip, consignments, stats } = data;

  const columns = [
    { key: 'lrNumber', label: 'LR Number', render: (row) => <Link className="font-semibold text-accent" to={`/consignments/${row._id}`}>{row.lrNumber}</Link> },
    { key: 'consigner', label: 'Consigner', render: (row) => row.consignerId?.companyName },
    { key: 'consignee', label: 'Consignee', render: (row) => row.consigneeId?.companyName },
    { key: 'destination', label: 'Destination', render: () => trip.to },
    { key: 'weight', label: 'Weight', render: (row) => row.chargeableWeight || row.actualWeight || 0 },
    { key: 'packages', label: 'Packages', render: (row) => row.packageCount || 0 },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge value={row.status} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={trip.tripNumber} description={`${trip.vehicleNumber} - ${trip.from} to ${trip.to}`} action={<StatusBadge value={trip.status} />} />
      <section className="grid gap-4 md:grid-cols-3">
        {[
          ['Total Consignments', stats.totalConsignments],
          ['Total Packages', stats.totalPackages],
          ['Total Weight', `${stats.totalWeight} kg`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
          </div>
        ))}
      </section>
      <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="mb-5 grid gap-3 text-sm text-slate-600 md:grid-cols-4">
          <div><span className="block text-slate-400">Departure</span>{formatDate(trip.departureDate)}</div>
          <div><span className="block text-slate-400">Expected Arrival</span>{formatDate(trip.expectedArrival)}</div>
          <div><span className="block text-slate-400">Vehicle</span>{trip.vehicleNumber}</div>
          <div><span className="block text-slate-400">Remarks</span>{trip.remarks || '-'}</div>
        </div>
        <DataTable columns={columns} rows={consignments} emptyText="No consignments assigned to this trip yet" />
      </section>
    </div>
  );
};

export default TripDetailsPage;
