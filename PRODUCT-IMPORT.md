# Product CSV import and export

Open Store administration > Products > Import and export products.

1. Export products CSV to edit existing products, or download the blank template for new products.
2. Open the file in Excel. Keep all column names and their order unchanged.
3. Keep product_id for updates. Leave it blank for new products. Names must be unique within the file and must not duplicate another product.
4. Use existing category and brand names. Blank category/brand clears that relation. is_active must be true or false. Active products also need active categories/brands to appear publicly.
5. Enter actual price and stock. Save as CSV UTF-8 (comma delimited).
6. Put photos in one folder and ZIP that folder. In image_filename, enter the exact basename including extension, such as scrubber.jpg. New or changed filenames need the matching ZIP image. A blank filename preserves the current image; a new product without an image uses a placeholder.
7. Choose the CSV and optional images ZIP. Preview import, correct any row errors, preview again, then Confirm import.
8. Refresh the public catalogue. Up to 500 rows and 2 MB per CSV; ZIP up to 25 MB, 80 MB uncompressed; each JPEG/PNG/WebP image up to 5 MB.

Exported CSV stores image filenames, not embedded pictures. This feature does not accept native XLSX files. Save Excel files as CSV UTF-8 first. The import does not create missing categories/brands or delete omitted products. Preview expires after 30 minutes and must be repeated after file or product changes.

Admin-only endpoints:
- GET /api/products/export-csv/
- GET /api/products/export-csv/?template=true
- POST /api/products/import-csv/ (multipart: csv_file, optional images)
- Confirm the same files with confirm=true and the preview_token returned by preview.

No schema migrations or additional dependencies are required. The existing image storage configuration is used; production hosting must support persistent media storage.
