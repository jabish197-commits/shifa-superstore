import { Link, useParams } from 'react-router-dom';
import useLoad from '../hooks/useLoad';
import { Loader, ErrorBox, PageHeading } from '../components/common/UI';
import OrderView from '../components/common/OrderView';
export default function OrderDetails({ admin = false }) {
  const { id } = useParams();
  const { data, loading, error, reload } = useLoad(`orders/${id}/`);
  return (
    <div className={admin ? '' : 'container section'}>
      <Link className="text-link" to={admin ? '/admin-dashboard/orders' : '/my-orders'}>
        ← Back to orders
      </Link>
      <PageHeading title="Order details" />
      {loading ? (
        <Loader />
      ) : error ? (
        <ErrorBox message={error} retry={reload} />
      ) : (
        <OrderView order={data} admin={admin} reload={reload} />
      )}
    </div>
  );
}
