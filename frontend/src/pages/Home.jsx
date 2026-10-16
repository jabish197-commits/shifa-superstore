import DeliveryAnimation from '../components/common/DeliveryAnimation';
import BrandHero from '../components/common/BrandHero';
import BannerCarousel from '../components/common/BannerCarousel';
import ShoppingAnimation from '../components/common/ShoppingAnimation';
import { Link } from 'react-router-dom';
import useLoad from '../hooks/useLoad';
import ProductCard from '../components/products/ProductCard';
import { Icon, Loader, ErrorBox, Empty } from '../components/common/UI';
export default function Home() {
  const products = useLoad('products/');
  const categories = useLoad('categories/');
  const banners = useLoad('banners/');
  return (
    <>
      <BrandHero />
      <div className="container benefits">
        <div>
          <Icon name="leaf" />
          <span>
            <strong>Quality you can trust</strong>
            <small>Carefully chosen essentials</small>
          </span>
        </div>
        <div>
          <Icon name="pin" />
          <span>
            <strong>Local delivery</strong>
            <small>Check your area &amp; pincode</small>
          </span>
        </div>
        <div>
          <Icon name="box" />
          <span>
            <strong>Cash on Delivery</strong>
            <small>Pay when your order arrives</small>
          </span>
        </div>
      </div>
      <ShoppingAnimation />
      <section className="container section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">FIND YOUR EVERYDAY</p>
            <h2>Shop by category</h2>
          </div>
          <Link to="/categories" className="text-link">
            View all <Icon name="arrow" size={17} />
          </Link>
        </div>
        {categories.error ? (
          <ErrorBox message={categories.error} retry={categories.reload} />
        ) : categories.loading ? (
          <Loader />
        ) : categories.data?.length ? (
          <div className="category-strip">
            {categories.data.slice(0, 7).map((c, i) => (
              <Link
                className={`category-tile tone-${i % 4}`}
                key={c.id}
                to={`/products?category=${c.id}`}
              >
                <span>
                  <>
                    {c.image ? (
                      <img className="category-tile-image" src={c.image} alt="" loading="lazy" />
                    ) : (
                      <Icon name={i % 2 ? 'box' : 'leaf'} size={31} />
                    )}
                  </>
                </span>
                <strong>{c.name}</strong>
                <small>
                  Explore <Icon name="arrow" size={13} />
                </small>
              </Link>
            ))}
          </div>
        ) : (
          <p className="muted">
            Our categories are being prepared. Browse all available products below.
          </p>
        )}
      </section>
      <BannerCarousel banners={banners.data || []} />
      <section className="container section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">THE EVERYDAY EDIT</p>
            <h2>Good things for your basket</h2>
          </div>
          <Link to="/products" className="text-link">
            Shop all products <Icon name="arrow" size={17} />
          </Link>
        </div>
        {products.error ? (
          <ErrorBox message={products.error} retry={products.reload} />
        ) : products.loading ? (
          <Loader />
        ) : products.data?.results.length ? (
          <div className="product-grid">
            {products.data.results.slice(0, 8).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <Empty title="Fresh choices are on their way">
            Our team is preparing the product selection. Please check back soon.
          </Empty>
        )}
      </section>
      <section className="container section">
        <div className="delivery-callout delivery-feature">
          <div>
            <span className="eyebrow">FROM OUR STORE TO YOUR DOOR</span>
            <h2>
              Your favourites,
              <br />
              one doorstep away.
            </h2>
            <p>Enter your area and pincode to see if we deliver to you.</p>
            <Link to="/delivery" className="button">
              Check my area <Icon name="arrow" />
            </Link>
            <ol className="delivery-steps">
              <li><span>01</span>Check your area</li>
              <li><span>02</span>Fill your basket</li>
              <li><span>03</span>Pay on delivery</li>
            </ol>
          </div>
          <DeliveryAnimation />
        </div>
      </section>
    </>
  );
}
