import { money, Icon } from '../common/UI';
export default function CartSummary({ cart, children }) {
  return (
    <aside className="panel cart-summary">
      <h2>Your order summary</h2>
      <div>
        <span>Subtotal ({cart.item_count} items)</span>
        <strong>{money(cart.subtotal)}</strong>
      </div>
      <div>
        <span>Delivery charge</span>
        <strong>Free</strong>
      </div>
      <div className="summary-total">
        <span>Total</span>
        <strong>{money(cart.total)}</strong>
      </div>
      <p className="muted">
        <Icon name="box" size={17} />
        Cash on Delivery only
      </p>
      {children}
      <small className="muted">
        Prices, stock, and delivery eligibility are verified again when you place your order.
      </small>
    </aside>
  );
}
