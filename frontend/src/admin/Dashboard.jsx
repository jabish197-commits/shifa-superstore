import { Link } from 'react-router-dom';
import useLoad from '../hooks/useLoad';
import { Loader, ErrorBox, PageHeading, money, Badge, date, Icon } from '../components/common/UI';
export default function Dashboard() {
  const { data, loading, error, reload } = useLoad('admin/dashboard/');
  return (
    <>
      <PageHeading
        eyebrow="YOUR STORE AT A GLANCE"
        title="Welcome to your dashboard"
        action={
          <Link className="button" to="/admin-dashboard/products/new">
            <Icon name="plus" />
            Add product
          </Link>
        }
      />
      {loading ? (
        <Loader />
      ) : error ? (
        <ErrorBox message={error} retry={reload} />
      ) : (
        <>
          <div className="stats-grid">
            {[
              ['Total products', data.total_products],
              ['Total orders', data.total_orders],
              ['Pending orders', data.pending_orders],
              ['Delivered orders', data.delivered_orders],
            ].map(([label, value]) => (
              <div className="panel stat" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          <div className="revenue-panel">
            <div>
              <span>Delivered order revenue</span>
              <strong>{money(data.delivered_revenue)}</strong>
            </div>
            <Icon name="box" size={44} />
          </div>
          <section className="panel">
            <div className="section-heading">
              <h2>Recent orders</h2>
              <Link className="text-link" to="/admin-dashboard/orders">
                View all <Icon name="arrow" />
              </Link>
            </div>
            {data.recent_orders.length ? (
              data.recent_orders.map((order) => (
                <Link
                  className="dashboard-order"
                  to={`/admin-dashboard/orders/${order.id}`}
                  key={order.id}
                >
                  <span>
                    <strong>{order.number}</strong>
                    <small>
                      {order.customer.username} · {date(order.created_at)}
                    </small>
                  </span>
                  <Badge>{order.status}</Badge>
                  <strong>{money(order.total)}</strong>
                </Link>
              ))
            ) : (
              <p className="muted">No orders yet. New orders will appear here.</p>
            )}
          </section>
          <div className="admin-tip">
            <Icon name="pin" />
            <p>
              <strong>Ready for local delivery?</strong> Add your active area and pincode
              combinations under Delivery areas so customers can place COD orders.
            </p>
          </div>
        </>
      )}
    </>
  );
}
