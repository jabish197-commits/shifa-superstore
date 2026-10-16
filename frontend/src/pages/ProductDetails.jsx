import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import useLoad from '../hooks/useLoad';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ProductImage } from '../components/products/ProductCard';
import { Loader, ErrorBox, money, Icon, Badge } from '../components/common/UI';
import { errorMessage } from '../services/api';
export default function ProductDetails() {
  const { id } = useParams();
  const { data: p, loading, error, reload } = useLoad(`products/${id}/`);
  const { user } = useAuth();
  const { add, busy } = useCart();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');
  const [added, setAdded] = useState(false);
  if (loading) return <Loader />;
  if (error)
    return (
      <main className="container section">
        <ErrorBox message={error} retry={reload} />
        <Link to="/products">Back to products</Link>
      </main>
    );
  return (
    <main className="container section">
      <div className="breadcrumbs">
        <Link to="/products">Shop all</Link>
        <span>/</span>
        {p.category_name || 'Products'}
        <span>/</span>
        {p.name}
      </div>
      <div className="product-detail">
        <div className="detail-visual">
          <ProductImage product={p} />
        </div>
        <div className="detail-copy">
          <p className="eyebrow">{p.brand_name || 'SHIFA SUPERSTORE'}</p>
          <h1>{p.name}</h1>
          <Badge>{p.in_stock ? 'In stock' : 'Out of stock'}</Badge>
          <div className="detail-price">
            {money(p.pricing.final_price)}
            {Number(p.pricing.discount_amount) > 0 && <del>{money(p.price)}</del>}
          </div>
          {p.pricing.offer && (
            <p className="offer-note">
              {p.pricing.offer.title} · Save {money(p.pricing.discount_amount)}
            </p>
          )}
          <p className="description">
            {p.description || 'An everyday essential from Shifa Superstore.'}
          </p>
          <ErrorBox message={message} />
          <div className="purchase-row">
            <label>
              Quantity
              <input
                type="number"
                min="1"
                max={Math.min(99, p.stock)}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </label>
            <button
              className="button"
              disabled={
                busy ||
                !p.in_stock ||
                user?.role === 'admin' ||
                Number(quantity) < 1 ||
                Number(quantity) > Math.min(99, p.stock) ||
                !Number.isInteger(Number(quantity))
              }
              onClick={async () => {
                if (!user) {
                  navigate('/login', { state: { from: `/products/${id}` } });
                  return;
                }
                try {
                  setMessage('');
                  await add(p.id, Number(quantity));
                  setAdded(true);
                } catch (err) {
                  setMessage(errorMessage(err));
                }
              }}
            >
              <Icon name="cart" />
              {added ? 'Added to cart' : 'Add to cart'}
            </button>
          </div>
          {added && (
            <Link className="text-link" to="/cart">
              View your cart <Icon name="arrow" />
            </Link>
          )}
          <div className="detail-assurances">
            <span>
              <Icon name="box" />
              Cash on Delivery only
            </span>
            <Link to="/delivery">
              <Icon name="pin" />
              Check your delivery area
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
