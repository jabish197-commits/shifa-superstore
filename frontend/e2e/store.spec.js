import { test, expect } from '@playwright/test';
test('customer shops, checks delivery, places COD order; admin manages it', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Everything you need. Under one roof.' }),
  ).toBeVisible();
  await page.screenshot({ path: 'test-results/home-desktop.png', fullPage: true });
  await page.goto('/register');
  await page.getByLabel('First name').fill('Browser Customer');
  await page.getByLabel('Email', { exact: true }).fill('browser@example.test');
  await page.getByLabel('Username', { exact: true }).fill(`browser_${Date.now()}`);
  await page.getByLabel('Password', { exact: true }).fill('Customer-test-729!');
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page).toHaveURL(/\/products$/);
  await page.getByRole('button', { name: 'Add Test Basmati Rice to cart' }).click();
  await expect(page.getByRole('link', { name: 'Cart, 1 items' })).toBeVisible();
  await page.goto('/cart');
  await expect(page.getByText('Test Basmati Rice', { exact: true })).toBeVisible();
  await page.goto('/checkout');
  await expect(page.getByRole('heading', { name: 'Delivery address' })).toBeVisible();
  for (const [label, value] of Object.entries({
    'Full name': 'Browser Customer',
    'Mobile number': '9876543210',
    'House / door number': '12',
    Street: 'Test Street',
    Area: 'Unavailable Area',
    Pincode: '629165',
    City: 'Test City',
    District: 'Test District',
    State: 'Tamil Nadu',
  }))
    await page.getByLabel(label, { exact: true }).fill(value);
  await page.getByRole('button', { name: 'Check delivery availability', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Place COD order' })).toBeDisabled();
  await expect(page.getByText(/currently don.t deliver/)).toBeVisible();
  await page.getByLabel('Area', { exact: true }).fill('Test Area');
  await page.getByRole('button', { name: 'Check delivery availability', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Place COD order' })).toBeEnabled();
  await page.getByRole('button', { name: 'Place COD order' }).click();
  await expect(page).toHaveURL(/\/order-success\/\d+$/);
  await expect(page.getByRole('heading', { name: 'Your order is placed.' })).toBeVisible();
  const id = page.url().split('/').pop();
  await page.getByRole('link', { name: 'View order', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Items in your order' })).toBeVisible();
  await expect(page.getByText('Test Basmati Rice', { exact: true })).toBeVisible();
  await page.goto('/admin-dashboard');
  await expect(
    page.getByRole('heading', { name: 'This page is not available for your account' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Log out' }).click();
  await page.goto('/login');
  await page.getByLabel('Username', { exact: true }).fill('e2e_admin');
  await page.getByLabel('Password', { exact: true }).fill('Browser-test-827!');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/admin-dashboard$/);
  await page.goto(`/admin-dashboard/orders/${id}`);
  await page.getByLabel('Next status').selectOption('Confirmed');
  await page.getByRole('button', { name: 'Update status' }).click();
  await expect(page.locator('.order-overview .badge')).toHaveText('Confirmed');
  await page.goto('/admin-dashboard/categories/new');
  await page.getByLabel('Name', { exact: true }).fill('Browser Category');
  await page.getByRole('button', { name: 'Save category' }).click();
  await expect(page.getByText('Browser Category', { exact: true })).toBeVisible();
  await page.goto('/admin-dashboard');
  await expect(page.getByText('Total products', { exact: true })).toBeVisible();
  await page.screenshot({ path: 'test-results/admin-desktop.png', fullPage: true });
  expect(errors).toEqual([]);
});
test('mobile layout, offer filtering, detail, and protected routes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('.brand-hero')).toBeVisible();
  await page.screenshot({ path: 'test-results/home-mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.goto('/offers');
  await page.getByRole('link', { name: 'Shop this offer', exact: true }).click();
  await expect(page.getByText('Test Basmati Rice', { exact: true })).toBeVisible();
  await expect(page.getByText('Test Lentils', { exact: true })).toHaveCount(0);
  await page.getByRole('link', { name: 'Test Basmati Rice', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Test Basmati Rice' })).toBeVisible();
  await page.getByRole('button', { name: 'Add to cart', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto('/my-orders');
  await expect(page).toHaveURL(/\/login$/);
});

test('admin product, brand, offer and delivery management', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Username', { exact: true }).fill('e2e_admin');
  await page.getByLabel('Password', { exact: true }).fill('Browser-test-827!');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/admin-dashboard$/);
  await page.goto('/admin-dashboard/brands/new');
  await page.getByLabel('Name', { exact: true }).fill('Browser Brand');
  await page.getByRole('button', { name: 'Save brand' }).click();
  await expect(page.getByText('Browser Brand', { exact: true })).toBeVisible();
  await page.goto('/admin-dashboard/products/new');
  await page.getByLabel('Name', { exact: true }).fill('Browser Product');
  await page
    .getByRole('combobox', { name: 'Category', exact: true })
    .selectOption({ label: 'Pantry essentials' });
  await page
    .getByRole('combobox', { name: 'Brand', exact: true })
    .selectOption({ label: 'Browser Brand' });
  await page.getByLabel('Regular price').fill('150');
  await page.getByLabel('Stock quantity').fill('12');
  await page.getByRole('button', { name: 'Save product' }).click();
  const row = page.getByRole('row').filter({ hasText: 'Browser Product' });
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: 'Deactivate', exact: true }).click();
  await expect(row.getByText('Inactive', { exact: true })).toBeVisible();
  await row.getByRole('link', { name: 'Edit', exact: true }).click();
  await page.getByLabel('Stock quantity').fill('15');
  await page.getByLabel('Active', { exact: true }).check();
  await page.getByRole('button', { name: 'Save product' }).click();
  await expect(row.getByText('Stock: 15', { exact: true })).toBeVisible();
  await page.goto('/admin-dashboard/offers/new');
  await page.getByLabel('Title', { exact: true }).fill('Browser Offer');
  await page
    .getByRole('listbox', { name: 'Products (hold Ctrl or Cmd to select several)', exact: true })
    .selectOption({ label: 'Browser Product' });
  await page.getByLabel('Discount (%)', { exact: true }).fill('15');
  await page.getByRole('button', { name: 'Save offer' }).click();
  await expect(page.getByText('Browser Offer', { exact: true })).toBeVisible();
  await page.goto('/admin-dashboard/delivery-areas/new');
  await page.getByLabel('Area name', { exact: true }).fill('Browser Delivery');
  await page.getByLabel('Pincode', { exact: true }).fill('629166');
  await page.getByRole('button', { name: 'Save delivery area' }).click();
  const areaRow = page.getByRole('row').filter({ hasText: 'Browser Delivery' });
  await expect(areaRow).toBeVisible();
  page.once('dialog', (dialog) => dialog.accept());
  await areaRow.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(areaRow).toHaveCount(0);
});
