export default function UiSkeleton({ label = "กำลังโหลดข้อมูล", rows = 3, page = false }: {
  label?: string; rows?: number; page?: boolean;
}) {
  return (
    <div className={`telemed-skeleton${page ? ' telemed-skeleton-page' : ''}`} role="status" aria-label={label} aria-busy="true">
      <div aria-hidden="true">
        {page && <><div className="skeleton-shape skeleton-title" /><div className="skeleton-shape skeleton-banner" /></>}
        {Array.from({ length: rows }, (_, index) => (
          <div className="skeleton-row" key={index}>
            <div className="skeleton-shape skeleton-avatar" />
            <div className="skeleton-copy"><div className="skeleton-shape skeleton-line" /><div className="skeleton-shape skeleton-line skeleton-short" /></div>
          </div>
        ))}
      </div>
    </div>
  );
}
