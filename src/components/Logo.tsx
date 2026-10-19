import { Link } from 'react-router-dom';

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="brand" aria-label="Random Tech — home">
      <span className="brand__mark" aria-hidden="true">
        <span className="brand__tile brand__tile--mint" />
        <span className="brand__tile brand__tile--peach" />
        <span className="brand__tile brand__tile--blue" />
        <span className="brand__tile brand__tile--ink">
          <span />
        </span>
      </span>
      {!compact && <span className="brand__name">Random Tech</span>}
    </Link>
  );
}
