import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Icon } from './UI';
import logo from '../../assets/shifa-logo.png';
export default function Header() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  return (
    <>
      <div className="top-strip">
        <span>
          <Icon name="leaf" size={14} /> Fresh • Quality • Everyday
        </span>
        <Link to="/delivery">
          Cash on Delivery in selected areas <Icon name="arrow" size={14} />
        </Link>
      </div>
      <header className="header floating-header">
        <div className="header-main container">
          <Link className="brand" to="/" aria-label="Shifa Superstore home">
            <img src={logo} alt="" />
            <span>
              SHIFA<small>SUPERSTORE</small>
            </span>
          </Link>
          <form
            className="search-bar"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              navigate(`/products?search=${encodeURIComponent(search)}`);
            }}
          >
            <Icon name="search" />
            <input
              aria-label="Search products"
              placeholder="Search for your everyday essentials…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" aria-label="Search">
              <Icon name="arrow" />
            </button>
          </form>
          <div className="header-actions">
            {user ? (
              <>
                <Link
                  className="account-link"
                  aria-label={user.role === 'admin' ? 'Admin dashboard' : 'My orders'}
                  to={user.role === 'admin' ? '/admin-dashboard' : '/my-orders'}
                >
                  <Icon name="user" />
                  <span>
                    {user.first_name || user.username}
                    <small>{user.role === 'admin' ? 'Store administration' : 'My orders'}</small>
                  </span>
                </Link>
                <button
                  className="text-button logout"
                  onClick={async () => {
                    try {
                      await logout();
                    } catch {}
                    navigate('/');
                  }}
                >
                  Log out
                </button>
              </>
            ) : (
              <Link className="account-link" to="/login" aria-label="Sign in or register">
                <Icon name="user" />
                <span>
                  Hello, welcome<small>Sign in / Register</small>
                </span>
              </Link>
            )}
            {user?.role !== 'admin' && (
              <Link className="cart-link" to="/cart" aria-label={`Cart, ${cart.item_count} items`}>
                <Icon name="cart" size={23} />
                <span className="cart-count">{cart.item_count}</span>
              </Link>
            )}
          </div>
        </div>
        <nav className="main-nav container" aria-label="Main navigation">
          <NavLink to="/products">Shop all</NavLink>
          <NavLink to="/categories">Categories</NavLink>
          <NavLink to="/brands">Brands</NavLink>
          <NavLink to="/offers">
            Offers <span className="nav-dot" />
          </NavLink>
          <NavLink to="/delivery" className="delivery-nav">
            <Icon name="pin" size={16} />
            Check delivery availability
          </NavLink>
        </nav>
      </header>
    </>
  );
}
