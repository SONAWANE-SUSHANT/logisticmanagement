const FormField = ({ label, error, children }) => (
  <label className="block">
    <span className="text-sm font-medium text-slate-700">{label}</span>
    <div className="mt-1">{children}</div>
    {error && <span className="mt-1 block text-xs text-red-600">{error.message || 'Required'}</span>}
  </label>
);

export const inputClass = 'w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-accent';

export default FormField;

