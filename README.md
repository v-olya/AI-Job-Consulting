# Job Consultant

AI-powered job scraping and analysis tool. Scrapes listings from StartupJobs.cz and Jobs.cz, analyzes them with local LLM (Ollama), and provides intelligent recommendations.

## Features

- **Multi-source scraping** with configurable domain-specific filters
- **AI analysis**: Local LLM processing via Ollama for job scoring, company research, and recommendations.
- **Database viewer**: Browse, filter, and manage scraped jobs with pagination
- **Multi-tabs management**: Cross-tab operation state with cancellation support

## Tech Stack

- Next.js 16 + React 19 + TypeScript + Tailwind CSS
- MongoDB + Mongoose
- Ollama (local AI)
- Playwright + Cheerio (scraping)
- Nodemailer (email notifications)
- MSW (Mock Service Worker)

## Scraping Sources

| Source | Method | Notes |
|--------|--------|-------|
| **StartupJobs.cz** | Core API | Uses JSON API — fast, no browser automation needed |
| **Jobs.cz** | Playwright | Headless browser scraping with throttling and retry logic |

## Mock API Server

This project includes a mock API server that intercepts external API calls to `startupjobs.cz` and returns realistic mock data. When scraping `jobs.cz` with Playwright in dev mode, we can use Network-level MSW/interceptors. For this, start with

```bash
npm run dev:mock
```

This script will run the dev server with `MOCK_MODE=true` environment variable.

### How it works

When `MOCK_MODE=true` is set, MSW (Mock Service Worker) intercepts requests at the node network level

**Source-specific handling**:

- `startupjobs.cz` → Mock data from `mocks/handlers.ts`
- `jobs.cz` → Mock implementation from `mocks/mockScrapers.ts`

**Mock Data Structure**
You can see the response structure in `mocks/handlers.ts` (for StartupJobs) and `mocks/mockScrapers.ts` (for Jobs.cz).

## Environment Variables

All configuration is managed through environment variables in `.env.local`:

| Variable | Default | Description |
| ---------- | --------- | ------------- |
| `MONGODB_URI` | `mongodb://localhost:27017/job-scraper` | MongoDB connection string |
| `OLLAMA_HOST` | `http://localhost:11434` | Ollama server URL |
| `OLLAMA_API_KEY` | - | Ollama API key (if required) |
| `EMAIL_USER` | - | Your Gmail address |
| `NOTIFICATION_EMAIL` | `EMAIL_USER` | Email address to receive notifications |
| `OAUTH_CLIENT_ID` | - | Google OAuth2 client ID |
| `OAUTH_CLIENT_SECRET` | - | Google OAuth2 client secret |
| `OAUTH_REFRESH_TOKEN` | - | Google OAuth2 refresh token |

## Usage

Run development server:

```bash
   npm run dev
   ```

1. Open <http://localhost:3000>
2. Click scrape buttons to collect jobs from selected sources
3. Jobs are automatically processed with AI during scraping (if Ollama is running) and emails are sent when there are recommendations for job applications. 
4. If the operation fails during processing, the already scrapped data is saved to the database for you to run AI analysis later.
5. On `/database` page, you can see all jobs, filtered by source/status, and trigger AI analysis on unprocessed ones.

## Scripts

| Command | Description |
| -------- | ------------- |
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run type-check` | Run TypeScript checks |
| `npm run lint` | Run ESLint |
| `src/scripts/generate-refresh-token.ts` | Generate Google OAuth2 refresh token (Desktop app required) |
| `npm run postinstall` | Auto-setup config files from templates |

### Postinstall Setup

`npm install` automatically runs `postinstall` which creates:

- `.env.local` — environment variables
- `src/configureFilters.ts` — scraping filters
- `src/constants/context.ts` — AI context about you

## Email Notifications

When AI processes jobs, it automatically sends email notifications for positions it recommends applying to.

### Feature description

1. **Trigger**: When AI analysis recommends "Reagovat" (Apply) for a job
2. **Email content**: Includes job title, company, location, salary, and AI analysis
3. **Recipients**: Configured via environment variables
4. **Service**: Uses Gmail with OAuth2 authentication via Nodemailer

### Setup Instructions

1. Enable Gmail API for your account
2. Create OAuth2 credentials in Google Cloud Console (Desktop app type)
3. Use the `src/scripts/generate-refresh-token.ts` script to get your refresh token:
   ```bash
   node src/scripts/generate-refresh-token.ts
   ```
   This opens a browser window for authorization and outputs your refresh token.
4. Add credentials to `.env.local` file
5. Restart the application

## API Routes

| Route | Method | Description |
| ------- | -------- | ------------- |
| `POST /api/scrape` | POST | Start scraping. Body: `{ source: 'startupjobs' \| 'jobs.cz' \| 'all' }` |
| `POST /api/process-ai` | POST | AI-process unprocessed jobs. Body: `{ limit?: number }` |
| `GET /api/jobs` | GET | List jobs with filters: `?source=\u0026processed=\u0026limit=\u0026skip=` |
| `GET /api/config` | GET | Current scraping configuration with field descriptions |
| `GET /api/operation-status` | GET | Check if operation is running. Query: `?type=scraping\|ai-processing` |
| `POST /api/cancel` | POST | Cancel running operation. Body: `{ type?: 'scraping' \| 'ai-processing' }` |

All long-running endpoints support cancellation via `AbortSignal` and return stats on completion/cancellation.

## Multi-Tab State Synchronization

The application synchronizes operation state across multiple browser tabs using **BroadcastChannel API**:

### Architecture

- **Two operation types**: `scraping` (home page) and `ai-processing` (database page)
- **Server-side registry**: `operationAbortRegistry.ts` tracks active AbortControllers per operation type
- **Client-side sync**: `useAsyncOperationState` hook manages local state + cross-tab broadcasting

### Flow

1. **On mount**: Tab queries `/api/operation-status?type=X` to check if operation is already running. Syncs local state accordingly.

2. **Starting an operation**:
   - Tab sets local state optimistically (sync, no server check)
   - Broadcasts `START` message via BroadcastChannel to other tabs
   - Calls the server endpoint (e.g., `/api/scrape`)
   - If server rejects with `409` (operation already running), tab reverts local state

3. **Other tabs receive broadcast**:
   - Listen for `START`/`STOP` messages on channel `job-operations-sync`
   - Filter by `operationType` to only react to their own operation type
   - Update local `isOperationActive` state accordingly

4. **Completion/cancellation**:
   - Mother tab (that triggered the operation) receives server response
   - Broadcasts `STOP` message to all tabs
   - All tabs clear their active operation state

### Orphaned Operations

If mother tab closes before operation completes: other tabs show "Processing..." until page refresh. Reload triggers mount-time server query → gets fresh state.

**⚠️ Single-Server-Instance Limitation**:

- This app cannot be deployed as a multi-tenant SaaS.
- Cancellation only works within the same server instance (AbortControllers are stored in a module-level Map). In serverless or multi-instance deployments, `/api/cancel` may hit a different instance than the running operation.

**⚠️ One-User Limitation** The application:

- Does not manage user authentication or multiple user accounts
- Stores all data in a single MongoDB database without user isolation
- Shares the same AI context and configuration across all sessions.
