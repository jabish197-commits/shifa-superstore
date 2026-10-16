import { Link } from 'react-router-dom';
import { ProductImage } from '../products/ProductCard';
import { money } from '../common/UI';
export default function CartItem({ item, busy, update, remove }) {
  return (
    <article className="cart-item">
      <Link to={`/products/${item.product.id}`} className="cart-item-image">
        <ProductImage product={item.product} />
      </Link>
      <div className="cart-item-copy">
        <Link to={`/products/${item.product.id}`}>
          <h3>{item.product.name}</h3>
        </Link>
        <p>{money(item.unit_price)} each</p>
        {!item.available && <p className="field-error">{item.message}</p>}
        <button className="text-button danger" disabled={busy} onClick={() => remove(item.id)}>
          Remove
        </button>
      </div>
      <div className="quantity-control">
        <button
          aria-label={`Decrease ${item.product.name} quantity`}
          disabled={busy || item.quantity <= 1}
          onClick={() => update(item.id, item.quantity - 1)}
        >
          −
        </button>
        <span aria-label="Quantity">{item.quantity}</span>
        <button
          aria-label={`Increase ${item.product.name} quantity`}
          disabled={busy || item.quantity >= Math.min(99, item.product.stock)}
          onClick={() => update(item.id, item.quantity + 1)}
        >
          +
        </button>
      </div>
      <strong>{money(item.line_total)}</strong>
    </article>
  );
}
