import { NavLink, Outlet } from 'react-router-dom';
import { resources } from './resources';
import { Icon } from '../components/common/UI';
export default function AdminLayout() {
  return (
    <div className="admin-layout container">
      <aside className="admin-sidebar">
        <p className="eyebrow">STORE ADMINISTRATION</p>
        <NavLink end to="/admin-dashboard">
          <Icon name="box" />
          Overview
        </NavLink>
        {Object.entries(resources).map(([key, config]) => (
          <NavLink key={key} to={`/admin-dashboard/${key}`}>
            <Icon name={key === 'delivery-areas' ? 'pin' : key === 'products' ? 'leaf' : 'box'} />
            {config.title}
          </NavLink>
        ))}
        <NavLink to="/admin-dashboard/orders">
          <Icon name="cart" />
          Orders
        </NavLink>
        <a
          href={
            import.meta.env.VITE_DJANGO_ADMIN_URL || (import.meta.env.VITE_API_URL ? new URL('../admin/', import.meta.env.VITE_API_URL).href : import.meta.env.DEV ? 'http://127.0.0.1:8000/admin/' : '/admin/')
          }
          target="_blank"
          rel="noreferrer"
        >
          Django administration ↗
        </a>
      </aside>
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}
