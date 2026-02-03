import { ScrapingConfig } from '@/types';
import { ConfigCard } from '@/components/ConfigCard';
import { ConfigField } from '@/components/ConfigField';

interface ConfigSectionProps {
  config: ScrapingConfig;
}

export function ConfigSection({ config }: ConfigSectionProps) {
  return (
    <div className="mb-8 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-sm border border-gray-200">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Current Configuration</h2>
      <div className="grid md:grid-cols-2 gap-6 text-sm">
        <ConfigCard title="StartupJobs.cz" titleColor="text-blue-700" borderColor="border-blue-200">
          <ConfigField 
            label="Fields" 
            items={config.startupJobs.fields || []} 
            colorClass="bg-blue-100 text-blue-800" 
          />
          <div className="grid grid-cols-2 gap-4">
            <ConfigField 
              label="Seniority" 
              items={config.startupJobs.seniority || []} 
              colorClass="bg-purple-100 text-purple-800" 
            />
            <ConfigField 
              label="Work Type" 
              items={config.startupJobs.locationPreference || []} 
              colorClass="bg-green-100 text-green-800" 
            />
          </div>
        </ConfigCard>
        
        <ConfigCard title="Jobs.cz" titleColor="text-green-700" borderColor="border-green-200">
          <ConfigField 
            label="Search Terms" 
            items={config.jobsCz.queries || []} 
            colorClass="bg-orange-100 text-orange-800" 
          />
          <ConfigField 
            label="Location" 
            items={[`${config.jobsCz.locality?.label} (${config.jobsCz.locality?.radius}km radius)`]} 
            colorClass="bg-gray-100 text-gray-800" 
          />
        </ConfigCard>
      </div>
    </div>
  );
}
