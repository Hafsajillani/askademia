import type { ReactNode } from 'react';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen relative">
        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="w-full">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout; 