import { getScrapingConfig } from '@/configureFilters';
import { getActiveOperationInfo } from '@/lib/utils/operationAbortRegistry';
import { HomeClient } from './HomeClient';

export default async function Home() {
  const config = getScrapingConfig();
  const activeOpInfo = getActiveOperationInfo('scraping');
  
  const initialActiveOperation = activeOpInfo ? {
    type: 'scraping' as const,
    source: activeOpInfo.source
  } : null;

  return (
    <HomeClient 
      initialConfig={config} 
      initialActiveOperation={initialActiveOperation} 
    />
  );
}
