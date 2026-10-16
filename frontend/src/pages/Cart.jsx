import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import CartItem from '../components/cart/CartItem';
import CartSummary from '../components/cart/CartSummary';
import { PageHeading, ErrorBox, Empty, Icon, Loader } from '../components/common/UI';
import { errorMessage } from '../services/api';
export default function Cart() {
  const { cart, busy, refresh, update, remove } = useCart();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    refresh()
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [refresh]);
  async function act(operation) {
    setError('');
    try {
      await operation();
    } catch (err) {
      setError(errorMessage(err));
    }
  }
  return (
    <main className="container section">
      <PageHeading eyebrow="YOUR EVERYDAY PICKS" title="Your cart" />
      <ErrorBox message={error} />
      {loading ? (
        <Loader />
      ) : cart.items.length ? (
        <div className="checkout-layout">
          <div>
            {cart.items.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                busy={busy}
                update={(id, qty) => act(() => update(id, qty))}
                remove={(id) => act(() => remove(id))}
              />
            ))}
            <Link className="text-link" to="/products">
              Continue shopping <Icon name="arrow" />
            </Link>
          </div>
          <CartSummary cart={cart}>
            {cart.can_checkout ? (
              <Link className="button full" to="/checkout">
                Proceed to checkout <Icon name="arrow" />
              </Link>
            ) : (
              <p className="field-error">
                Please update or remove unavailable items before checkout.
              </p>
            )}
          </CartSummary>
        </div>
      ) : (
        <Empty title="Your basket is waiting" to="/products">
          Find a few good things for your everyday.
        </Empty>
      )}
    </main>
  );
}
