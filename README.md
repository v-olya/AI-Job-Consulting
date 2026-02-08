# Job Consultant

AI-powered job scraping and analysis tool. Scrapes listings from StartupJobs.cz and Jobs.cz, analyzes them with local LLM (Ollama), and provides intelligent recommendations.

## Features

- **Multi-source scraping** with configurable domain-specific filters
- **AI analysis**: Local LLM processing via Ollama for job scoring, company research, and recommendations.
- **Database viewer**: Browse, filter, and manage scraped jobs with pagination
- **Session management**: Cross-tab operation state with cancellation support

## Tech Stack

- Next.js 16 + React 19 + TypeScript + Tailwind CSS
- MongoDB + Mongoose
- Ollama (local AI)
- Playwright + Cheerio (scraping)

## Scraping Sources

| Source | Method | Notes |
|--------|--------|-------|
| **StartupJobs.cz** | Core API | Uses JSON API — fast, no browser automation needed |
| **Jobs.cz** | Playwright | Headless browser scraping with throttling and retry logic |

## Setup

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Configure environment**:

   ```bash
   MONGODB_URI=mongodb://localhost:27017/job-scraper  # MongoDB connection
   OLLAMA_HOST=http://localhost:11434                # Local Ollama server
   OLLAMA_API_KEY=your-key                           # Ollama requires auth for web search
   ```

3. **Configure scraping filters**:
    Edit `src/configureFilters.ts` to set domain-specific scraping filters

4. **Start Ollama** (required for AI analysis):

   ```bash
   ollama serve
   ollama run your-local-model
   ```

5. **Run development server**:

   ```bash
   npm run dev
   ```

## Usage

**NB!** We do not manage userIDs, the app is for a single user only.

1. Open <http://localhost:3000>
2. Click scrape buttons to collect jobs from selected sources
3. Jobs are automatically processed with AI during scraping (if Ollama is running)
4. Visit **Database** to view all jobs, filter by source/status, and run AI processing on unprocessed jobs

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run type-check` | Run TypeScript checks |
| `npm run lint` | Run ESLint |
| `npm run preprocess` | Preprocess StartupJobs data |
| `npm run postinstall` | Auto-setup config files from templates |

### Postinstall Setup

`npm install` automatically runs `postinstall` which creates:

- `.env.local` — environment variables
- `src/configureFilters.ts` — scraping filters
- `src/constants/context.ts` — AI context about you

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `POST /api/scrape` | POST | Start scraping. Body: `{ source: 'startupjobs' \| 'jobs.cz' \| 'all' }` |
| `POST /api/process-ai` | POST | AI-process unprocessed jobs. Body: `{ limit?: number }` |
| `GET /api/jobs` | GET | List jobs with filters: `?source=&processed=&limit=&skip=` |
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

**⚠️ Single-Instance Limitation**: Cancellation only works within the same server instance. AbortControllers are stored in a module-level Map. In serverless/multi-instance deployments, `/api/cancel` may hit a different instance than the running operation.
