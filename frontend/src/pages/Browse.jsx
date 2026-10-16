import BrandCard from '../components/common/BrandCard';
import { Link } from 'react-router-dom';
import useLoad from '../hooks/useLoad';
import { PageHeading, Loader, ErrorBox, Empty, Icon } from '../components/common/UI';
export default function Browse({ type }) {
  const { data, loading, error, reload } = useLoad(`${type}/`);
  const label = type === 'categories' ? 'Categories' : 'Brands';
  return (
    <main className="container section">
      <PageHeading eyebrow="EXPLORE SHIFA" title={label}>
        Find your next everyday favourite.
      </PageHeading>
      {error ? (
        <ErrorBox message={error} retry={reload} />
      ) : loading ? (
        <Loader />
      ) : data?.length ? (
        <div className={type === 'brands' ? 'brand-gallery' : 'browse-grid'}>
          {data.map((item, index) => type === 'brands' ? (
            <BrandCard key={item.id} brand={item} index={index} />
          ) : (
            <Link
              key={item.id}
              to={`/products?${type === 'categories' ? 'category' : 'brand'}=${item.id}`}
              className={`browse-card tone-${index % 4}`}
            >
              <>
                {type === 'categories' && item.image ? (
                  <img className="browse-category-image" src={item.image} alt="" loading="lazy" />
                ) : (
                  <Icon name={type === 'brands' ? 'box' : 'leaf'} size={36} />
                )}
              </>
              <h2>{item.name}</h2>
              <p>{item.description || 'Explore the selection'}</p>
              <span>
                Shop now <Icon name="arrow" />
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <Empty title={`No ${label.toLowerCase()} available yet`} to="/products">
          You can still explore our product selection.
        </Empty>
      )}
    </main>
  );
}
