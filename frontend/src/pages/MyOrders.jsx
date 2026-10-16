import { useState } from 'react';
import { Link } from 'react-router-dom';
import useLoad from '../hooks/useLoad';
import {
  PageHeading,
  Loader,
  ErrorBox,
  Empty,
  Badge,
  Pagination,
  money,
  date,
  Icon,
} from '../components/common/UI';
export default function MyOrders({ admin = false }) {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const { data, loading, error, reload } = useLoad(`orders/?page=${page}&status=${status}`);
  const base = admin ? '/admin-dashboard/orders' : '/my-orders';
  return (
    <div className={admin ? '' : 'container section'}>
      <PageHeading
        eyebrow={admin ? 'STORE OPERATIONS' : 'YOUR SHOPPING HISTORY'}
        title={admin ? 'Orders' : 'My orders'}
      />
      <div className="results-toolbar">
        <span>{data?.count || 0} orders</span>
        <label className="sort-label">
          Status
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            {['Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>
      {error ? (
        <ErrorBox message={error} retry={reload} />
      ) : loading ? (
        <Loader />
      ) : data?.results.length ? (
        <>
          <div className="orders-list">
            {data.results.map((order) => (
              <Link className="order-list-card panel" key={order.id} to={`${base}/${order.id}`}>
                <div>
                  <strong>{order.number}</strong>
                  <small>
                    {date(order.created_at)}
                    {admin ? ` · ${order.customer.username}` : ''}
                  </small>
                </div>
                <span>{order.items.reduce((sum, item) => sum + item.quantity, 0)} items</span>
                <Badge>{order.status}</Badge>
                <strong>{money(order.total)}</strong>
                <Icon name="arrow" />
              </Link>
            ))}
          </div>
          <Pagination page={page} next={data.next} previous={data.previous} onChange={setPage} />
        </>
      ) : (
        <Empty title="No orders yet" to={admin ? undefined : '/products'}>
          Your orders will appear here once they are placed.
        </Empty>
      )}
    </div>
  );
}
