import type { ReactNode } from 'react';

interface LearningCardProps {
  isActive: boolean;
  onNext: (delta?: number) => void;
  children: ReactNode;
}

export default function LearningCard({ isActive, children }: LearningCardProps) {
  return (
    <div className="w-full h-full bg-gray-50 border border-gray-100 dark:border-white/5 dark:bg-[#1c1f2e] text-gray-900 dark:text-white flex flex-col relative overflow-hidden">
      {children}
      
      {/* Swipe hint — positioned safely above bottom safe area */}
      {isActive && (
        <div className="absolute bottom-4 sm:bottom-6 left-0 right-0 flex justify-center pointer-events-none opacity-40 dark:opacity-30">
          <div className="flex flex-col items-center gap-0.5 animate-bounce">
             <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-[0.15em] text-gray-500 dark:text-gray-400">Swipe or Answer</span>
             <div className="w-0.5 h-3 sm:h-4 bg-gray-400 dark:bg-gray-500 rounded-full" />
          </div>
        </div>
      )}
    </div>
  );
}
