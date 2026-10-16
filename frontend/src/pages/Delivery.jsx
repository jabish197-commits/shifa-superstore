import { useState } from 'react';
import useLoad from '../hooks/useLoad';
import { orderService } from '../services/orderService';
import { errorMessage } from '../services/api';
import { PageHeading, Icon, ErrorBox, Loader } from '../components/common/UI';
export function DeliveryChecker({ onResult }) {
  const [area, setArea] = useState('');
  const [pincode, setPincode] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="panel delivery-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError('');
        try {
          const { data } = await orderService.checkDelivery({ area, pincode });
          setResult(data);
          onResult?.(data);
        } catch (err) {
          setError(errorMessage(err));
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2>Do we deliver to you?</h2>
      <label>
        Area
        <input
          disabled={busy}
          required
          maxLength="120"
          value={area}
          placeholder="Enter your area"
          onChange={(e) => {
            setArea(e.target.value);
            setResult(null);
          }}
        />
      </label>
      <label>
        Pincode
        <input
          disabled={busy}
          required
          inputMode="numeric"
          pattern="[1-9][0-9]{5}"
          maxLength="6"
          value={pincode}
          placeholder="Six-digit pincode"
          onChange={(e) => {
            setPincode(e.target.value);
            setResult(null);
          }}
        />
      </label>
      <button className="button full" disabled={busy}>
        {busy ? 'Checking…' : 'Check delivery'}
        <Icon name="arrow" />
      </button>
      <ErrorBox message={error} />
      {result && (
        <div role="status" className={result.available ? 'success-box' : 'error-box'}>
          {result.message}
        </div>
      )}
    </form>
  );
}
export default function Delivery() {
  const areas = useLoad('delivery-areas/');
  return (
    <main className="container section">
      <PageHeading eyebrow="CLOSE TO HOME" title="Delivery, made local">
        Cash on Delivery is available only in our selected areas.
      </PageHeading>
      <div className="two-column">
        <DeliveryChecker />
        <div className="panel">
          <h2>Where we deliver</h2>
          <p className="muted">
            Both your area and pincode need to match an active delivery location.
          </p>
          {areas.loading ? (
            <Loader />
          ) : areas.error ? (
            <ErrorBox message={areas.error} retry={areas.reload} />
          ) : areas.data?.length ? (
            <div className="area-list">
              {areas.data.map((area) => (
                <div key={area.id}>
                  <span>
                    <Icon name="pin" />
                    {area.area_name}
                  </span>
                  <strong>{area.pincode}</strong>
                </div>
              ))}
            </div>
          ) : (
            <p>Delivery areas are being prepared. Please check back soon.</p>
          )}
        </div>
      </div>
    </main>
  );
}
