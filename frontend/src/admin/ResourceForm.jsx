import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { errorMessage, listAll } from '../services/api';
import { resources } from './resources';
import { Loader, ErrorBox, Empty, PageHeading } from '../components/common/UI';
const localDate = (value) => {
  const d = new Date(value);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
export default function ResourceForm() {
  const { resource, id } = useParams();
  const config = resources[resource];
  const navigate = useNavigate();
  const [values, setValues] = useState({});
  const [options, setOptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let live = true;
    setLoading(true);
    setError('');
    if (!config) {
      setLoading(false);
      return;
    }
    const sources = [...new Set(config.fields.filter((f) => f.source).map((f) => f.source))];
    Promise.all([
      id ? api.get(`${resource}/${id}/`).then((r) => r.data) : Promise.resolve({}),
      ...sources.map((s) => listAll(`${s}/`)),
    ])
      .then(([data, ...lists]) => {
        if (!live) return;
        const initial = Object.fromEntries(
          config.fields.map((f) => [
            f.name,
            data[f.name] ??
              f.default ??
              (f.type === 'multi'
                ? []
                : f.type === 'datetime-local'
                  ? localDate(Date.now() + (f.name === 'ends_at' ? 7 * 86400000 : 0))
                  : ''),
          ]),
        );
        config.fields
          .filter((f) => f.type === 'datetime-local' && data[f.name])
          .forEach((f) => {
            initial[f.name] = localDate(data[f.name]);
          });
        setValues(initial);
        setOptions(Object.fromEntries(sources.map((s, i) => [s, lists[i]])));
      })
      .catch((err) => {
        if (live) setError(errorMessage(err));
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [resource, id, config]);
  if (!config) return <Empty title="Page not found" />;
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const payload = {};
      for (const field of config.fields) {
        let value = values[field.name];
        if (field.type === 'file') {
          if (value instanceof File) {
            if (value.size > 5 * 1024 * 1024) throw new Error('Images must be 5 MB or smaller.');
            payload[field.name] = value;
          }
          continue;
        }
        if (field.type === 'datetime-local') value = new Date(value).toISOString();
        if (field.type === 'select') value = value ? Number(value) : null;
        if (field.type === 'multi') value = value.map(Number);
        payload[field.name] = value;
      }
      let body = payload;
      if (Object.values(payload).some((v) => v instanceof File)) {
        body = new FormData();
        Object.entries(payload).forEach(([key, value]) =>
          body.append(key, value === null ? '' : value),
        );
      }
      if (id) await api.patch(`${resource}/${id}/`, body);
      else await api.post(`${resource}/`, body);
      navigate(`/admin-dashboard/${resource}`);
    } catch (err) {
      setError(err.response || err.code ? errorMessage(err) : err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Link className="text-link" to={`/admin-dashboard/${resource}`}>
        ← Back to {config.title.toLowerCase()}
      </Link>
      <PageHeading title={`${id ? 'Edit' : 'Add'} ${config.singular}`} />
      {loading ? (
        <Loader />
      ) : (
        <form className="panel resource-form" onSubmit={submit}>
          <ErrorBox message={error} />
          <div className="form-grid">
            {config.fields.map((field) => (
              <label
                className={
                  field.type === 'textarea' || field.type === 'multi' || field.type === 'file'
                    ? 'span-two'
                    : field.type === 'checkbox'
                      ? 'checkbox'
                      : ''
                }
                key={field.name}
              >
                {field.type !== 'checkbox' && field.label}
                {field.type === 'checkbox' ? (
                  <>
                    <input
                      type="checkbox"
                      checked={Boolean(values[field.name])}
                      onChange={(e) => setValues({ ...values, [field.name]: e.target.checked })}
                    />
                    {field.label}
                  </>
                ) : field.type === 'textarea' ? (
                  <textarea
                    rows="4"
                    value={values[field.name] || ''}
                    onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
                  />
                ) : field.type === 'select' || field.type === 'multi' ? (
                  <select
                    multiple={field.type === 'multi'}
                    required={field.required}
                    value={values[field.name] ?? (field.type === 'multi' ? [] : '')}
                    onChange={(e) =>
                      setValues({
                        ...values,
                        [field.name]:
                          field.type === 'multi'
                            ? Array.from(e.target.selectedOptions, (option) => option.value)
                            : e.target.value,
                      })
                    }
                  >
                    {field.type === 'select' && <option value="">None</option>}
                    {options[field.source]?.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                        {item.is_active ? '' : ' (inactive)'}
                      </option>
                    ))}
                  </select>
                ) : field.type === 'file' ? (
                  <>
                    {typeof values[field.name] === 'string' && values[field.name] && (
                      <img className="form-image" src={values[field.name]} alt="Current image" />
                    )}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      required={field.required && !id}
                      onChange={(e) => setValues({ ...values, [field.name]: e.target.files[0] })}
                    />
                    <small>JPEG, PNG, or WebP · Maximum 5 MB</small>
                  </>
                ) : (
                  <input
                    type={field.type || 'text'}
                    required={field.required}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    maxLength={field.maxLength}
                    pattern={field.pattern}
                    value={values[field.name] ?? ''}
                    onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
                  />
                )}
              </label>
            ))}
          </div>
          <div className="button-row">
            <button className="button" disabled={busy}>
              {busy ? 'Saving…' : `Save ${config.singular}`}
            </button>
            <Link className="button secondary" to={`/admin-dashboard/${resource}`}>
              Cancel
            </Link>
          </div>
        </form>
      )}
    </>
  );
}
