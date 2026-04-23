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
    <div className="flex-1 flex flex-col px-5 py-6 sm:p-6 lg:px-16 xl:px-24 h-full relative z-10 w-full overflow-y-auto">
      <div className="w-full max-w-4xl mx-auto flex flex-col flex-1 min-h-0">
      {/* Badge */}
      <div className="mb-3 sm:mb-4 px-2.5 py-0.5 sm:px-3 sm:py-1 bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 text-[10px] sm:text-xs font-bold rounded-full border border-orange-200 dark:border-orange-500/30 uppercase tracking-wider w-fit shadow-sm shrink-0">
        Flashcard
      </div>
      
      {/* Flip card area */}
      <div 
        className="flex-1 w-full flex items-center justify-center cursor-pointer perspective-1000 min-h-0"
        onClick={() => !isFlipped && setIsFlipped(true)}
      >
        <div className={`w-full max-w-2xl h-full max-h-[50vh] sm:max-h-[55vh] lg:max-h-[60vh] relative preserve-3d transition-transform duration-700 ${isFlipped ? 'rotate-y-180' : ''}`}>
          
          {/* Front */}
          <div className="absolute inset-0 backface-hidden bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center px-5 py-6 sm:p-8 lg:p-12 text-center shadow-xl dark:shadow-2xl">
            <div className="flex-1 flex items-center w-full overflow-y-auto custom-scrollbar">
              <h2 className={`font-bold leading-relaxed text-gray-900 dark:text-gray-100 break-words w-full ${content.question.length > 200 ? 'text-base sm:text-lg lg:text-xl' : 'text-lg sm:text-2xl lg:text-3xl'}`}>{content.question}</h2>
            </div>
            <div className="mt-2 shrink-0 text-gray-400 dark:text-gray-500 text-xs sm:text-sm animate-pulse">Tap to reveal</div>
          </div>

          {/* Back */}
          <div className="absolute inset-0 backface-hidden bg-indigo-500 dark:bg-indigo-600 border border-indigo-300 dark:border-indigo-400 rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center px-5 py-6 sm:p-8 lg:p-12 text-center rotate-y-180 shadow-[0_10px_40px_rgba(99,102,241,0.2)] dark:shadow-[0_0_40px_rgba(79,70,229,0.3)]">
            <div className="flex-1 flex items-center w-full overflow-y-auto custom-scrollbar">
              <p className={`font-bold leading-relaxed text-white whitespace-pre-wrap break-words w-full ${content.answer.length > 200 ? 'text-sm sm:text-base lg:text-lg' : 'text-base sm:text-xl lg:text-2xl'}`}>{content.answer}</p>
            </div>
          </div>

        </div>
      </div>

      {/* Confidence buttons — slide up when flipped */}
      <div className={`transition-all duration-500 flex flex-col gap-2 sm:gap-3 pt-3 sm:pt-4 pb-8 sm:pb-6 shrink-0 ${isFlipped ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-6 pointer-events-none'}`}>
        <p className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">How did you do?</p>
        <div className="flex items-center gap-2 sm:gap-3 w-full">
          <button 
            onClick={() => onComplete('hard')}
            className="flex-1 bg-red-50 dark:bg-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/30 text-red-700 dark:text-red-400 font-bold py-3 sm:py-3.5 rounded-xl border border-red-200 dark:border-red-500/30 transition-colors shadow-sm dark:shadow-none text-sm sm:text-base active:scale-95"
          >
            Hard
          </button>
          <button 
            onClick={() => onComplete('medium')}
            className="flex-1 bg-yellow-50 dark:bg-yellow-500/20 hover:bg-yellow-100 dark:hover:bg-yellow-500/30 text-yellow-700 dark:text-yellow-400 font-bold py-3 sm:py-3.5 rounded-xl border border-yellow-200 dark:border-yellow-500/30 transition-colors shadow-sm dark:shadow-none text-sm sm:text-base active:scale-95"
          >
            Good
          </button>
          <button 
            onClick={() => onComplete('easy')}
            className="flex-1 bg-green-50 dark:bg-green-500/20 hover:bg-green-100 dark:hover:bg-green-500/30 text-green-700 dark:text-green-400 font-bold py-3 sm:py-3.5 rounded-xl border border-green-200 dark:border-green-500/30 transition-colors shadow-sm dark:shadow-none text-sm sm:text-base active:scale-95"
          >
            Easy
          </button>
        </div>
      </div>

      </div>
    </div>
  );
}
