// Copy to frontend/src/admin/ProductImport.jsx
import { useState } from 'react';
import api, { errorMessage } from '../services/api';
import { ErrorBox } from '../components/common/UI';

export default function ProductImport({ onImported }) {
  const [csvFile, setCsvFile] = useState(null);
  const [images, setImages] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  function choose(setter, file) {
    setter(file);
    setPreview(null);
    setError('');
    setMessage('');
  }

  async function download(template = false) {
    setBusy(true);
    setError('');
    try {
      const { data } = await api.get('products/export-csv/', {
        params: template ? { template: 'true' } : {},
        responseType: 'blob',
      });
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = template ? 'shifa-product-template.csv' : 'shifa-products.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setError('Could not download CSV. Check your admin login and try again.');
    } finally {
      setBusy(false);
    }
  }

  async function submit(confirm = false) {
    if (!csvFile || (confirm && !preview?.preview_token)) return;
    setBusy(true);
    setError('');
    setMessage('');
    const form = new FormData();
    form.append('csv_file', csvFile);
    if (images) form.append('images', images);
    if (confirm) {
      form.append('confirm', 'true');
      form.append('preview_token', preview.preview_token);
    }
    try {
      const { data } = await api.post('products/import-csv/', form, { timeout: 120000 });
      if (data.imported !== undefined) {
        setPreview(null);
        setMessage(`Imported ${data.imported} products: ${data.created} created, ${data.updated} updated.`);
        onImported();
      } else {
        setPreview(data);
      }
    } catch (err) {
      setError(errorMessage(err));
      setPreview(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel product-import" aria-labelledby="product-import-title">
      <h2 id="product-import-title">Import and export products</h2>
      <p>Download your catalogue or a blank template. Edit in Excel and save as CSV UTF-8.</p>
      <div className="import-actions">
        <button className="button button-outline" disabled={busy} onClick={() => download()}>Export products CSV</button>
        <button className="button button-outline" disabled={busy} onClick={() => download(true)}>Download template</button>
      </div>
      <div className="import-files">
        <label>Products CSV (maximum 2 MB, 500 rows)
          <input type="file" accept=".csv,text/csv" disabled={busy} onChange={e => choose(setCsvFile, e.target.files[0] || null)} />
        </label>
        <label>Product images ZIP (optional, maximum 25 MB)
          <input type="file" accept=".zip,application/zip" disabled={busy} onChange={e => choose(setImages, e.target.files[0] || null)} />
        </label>
      </div>
      <p>Use an existing product_id to update; leave it blank to create. Category and brand names must already exist. A blank category or brand clears it. A blank image_filename keeps the current image. Photos must be JPEG, PNG or WebP, up to 5 MB each. Filenames must match the CSV exactly.</p>
      <ErrorBox message={error} />
      {message && <p role="status">{message}</p>}
      <button className="button" disabled={busy || !csvFile} onClick={() => submit()}>{busy ? 'Please wait...' : 'Preview import'}</button>
      {preview && <div aria-live="polite">
        {preview.errors?.length > 0 && <div role="alert">
          <h3>Fix these rows and preview again. Nothing has been imported.</h3>
          <ul>{preview.errors.map(item => <li key={item.row}>CSV row {item.row}: {JSON.stringify(item.message)}</li>)}</ul>
        </div>}
        {preview.rows?.length > 0 && <div className="table-wrap import-preview"><table>
          <thead><tr><th>CSV row</th><th>Action</th><th>Product</th><th>Price</th><th>Stock</th><th>Image</th></tr></thead>
          <tbody>{preview.rows.map(row => <tr key={row.row}><td>{row.row}</td><td>{row.action}</td><td>{row.name}</td><td>{row.price}</td><td>{row.stock}</td><td>{row.image}</td></tr>)}</tbody>
        </table></div>}
        {preview.valid && <>
          <p>Confirming will create or update the products shown above, including their stock and prices. Omitted products are kept.</p>
          <button className="button" disabled={busy} onClick={() => submit(true)}>Confirm import ({preview.rows.length} products)</button>
        </>}
      </div>}
    </section>
  );
}
