export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.MOCK_MODE === 'true') {
    const { server } = await import('../mocks/node');
    server.listen();
    console.log('MSW Server listening');
  }
}