import { useAuth } from '../../context/AuthContext';
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import useLoad from '../../hooks/useLoad';
import { ErrorBox, Icon, Loader } from './UI';
import { sheetSwipeDown } from './mobileGestures';
import dialogPolyfill from 'dialog-polyfill';
import 'dialog-polyfill/dist/dialog-polyfill.css';

export default function CategorySheet({ open, onClose }) {
  const dialog = useRef(null);
  const drag = useRef(null);
  const { user } = useAuth();
  const categories = useLoad(open ? 'categories/' : null, { cacheKey: `categories:${user?.id || 'guest'}:${user?.role || 'guest'}` });
  useEffect(() => {
    if (typeof dialog.current.showModal !== 'function') dialogPolyfill.registerDialog(dialog.current);
    if (open && !dialog.current.open) dialog.current.showModal();
    else if (!open && dialog.current.open) dialog.current.close();
  }, [open]);
  return (
    <dialog ref={dialog} className="category-sheet" aria-labelledby="category-sheet-title"
      onCancel={onClose} onClose={onClose}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="category-sheet-heading"
        onTouchStart={(event) => {
          drag.current = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
        }}
        onTouchEnd={(event) => {
          const start = drag.current;
          drag.current = null;
          if (start && event.changedTouches.length === 1 && sheetSwipeDown(event.changedTouches[0].clientX - start.x, event.changedTouches[0].clientY - start.y)) onClose();
        }}>
        <span className="category-sheet-handle" aria-hidden="true" />
        <div className="category-sheet-title-row">
          <div><p>FIND YOUR EVERYDAY</p><h2 id="category-sheet-title">Explore categories</h2></div>
          <button type="button" className="category-sheet-close" aria-label="Close categories" onClick={onClose}>×</button>
        </div>
      </div>
      <div className="category-sheet-content">
        {categories.loading ? <Loader /> : categories.error ? <ErrorBox message={categories.error} retry={categories.reload} />
          : categories.data?.length ? <div className="category-bubble-grid">
            {categories.data.map((category, index) => (
              <Link key={category.id} to={`/products?category=${category.id}`} className={`category-bubble tone-bubble-${index % 4}`} onClick={onClose}>
                <span>{category.image ? <img src={category.image} alt="" loading="lazy" /> : <Icon name="leaf" size={27} />}</span>
                <strong>{category.name}</strong>
              </Link>
            ))}
          </div> : <p className="muted">Categories are being prepared.</p>}
        <Link className="category-sheet-all" to="/categories" onClick={onClose}>View all categories <Icon name="arrow" size={16} /></Link>
      </div>
    </dialog>
  );
}
