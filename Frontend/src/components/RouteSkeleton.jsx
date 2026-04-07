export function RouteSkeleton() {
  return (
    <section className="card skeleton-card" aria-label="Loading view">
      <div className="skeleton-row" />
      <div className="skeleton-row short" />
      <div className="skeleton-row" />
    </section>
  );
}
