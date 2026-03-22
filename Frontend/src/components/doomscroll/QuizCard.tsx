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
    if (selected) return; // Prevent double click
    setSelected(choice);
    
    const isCorrect = choice === content.answer;
    
    // Auto transition after a short delay
    setTimeout(() => {
      onComplete(isCorrect);
    }, 1200);
  };

  return (
    <div className="flex-1 flex flex-col p-8 justify-center h-full relative z-10">
      <div className="mb-4 inline-flex px-3 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 text-xs font-bold rounded-full border border-indigo-200 dark:border-indigo-500/30 uppercase tracking-wider w-fit shadow-sm">
        Quiz
      </div>
      
      <h2 className="text-2xl sm:text-3xl font-extrabold mb-8 leading-snug text-gray-900 dark:text-white">
        {content.question}
      </h2>

      <div className="flex flex-col gap-3">
        {content.choices.map((choice, i) => {
          const isSelected = selected === choice;
          const isCorrectAnswer = choice === content.answer;
          const showResult = selected !== null;

          let btnClass = "w-full text-left p-4 rounded-2xl border-2 transition-all duration-300 font-semibold text-sm sm:text-base outline-none flex items-center justify-between ";

          if (showResult) {
            if (isCorrectAnswer) {
              btnClass += "bg-green-50 dark:bg-green-500/10 border-green-500 text-green-700 dark:text-green-400";
            } else if (isSelected) {
              btnClass += "bg-red-50 dark:bg-red-500/10 border-red-500 text-red-700 dark:text-red-400";
            } else {
              btnClass += "bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10 text-gray-400 dark:text-gray-500";
            }
          } else {
            btnClass += "bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 cursor-pointer shadow-sm dark:shadow-none";
          }

          return (
            <button
              key={i}
              onClick={() => handleSelect(choice)}
              disabled={showResult}
              className={btnClass}
            >
              <span>{choice}</span>
              {showResult && isCorrectAnswer && <FaCheck className="text-green-500" />}
              {showResult && isSelected && !isCorrectAnswer && <FaTimes className="text-red-500" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
