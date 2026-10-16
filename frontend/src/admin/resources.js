const active = { name: 'is_active', label: 'Active', type: 'checkbox', default: true };
const description = { name: 'description', label: 'Description', type: 'textarea' };
const name = { name: 'name', label: 'Name', required: true, maxLength: 100 };
export const resources = {
  products: {
    title: 'Products',
    singular: 'product',
    fields: [
      { ...name, maxLength: 200 },
      description,
      { name: 'category', label: 'Category', type: 'select', source: 'categories' },
      { name: 'brand', label: 'Brand', type: 'select', source: 'brands' },
      {
        name: 'price',
        label: 'Regular price (₹)',
        type: 'number',
        required: true,
        min: '0.01',
        step: '0.01',
      },
      {
        name: 'stock',
        label: 'Stock quantity',
        type: 'number',
        required: true,
        min: '0',
        step: '1',
        default: 0,
      },
      { name: 'image', label: 'Product image', type: 'file' },
      active,
    ],
  },
  categories: {
    title: 'Categories',
    singular: 'category',
    fields: [name, description, { name: 'image', label: 'Category image', type: 'file' }, active],
  },
  brands: { title: 'Brands', singular: 'brand', fields: [name, description, active] },
  offers: {
    title: 'Offers',
    singular: 'offer',
    fields: [
      { name: 'title', label: 'Title', required: true, maxLength: 150 },
      description,
      {
        name: 'products',
        label: 'Products (hold Ctrl or Cmd to select several)',
        type: 'multi',
        source: 'products',
        required: true,
      },
      {
        name: 'discount_percent',
        label: 'Discount (%)',
        type: 'number',
        required: true,
        min: '0.01',
        max: '99',
        step: '0.01',
      },
      {
        name: 'starts_at',
        label: 'Starts at (your local time)',
        type: 'datetime-local',
        required: true,
      },
      {
        name: 'ends_at',
        label: 'Ends at (your local time)',
        type: 'datetime-local',
        required: true,
      },
      active,
    ],
  },
  banners: {
    title: 'Banners',
    singular: 'banner',
    fields: [
      { name: 'title', label: 'Title', required: true, maxLength: 150 },
      { name: 'subtitle', label: 'Subtitle', maxLength: 250 },
      { name: 'alt_text', label: 'Image accessibility text', required: true, maxLength: 200 },
      { name: 'image', label: 'Banner image', type: 'file', required: true },
      {
        name: 'display_order',
        label: 'Display order',
        type: 'number',
        min: '0',
        step: '1',
        default: 0,
      },
      active,
    ],
  },
  'delivery-areas': {
    title: 'Delivery areas',
    singular: 'delivery area',
    fields: [
      { name: 'area_name', label: 'Area name', required: true, maxLength: 120 },
      { name: 'pincode', label: 'Pincode', required: true, pattern: '[1-9][0-9]{5}', maxLength: 6 },
      active,
    ],
  },
};
