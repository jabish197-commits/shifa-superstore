import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { orderService } from '../services/orderService';
import { errorMessage } from '../services/api';
import CartSummary from '../components/cart/CartSummary';
import { PageHeading, ErrorBox, Empty, Loader, Icon } from '../components/common/UI';
const fields = [
  ['recipient_name', 'Full name'],
  ['mobile_number', 'Mobile number'],
  ['house_number', 'House / door number'],
  ['street', 'Street'],
  ['area', 'Area'],
  ['pincode', 'Pincode'],
  ['city', 'City'],
  ['district', 'District'],
  ['state', 'State'],
];
export default function Checkout() {
  const { user } = useAuth();
  const { cart, refresh } = useCart();
  const navigate = useNavigate();
  const [address, setAddress] = useState({
    recipient_name: [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username,
    state: 'Tamil Nadu',
  });
  const [delivery, setDelivery] = useState(null);
  const [checking, setChecking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const keyName = `shifa-checkout-${user.id}`;
  const [checkoutKey] = useState(() => {
    const old = sessionStorage.getItem(keyName);
    const key = old || crypto.randomUUID();
    sessionStorage.setItem(keyName, key);
    return key;
  });
  useEffect(() => {
    refresh()
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [refresh]);
  async function check() {
    setChecking(true);
    setError('');
    try {
      const { data } = await orderService.checkDelivery({
        area: address.area,
        pincode: address.pincode,
      });
      setDelivery(data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setChecking(false);
    }
  }
  async function submit(e) {
    e.preventDefault();
    if (!delivery?.available || busy) return;
    setBusy(true);
    setError('');
    try {
      const { data } = await orderService.create({
        ...address,
        checkout_key: checkoutKey,
        expected_total: cart.total,
        payment_method: 'COD',
      });
      sessionStorage.removeItem(keyName);
      await refresh().catch(() => {});
      navigate(`/order-success/${data.id}`, { replace: true });
    } catch (err) {
      setError(errorMessage(err));
      await refresh().catch(() => {});
      setDelivery(null);
    } finally {
      setBusy(false);
    }
  }
  if (loading) return <Loader />;
  return (
    <main className="container section">
      <PageHeading eyebrow="ONE MORE STEP" title="Checkout">
        Pay in cash when your order arrives.
      </PageHeading>
      <ErrorBox message={error} />
      {cart.items.length ? (
        <form className="checkout-layout" onSubmit={submit}>
          <div className="panel">
            <h2>Delivery address</h2>
            <div className="form-grid">
              {fields.map(([name, label]) => (
                <label key={name}>
                  {label}
                  <input
                    disabled={checking || busy}
                    name={name}
                    required
                    value={address[name] || ''}
                    maxLength={
                      name === 'mobile_number'
                        ? 10
                        : name === 'pincode'
                          ? 6
                          : name === 'street'
                            ? 200
                            : name === 'area' || name === 'recipient_name'
                              ? 120
                              : 100
                    }
                    inputMode={
                      name === 'pincode' || name === 'mobile_number' ? 'numeric' : undefined
                    }
                    pattern={
                      name === 'pincode'
                        ? '[1-9][0-9]{5}'
                        : name === 'mobile_number'
                          ? '[6-9][0-9]{9}'
                          : undefined
                    }
                    onChange={(e) => {
                      setAddress({ ...address, [name]: e.target.value });
                      if (name === 'area' || name === 'pincode') setDelivery(null);
                    }}
                  />
                </label>
              ))}
            </div>
            <button
              type="button"
              className="button secondary"
              disabled={
                checking || !address.area?.trim() || !/^[1-9][0-9]{5}$/.test(address.pincode || '')
              }
              onClick={check}
            >
              {checking ? 'Checking…' : 'Check delivery availability'}
              <Icon name="pin" />
            </button>
            {delivery && (
              <div role="status" className={delivery.available ? 'success-box' : 'error-box'}>
                {delivery.message}
              </div>
            )}
            <div className="payment-option">
              <Icon name="check" />
              <div>
                <strong>Cash on Delivery</strong>
                <p>Pay the order total in cash at delivery.</p>
              </div>
            </div>
          </div>
          <CartSummary cart={cart}>
            <button
              className="button full"
              type="submit"
              disabled={busy || !delivery?.available || !cart.can_checkout}
            >
              {busy ? 'Placing your order…' : 'Place COD order'}
              <Icon name="arrow" />
            </button>
            {!cart.can_checkout && (
              <p className="field-error">Some items need attention. Please return to your cart.</p>
            )}
          </CartSummary>
        </form>
      ) : (
        <Empty title="Your cart is empty" to="/products">
          Add products before checking out.
        </Empty>
      )}
    </main>
  );
}
