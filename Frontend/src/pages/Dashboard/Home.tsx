import PageMeta from "../../components/common/PageMeta";
import QuizMetrics from "../../components/quiz/QuizMetrics";
import QuizCategory from "../../components/quiz/QuizCategory";
import QuizSource from "../../components/quiz/QuizSource";
import { useAuth } from "../../context/AuthContext";

export default function Home() {
  const { currentUser } = useAuth();

  return (
    <>
      <PageMeta
        title="Dashboard - Quizora Learn"
        description="Welcome to Quizora Learn dashboard"
      />
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
          Welcome back, {currentUser?.user_metadata?.full_name || 'Learner'}! 👋
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-base">Here is what's happening with your learning progress today.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 xl:gap-8 min-h-[60vh]">
        <div className="xl:col-span-12">
          <QuizMetrics />
        </div>
        
        <div className="xl:col-span-8 flex flex-col h-full">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-800 flex-1 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 dark:bg-indigo-900/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="mb-8 relative z-10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Generate a New Quiz</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm max-w-lg leading-relaxed">Turn any long YouTube video or document into an interactive quiz instantly. Our AI handles the heavy lifting.</p>
            </div>
            <div className="relative z-10 w-full">
              <QuizSource />
            </div>
          </div>
        </div>

        <div className="xl:col-span-4 flex flex-col h-full">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-800 flex-1 relative overflow-hidden group">
             <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-50 dark:bg-blue-900/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
             <div className="mb-8 relative z-10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Quiz Categories</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">Browse your organized learning materials.</p>
            </div>
            <div className="relative z-10 h-[calc(100%-80px)] overflow-y-auto pr-2 custom-scrollbar">
              <QuizCategory />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
