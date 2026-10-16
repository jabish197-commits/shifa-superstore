import { useState } from 'react';
import { Link } from 'react-router-dom';
import artwork from '../../assets/shifa-realistic-hero.png';
import { Icon } from './UI';
import './BrandHero.css';
export default function BrandHero() {
  const [paused, setPaused] = useState(false);
  return (
    <section
      className={`brand-hero container ${paused ? 'brand-hero-paused' : ''}`}
      aria-labelledby="brand-hero-title"
    >
      <div className="brand-hero-scene">
        <img
          className="brand-hero-art"
          src={artwork}
          width="1774"
          height="887"
          fetchPriority="high"
          alt="A shopping trolley filled with fresh vegetables, fruit, milk and bread in a sunlit supermarket."
        />
        <div className="brand-hero-shade" aria-hidden="true" />
        <div className="brand-hero-copy">
          <span className="brand-hero-eyebrow">
            <i /> FRESH • QUALITY • EVERYDAY
          </span>
          <h1 id="brand-hero-title">
            Everything you need.
            <br />
            <em>Under one roof.</em>
          </h1>
          <p>
            Fresh choices. Familiar favourites.
            <br />
            Bring home a little more goodness with Shifa.
          </p>
          <div className="brand-hero-actions">
            <Link to="/products" className="button brand-hero-shop">
              Shop now <Icon name="arrow" />
            </Link>
            <Link to="/categories" className="brand-hero-browse">
              Explore categories <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <span className="brand-hero-trust">
            <Icon name="box" size={16} /> Cash on Delivery in selected areas
          </span>
        </div>
        <div className="brand-hero-light" aria-hidden="true" />
        <div className="brand-hero-photo-note" aria-hidden="true">
          <Icon name="leaf" size={20} />
          <span>
            Your daily dose
            <br />
            <strong>of goodness.</strong>
          </span>
        </div>
      </div>
      <div className="brand-hero-footer">
        <span>
          SHIFA <strong>SUPERSTORE</strong>
        </span>
        <button
          type="button"
          className="brand-hero-pause"
          aria-pressed={paused}
          onClick={() => setPaused(!paused)}
        >
          {paused ? 'Play banner animation' : 'Pause banner animation'}
        </button>
      </div>
    </section>
  );
}
