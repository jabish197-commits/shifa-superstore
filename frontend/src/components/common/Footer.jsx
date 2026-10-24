import { Link } from 'react-router-dom';
import { Icon } from './UI';
export default function Footer() {
  return (
    <footer>
      <div className="container footer-grid">
        <div>
          <div className="footer-brand">
            SHIFA <span>SUPERSTORE</span>
          </div>
          <p>
            Good things for your everyday.
            <br />
            Fresh groceries and household essentials, close to home.
          </p>
        </div>
        <div>
          <h3>Explore the store</h3>
          <Link to="/products">All products</Link>
          <Link to="/categories">Categories</Link>
          <Link to="/brands">Brands</Link>
          <Link to="/offers">Current offers</Link>
        </div>
        <div>
          <h3>Here to help</h3>
          <Link to="/delivery">Delivery areas</Link>
          <Link to="/my-orders">Track your orders</Link>
          <Link to="/login">Your account</Link>
        </div>
        <div className="footer-note">
          <Icon name="box" size={30} />
          <h3>Pay when it arrives.</h3>
          <p>Cash on Delivery, available in our selected service areas.</p>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Shifa Superstore</span>
        <span>Fresh • Quality • Everyday</span>
      </div>
    </footer>
  );
}
