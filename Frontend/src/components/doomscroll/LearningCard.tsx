import React from 'react';

interface LearningCardProps {
  isActive: boolean;
  onNext: (delta?: number) => void;
  children: React.ReactNode;
}

export default function LearningCard({ isActive, children }: LearningCardProps) {
  return (
    <div className={`w-full h-full bg-gray-50 border border-gray-100 dark:border-white/5 dark:bg-[#1c1f2e] text-gray-900 dark:text-white flex flex-col relative`}>
      {children}
      {/* Tap to skip overlay or simple indicator */}
      {isActive && (
        <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none opacity-50 dark:opacity-40">
          <div className="flex flex-col items-center animate-bounce gap-1">
             <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500 dark:text-gray-400">Swipe or Answer</span>
             <div className="w-1 h-4 bg-gray-400 dark:bg-gray-500 rounded-full" />
          </div>
        </div>
      )}
    </div>
  );
}
