const DataTable = ({ columns, rows, emptyText = 'No records found' }) => (
  <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
    <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
        <tr>
          {columns.map((column) => (
            <th key={column.key} className="px-4 py-3 font-semibold">
              {column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 text-slate-700">
        {rows?.length ? (
          rows.map((row) => (
            <tr key={row._id || row.id} className="hover:bg-slate-50">
              {columns.map((column) => (
                <td key={column.key} className="px-4 py-3 align-top">
                  {column.render ? column.render(row) : row[column.key] || '-'}
                </td>
              ))}
            </tr>
          ))
        ) : (
          <tr>
            <td className="px-4 py-10 text-center text-slate-500" colSpan={columns.length}>
              {emptyText}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

export default DataTable;

