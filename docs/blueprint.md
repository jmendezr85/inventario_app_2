# **App Name**: StockFlow

## Core Features:

- Excel Import: Upload and parse .xlsx files in batches of 400 to populate the product master data.
- Store Management: Create and select multiple storage locations (e.g., 'Main Store', 'Warehouse').
- Barcode Scanning: Scan EAN-13 barcodes using the device camera, using `html5-qrcode` and store data locally.
- Manual Input: Accept manual input of product codes via a text field.
- Inventory Tracking: Increment product counts in the selected inventory (`inventory_{storeId}`) and record the location ('Warehouse' or 'Shelf').
- Real-time Reporting: Display a searchable inventory report with options to edit quantities or delete items.
- Excel Export: Export inventory data to an .xlsx file with columns for EAN, Description, Quantity in WAREHOUSE, Quantity on SHELF, and TOTAL.

## Style Guidelines:

- Primary color: Strong blue (#2962FF) to convey trust and efficiency.
- Background color: Very light blue (#E6EEFF) for a clean interface.
- Accent color: Soft violet (#7953D2) to highlight interactive elements.
- Body and headline font: 'Inter', a sans-serif, to provide a clean, readable UI.
- Full-screen overlay for barcode scanning and prominent buttons for location selection.
- Clear and simple icons for store management, scanning, and reporting functionalities.
- Visual feedback (green/yellow colors) upon successful scan and subtle transitions for UI elements.