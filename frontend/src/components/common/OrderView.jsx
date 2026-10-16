import { useState } from 'react';
import { Link } from 'react-router-dom';
import { money, date, Badge, ErrorBox, Icon } from './UI';
import { orderService } from '../../services/orderService';
import { errorMessage } from '../../services/api';
export const transitions = {
  Pending: ['Confirmed', 'Cancelled'],
  Confirmed: ['Packed', 'Cancelled'],
  Packed: ['Shipped', 'Cancelled'],
  Shipped: ['Delivered'],
  Delivered: [],
  Cancelled: [],
};
export default function OrderView({ order, admin = false, reload }) {
  const [selected, setSelected] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const stages = ['Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered'];
  return (
    <>
      <div className="order-overview panel">
        <div>
          <h2>{order.number}</h2>
          <p className="muted">Placed {date(order.created_at)}</p>
        </div>
        <Badge>{order.status}</Badge>
        <strong>{money(order.total)}</strong>
      </div>
      {order.status !== 'Cancelled' ? (
        <ol className="order-timeline">
          {stages.map((stage, i) => (
            <li key={stage} className={i <= stages.indexOf(order.status) ? 'complete' : ''}>
              <span>
                {i < stages.indexOf(order.status) ? <Icon name="check" size={15} /> : i + 1}
              </span>
              {stage}
            </li>
          ))}
        </ol>
      ) : (
        <div className="error-box">This order has been cancelled. No payment is due.</div>
      )}
      <div className="two-column">
        <div className="panel">
          <h2>Items in your order</h2>
          {order.items.map((item) => (
            <div className="order-line" key={item.id}>
              <div>
                {item.product ? (
                  <Link to={`/products/${item.product}`}>{item.product_name}</Link>
                ) : (
                  <strong>{item.product_name}</strong>
                )}
                <small>
                  {item.quantity} × {money(item.unit_price)}
                </small>
              </div>
              <strong>{money(item.line_total)}</strong>
            </div>
          ))}
          <div className="summary-total">
            <strong>Total · Cash on Delivery</strong>
            <strong>{money(order.total)}</strong>
          </div>
        </div>
        <div className="panel">
          <h2>Delivery details</h2>
          <address>
            <strong>{order.recipient_name}</strong>
            <br />
            {order.house_number}, {order.street}
            <br />
            {order.area}, {order.city}
            <br />
            {order.district}, {order.state} – {order.pincode}
            <br />
            <a href={`tel:${order.mobile_number}`}>{order.mobile_number}</a>
          </address>
          {admin && (
            <p className="muted">
              Customer: {order.customer.username}
              <br />
              {order.customer.email}
            </p>
          )}
          <div className="payment-option">
            <Icon name="box" />
            <span>Cash on Delivery</span>
          </div>
        </div>
      </div>
      {admin && (
        <form
          className="panel status-form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!selected) return;
            if (
              selected === 'Cancelled' &&
              !window.confirm('Cancel this order and restore its stock?')
            )
              return;
            setBusy(true);
            setError('');
            try {
              await orderService.updateStatus(order.id, selected);
              setSelected('');
              reload();
            } catch (err) {
              setError(errorMessage(err));
            } finally {
              setBusy(false);
            }
          }}
        >
          <h2>Update order status</h2>
          <ErrorBox message={error} />
          {transitions[order.status]?.length ? (
            <div className="inline-form">
              <label>
                Next status
                <select required value={selected} onChange={(e) => setSelected(e.target.value)}>
                  <option value="">Choose a status</option>
                  {transitions[order.status].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <button className="button" disabled={busy}>
                {busy ? 'Saving…' : 'Update status'}
              </button>
            </div>
          ) : (
            <p>This order is complete. Its status cannot be changed.</p>
          )}
        </form>
      )}
    </>
  );
}
