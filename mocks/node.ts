import { BatchInterceptor } from '@mswjs/interceptors';
import { ClientRequestInterceptor } from '@mswjs/interceptors/ClientRequest';
import { FetchInterceptor } from '@mswjs/interceptors/fetch';

let interceptor: BatchInterceptor<[ClientRequestInterceptor, FetchInterceptor]> | null = null;

export function configureMSW() {
  if (process.env.MOCK_MODE === 'true' && !interceptor) {
    interceptor = new BatchInterceptor({
      name: 'startupjobs-mock',
      interceptors: [
        new ClientRequestInterceptor(),
        new FetchInterceptor(),
      ],
    });

    interceptor.on('request', async ({ request, controller }) => {
      const url = new URL(request.url);

      // Mock StartupJobs API
      if (url.origin === 'https://core.startupjobs.cz' && url.pathname === '/api/search/offers') {
        const page = parseInt(url.searchParams.get('page') || '1');
        
        const mockStartupJobs = Array.from({ length: 5 }).map((_, i) => {
          const id = (page - 1) * 5 + i + 1;
          return {
            id: `job-${id}`,
            displayId: 1000 + id,
            title: { cs: `Startup Mock Position ${id}` },
            description: { cs: `<p>This is a mock startup job description for <strong>Position ${id}</strong>.</p>` },
            company: {
              name: `Startup Mock Company ${id}`,
              logo: 'https://via.placeholder.com/150',
              isStartup: true
            },
            locations: [
              {
                name: { cs: 'Prague', en: 'Prague' },
                type: 'city'
              }
            ],
            salary: {
              from: 40000 + (id * 1000),
              to: 60000 + (id * 1000),
              currency: 'CZK'
            },
            created_at: new Date().toISOString(),
            tags: ['React', 'TypeScript', 'Node.js'],
            url: `https://www.startupjobs.cz/nabidka/${1000 + id}/mock-job-${id}`
          };
        });

        controller.respondWith(
          new Response(
            JSON.stringify({
              data: mockStartupJobs,
              meta: {
                current_page: page,
                last_page: 5,
                total: 25
              }
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }
          )
        );
      }
    });

    interceptor.apply();
    console.log('[MSW Interceptor] Mocking enabled (no BroadcastChannel interference)');
  }
}
