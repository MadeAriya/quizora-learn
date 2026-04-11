import { useState } from 'react';
import { FaCheck, FaTimes } from 'react-icons/fa';

interface QuizContent {
  question: string;
  choices: string[];
  answer: string;
}

interface QuizCardProps {
  content: QuizContent;
  onComplete: (isCorrect: boolean) => void;
}

export default function QuizCard({ content, onComplete }: QuizCardProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (choice: string) => {
    if (selected) return;
    setSelected(choice);
    
    const isCorrect = choice === content.answer;
    setTimeout(() => {
      onComplete(isCorrect);
    }, 1200);
  };

  return (
    <div className="flex-1 flex flex-col px-5 py-6 sm:p-8 lg:px-16 xl:px-24 justify-center h-full relative z-10 overflow-y-auto">
      <div className="w-full max-w-4xl mx-auto">
      <div className="mb-3 sm:mb-4 inline-flex px-2.5 py-0.5 sm:px-3 sm:py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 text-[10px] sm:text-xs font-bold rounded-full border border-indigo-200 dark:border-indigo-500/30 uppercase tracking-wider w-fit shadow-sm shrink-0">
        Quiz
      </div>
      
      <h2 className="text-lg sm:text-2xl lg:text-3xl font-extrabold mb-5 sm:mb-8 leading-snug text-gray-900 dark:text-white shrink-0">
        {content.question}
      </h2>

      <div className="flex flex-col gap-2.5 sm:gap-3 pb-10 sm:pb-6">
        {content.choices.map((choice, i) => {
          const isSelected = selected === choice;
          const isCorrectAnswer = choice === content.answer;
          const showResult = selected !== null;

          let btnClass = "w-full text-left px-3.5 py-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 font-semibold text-xs sm:text-sm lg:text-base outline-none flex items-center justify-between gap-2 ";

          if (showResult) {
            if (isCorrectAnswer) {
              btnClass += "bg-green-50 dark:bg-green-500/10 border-green-500 text-green-700 dark:text-green-400";
            } else if (isSelected) {
              btnClass += "bg-red-50 dark:bg-red-500/10 border-red-500 text-red-700 dark:text-red-400";
            } else {
              btnClass += "bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10 text-gray-400 dark:text-gray-500";
            }
          } else {
            btnClass += "bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 cursor-pointer shadow-sm dark:shadow-none active:scale-[0.98]";
          }

          return (
            <button
              key={i}
              onClick={() => handleSelect(choice)}
              disabled={showResult}
              className={btnClass}
            >
              <span className="flex-1 break-words">{choice}</span>
              {showResult && isCorrectAnswer && <FaCheck className="text-green-500 shrink-0" size={14} />}
              {showResult && isSelected && !isCorrectAnswer && <FaTimes className="text-red-500 shrink-0" size={14} />}
            </button>
          );
        })}
      </div>
      </div>
    </div>
  );
}
