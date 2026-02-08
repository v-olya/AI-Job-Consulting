import { http, HttpResponse } from'msw';

export const handlers = [
  // Mock handler for startupjobs.cz API
  http.get(`https://core.startupjobs.cz/api/search/offers`, ({ request }) => {
    const url = new URL(request.url);
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
    
    return HttpResponse.json({
      data: mockStartupJobs,
      meta: {
        current_page: page,
        last_page: 5,
        total: 25
      }
    });
  }),
];