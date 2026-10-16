import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from './UI';
import brandArtwork from '../../assets/brandArtwork.json';
import './BrandCard.css';

export default function BrandCard({ brand, index }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const [failed, setFailed] = useState(false);
  const art = brandArtwork[brand.name.toLowerCase()];
  useEffect(() => {
    if (!window.IntersectionObserver) { setVisible(true); return; }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { threshold: 0.08 });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className={`brand-reveal ${visible ? 'is-visible' : ''}`} style={{ '--brand-delay': `${(index % 4) * 65}ms` }}>
      <Link to={`/products?brand=${brand.id}`} className={`brand-showcase brand-palette-${index % 4}`}>
        <div className={`brand-logo-stage ${art?.dark ? 'brand-logo-dark' : ''}`}>
          {art && !failed ? <img src={art.src} alt="" loading="lazy" width="240" height="140" onError={() => setFailed(true)} /> : <span className="brand-initials" aria-hidden="true">{brand.name.slice(0, 2)}</span>}
        </div>
        <div className="brand-card-copy">
          <h2>{brand.name}</h2>
          <p>{brand.description || art?.caption || 'Find your everyday favourites.'}</p>
          <span className="brand-shop-link">Shop brand <span className="brand-arrow"><Icon name="arrow" size={18} /></span></span>
        </div>
      </Link>
    </div>
  );
}
