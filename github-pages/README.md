# Checklist Manifesto Project Website

This directory contains the source code for the Checklist Manifesto project website, hosted on GitHub Pages.

## Development

### Prerequisites

- Node.js 16.x or higher
- npm 8.x or higher

### Setup

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Open your browser and navigate to http://localhost:5173/

## Building for Production

To build the site for GitHub Pages:

```bash
npm run build
```

This will generate static files in the `dist` directory that can be deployed to GitHub Pages.

## Deployment

This site is automatically deployed to GitHub Pages whenever changes are pushed to the main branch. 

### Manual Deployment

If you need to deploy manually:

1. Build the site
2. Push the contents of the `dist` directory to the `gh-pages` branch

```bash
# After building
git checkout -b gh-pages
git add dist -f
git commit -m "Deploy website"
git subtree push --prefix dist origin gh-pages
```

## Project Structure

- `src/` - React source code
  - `components/` - UI components
  - `assets/` - Static assets like images
- `index.html` - Entry point HTML file
- `vite.config.js` - Vite configuration

## Customization

To update the site content:

1. Edit the components in `src/components/`
2. Update the download URL in `src/components/Hero.jsx`
3. Replace social media and contact links in `src/components/Footer.jsx`

## License

This website is MIT licensed, as is the entire Checklist Manifesto project.