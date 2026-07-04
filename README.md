# OSRS Tools

Tools for Old School RuneScape, starting with a better High Alchemy calculator.

## High Alchemy Calculator

This app helps identify profitable items to alch using live OSRS Wiki market data. It is designed to be faster to evaluate than spreadsheet-style calculators: useful defaults, visible price freshness, clear profit math, and a table that stays workable on desktop and mobile.

Current features:

- live nature rune pricing with manual override
- recent and stable pricing modes
- profit calculation including nature rune cost
- item search, sorting, pagination, and row-count controls
- member item filtering
- minimum GE limit, minimum 5-minute volume, and profit range filters
- price freshness and next-refresh status
- compact desktop and mobile table layouts

## Data Source

Pricing data comes from the OSRS Wiki prices API:

- `/api/v1/osrs/mapping`
- `/api/v1/osrs/latest`
- `/api/v1/osrs/5m`

The app fetches those through its local Next.js API route so the UI can cache and normalize data in one place.

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open http://localhost:3000.

## Scripts

```bash
npm run dev      # start local development server
npm run lint     # run ESLint
npm run test     # run Vitest tests
npm run build    # create a production build
npm run start    # start the production server
```

## Project Structure

```text
src/app/                 Next.js app routes and global styles
src/app/api/prices/      API route for OSRS price data
src/components/          Calculator controls and table UI
src/lib/osrs/            Price normalization, refresh, and table logic
docs/                    Planning and project context
```

## Development Notes

- The app should keep using the OSRS Wiki API responsibly and avoid unnecessary refresh spam.
- Default filters should favor actually useful profitable alchs: positive profit, nonzero trade volume, and known GE limits.
- UI changes should be checked at both desktop and mobile widths because the table is the core product surface.

## License

MIT. See [LICENSE](LICENSE).
