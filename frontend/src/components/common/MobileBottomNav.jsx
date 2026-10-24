import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Icon } from './UI';

export default function MobileBottomNav() {
  const { user } = useAuth();
  const { cart } = useCart();
  const { pathname } = useLocation();
  if (pathname.startsWith('/admin-dashboard')) return null;
  const admin = user?.role === 'admin';
  const accountPath = !user ? '/login' : admin ? '/admin-dashboard' : '/my-orders';
  const items = [
    { to: '/', label: 'Home', icon: 'home', end: true },
    { to: '/categories', label: 'Categories', icon: 'grid' },
    admin ? { to: '/offers', label: 'Offers', icon: 'leaf' }
      : { to: '/cart', label: 'Cart', icon: 'cart', count: cart.item_count },
    { to: accountPath, label: admin ? 'Admin' : 'Profile', icon: 'user' },
  ];
  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      {items.map(({ to, label, icon, count, end }) => (
        <NavLink key={label} to={to} end={end} className={({ isActive }) => isActive ? 'mobile-tab active' : 'mobile-tab'}>
          <span className="mobile-tab-icon"><Icon name={icon} size={21} />
            {count > 0 && <span className="mobile-tab-count" aria-label={`${count} items`}>{count > 99 ? '99+' : count}</span>}
          </span>
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
