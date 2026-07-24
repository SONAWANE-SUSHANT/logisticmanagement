import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiDownload, FiEye, FiPlus, FiSearch, FiTrash2 } from 'react-icons/fi';
import DataTable from '../components/DataTable';
import FormField, { inputClass } from '../components/FormField';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';
import { TripForm } from './TripsPage';
import { api, listParams } from '../services/api';
import { exportConsignmentsToExcel } from '../utils/consignmentExport';
import { asDateInput, formatCurrency, formatDate } from '../utils/formatters';

const today = new Date().toISOString().slice(0, 10);
const nowTime = new Date().toTimeString().slice(0, 5);

const blankConsignment = {
  bookingDate: today,
  bookingTime: nowTime,
  consignerId: '',
  consigneeId: '',
  tripId: '',
  invoiceNumber: '',
  invoiceDate: '',
  ewayBillNumber: '',
  ewayBillDate: '',
  ewayBillValidUpto: '',
  description: '',
  packageType: 'Boxes',
  packageCount: 1,
  dimensions: '',
  rate: 0,
  bookingMode: 'Paid',
  modeOfDelivery: 'Door Delivery',
  paymentMode: 'To Pay',
  deliveryDate: '',
  partNumber: '',
  partName: '',
  quantity: 0,
  privateMark: '',
  actualWeight: 0,
  chargeableWeight: 0,
  goodsValue: 0,
  freight: 0,
  collectionCharges: 0,
  doorDeliveryCharges: 0,
  hamali: 0,
  stCharges: 0,
  otherCharges: 0,
  insurance: 0,
  subTotal: 0,
  gst: 0,
  sgst: 0,
  cgst: 0,
  igst: 0,
  totalAmount: 0,
  status: 'Pending',
  remarks: '',
};

const ConsignmentForm = ({ customers, trips, initial = blankConsignment, onSubmit, onCancel, onNewTrip }) => {
  const normalizedInitial = {
    ...initial,
    bookingDate: asDateInput(initial.bookingDate),
    invoiceDate: asDateInput(initial.invoiceDate),
    ewayBillDate: asDateInput(initial.ewayBillDate),
    ewayBillValidUpto: asDateInput(initial.ewayBillValidUpto),
    deliveryDate: asDateInput(initial.deliveryDate),
  };
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({ defaultValues: normalizedInitial });
  const charges = watch(['freight', 'collectionCharges', 'doorDeliveryCharges', 'hamali', 'stCharges', 'otherCharges', 'insurance', 'sgst', 'cgst', 'igst']);
  const computedTotal = useMemo(() => charges.reduce((sum, value) => sum + Number(value || 0), 0), [charges]);

  const submit = (values) => {
    onSubmit({
      ...values,
      gst: Number(values.sgst || 0) + Number(values.cgst || 0) + Number(values.igst || 0),
      subTotal:
        Number(values.freight || 0) +
        Number(values.collectionCharges || 0) +
        Number(values.doorDeliveryCharges || 0) +
        Number(values.hamali || 0) +
        Number(values.stCharges || 0) +
        Number(values.otherCharges || 0) +
        Number(values.insurance || 0),
      totalAmount: Number(values.totalAmount || computedTotal),
    });
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Consigner" error={errors.consignerId}>
          <select className={inputClass} {...register('consignerId', { required: true })}>
            <option value="">Select consigner</option>
            {customers.map((customer) => <option key={customer._id} value={customer._id}>{customer.companyName}</option>)}
          </select>
        </FormField>
        <FormField label="Consignee" error={errors.consigneeId}>
          <select className={inputClass} {...register('consigneeId', { required: true })}>
            <option value="">Select consignee</option>
            {customers.map((customer) => <option key={customer._id} value={customer._id}>{customer.companyName}</option>)}
          </select>
        </FormField>
        <FormField label="Booking Date" error={errors.bookingDate}><input type="date" className={inputClass} {...register('bookingDate', { required: true })} /></FormField>
        <FormField label="Booking Time" error={errors.bookingTime}><input type="time" className={inputClass} {...register('bookingTime', { required: true })} /></FormField>
        <FormField label="Booking Mode"><select className={inputClass} {...register('bookingMode')}><option>Paid</option><option>To Pay</option><option>Credit</option></select></FormField>
        <FormField label="Mode of Delivery"><select className={inputClass} {...register('modeOfDelivery')}><option>Door Delivery</option><option>Godown Delivery</option><option>Pickup</option></select></FormField>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr,auto] md:items-end">
        <FormField label="Assign Trip" error={errors.tripId}>
          <select className={inputClass} {...register('tripId', { required: true })}>
            <option value="">Select active trip</option>
            {trips.filter((trip) => trip.status !== 'Completed').map((trip) => (
              <option key={trip._id} value={trip._id}>{trip.tripNumber} - {trip.vehicleNumber} - {trip.from} to {trip.to}</option>
            ))}
          </select>
        </FormField>
        <button type="button" onClick={onNewTrip} className="rounded-md border border-slate-200 px-4 py-2.5 font-semibold text-slate-700">Create New Trip</button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          ['invoiceNumber', 'Invoice Number', 'text'],
          ['invoiceDate', 'Invoice Date', 'date'],
          ['ewayBillNumber', 'E-Way Bill Number', 'text'],
          ['ewayBillDate', 'E-Way Bill Date', 'date'],
          ['ewayBillValidUpto', 'E-Way Valid Upto', 'date'],
          ['deliveryDate', 'Delivery Date', 'date'],
          ['paymentMode', 'Payment Mode', 'text'],
          ['packageType', 'Package Type', 'text'],
          ['packageCount', 'Packages', 'number'],
          ['dimensions', 'Dimensions', 'text'],
          ['rate', 'Rate', 'number'],
          ['partNumber', 'Part Number', 'text'],
          ['partName', 'Part Name', 'text'],
          ['quantity', 'Quantity', 'number'],
          ['privateMark', 'Private Mark', 'text'],
          ['actualWeight', 'Actual Weight', 'number'],
          ['chargeableWeight', 'Chargeable Weight', 'number'],
          ['goodsValue', 'Goods Value', 'number'],
          ['freight', 'Freight', 'number'],
          ['collectionCharges', 'Collection Charges', 'number'],
          ['doorDeliveryCharges', 'Door Delivery Charges', 'number'],
          ['hamali', 'Hamali', 'number'],
          ['stCharges', 'Station Charges', 'number'],
          ['otherCharges', 'Other Charges', 'number'],
          ['insurance', 'Insurance', 'number'],
          ['subTotal', 'Sub Total', 'number'],
          ['sgst', 'SGST', 'number'],
          ['cgst', 'CGST', 'number'],
          ['igst', 'IGST', 'number'],
          ['totalAmount', 'Total Amount', 'number'],
        ].map(([name, label, type]) => (
          <FormField key={name} label={label}>
            <input
              type={type}
              className={inputClass}
              {...register(name)}
              onBlur={() => {
                if (['freight', 'collectionCharges', 'doorDeliveryCharges', 'hamali', 'stCharges', 'otherCharges', 'insurance', 'sgst', 'cgst', 'igst'].includes(name)) {
                  setValue('subTotal',
                    Number(watch('freight') || 0) +
                    Number(watch('collectionCharges') || 0) +
                    Number(watch('doorDeliveryCharges') || 0) +
                    Number(watch('hamali') || 0) +
                    Number(watch('stCharges') || 0) +
                    Number(watch('otherCharges') || 0) +
                    Number(watch('insurance') || 0)
                  );
                  setValue('totalAmount', computedTotal);
                }
              }}
            />
          </FormField>
        ))}
        <FormField label="Status">
          <select className={inputClass} {...register('status')}>
            <option>Pending</option>
            <option>In Transit</option>
            <option>Delivered</option>
          </select>
        </FormField>
      </div>

      <FormField label="Description of Goods"><textarea rows="3" className={inputClass} {...register('description')} /></FormField>
      <FormField label="Remarks"><textarea rows="2" className={inputClass} {...register('remarks')} /></FormField>
      <div className="flex justify-between gap-3 border-t border-slate-200 pt-4">
        <span className="text-sm text-slate-500">Calculated charges: <strong className="text-slate-900">{formatCurrency(computedTotal)}</strong></span>
        <div className="flex gap-3">
          <button type="button" onClick={onCancel} className="rounded-md border border-slate-200 px-4 py-2 text-slate-700">Cancel</button>
          <button className="rounded-md bg-accent px-4 py-2 font-semibold text-white">Generate LR & Save</button>
        </div>
      </div>
    </form>
  );
};

const ConsignmentsPage = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [editing, setEditing] = useState(null);
  const [tripModal, setTripModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['consignments', page, search, status],
    queryFn: async () => (await api.get('/consignments', { params: listParams({ page, search, status }) })).data,
  });
  const { data: customerData } = useQuery({ queryKey: ['customers', 'all'], queryFn: async () => (await api.get('/customers', { params: { limit: 100 } })).data });
  const { data: tripData } = useQuery({ queryKey: ['trips', 'all'], queryFn: async () => (await api.get('/trips', { params: { limit: 100 } })).data });

  const saveConsignment = useMutation({
    mutationFn: async (payload) => editing?._id ? (await api.put(`/consignments/${editing._id}`, payload)).data : (await api.post('/consignments', payload)).data,
    onSuccess: () => {
      toast.success(editing?._id ? 'Consignment updated' : 'LR generated');
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ['consignments'] });
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Could not save consignment'),
  });

  const createTrip = useMutation({
    mutationFn: async (payload) => (await api.post('/trips', payload)).data,
    onSuccess: (trip) => {
      toast.success(`Trip ${trip.tripNumber} created`);
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      setTripModal(false);
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Could not create trip'),
  });

  const deleteConsignment = useMutation({
    mutationFn: async (id) => (await api.delete(`/consignments/${id}`)).data,
    onSuccess: () => {
      toast.success('Consignment deleted');
      queryClient.invalidateQueries({ queryKey: ['consignments'] });
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Could not delete consignment'),
  });

  const exportFiltered = async () => {
    try {
      const response = await api.get('/consignments', { params: listParams({ page: 1, limit: 1000, search, status }) });
      await exportConsignmentsToExcel(response.data.consignments || []);
      toast.success('Excel export ready');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not export consignments');
    }
  };

  const columns = [
    { key: 'lrNumber', label: 'LR Number' },
    { key: 'consigner', label: 'Consigner', render: (row) => row.consignerId?.companyName },
    { key: 'consignee', label: 'Consignee', render: (row) => row.consigneeId?.companyName },
    { key: 'trip', label: 'Trip', render: (row) => row.tripId?.tripNumber },
    { key: 'bookingDate', label: 'Booking', render: (row) => formatDate(row.bookingDate) },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge value={row.status} /> },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <Link to={`/consignments/${row._id}`} className="rounded-md border border-slate-200 p-2 text-slate-700" title="View LR"><FiEye /></Link>
          <button onClick={() => setEditing({ ...row, consignerId: row.consignerId?._id, consigneeId: row.consigneeId?._id, tripId: row.tripId?._id })} className="rounded-md border border-slate-200 px-3 py-1.5 text-slate-700">Edit</button>
          <button onClick={() => window.confirm('Delete this consignment?') && deleteConsignment.mutate(row._id)} className="rounded-md border border-red-200 p-2 text-red-600" title="Delete consignment"><FiTrash2 /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Consignments"
        description="Create LR records, assign active trips, and track shipment status."
        action={<div className="flex flex-col gap-2 sm:flex-row">
          <button onClick={exportFiltered} className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 px-4 py-2.5 font-semibold text-slate-700"><FiDownload /> Export Excel</button>
          <button onClick={() => setEditing(blankConsignment)} className="inline-flex items-center justify-center gap-2 rounded-md bg-accent px-4 py-2.5 font-semibold text-white"><FiPlus /> New Consignment</button>
        </div>}
      />
      <section className="space-y-4 rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="grid gap-3 md:grid-cols-[1fr,220px]">
          <div className="relative">
            <FiSearch className="absolute left-3 top-3 text-slate-400" />
            <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search LR, invoice, e-way bill..." className={`${inputClass} pl-10`} />
          </div>
          <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className={inputClass}>
            <option value="">All Status</option>
            <option>Pending</option>
            <option>In Transit</option>
            <option>Delivered</option>
          </select>
        </div>
        {isLoading ? <div className="text-sm text-slate-500">Loading consignments...</div> : <DataTable columns={columns} rows={data?.consignments || []} />}
        <Pagination page={data?.page || page} pages={data?.pages || 1} onPage={setPage} />
      </section>
      {editing && (
        <Modal title={editing._id ? 'Edit Consignment' : 'Create Consignment LR'} onClose={() => setEditing(null)} width="max-w-5xl">
          <ConsignmentForm customers={customerData?.customers || []} trips={tripData?.trips || []} initial={editing} onCancel={() => setEditing(null)} onNewTrip={() => setTripModal(true)} onSubmit={(values) => saveConsignment.mutate(values)} />
        </Modal>
      )}
      {tripModal && (
        <Modal title="Create Trip" onClose={() => setTripModal(false)}>
          <TripForm onCancel={() => setTripModal(false)} onSubmit={(values) => createTrip.mutate(values)} />
        </Modal>
      )}
    </div>
  );
};

export default ConsignmentsPage;
