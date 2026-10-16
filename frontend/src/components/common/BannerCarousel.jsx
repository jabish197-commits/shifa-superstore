import groceryPhoto from '../../assets/shifa-realistic-hero.png';
import producePhoto from '../../assets/carousel-produce.png';
import deliveryPhoto from '../../assets/carousel-delivery.png';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from './UI';
import './BannerCarousel.css';
const defaults = [
  {
    id: 'essentials',
    title: 'Small essentials. Big everyday joy.',
    subtitle: 'Discover your kitchen favourites and household essentials, all in one place.',
    to: '/products',
    action: 'Shop now',
    image: groceryPhoto,
    photo: true,
    alt_text: 'Fresh groceries in a supermarket trolley',
    tag: 'THE EVERYDAY EDIT',
    tone: 'peach',
  },
  {
    id: 'discover',
    title: 'A fresh way to fill your basket.',
    subtitle: 'Explore our categories and find what your home needs next.',
    to: '/categories',
    action: 'Explore categories',
    image: producePhoto,
    photo: true,
    alt_text: 'Fresh vegetables and fruit in wooden market crates',
    tag: 'FIND YOUR FAVOURITES',
    tone: 'mint',
  },
  {
    id: 'local',
    title: 'Your neighbourhood. Your superstore.',
    subtitle: 'Check your area and pincode for convenient Cash on Delivery.',
    to: '/delivery',
    action: 'Check delivery',
    image: deliveryPhoto,
    photo: true,
    alt_text: 'Grocery bags on a sunlit doorstep',
    tag: 'CLOSE TO HOME',
    tone: 'lilac',
  },
];
export default function BannerCarousel({ banners = [] }) {
  const slides = banners.length
    ? banners.map((b, i) => ({
        ...b,
        to: '/products',
        action: 'Shop now',
        tone: ['peach', 'mint', 'lilac'][i % 3],
        tag: 'SHIFA SUPERSTORE',
      }))
    : defaults;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [hidden, setHidden] = useState(document.hidden);
  const touch = useRef(null);
  const current = index % slides.length;
  const move = (direction) => setIndex((i) => (i + direction + slides.length) % slides.length);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    const visibility = () => setHidden(document.hidden);
    update();
    media.addEventListener('change', update);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      media.removeEventListener('change', update);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);
  useEffect(() => {
    if (paused || focused || reduced || hidden || slides.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), 6000);
    return () => clearInterval(timer);
  }, [paused, focused, reduced, hidden, slides.length]);
  return (
    <section
      className={`container promo-carousel ${paused || focused || hidden ? 'promo-motion-paused' : ''}`}
      aria-label="Shifa featured banners"
      aria-roledescription="carousel"
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false);
      }}
    >
      <div
        className="promo-viewport"
        onTouchStart={(e) => {
          touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }}
        onTouchEnd={(e) => {
          if (!touch.current) return;
          const dx = e.changedTouches[0].clientX - touch.current.x;
          const dy = e.changedTouches[0].clientY - touch.current.y;
          if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? 1 : -1);
          touch.current = null;
        }}
      >
        <div className="promo-track" style={{ transform: `translateX(-${current * 100}%)` }}>
          {slides.map((slide, i) => (
            <article
              key={slide.id}
              className={`promo-slide promo-${slide.tone} ${slide.photo ? 'promo-photo' : slide.image ? 'promo-uploaded' : ''}`}
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${slides.length}: ${slide.title}`}
              aria-hidden={i !== current}
              inert={i !== current}
            >
              <div className="promo-copy">
                <span className="promo-kicker">{slide.tag}</span>
                <h2>{slide.title}</h2>
                {slide.subtitle && <p>{slide.subtitle}</p>}
                <Link to={slide.to} className="button promo-cta">
                  {slide.action}
                  <Icon name="arrow" />
                </Link>
              </div>
              {slide.image ? (
                <div className="promo-image">
                  <img
                    src={slide.image}
                    alt={slide.alt_text}
                    loading={i === 0 ? 'eager' : 'lazy'}
                  />
                </div>
              ) : (
                <div className="promo-illustration" aria-hidden="true">
                  <span className="promo-orbit" />
                  <span className="promo-spark spark-one">Ã¢Å“Â¦</span>
                  <span className="promo-spark spark-two">Ã¢Å“Â¦</span>
                  <div className="promo-icon-card">
                    <Icon name={slide.icon} size={115} />
                    <strong>SHIFA</strong>
                    <small>Fresh Ã¢â‚¬Â¢ Quality Ã¢â‚¬Â¢ Everyday</small>
                  </div>
                  <span className="promo-seal">
                    Made for
                    <br />
                    <b>everyday.</b>
                  </span>
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
      {slides.length > 1 && (
        <>
          <button
            type="button"
            className="promo-arrow promo-prev"
            aria-label="Previous banner"
            onClick={() => move(-1)}
          >
            {'\u2039'}
          </button>
          <button
            type="button"
            className="promo-arrow promo-next"
            aria-label="Next banner"
            onClick={() => move(1)}
          >
            {'\u203a'}
          </button>
          <div className="promo-controls">
            <div className="promo-dots" aria-label="Choose a banner">
              {slides.map((slide, i) => (
                <button
                  key={slide.id}
                  type="button"
                  aria-label={`Show banner ${i + 1}`}
                  aria-current={current === i ? 'true' : undefined}
                  onClick={() => setIndex(i)}
                >
                  <span />
                </button>
              ))}
            </div>
            {!reduced && (
              <button
                className="promo-pause"
                type="button"
                aria-pressed={paused}
                onClick={(event) => {
                  setPaused(!paused);
                  if (paused) {
                    setFocused(false);
                    event.currentTarget.blur();
                  }
                }}
              >
                {paused ? 'Play slideshow' : 'Pause slideshow'}
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
