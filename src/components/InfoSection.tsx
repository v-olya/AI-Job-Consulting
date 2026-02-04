import { ReactNode } from 'react';

type ColorVariant = 'blue-purple' | 'green-emerald';

interface InfoSectionProps {
  children: ReactNode;
  variant: ColorVariant;
}

const colorVariants: Record<ColorVariant, string> = {
  'blue-purple': 'mt-4 p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-100',
  'green-emerald': 'mt-4 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-100',
};

export function InfoSection({ children, variant }: InfoSectionProps) {
  return (
    <div className={colorVariants[variant]}>
      {children}
    </div>
  );
}