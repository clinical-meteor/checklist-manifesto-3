## Project Website

This repository includes a GitHub Pages website in the `/docs` directory. The website showcases the application and provides download links for the latest release.

### Website Features

- Product overview and screenshots
- Feature highlights
- Download links for the latest release
- Information about the project inspiration
- Links to resources and documentation

### Viewing the Website

The website is automatically deployed to GitHub Pages when changes are pushed to the main branch. You can visit it at:

https://yourusername.github.io/checklist-manifesto/

### Local Development

To develop the website locally:

1. Navigate to the docs directory:
   ```bash
   cd docs
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to http://localhost:5173/checklist-manifesto/

### Updating Release Download Links

When creating a new release, update the download URL in the website:

```bash
node scripts/update-release-url.js 1.0.0 checklist-manifesto-v1.0.0.zip
```

This will update the download links on the website to point to the new release asset.

### Google Analytics

The website includes Google Analytics tracking. To use your own Google Analytics account:

1. Create a Google Analytics 4 property in the Google Analytics console
2. Get your Measurement ID (starts with "G-")
3. Replace the placeholder ID in `docs/src/components/GoogleAnalytics.jsx`

```javascript
const TRACKING_ID = "G-XXXXXXXXXX"; // Replace with your Google Analytics tracking ID
```