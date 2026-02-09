export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.MOCK_MODE === 'true') {
    console.log('[Instrumentation] Runtime: nodejs, MOCK_MODE: true. Loading MSW...');
    
    // We use a variable for the path to prevent the Next.js Edge bundler 
    // from statically analyzing and failing on Node-only dependencies.
    const mockModule = '@mocks/node';
    const { configureMSW } = await import(mockModule);
    configureMSW();
  }
}