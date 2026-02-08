import { abortOperation } from './operationAbortRegistry';
import mongoose from 'mongoose';

function cleanupAllControllers() {
  // Cleanup scraping controllers
  if (abortOperation('scraping')) {
    console.log('Scraping controller cleaned up');
  }
  
  // Cleanup AI processing controllers
  if (abortOperation('ai-processing')) {
    console.log('AI processing controller cleaned up');
  }
}

function cleanupDatabase() {
  // Note: In process exit handlers, we can't reliably use await.
  // Using force:true requests immediate close
  if (mongoose.connection.readyState === 1) {
    mongoose.connection.close(true).catch(() => {});
    console.log('Database connection close requested');
  }
}

function handleProcessExit() {
  console.log('Process is exiting, performing cleanup...');
  cleanupAllControllers();
  cleanupDatabase();
  console.log('Cleanup completed');
}

function handleUncaughtException(error: Error) {
  console.error('Uncaught exception:', error);
  
  // Cleanup before exiting
  cleanupAllControllers();
  cleanupDatabase();
  
  // Exit with failure code
  process.exit(1);
}

function handleUncaughtRejection(reason: unknown) {
  console.error('Uncaught rejection:', reason);
  
  // Cleanup before exiting
  cleanupAllControllers();
  cleanupDatabase();
  
  // Exit with failure code
  process.exit(1);
}

function setupProcessHandlers() {
  // Handle normal process exit
  process.on('exit', handleProcessExit);
  
  // Handle signals
  process.on('SIGINT', () => {
    console.log('\nReceived SIGINT, cleaning up...');
    cleanupAllControllers();
    cleanupDatabase();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('\nReceived SIGTERM, cleaning up...');
    cleanupAllControllers();
    cleanupDatabase();
    process.exit(0);
  });
  
  // Handle uncaught exceptions
  process.on('uncaughtException', handleUncaughtException);
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', handleUncaughtRejection);
}

export { setupProcessHandlers };