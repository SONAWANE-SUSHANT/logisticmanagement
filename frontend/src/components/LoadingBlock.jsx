const LoadingBlock = ({ rows = 3 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, index) => (
      <div key={index} className="h-12 animate-pulse rounded-md bg-slate-100" />
    ))}
  </div>
);

export default LoadingBlock;
