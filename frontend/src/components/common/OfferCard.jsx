import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon, date } from './UI';
import './OfferCard.css';
const artworks = [
  [/snack|noodle|biscuit/i, '/offers/snacks.webp', 'Noodles and snack-time essentials', 'peach'],
  [/home|clean|laundry/i, '/offers/home-care.webp', 'Home cleaning and laundry essentials', 'mint'],
  [/coffee|dairy|beverage/i, '/offers/coffee.webp', 'Coffee and beverages', 'rose'],
  [/pantry|rice|grain|atta|pulse/i, '/offers/pantry.webp', 'Rice and pantry staples', 'sage'],
];
export default function OfferCard({ offer, index }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const [failed, setFailed] = useState(false);
  const [, src, alt, tone] = artworks.find(([pattern]) => pattern.test(offer.title)) || [null, '/offers/essentials.webp', 'Everyday grocery essentials', 'sage'];
  useEffect(() => {
    if (!window.IntersectionObserver) { setVisible(true); return; }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { threshold: 0.1 });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return (
    <article ref={ref} className={`deal-card deal-${tone} ${visible ? 'deal-visible' : ''}`} style={{ '--deal-delay': `${(index % 2) * 110}ms` }}>
      <div className="deal-art">
        {!failed ? <img src={src} alt={alt} width="640" height="480" loading="lazy" onError={() => setFailed(true)} /> : <Icon name="box" size={72} />}
        <div className="deal-badge"><strong>{Number(offer.discount_percent)}<span>%</span></strong><small>OFF</small></div>
        <span className="deal-image-note">Illustrative image</span>
      </div>
      <div className="deal-content">
        <p className="deal-kicker">MORE VALUE, EVERY DAY</p>
        <h2>{offer.title}</h2>
        {offer.description && <p className="deal-description">{offer.description}</p>}
        <div className="deal-bottom">
          <small className="deal-expiry">Until {date(offer.ends_at)}</small>
          <Link to={`/products?offer=${offer.id}`} className="deal-link">Shop this offer <span><Icon name="arrow" size={19} /></span></Link>
        </div>
      </div>
    </article>
  );
}
