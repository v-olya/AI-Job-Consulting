import { setupProcessHandlers } from './src/lib/utils/processCleanup';

console.log('Testing process handlers...');

setupProcessHandlers();

console.log('Process handlers setup complete');
console.log('You can test with: Ctrl+C or kill -SIGTERM <pid>');

setTimeout(() => {
  console.log('Simulating long-running operation...');
  // Simulate a long-running operation
  let counter = 0;
  const interval = setInterval(() => {
    counter++;
    console.log(`Operation running: ${counter}s`);
    if (counter >= 5) {
      clearInterval(interval);
      console.log('Operation completed normally');
      process.exit(0);
    }
  }, 1000);
}, 1000);