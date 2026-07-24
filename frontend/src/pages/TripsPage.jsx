import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiEye, FiPlus, FiSearch, FiTrash2 } from 'react-icons/fi';
import DataTable from '../components/DataTable';
import FormField, { inputClass } from '../components/FormField';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';
import { api, listParams } from '../services/api';
import { asDateInput, formatDate } from '../utils/formatters';

const blankTrip = { vehicleNumber: '', from: '', to: '', departureDate: '', expectedArrival: '', status: 'To Be Gone', remarks: '' };

export const TripForm = ({ initial = blankTrip, onSubmit, onCancel }) => {
  const normalizedInitial = {
    ...initial,
    departureDate: asDateInput(initial.departureDate),
    expectedArrival: asDateInput(initial.expectedArrival),
  };
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: normalizedInitial });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        {[
          ['vehicleNumber', 'Vehicle Number', 'text'],
          ['from', 'From Location', 'text'],
          ['to', 'Destination', 'text'],
          ['departureDate', 'Departure Date', 'date'],
          ['expectedArrival', 'Expected Arrival', 'date'],
        ].map(([name, label, type]) => (
          <FormField key={name} label={label} error={errors[name]}>
            <input type={type} className={inputClass} {...register(name, { required: true })} />
          </FormField>
        ))}
        <FormField label="Status">
          <select className={inputClass} {...register('status')}>
            <option>To Be Gone</option>
            <option>Ongoing</option>
            <option>Completed</option>
          </select>
        </FormField>
      </div>
      <FormField label="Remarks">
        <textarea rows="3" className={inputClass} {...register('remarks')} />
      </FormField>
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="rounded-md border border-slate-200 px-4 py-2 text-slate-700">Cancel</button>
        <button className="rounded-md bg-accent px-4 py-2 font-semibold text-white">Save Trip</button>
      </div>
    </form>
  );
};

const TripsPage = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [editing, setEditing] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['trips', page, search, status],
    queryFn: async () => (await api.get('/trips', { params: listParams({ page, search, status }) })).data,
  });

  const saveTrip = useMutation({
    mutationFn: async (payload) => editing?._id ? (await api.put(`/trips/${editing._id}`, payload)).data : (await api.post('/trips', payload)).data,
    onSuccess: () => {
      toast.success(editing?._id ? 'Trip updated' : 'Trip created');
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Could not save trip'),
  });

  const deleteTrip = useMutation({
    mutationFn: async (id) => (await api.delete(`/trips/${id}`)).data,
    onSuccess: () => {
      toast.success('Trip deleted');
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Could not delete trip'),
  });

  const columns = [
    { key: 'tripNumber', label: 'Trip Number' },
    { key: 'vehicleNumber', label: 'Vehicle' },
    { key: 'route', label: 'Route', render: (row) => `${row.from} to ${row.to}` },
    { key: 'departureDate', label: 'Departure', render: (row) => formatDate(row.departureDate) },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge value={row.status} /> },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <Link to={`/trips/${row._id}`} className="rounded-md border border-slate-200 p-2 text-slate-700" title="View trip"><FiEye /></Link>
          <button onClick={() => setEditing(row)} className="rounded-md border border-slate-200 px-3 py-1.5 text-slate-700">Edit</button>
          <button onClick={() => window.confirm('Delete this trip?') && deleteTrip.mutate(row._id)} className="rounded-md border border-red-200 p-2 text-red-600" title="Delete trip"><FiTrash2 /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Trips" description="Each dispatch gets its own trip history and consignment list." action={<button onClick={() => setEditing(blankTrip)} className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2.5 font-semibold text-white"><FiPlus /> Create Trip</button>} />
      <section className="space-y-4 rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="grid gap-3 md:grid-cols-[1fr,220px]">
          <div className="relative">
            <FiSearch className="absolute left-3 top-3 text-slate-400" />
            <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search trip, vehicle, route..." className={`${inputClass} pl-10`} />
          </div>
          <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className={inputClass}>
            <option value="">All Status</option>
            <option>To Be Gone</option>
            <option>Ongoing</option>
            <option>Completed</option>
          </select>
        </div>
        {isLoading ? <div className="text-sm text-slate-500">Loading trips...</div> : <DataTable columns={columns} rows={data?.trips || []} />}
        <Pagination page={data?.page || page} pages={data?.pages || 1} onPage={setPage} />
      </section>
      {editing && (
        <Modal title={editing._id ? 'Edit Trip' : 'Create Trip'} onClose={() => setEditing(null)}>
          <TripForm initial={editing} onCancel={() => setEditing(null)} onSubmit={(values) => saveTrip.mutate(values)} />
        </Modal>
      )}
    </div>
  );
};

export default TripsPage;
