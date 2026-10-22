import ProductImport from './ProductImport';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import useLoad from '../hooks/useLoad';
import api, { errorMessage } from '../services/api';
import { resources } from './resources';
import {
  Loader,
  ErrorBox,
  Empty,
  PageHeading,
  Icon,
  Pagination,
  money,
  Badge,
} from '../components/common/UI';
export default function ResourceList() {
  const { resource } = useParams();
  const config = resources[resource];
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(null);
  const [actionError, setActionError] = useState('');
  const { data, loading, error, reload } = useLoad(
    config ? `${resource}/?page=${page}&search=${encodeURIComponent(search)}` : null,
  );
  if (!config) return <Empty title="Page not found" />;
  let rows = Array.isArray(data) ? data : data?.results || [];
  if (Array.isArray(data) && search)
    rows = rows.filter((row) => JSON.stringify(row).toLowerCase().includes(search.toLowerCase()));
  async function act(id, operation) {
    setBusy(id);
    setActionError('');
    try {
      await operation();
      reload();
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }
  return (
    <>
      <PageHeading
        title={config.title}
        action={
          <Link className="button" to={`/admin-dashboard/${resource}/new`}>
            <Icon name="plus" />
            Add {config.singular}
          </Link>
        }
      />
      {resource === 'products' && <ProductImport onImported={reload} />}
      <label className="admin-search">
        Search {config.title.toLowerCase()}
        <input
          value={search}
          placeholder="Search…"
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </label>
      <ErrorBox message={actionError} />
      {loading ? (
        <Loader />
      ) : error ? (
        <ErrorBox message={error} retry={reload} />
      ) : rows.length ? (
        <>
          <div className="table-wrap panel">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Details</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="table-name">
                        {row.image && <img src={row.image} alt="" />}
                        <span>
                          <strong>{row.name || row.title || row.area_name}</strong>
                          <small>#{row.id}</small>
                        </span>
                      </div>
                    </td>
                    <td>
                      {resource === 'products' ? (
                        <>
                          {money(row.price)}
                          <small>Stock: {row.stock}</small>
                        </>
                      ) : resource === 'offers' ? (
                        <>
                          {Number(row.discount_percent)}% off
                          <small>{row.products.length} products</small>
                        </>
                      ) : resource === 'delivery-areas' ? (
                        row.pincode
                      ) : resource === 'banners' ? (
                        `Order: ${row.display_order}`
                      ) : (
                        <span className="truncate">{row.description || '—'}</span>
                      )}
                    </td>
                    <td>
                      <Badge>{row.is_active ? 'Active' : 'Inactive'}</Badge>
                    </td>
                    <td>
                      <div className="table-actions">
                        <Link
                          className="text-button"
                          to={`/admin-dashboard/${resource}/${row.id}/edit`}
                        >
                          Edit
                        </Link>
                        <button
                          className="text-button"
                          disabled={busy !== null}
                          onClick={() =>
                            act(row.id, () =>
                              api.patch(`${resource}/${row.id}/`, { is_active: !row.is_active }),
                            )
                          }
                        >
                          {row.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          className="text-button danger"
                          disabled={busy !== null}
                          onClick={() => {
                            if (window.confirm(`Delete this ${config.singular}?`))
                              act(row.id, () => api.delete(`${resource}/${row.id}/`));
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!Array.isArray(data) && (
            <Pagination page={page} next={data.next} previous={data.previous} onChange={setPage} />
          )}
        </>
      ) : (
        <Empty title={`No ${config.title.toLowerCase()} found`}>
          Add a {config.singular} to get started.
        </Empty>
      )}
    </>
  );
}
