# Adaguc Data Explorer (ADE)

Browser-based viewer for WMS/WCS geospatial data, built for use with [Adaguc-Server](https://github.com/KNMI/adaguc-server) WMS services. For developers integrating or testing services, researchers visualizing datasets, and anyone building new WMS layers who needs a quick way to check rendering, styles, dimensions and legends.

## Quick start

```bash
nvm use 22
npm ci
npm start   # http://localhost:4000
```

## Scripts

| Command                | Purpose                                             |
| ----------------------- | ---------------------------------------------------- |
| `npm start`             | Dev server with hot reload                            |
| `npm run build`         | Production build → `dist/` (serve with `npx serve dist`) |
| `npm test`              | Run the test suite                                    |
| `npm run lint`          | Prettier + ESLint                                     |
| `npm run storybook`     | Component storybook (uses `stories/`)                 |

## Docker

```bash
docker build . -t adaguc-data-explorer
docker run -it -p 8080:80 \
  -e ADAGUC_AUTOWMS_ENDPOINT=https://geoservices.knmi.nl/autowms \
  adaguc-data-explorer
# → http://localhost:8080
```
