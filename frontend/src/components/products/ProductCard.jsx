import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { errorMessage } from '../../services/api';
import { Icon, money } from '../common/UI';
export function ProductImage({ product, className = '' }) {
  return product.image ? (
    <img className={className} src={product.image} alt={product.name} loading="lazy" />
  ) : (
    <div className={`product-placeholder ${className}`}>
      <Icon name="leaf" size={48} />
      <span>{product.category_name || 'Shifa essentials'}</span>
    </div>
  );
}
export default function ProductCard({ product }) {
  const { user } = useAuth();
  const { add, busy } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [message, setMessage] = useState('');
  const [added, setAdded] = useState(false);
  async function addItem() {
    if (!user) {
      navigate('/login', { state: { from: location.pathname + location.search } });
      return;
    }
    setMessage('');
    try {
      await add(product.id, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    } catch (error) {
      setMessage(errorMessage(error));
    }
  }
  return (
    <article className="product-card">
      <Link className="product-visual" to={`/products/${product.id}`}>
        <ProductImage product={product} />
        {product.pricing?.offer && (
          <span className="discount-badge">
            {Number(product.pricing.offer.discount_percent)}% off
          </span>
        )}
      </Link>
      <div className="product-content">
        <span className="product-category">{product.category_name || 'Everyday essentials'}</span>
        <Link className="product-title" to={`/products/${product.id}`}>
          {product.name}
        </Link>
        <span className="product-brand">{product.brand_name || 'Shifa Superstore'}</span>
        <div className="product-bottom">
          <div>
            <strong>{money(product.pricing?.final_price ?? product.price)}</strong>
            {Number(product.pricing?.discount_amount) > 0 && <del>{money(product.price)}</del>}
          </div>
          <button
            className={`add-button ${added ? 'added' : ''}`}
            disabled={!product.in_stock || busy || user?.role === 'admin'}
            onClick={addItem}
            aria-label={`Add ${product.name} to cart`}
          >
            {added ? <Icon name="check" /> : <Icon name="plus" />}
            <span>{added ? 'Added' : product.in_stock ? 'Add' : 'Sold out'}</span>
          </button>
        </div>
        {message && (
          <p role="alert" className="field-error">
            {message}
          </p>
        )}
      </div>
    </article>
  );
}
