import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Icon } from './UI';
import CategorySheet from './CategorySheet';
import { tabSwipeDirection } from './mobileGestures';

export default function MobileBottomNav() {
  const { user } = useAuth();
  const { cart } = useCart();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  useEffect(() => { setCategoriesOpen(false); }, [pathname]);
  const admin = user?.role === 'admin';
  const accountPath = !user ? '/login' : admin ? '/admin-dashboard' : '/my-orders';
  useEffect(() => {
    if (pathname.startsWith('/admin-dashboard')) return;
    const tabPaths = ['/', '/categories', admin ? '/offers' : '/cart', accountPath];
    const current = tabPaths.indexOf(pathname);
    if (current < 0) return;
    let start = null;
    const begin = (event) => {
      start = null;
      if (!window.matchMedia('(max-width: 760px)').matches || event.touches.length !== 1) return;
      const target = event.target;
      if (!target.closest('#main-content, .mobile-bottom-nav') ||
        target.closest('input, textarea, select, button, dialog, .promo-viewport, .category-rail-window')) return;
      const touch = event.touches[0];
      // Leave screen edges to the browser's native back/forward gestures.
      if (touch.clientX < 28 || touch.clientX > window.innerWidth - 28) return;
      start = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    };
    const finish = (event) => {
      if (!start || event.changedTouches.length !== 1) return;
      const origin = start;
      start = null;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - origin.x;
      const dy = touch.clientY - origin.y;
      const direction = tabSwipeDirection(dx, dy, Date.now() - origin.time);
      if (!direction) return;
      const next = current + direction;
      if (next >= 0 && next < tabPaths.length) {
        if (tabPaths[next] === '/categories') setCategoriesOpen(true);
        else navigate(tabPaths[next], { state: { mobileSwipe: dx < 0 ? 'next' : 'previous' } });
      }
    };
    const cancel = () => { start = null; };
    document.addEventListener('touchstart', begin, { passive: true });
    document.addEventListener('touchend', finish, { passive: true });
    document.addEventListener('touchcancel', cancel, { passive: true });
    return () => {
      document.removeEventListener('touchstart', begin);
      document.removeEventListener('touchend', finish);
      document.removeEventListener('touchcancel', cancel);
    };
  }, [pathname, accountPath, admin, navigate]);
  if (pathname.startsWith('/admin-dashboard')) return null;
  const items = [
    { to: '/', label: 'Home', icon: 'home', end: true },
    { to: '/categories', label: 'Categories', icon: 'grid' },
    admin ? { to: '/offers', label: 'Offers', icon: 'leaf' }
      : { to: '/cart', label: 'Cart', icon: 'cart', count: cart.item_count },
    { to: accountPath, label: admin ? 'Admin' : 'Profile', icon: 'user' },
  ];
  return (
    <>
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      {items.map(({ to, label, icon, count, end }) => label === 'Categories' ? (
        <button key={label} type="button" className={`mobile-tab ${categoriesOpen || pathname === '/categories' ? 'active' : ''}`}
          aria-haspopup="dialog" aria-expanded={categoriesOpen} onClick={() => setCategoriesOpen(true)}>
          <span className="mobile-tab-icon"><Icon name={icon} size={21} /></span><span>{label}</span>
        </button>
      ) : (
        <NavLink key={label} to={to} end={end} className={({ isActive }) => isActive ? 'mobile-tab active' : 'mobile-tab'}>
          <span className="mobile-tab-icon"><Icon name={icon} size={21} />
            {count > 0 && <span className="mobile-tab-count" aria-label={`${count} items`}>{count > 99 ? '99+' : count}</span>}
          </span>
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
    <CategorySheet open={categoriesOpen} onClose={() => setCategoriesOpen(false)} />
    </>
  );
}
