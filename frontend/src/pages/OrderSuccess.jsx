import { Link, useParams } from 'react-router-dom';
import useLoad from '../hooks/useLoad';
import { Loader, ErrorBox, Icon, money } from '../components/common/UI';
export default function OrderSuccess() {
  const { id } = useParams();
  const { data, loading, error, reload } = useLoad(`orders/${id}/`);
  return (
    <main className="container section">
      {loading ? (
        <Loader />
      ) : error ? (
        <ErrorBox message={error} retry={reload} />
      ) : (
        <div className="success-page panel">
          <span className="success-icon">
            <Icon name="check" size={40} />
          </span>
          <p className="eyebrow">THANK YOU FOR SHOPPING LOCAL</p>
          <h1>Your order is placed.</h1>
          <p>
            We’ve received <strong>{data.number}</strong>. Follow its progress in My Orders.
          </p>
          <div className="success-total">
            <span>Cash on Delivery</span>
            <strong>{money(data.total)}</strong>
          </div>
          <div className="button-row">
            <Link className="button" to={`/my-orders/${data.id}`}>
              View order <Icon name="arrow" />
            </Link>
            <Link className="button secondary" to="/products">
              Continue shopping
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
