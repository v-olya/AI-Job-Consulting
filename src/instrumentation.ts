export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.MOCK_MODE === 'true') {
    const { configureMSW } = await import('../mocks/node');
    configureMSW();
  }
}