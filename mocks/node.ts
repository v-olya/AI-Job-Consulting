import { setupServer } from'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);

export function configureMSW() {
  // Suppress warnings for unhandled requests
  server.listen({ onUnhandledRequest: 'bypass' });
}