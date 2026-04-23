
import { FaCheck } from 'react-icons/fa';
import DOMPurify from 'dompurify';

interface ExplanationContent {
  id: string;
  html: string;
}

interface ExplanationCardProps {
  content: ExplanationContent;
  onComplete: () => void;
}

export default function ExplanationCard({ content, onComplete }: ExplanationCardProps) {
  const sanitizedHtml = DOMPurify.sanitize(content.html);

  return (
    <div className="flex-1 flex flex-col px-5 py-6 sm:p-8 lg:px-16 xl:px-24 justify-between h-full relative z-10 w-full overflow-y-auto">
      <div className="w-full max-w-4xl mx-auto flex flex-col flex-1 min-h-0">
      {/* Badge */}
      <div className="mb-4 sm:mb-6 inline-flex px-2.5 py-0.5 sm:px-3 sm:py-1 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 text-[10px] sm:text-xs font-bold rounded-full border border-blue-200 dark:border-blue-500/30 uppercase tracking-wider w-fit shrink-0 shadow-sm">
        Explanation
      </div>
      
      {/* Scrollable content area */}
      <div className="flex-1 w-full overflow-y-auto custom-scrollbar pr-1 sm:pr-2 min-h-0">
        <div 
           className="prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg max-w-none prose-p:leading-relaxed prose-p:text-gray-800 dark:prose-p:text-gray-200 prose-headings:text-gray-900 dark:prose-headings:text-white marker:text-blue-500 dark:marker:text-blue-400"
           dangerouslySetInnerHTML={{ __html: sanitizedHtml }} 
        />
      </div>

      {/* Action button — always visible at bottom */}
      <div className="mt-4 sm:mt-6 shrink-0 pb-8 sm:pb-4">
        <button 
          onClick={() => onComplete()}
          className="w-full bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 text-white font-bold py-3 sm:py-4 rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 transition-all shadow-[0_8px_30px_rgba(37,99,235,0.2)] dark:shadow-[0_4px_20px_rgba(37,99,235,0.4)] text-sm sm:text-base active:scale-[0.98]"
        >
          Got it! <FaCheck size={12} className="sm:w-3.5 sm:h-3.5" />
        </button>
      </div>
      </div>
    </div>
  );
}
