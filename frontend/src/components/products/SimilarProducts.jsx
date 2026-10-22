import { Link } from 'react-router-dom';
import useLoad from '../../hooks/useLoad';
import ProductCard from './ProductCard';
import { ErrorBox, Loader, Icon } from '../common/UI';

export default function SimilarProducts({ product }) {
  const { data, loading, error, reload } = useLoad(`products/${product.id}/similar/`);
  if (!loading && !error && !data?.length) return null;
  return (
    <section className="similar-products" aria-labelledby="similar-products-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">MORE CHOICES FOR YOU</p>
          <h2 id="similar-products-title">Similar products</h2>
          <p>Compare more options for your everyday needs.</p>
        </div>
        {product.category && <Link className="text-link" to={`/products?category=${product.category}`}>View category <Icon name="arrow" /></Link>}
      </div>
      {loading ? <Loader /> : error ? <ErrorBox message="Similar products could not be loaded." retry={reload} /> : (
        <div className="product-grid">{data.map(item => <ProductCard key={item.id} product={item} />)}</div>
      )}
    </section>
  );
}
