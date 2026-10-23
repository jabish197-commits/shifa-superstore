import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from './UI';

export default function MobileCategoryRail({ categories }) {
  const [paused, setPaused] = useState(false);
  const middle = Math.ceil(categories.length / 2);
  const rows = [categories.slice(0, middle), categories.slice(middle)].filter((row) => row.length);

  return (
    <div className="mobile-category-rail" data-paused={paused}>
      <div className="category-rail-caption">
        <span><i aria-hidden="true" /> Little finds. Everyday favourites.</span>
        <button type="button" aria-pressed={paused} onClick={() => setPaused(!paused)}>
          {paused ? 'Play animation' : 'Pause animation'}
        </button>
      </div>
      <div className="category-rail-window" aria-label="Shop all categories">
        {rows.map((row, rowIndex) => (
          <div className={`category-rail-track category-rail-track-${rowIndex}`} key={rowIndex}
            style={{ '--rail-duration': `${Math.max(row.length * 4.5, 24)}s` }}>
            {[false, true].map((duplicate) => (
              <div className="category-rail-group" key={String(duplicate)}
                aria-hidden={duplicate || undefined} data-duplicate={duplicate}>
                {row.map((category, index) => (
                  <Link className={`category-mini-card category-mini-tone-${(index + rowIndex) % 4}`}
                    key={category.id} to={`/products?category=${category.id}`}
                    tabIndex={duplicate ? -1 : undefined}>
                    <span className="category-mini-art">
                      {category.image ? <img src={category.image} alt="" loading="lazy" draggable="false" />
                        : <Icon name="leaf" size={30} />}
                      <span className="category-mini-arrow" aria-hidden="true">↗</span>
                    </span>
                    <strong>{category.name}</strong>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
      <p className="category-rail-hint">A little inspiration, on the move. Tap a category to explore.</p>
    </div>
  );
}
