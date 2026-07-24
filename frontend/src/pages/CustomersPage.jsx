import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiEdit2, FiPlus, FiSearch, FiTrash2 } from 'react-icons/fi';
import DataTable from '../components/DataTable';
import FormField, { inputClass } from '../components/FormField';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import Pagination from '../components/Pagination';
import { api, listParams } from '../services/api';

const blankCustomer = {
  companyName: '',
  contactPerson: '',
  gstNumber: '',
  panNumber: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  country: 'India',
  remarks: '',
};

const CustomerForm = ({ initial, onSubmit, onCancel }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: initial || blankCustomer });
  const fields = [
    ['companyName', 'Company Name', true],
    ['contactPerson', 'Contact Person'],
    ['phone', 'Mobile Number', true],
    ['email', 'Email'],
    ['gstNumber', 'GST Number'],
    ['panNumber', 'PAN Number'],
    ['address', 'Address Line 1'],
    ['city', 'City'],
    ['state', 'State'],
    ['pincode', 'Pincode'],
    ['country', 'Country'],
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map(([name, label, required]) => (
          <FormField key={name} label={label} error={errors[name]}>
            <input className={inputClass} {...register(name, { required })} />
          </FormField>
        ))}
      </div>
      <FormField label="Remarks">
        <textarea rows="3" className={inputClass} {...register('remarks')} />
      </FormField>
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="rounded-md border border-slate-200 px-4 py-2 text-slate-700">Cancel</button>
        <button className="rounded-md bg-accent px-4 py-2 font-semibold text-white">Save Customer</button>
      </div>
    </form>
  );
};

const CustomersPage = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['customers', page, search],
    queryFn: async () => (await api.get('/customers', { params: listParams({ page, search }) })).data,
  });

  const saveCustomer = useMutation({
    mutationFn: async (payload) => editing?._id ? (await api.put(`/customers/${editing._id}`, payload)).data : (await api.post('/customers', payload)).data,
    onSuccess: () => {
      toast.success(editing ? 'Customer updated' : 'Customer added');
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Could not save customer'),
  });

  const deleteCustomer = useMutation({
    mutationFn: async (id) => (await api.delete(`/customers/${id}`)).data,
    onSuccess: () => {
      toast.success('Customer deleted');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Could not delete customer'),
  });

  const columns = [
    { key: 'customerCode', label: 'Code' },
    { key: 'companyName', label: 'Company' },
    { key: 'contactPerson', label: 'Contact' },
    { key: 'city', label: 'City' },
    { key: 'gstNumber', label: 'GST' },
    { key: 'phone', label: 'Mobile' },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <button onClick={() => setEditing(row)} className="rounded-md border border-slate-200 p-2 text-slate-700" title="Edit customer"><FiEdit2 /></button>
          <button onClick={() => window.confirm('Delete this customer?') && deleteCustomer.mutate(row._id)} className="rounded-md border border-red-200 p-2 text-red-600" title="Delete customer"><FiTrash2 /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="One database for consigners and consignees, with searchable contact and tax details."
        action={<button onClick={() => setEditing(blankCustomer)} className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2.5 font-semibold text-white"><FiPlus /> Add Customer</button>}
      />
      <section className="space-y-4 rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="relative max-w-lg">
          <FiSearch className="absolute left-3 top-3 text-slate-400" />
          <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search name, code, GST, mobile..." className={`${inputClass} pl-10`} />
        </div>
        {isLoading ? <div className="text-sm text-slate-500">Loading customers...</div> : <DataTable columns={columns} rows={data?.customers || []} />}
        <Pagination page={data?.page || page} pages={data?.pages || 1} onPage={setPage} />
      </section>
      {editing && (
        <Modal title={editing._id ? 'Edit Customer' : 'Add Customer'} onClose={() => setEditing(null)}>
          <CustomerForm initial={editing} onCancel={() => setEditing(null)} onSubmit={(values) => saveCustomer.mutate(values)} />
        </Modal>
      )}
    </div>
  );
};

export default CustomersPage;

