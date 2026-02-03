#!/usr/bin/env tsx

import fs from 'fs';

interface ConfigFile {
  template: string;
  target: string;
}

const files: ConfigFile[] = [
  {
    template: '.env.local.template',
    target: '.env.local'
  },
  {
    template: 'src/constants/context.ts.template',
    target: 'src/constants/context.ts'
  },
  {
    template: 'src/configureFilters.ts.template', 
    target: 'src/configureFilters.ts'
  }
];

console.log('🔧 Setting up configuration files...\n');

files.forEach(({ template, target }) => {
  if (!fs.existsSync(target)) {
    if (fs.existsSync(template)) {
      fs.copyFileSync(template, target);
      console.log(`✅ Created ${target} from template. Edit the file to match your configurations`);
    } else {
      console.log(`❌ Template ${template} not found`);
    }
  } else {
    console.log(`⏭️  ${target} already exists, skipping`);
  }
});

console.log('\n🎉 Setup complete!');
console.log('Fill-in your .env.local and other config files');