import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BlobProvider, PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import toast from 'react-hot-toast';
import { FiDownload, FiEye, FiExternalLink, FiFileText, FiSearch, FiTrash2 } from 'react-icons/fi';
import DataTable from '../components/DataTable';
import FreightBillPdf from '../components/FreightBillPdf';
import FormField, { inputClass } from '../components/FormField';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import Pagination from '../components/Pagination';
import { api, listParams } from '../services/api';
import { formatDate } from '../utils/formatters';
import { ConsignmentForm } from './ConsignmentsPage';
import { TripForm } from './TripsPage';

const today = new Date().toISOString().slice(0, 10);
const money = (value = 0) =>
  new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value || 0));
const displayBillStatus = (value) => (value === 'Bill Generated' ? 'Bill Generated' : 'Not Billed');
const displayPaymentStatus = (row) => (displayBillStatus(row.billStatus) === 'Bill Generated' ? row.paymentStatus || 'Pending' : '-');

const pdfFileName = (bill) => `Freight-Bill-${String(bill?.billNumber || 'Draft').replace(/[^\w.-]+/g, '-')}.pdf`;

const PdfActions = ({ bill }) => (
  <div className="flex flex-wrap gap-2">
    <PDFDownloadLink
      document={<FreightBillPdf bill={bill} />}
      fileName={pdfFileName(bill)}
      className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2.5 font-semibold text-white"
    >
      {({ loading }) => <><FiDownload /> {loading ? 'Preparing PDF...' : 'Download PDF'}</>}
    </PDFDownloadLink>
    <BlobProvider document={<FreightBillPdf bill={bill} />}>
      {({ url, loading }) => (
        <a
          href={url || undefined}
          target="_blank"
          rel="noreferrer"
          className={`inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 font-semibold text-white ${loading || !url ? 'pointer-events-none opacity-60' : ''}`}
        >
          <FiExternalLink /> {loading ? 'Preparing...' : 'Open / Print'}
        </a>
      )}
    </BlobProvider>
  </div>
);

const PdfPreview = ({ bill }) => (
  <div className="h-[78vh] overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
    <PDFViewer width="100%" height="100%" showToolbar>
      <FreightBillPdf bill={bill} />
    </PDFViewer>
  </div>
);

const FreightBillDetails = ({ id }) => {
  const { data, isLoading } = useQuery({ queryKey: ['freight-bill', id], queryFn: async () => (await api.get(`/freight-bills/${id}`)).data });
  if (isLoading) return <div className="text-sm text-slate-500">Loading freight bill...</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Freight Bill ${data.billNumber}`}
        description={`${data.customerSnapshot?.companyName} | ${formatDate(data.fromDate)} to ${formatDate(data.toDate)}`}
        action={<div className="flex flex-wrap gap-2">
          <Link to="/freight-bills" className="rounded-md border border-slate-200 px-4 py-2.5 font-semibold text-slate-700">Back</Link>
          <PdfActions bill={data} />
        </div>}
      />
      <section className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <PdfPreview bill={data} />
      </section>
    </div>
  );
};

const FreightBillsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ customerId: '', fromDate: today, toDate: today, ratePerKg: '', cgstRate: 9, sgstRate: 9, igstRate: 0 });
  const [selectedConsignmentIds, setSelectedConsignmentIds] = useState([]);
  const [editingConsignment, setEditingConsignment] = useState(null);
  const [tripModal, setTripModal] = useState(false);
  const [preview, setPreview] = useState(null);

  const { data: customerData } = useQuery({ queryKey: ['customers', 'freight-bill'], queryFn: async () => (await api.get('/customers', { params: { limit: 500, sort: 'companyName' } })).data });
  const { data: tripData } = useQuery({ queryKey: ['trips', 'freight-bill-edit'], queryFn: async () => (await api.get('/trips', { params: { limit: 500 } })).data });
  const { data: consignmentData, isFetching: isFetchingConsignments } = useQuery({
    queryKey: ['freight-bill-consignments', filters.customerId, filters.fromDate, filters.toDate],
    queryFn: async () => (await api.get('/freight-bills/consignments', { params: listParams({ customerId: filters.customerId, fromDate: filters.fromDate, toDate: filters.toDate }) })).data,
    enabled: Boolean(filters.customerId && filters.fromDate && filters.toDate),
  });
  const { data, isLoading } = useQuery({
    queryKey: ['freight-bills', page, search],
    queryFn: async () => (await api.get('/freight-bills', { params: listParams({ page, search }) })).data,
  });

  const selectedCustomer = useMemo(
    () => (customerData?.customers || []).find((customer) => customer._id === filters.customerId),
    [customerData, filters.customerId]
  );

  const billConsignments = consignmentData?.consignments || [];
  const selectableConsignments = billConsignments.filter((item) => item.canSelectForBill !== false && displayBillStatus(item.billStatus) !== 'Bill Generated');
  const allConsignmentsSelected = selectableConsignments.length > 0 && selectedConsignmentIds.length === selectableConsignments.length;
  const ratePerKg = Number(filters.ratePerKg || 0);

  useEffect(() => {
    setSelectedConsignmentIds([]);
    setPreview(null);
  }, [filters.customerId, filters.fromDate, filters.toDate]);

  const updateFilter = (name, value) => {
    setFilters((current) => ({ ...current, [name]: value }));
    if (!['customerId', 'fromDate', 'toDate'].includes(name)) {
      setPreview(null);
    }
  };

  const toggleConsignment = (consignmentId) => {
    const consignment = billConsignments.find((item) => item._id === consignmentId);
    if (!consignment || consignment.canSelectForBill === false || displayBillStatus(consignment.billStatus) === 'Bill Generated') return;
    setPreview(null);
    setSelectedConsignmentIds((current) =>
      current.includes(consignmentId) ? current.filter((idValue) => idValue !== consignmentId) : [...current, consignmentId]
    );
  };

  const toggleAllConsignments = () => {
    setPreview(null);
    setSelectedConsignmentIds(allConsignmentsSelected ? [] : selectableConsignments.map((item) => item._id));
  };

  const billPayload = () => ({
    ...filters,
    ratePerKg,
    consignmentIds: selectedConsignmentIds,
  });

  const previewBill = useMutation({
    mutationFn: async () => (await api.post('/freight-bills/preview', billPayload())).data,
    onSuccess: (bill) => {
      setPreview({ ...bill, billDate: today, billNumber: 'Draft' });
      toast.success(`${bill.lineItems.length} LR records loaded`);
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Could not preview bill'),
  });

  const createBill = useMutation({
    mutationFn: async () => (await api.post('/freight-bills', billPayload())).data,
    onSuccess: (bill) => {
      toast.success(`Freight bill ${bill.billNumber} generated`);
      queryClient.invalidateQueries({ queryKey: ['freight-bills'] });
      navigate(`/freight-bills/${bill._id}`);
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Could not generate bill'),
  });

  const deleteBill = useMutation({
    mutationFn: async (billId) => (await api.delete(`/freight-bills/${billId}`)).data,
    onSuccess: () => {
      toast.success('Freight bill deleted');
      queryClient.invalidateQueries({ queryKey: ['freight-bills'] });
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Could not delete bill'),
  });

  const markBillPaid = useMutation({
    mutationFn: async (billId) => (await api.post(`/freight-bills/${billId}/mark-paid`)).data,
    onSuccess: (bill) => {
      toast.success(`Freight bill ${bill.billNumber} marked as paid`);
      queryClient.invalidateQueries({ queryKey: ['freight-bills'] });
      queryClient.invalidateQueries({ queryKey: ['freight-bill-consignments'] });
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Could not mark bill as paid'),
  });

  const loadConsignmentForEdit = useMutation({
    mutationFn: async (consignmentId) => (await api.get(`/consignments/${consignmentId}`)).data,
    onSuccess: (consignment) => {
      setEditingConsignment({
        ...consignment,
        consignerId: consignment.consignerId?._id,
        consigneeId: consignment.consigneeId?._id,
        tripId: consignment.tripId?._id,
      });
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Could not load consignment'),
  });

  const saveConsignment = useMutation({
    mutationFn: async (payload) => (await api.put(`/consignments/${editingConsignment._id}`, payload)).data,
    onSuccess: () => {
      toast.success('Consignment updated');
      setEditingConsignment(null);
      setPreview(null);
      queryClient.invalidateQueries({ queryKey: ['freight-bill-consignments'] });
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Could not save consignment'),
  });

  const createTrip = useMutation({
    mutationFn: async (payload) => (await api.post('/trips', payload)).data,
    onSuccess: (trip) => {
      toast.success(`Trip ${trip.tripNumber} created`);
      queryClient.invalidateQueries({ queryKey: ['trips', 'freight-bill-edit'] });
      setTripModal(false);
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Could not create trip'),
  });

  const rows = data?.freightBills || [];
  const columns = [
    { key: 'billNumber', label: 'Bill No.' },
    { key: 'customer', label: 'Customer', render: (row) => row.customerSnapshot?.companyName },
    { key: 'period', label: 'Period', render: (row) => `${formatDate(row.fromDate)} - ${formatDate(row.toDate)}` },
    { key: 'items', label: 'LRs', render: (row) => row.lineItems?.length || 0 },
    { key: 'status', label: 'Status', render: (row) => row.status || 'Generated' },
    { key: 'total', label: 'Grand Total', render: (row) => `Rs. ${money(row.grandTotal)}` },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <Link to={`/freight-bills/${row._id}`} className="rounded-md border border-slate-200 p-2 text-slate-700" title="View bill"><FiEye /></Link>
          {row.status !== 'Paid' && <button onClick={() => markBillPaid.mutate(row._id)} disabled={markBillPaid.isPending} className="rounded-md border border-emerald-200 px-3 py-1.5 text-emerald-700 disabled:opacity-50">Mark as Paid</button>}
          <button onClick={() => window.confirm('Delete this freight bill?') && deleteBill.mutate(row._id)} className="rounded-md border border-red-200 p-2 text-red-600" title="Delete bill"><FiTrash2 /></button>
        </div>
      ),
    },
  ];

  const consignmentColumns = [
    {
      key: 'select',
      label: (
        <input
          type="checkbox"
          checked={allConsignmentsSelected}
          onChange={toggleAllConsignments}
          disabled={!selectableConsignments.length}
          className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
          title="Select all consignments"
        />
      ),
      render: (row) => {
        const isBilled = displayBillStatus(row.billStatus) === 'Bill Generated' || row.canSelectForBill === false;
        return (
        <input
          type="checkbox"
          checked={selectedConsignmentIds.includes(row._id)}
          onChange={() => toggleConsignment(row._id)}
          disabled={isBilled}
          className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
          title={isBilled ? `${row.lrNumber} already billed` : `Select ${row.lrNumber}`}
        />
      );
      },
    },
    { key: 'lrNumber', label: 'LR Number' },
    { key: 'bookingDate', label: 'Date', render: (row) => formatDate(row.bookingDate) },
    { key: 'consigner', label: 'Consigner' },
    { key: 'consignee', label: 'Consignee' },
    { key: 'route', label: 'Route', render: (row) => [row.from, row.to].filter(Boolean).join(' - ') || '-' },
    { key: 'billStatus', label: 'Bill Status', render: (row) => displayBillStatus(row.billStatus) },
    { key: 'paymentStatus', label: 'Payment Status', render: (row) => displayPaymentStatus(row) },
    { key: 'chargeableWeight', label: 'Chargeable Wt.', render: (row) => money(row.chargeableWeight) },
    { key: 'freight', label: 'Bill Freight', render: (row) => `Rs. ${money(Number(row.chargeableWeight || 0) * ratePerKg)}` },
    { key: 'storedFreight', label: 'Stored Freight', render: (row) => `Rs. ${money(row.storedFreight)}` },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <button
          onClick={() => loadConsignmentForEdit.mutate(row._id)}
          disabled={loadConsignmentForEdit.isPending}
          className="rounded-md border border-slate-200 px-3 py-1.5 text-slate-700 disabled:opacity-50"
        >
          Edit
        </button>
      ),
    },
  ];

  if (id) return <FreightBillDetails id={id} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Freight Bills" description="Generate consolidated customer bills from LR records and manage saved printable copies." />

      <section className="space-y-4 rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="grid gap-4 md:grid-cols-5">
          <FormField label="Customer">
            <select className={inputClass} value={filters.customerId} onChange={(event) => updateFilter('customerId', event.target.value)}>
              <option value="">Select customer</option>
              {(customerData?.customers || []).map((customer) => <option key={customer._id} value={customer._id}>{customer.companyName}</option>)}
            </select>
          </FormField>
          <FormField label="From Date">
            <input type="date" className={inputClass} value={filters.fromDate} onChange={(event) => updateFilter('fromDate', event.target.value)} />
          </FormField>
          <FormField label="To Date">
            <input type="date" className={inputClass} value={filters.toDate} onChange={(event) => updateFilter('toDate', event.target.value)} />
          </FormField>
          <FormField label="Rate Per Kg">
            <input type="number" min="0" step="0.01" className={inputClass} value={filters.ratePerKg} onChange={(event) => updateFilter('ratePerKg', event.target.value)} placeholder="0.00" />
          </FormField>
          <FormField label="GST Rates">
            <div className="grid grid-cols-3 gap-2">
              <input type="number" className={inputClass} value={filters.cgstRate} onChange={(event) => updateFilter('cgstRate', event.target.value)} title="CGST %" />
              <input type="number" className={inputClass} value={filters.sgstRate} onChange={(event) => updateFilter('sgstRate', event.target.value)} title="SGST %" />
              <input type="number" className={inputClass} value={filters.igstRate} onChange={(event) => updateFilter('igstRate', event.target.value)} title="IGST %" />
            </div>
          </FormField>
        </div>
        <div className="flex flex-wrap justify-between gap-3 border-t border-slate-200 pt-4">
          <p className="text-sm text-slate-500">
            {selectedCustomer ? `${selectedConsignmentIds.length} of ${billConsignments.length} LR records selected for ${selectedCustomer.companyName}.` : 'Select a customer and billing period to load matching LR records.'}
          </p>
          <div className="flex gap-2">
            <button onClick={() => previewBill.mutate()} disabled={!selectedConsignmentIds.length || filters.ratePerKg === '' || previewBill.isPending} className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-4 py-2.5 font-semibold text-slate-700 disabled:opacity-50"><FiFileText /> Preview</button>
            <button onClick={() => createBill.mutate()} disabled={!preview?.lineItems?.length || createBill.isPending} className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2.5 font-semibold text-white disabled:opacity-50"><FiFileText /> Generate & Save</button>
          </div>
        </div>
      </section>

      {filters.customerId && (
        <section className="space-y-4 rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Select Consignments</h2>
              <p className="text-sm text-slate-500">{isFetchingConsignments ? 'Loading matching LR records...' : `${billConsignments.length} matching LR records found`}</p>
            </div>
            <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={allConsignmentsSelected}
                onChange={toggleAllConsignments}
                disabled={!selectableConsignments.length}
                className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
              />
              Select All
            </label>
          </div>
          {isFetchingConsignments ? <div className="text-sm text-slate-500">Loading consignments...</div> : <DataTable columns={consignmentColumns} rows={billConsignments} emptyText="No consignments found for this customer and date range" />}
        </section>
      )}

      {preview && (
        <section className="space-y-4 rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Bill Preview</h2>
              <p className="text-sm text-slate-500">{preview.lineItems.length} LRs | Grand total Rs. {money(preview.grandTotal)}</p>
            </div>
            <PdfActions bill={preview} />
          </div>
          <PdfPreview bill={preview} />
        </section>
      )}

      <section className="space-y-4 rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200 print:hidden">
        <div className="relative">
          <FiSearch className="absolute left-3 top-3 text-slate-400" />
          <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search bill number, customer, GST..." className={`${inputClass} pl-10`} />
        </div>
        {isLoading ? <div className="text-sm text-slate-500">Loading freight bills...</div> : <DataTable columns={columns} rows={rows} />}
        <Pagination page={data?.page || page} pages={data?.pages || 1} onPage={setPage} />
      </section>
      {editingConsignment && (
        <Modal title="Edit Consignment" onClose={() => setEditingConsignment(null)} width="max-w-5xl">
          <ConsignmentForm
            customers={customerData?.customers || []}
            trips={tripData?.trips || []}
            initial={editingConsignment}
            onCancel={() => setEditingConsignment(null)}
            onNewTrip={() => setTripModal(true)}
            onSubmit={(values) => saveConsignment.mutate(values)}
          />
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

export default FreightBillsPage;
