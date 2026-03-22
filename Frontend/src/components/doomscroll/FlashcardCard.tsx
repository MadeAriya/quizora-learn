import { useState } from 'react';

interface FlashcardContent {
  question: string;
  answer: string;
}

interface FlashcardCardProps {
  content: FlashcardContent;
  onComplete: (status: 'easy' | 'medium' | 'hard') => void;
}

export default function FlashcardCard({ content, onComplete }: FlashcardCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className="flex-1 flex flex-col p-6 h-full relative z-10 w-full">
      <div className="mb-4 px-3 py-1 bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 text-xs font-bold rounded-full border border-orange-200 dark:border-orange-500/30 uppercase tracking-wider absolute top-8 left-8 z-20 shadow-sm">
        Flashcard
      </div>
      
      <div 
        className="flex-1 w-full flex items-center justify-center cursor-pointer perspective-1000 my-12"
        onClick={() => !isFlipped && setIsFlipped(true)}
      >
        <div className={`w-full h-full relative preserve-3d transition-transform duration-700 ${isFlipped ? 'rotate-y-180' : ''}`}>
          
          {/* Front */}
          <div className="absolute w-full h-full backface-hidden bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl flex flex-col items-center justify-center p-8 text-center shadow-xl dark:shadow-2xl">
            <h2 className="text-2xl sm:text-3xl font-bold leading-relaxed text-gray-900 dark:text-gray-100">{content.question}</h2>
            <div className="absolute bottom-6 text-gray-400 dark:text-gray-500 text-sm animate-pulse">Tap to reveal</div>
          </div>

          {/* Back */}
          <div className="absolute w-full h-full backface-hidden bg-indigo-500 dark:bg-indigo-600 border border-indigo-300 dark:border-indigo-400 rounded-3xl flex flex-col items-center justify-center p-8 text-center rotate-y-180 shadow-[0_10px_40px_rgba(99,102,241,0.2)] dark:shadow-[0_0_40px_rgba(79,70,229,0.3)]">
            <h2 className="text-xl sm:text-2xl font-bold leading-relaxed text-white whitespace-pre-wrap">{content.answer}</h2>
          </div>

        </div>
      </div>

      <div className={`transition-all duration-500 flex flex-col gap-3 pb-8 ${isFlipped ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 font-medium mb-2">How did you do?</p>
        <div className="flex items-center gap-3 w-full">
          <button 
            onClick={() => onComplete('hard')}
            className="flex-1 bg-red-50 dark:bg-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/30 text-red-700 dark:text-red-400 font-bold py-3.5 rounded-xl border border-red-200 dark:border-red-500/30 transition-colors shadow-sm dark:shadow-none"
          >
            Hard
          </button>
          <button 
            onClick={() => onComplete('medium')}
            className="flex-1 bg-yellow-50 dark:bg-yellow-500/20 hover:bg-yellow-100 dark:hover:bg-yellow-500/30 text-yellow-700 dark:text-yellow-400 font-bold py-3.5 rounded-xl border border-yellow-200 dark:border-yellow-500/30 transition-colors shadow-sm dark:shadow-none"
          >
            Good
          </button>
          <button 
            onClick={() => onComplete('easy')}
            className="flex-1 bg-green-50 dark:bg-green-500/20 hover:bg-green-100 dark:hover:bg-green-500/30 text-green-700 dark:text-green-400 font-bold py-3.5 rounded-xl border border-green-200 dark:border-green-500/30 transition-colors shadow-sm dark:shadow-none"
          >
            Easy
          </button>
        </div>
      </div>

    </div>
  );
}
