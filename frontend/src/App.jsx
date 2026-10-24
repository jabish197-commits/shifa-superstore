import { Component, useEffect } from 'react';
import { Routes, Route, useLocation, Link } from 'react-router-dom';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import MobileBottomNav from './components/common/MobileBottomNav';
import ProtectedRoute from './components/common/ProtectedRoute';
import { Empty } from './components/common/UI';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Browse from './pages/Browse';
import Offers from './pages/Offers';
import Delivery from './pages/Delivery';
import Auth from './pages/Auth';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import MyOrders from './pages/MyOrders';
import OrderDetails from './pages/OrderDetails';
import OrderSuccess from './pages/OrderSuccess';
import AdminLayout from './admin/AdminLayout';
import Dashboard from './admin/Dashboard';
import ResourceList from './admin/ResourceList';
import ResourceForm from './admin/ResourceForm';
class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="empty">
        <h1>Something went wrong</h1>
        <p>Please refresh the page to try again.</p>
        <button className="button" onClick={() => window.location.reload()}>
          Refresh
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
export default function App() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Shifa Superstore · Fresh, Quality, Everyday';
  }, [location.pathname]);
  return (
    <ErrorBoundary>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Header />
      <div id="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetails />} />
          <Route path="/categories" element={<Browse type="categories" />} />
          <Route path="/brands" element={<Browse type="brands" />} />
          <Route path="/offers" element={<Offers />} />
          <Route path="/delivery" element={<Delivery />} />
          <Route path="/login" element={<Auth key="login" />} />
          <Route path="/register" element={<Auth key="register" register />} />
          <Route element={<ProtectedRoute role="customer" />}>
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/my-orders" element={<MyOrders />} />
            <Route path="/my-orders/:id" element={<OrderDetails />} />
            <Route path="/order-success/:id" element={<OrderSuccess />} />
          </Route>
          <Route element={<ProtectedRoute role="admin" />}>
            <Route path="/admin-dashboard" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="orders" element={<MyOrders admin />} />
              <Route path="orders/:id" element={<OrderDetails admin />} />
              <Route path=":resource" element={<ResourceList key={location.pathname} />} />
              <Route path=":resource/new" element={<ResourceForm key={location.pathname} />} />
              <Route path=":resource/:id/edit" element={<ResourceForm key={location.pathname} />} />
            </Route>
          </Route>
          <Route
            path="*"
            element={
              <Empty title="This page could not be found" to="/" action="Back to the store">
                Let’s get you back to something fresh.
              </Empty>
            }
          />
        </Routes>
      </div>
      <Footer />
      <MobileBottomNav />
    </ErrorBoundary>
  );
}
