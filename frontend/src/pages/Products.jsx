import { useSearchParams } from 'react-router-dom';
import useLoad from '../hooks/useLoad';
import ProductCard from '../components/products/ProductCard';
import { PageHeading, Loader, ErrorBox, Empty, Pagination } from '../components/common/UI';
export default function Products() {
  const [params, setParams] = useSearchParams();
  const products = useLoad(`products/?${params.toString()}`);
  const update = (key, value) => {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    next.delete('page');
    setParams(next);
  };
  return (
    <main className="container section">
      <PageHeading eyebrow="YOUR EVERYDAY, SORTED" title="Shop the store">
        Browse fresh choices and everyday essentials.
      </PageHeading>
      <div className="catalog-layout catalog-without-sidebar">
        <div className="catalog-results">
          <div className="results-toolbar">
            <span>{products.data?.count ?? 'â€¦'} products</span>
            <label className="sort-label">
              Sort by
              <select
                aria-label="Sort products"
                value={params.get('ordering') || '-created_at'}
                onChange={(e) => update('ordering', e.target.value)}
              >
                <option value="-created_at">Newest first</option>
                <option value="price">Regular price: low to high</option>
                <option value="-price">Regular price: high to low</option>
                <option value="name">Name: Aâ€“Z</option>
              </select>
            </label>
          </div>
          {products.error ? (
            <ErrorBox message={products.error} retry={products.reload} />
          ) : products.loading ? (
            <Loader />
          ) : products.data?.results.length ? (
            <>
              <div className="product-grid catalog-grid">
                {products.data.results.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              <Pagination
                page={Number(params.get('page') || 1)}
                next={products.data.next}
                previous={products.data.previous}
                onChange={(page) => {
                  const next = new URLSearchParams(params);
                  next.set('page', page);
                  setParams(next);
                }}
              />
            </>
          ) : (
            <Empty title="No products found">Try a different search or reset your filters.</Empty>
          )}
        </div>
      </div>
    </main>
  );
}
