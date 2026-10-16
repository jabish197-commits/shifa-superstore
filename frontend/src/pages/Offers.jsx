import OfferCard from '../components/common/OfferCard';
import useLoad from '../hooks/useLoad';
import { PageHeading, Loader, ErrorBox, Empty } from '../components/common/UI';
export default function Offers() {
  const { data, loading, error, reload } = useLoad('offers/');
  return (
    <main className="container section">
      <PageHeading eyebrow="A LITTLE MORE VALUE" title="Offers worth a look">
        Current savings on selected products. The best eligible offer applies automatically.
      </PageHeading>
      {error ? (
        <ErrorBox message={error} retry={reload} />
      ) : loading ? (
        <Loader />
      ) : data?.length ? (
        <div className="deal-grid">
          {data.map((offer, index) => <OfferCard key={offer.id} offer={offer} index={index} />)}
        </div>
      ) : (
        <Empty title="New offers are on their way" to="/products">
          Explore our everyday essentials in the meantime.
        </Empty>
      )}
    </main>
  );
}
