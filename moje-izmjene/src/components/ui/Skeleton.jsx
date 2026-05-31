import "../../styles/skeleton.css"

export function Skeleton({ className = "", style }) {
  return <div className={`skeleton ${className}`} style={style} aria-hidden="true" />
}

export function CourtsSkeleton() {
  return (
    <div className="skeleton-courts">
      {[1, 2, 3].map((i) => (
        <div className="skeleton-court-card" key={i}>
          <Skeleton className="skeleton-title" />
          <Skeleton className="skeleton-line" />
          <div className="skeleton-week-row">
            {[1, 2, 3, 4, 5, 6, 7].map((d) => (
              <Skeleton key={d} className="skeleton-day-chip" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function HistorySkeleton() {
  return (
    <div className="skeleton-history">
      {[1, 2, 3, 4].map((i) => (
        <div className="skeleton-history-card" key={i}>
          <Skeleton className="skeleton-title" />
          <Skeleton className="skeleton-line" />
          <Skeleton className="skeleton-line skeleton-line--short" />
          <Skeleton className="skeleton-badge" />
        </div>
      ))}
    </div>
  )
}
