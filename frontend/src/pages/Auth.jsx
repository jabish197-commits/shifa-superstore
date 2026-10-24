import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { errorMessage } from '../services/api';
import { ErrorBox, Icon } from '../components/common/UI';
export default function Auth({ register = false }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(e.currentTarget));
    setBusy(true);
    setError('');
    try {
      if (register) await authService.register(values);
      await login({ username: values.username, password: values.password });
      navigate('/', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="container auth-page">
      <div className="auth-story">
        <p className="eyebrow">WELCOME TO YOUR LOCAL STORE</p>
        <h1>
          Good things
          <br />
          start here.
        </h1>
        <p>
          Your everyday essentials, all in one place.
          <br />
          Shop with care. Pay on delivery.
        </p>
        <Icon name="leaf" size={90} />
      </div>
      <form className="panel auth-form" onSubmit={submit}>
        <h2>{register ? 'Create your account' : 'Welcome back'}</h2>
        <p className="muted">
          {register
            ? 'A few details and you’re ready to shop.'
            : 'Sign in to shop or manage your store.'}
        </p>
        <ErrorBox message={error} />
        {register && (
          <>
            <label>
              First name
              <input name="first_name" autoComplete="given-name" maxLength="150" />
            </label>
            <label>
              Email
              <input name="email" type="email" required autoComplete="email" />
            </label>
          </>
        )}
        <label>
          Username
          <input name="username" required maxLength="150" autoComplete="username" />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            required
            minLength={register ? 8 : undefined}
            autoComplete={register ? 'new-password' : 'current-password'}
          />
        </label>
        {register && (
          <small className="muted">
            Use at least 8 characters and avoid common or entirely numeric passwords.
          </small>
        )}
        <button className="button full" disabled={busy}>
          {busy ? 'Please wait…' : register ? 'Create account' : 'Sign in'}
          <Icon name="arrow" />
        </button>
        <p className="auth-switch">
          {register ? 'Already have an account?' : 'New to Shifa?'}{' '}
          <Link to={register ? '/login' : '/register'} state={location.state}>
            {register ? 'Sign in' : 'Create an account'}
          </Link>
        </p>
      </form>
    </main>
  );
}
