# AI Marketing Report Generator

A React + Tailwind dashboard for uploading marketing CSVs, categorizing campaigns, reviewing analytics, and exporting PDF, PPTX, and categorized CSV reports.

## Included
- Dark responsive dashboard inspired by the supplied reference screenshots
- Demo records in the root `data.js`
- CSV upload and automatic column mapping
- Category editing and optional live OpenAI categorization
- Metric calculations (ROAS, CTR, CPC, CPM, CPA)
- AI insight generation (live OpenAI or clearly labelled demo fallback)
- PDF, PowerPoint, and CSV exports
- Client manager (in-memory demo state)

## Requirements
- Node.js 20+ recommended
- npm
- Optional OpenAI API key for live AI features

## Run locally
1. Extract the ZIP.
2. Open a terminal in the project folder.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Copy `.env.example` to `.env` and add your key:
   ```env
   OPENAI_API_KEY=your_real_key_here
   OPENAI_MODEL=gpt-4o-mini
   PORT=8787
   ```
   If you do not add a key, the app still runs in demo mode and clearly indicates that rule-based fallback is being used.
5. Start the frontend and API:
   ```bash
   npm run dev
   ```
6. Open the Vite URL printed in the terminal (usually `http://localhost:5173`).

## Build frontend
```bash
npm run build
```

## Test data
`data.js` contains fictional sample campaigns for Apex Retail India and Zest Living Real Estate. Use the CSV upload screen to test custom data. A sample CSV can also be downloaded from the upload page.

## CSV header support
Campaign Name (required), Platform, Objective, Category, Spend, Revenue, Impressions, Reach, Clicks, Conversions, Month.

Common aliases such as `Amount Spent`, `Link Clicks`, `Results`, `Purchase Conversion Value` and `Reporting Month` are supported.

## Important limitations before paid production use
- Client profiles and uploaded records currently live in browser memory. They reset on page refresh. This starter does not include persistent database storage, authentication, roles, or production multi-tenant security.
- Uploaded CSVs are processed in the browser. Selected campaign fields are sent to the server API only when requesting categorization or insights.
- OpenAI is called only by the server and the API key must never be put in a `VITE_*` variable or committed to source control.
- AI suggestions should be reviewed by a human. The app's demo fallback is not a real OpenAI response.
- PDF and PPTX exports use a shared current dataset, but are starter templates; customize branding, legal footers, chart layouts and pagination to the client's reporting requirements.
- Before deploying for a paying client, add Supabase Auth + Row Level Security, persistent dataset storage, request rate limits, upload auditing, robust test coverage, and a privacy/data retention policy.
- This app is not yet a hardened multi-tenant SaaS. Do not use it to store sensitive client data until production security and persistence are implemented and reviewed.

## Environment
See `.env.example`.
