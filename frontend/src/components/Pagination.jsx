import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const Pagination = ({ page = 1, pages = 1, onPage }) => (
  <div className="flex items-center justify-between text-sm text-slate-500">
    <span>
      Page {page} of {pages}
    </span>
    <div className="flex gap-2">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
        className="rounded-md border border-slate-200 p-2 text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
        title="Previous page"
      >
        <FiChevronLeft />
      </button>
      <button
        type="button"
        disabled={page >= pages}
        onClick={() => onPage(page + 1)}
        className="rounded-md border border-slate-200 p-2 text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
        title="Next page"
      >
        <FiChevronRight />
      </button>
    </div>
  </div>
);

export default Pagination;

