import { ReactNode } from 'react';

interface InfoSectionProps {
  children: ReactNode;
  colorFrom: string;
  colorTo: string;
}

export function InfoSection({ children, colorFrom, colorTo }: InfoSectionProps) {
  return (
    <div className={`mt-4 p-4 bg-gradient-to-br from-${colorFrom}-50 to-${colorTo}-50 rounded-lg border border-${colorFrom}-100`}>
      {children}
    </div>
  );
}