import { Link } from 'react-router-dom';
export const money = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
export const date = (value) =>
  new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
export function Icon({ name, size = 20, ...props }) {
  const paths = {
    cart: (
      <>
        <path d="M3 3h2l3 12h10l3-9H6" />
        <circle cx="9" cy="20" r="1" />
        <circle cx="18" cy="20" r="1" />
      </>
    ),
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 5 5" />
      </>
    ),
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    pin: (
      <>
        <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2" />
      </>
    ),
    box: (
      <>
        <path d="m3 7 9-5 9 5v10l-9 5-9-5ZM3 7l9 5 9-5M12 12v10M7 4l10 5" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="7" r="4" />
        <path d="M4 22v-2a8 8 0 0 1 16 0v2" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    leaf: (
      <>
        <path d="M20 3C5 2 1 10 6 17c7 5 15 0 14-14Z" />
        <path d="m4 21 11-12" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name] || paths.box}
    </svg>
  );
}
export function Loader() {
  return (
    <div className="loader" role="status">
      <span />
      Loading…
    </div>
  );
}
export function ErrorBox({ message, retry }) {
  return message ? (
    <div className="error-box" role="alert">
      {message}
      {retry && (
        <button className="text-button" onClick={retry}>
          Try again
        </button>
      )}
    </div>
  ) : null;
}
export function Empty({ title = 'Nothing here yet', children, to, action }) {
  return (
    <div className="empty">
      <Icon name="box" size={44} />
      <h2>{title}</h2>
      <p>{children}</p>
      {to && (
        <Link className="button" to={to}>
          {action || 'Browse products'} <Icon name="arrow" />
        </Link>
      )}
    </div>
  );
}
export function PageHeading({ eyebrow, title, children, action }) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {children && <p className="muted">{children}</p>}
      </div>
      {action}
    </div>
  );
}
export function Badge({ children }) {
  return <span className={`badge status-${String(children).toLowerCase()}`}>{children}</span>;
}
export function Pagination({ page, next, previous, onChange }) {
  return (
    <div className="pagination">
      <button className="button secondary" disabled={!previous} onClick={() => onChange(page - 1)}>
        Previous
      </button>
      <span>Page {page}</span>
      <button className="button secondary" disabled={!next} onClick={() => onChange(page + 1)}>
        Next
      </button>
    </div>
  );
}
