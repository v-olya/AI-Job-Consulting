# Job Consultant

AI-powered job scraping and analysis tool. Scrapes listings from StartupJobs.cz and Jobs.cz, analyzes them with local LLM (Ollama), and provides intelligent recommendations.

## Features

- **Multi-source scraping** with configurable domain-specific filters
- **AI analysis**: Local LLM processing via Ollama for job scoring, skill extraction, and recommendations
- **Company research**: Automatic company background research for recommended positions
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

1. Open http://localhost:3000
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
| `POST /api/scrape` | POST | Start scraping. Body: `{ source: 'startupjobs' \| 'jobs.cz' \| 'all', tabId: string }` |
| `POST /api/process-ai` | POST | AI-process unprocessed jobs. Body: `{ limit?: number, tabId: string }` |
| `GET /api/jobs` | GET | List jobs with filters: `?source=&processed=&limit=&skip=` |
| `GET /api/config` | GET | Current scraping configuration with field descriptions |
| `POST /api/cancel` | POST | Cancel running operation. Body: `{ tabId: string, type?: 'scraping' \| 'ai-processing' }` |

All long-running endpoints support cancellation via `AbortSignal` and return stats on completion/cancellation.

## Multi-Tabs Handling

The application prevents conflicting operations across multiple browser tabs:

- **Session Management**: Each tab generates a unique `tabId` and shares operation state via localStorage
- **Heartbeat System**: Active tabs send heartbeats every 5 seconds; stale sessions auto-expire after 2 minutes
- **Cross-Tab Communication**: When an operation starts in one tab, other tabs show the running state and offer "Force Stop" option
- **Automatic Cleanup**: When a tab closes, its session is automatically cleaned up

**NB!** Cancellation endpoint only works within the same server instance. It stores abort controllers in a module-level Map.
If you deploy to a serverless/multi-instance environment, tab A might start /api/process-ai on instance #1, and tab B might send /api/cancel to instance #2 → no controller found, /cancel does not abort anything.
