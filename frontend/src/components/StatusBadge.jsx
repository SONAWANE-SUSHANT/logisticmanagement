const palette = {
  'To Be Gone': 'bg-sky-50 text-sky-700 ring-sky-200',
  Ongoing: 'bg-amber-50 text-amber-700 ring-amber-200',
  Completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  'In Transit': 'bg-blue-50 text-blue-700 ring-blue-200',
  Delivered: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
};

const StatusBadge = ({ value }) => (
  <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ${palette[value] || 'bg-slate-50 text-slate-700 ring-slate-200'}`}>
    {value || 'Unknown'}
  </span>
);

export default StatusBadge;

