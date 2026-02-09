import type { NextConfig } from "next";
import { setupProcessHandlers } from './src/lib/utils/processCleanup';

// Setup process handlers when Next.js starts
setupProcessHandlers();

const nextConfig: NextConfig = {};

export default nextConfig;
