import PageMeta from "../../components/common/PageMeta";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../config/SupabaseConfig";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { FiRefreshCw, FiArrowUp } from 'react-icons/fi';
import { BiBookOpen } from 'react-icons/bi';

interface Question {
  id: string;
  question: string;
  answer: string;
}

interface Quiz {
  id: string;
  topic: string;
}

export default function QuizFlashcard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quizLoading, setQuizLoading] = useState<boolean>(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizez, setQuizez] = useState<Quiz[]>([]);
  const [transcript, setTranscript] = useState<{ transcribe_text: string } | null>(null);
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnswerFirst, setIsAnswerFirst] = useState(false);
  const isGenerating = useRef(false);
  const hasAttemptedRefill = useRef(false);

  // Spaced Repetition Metadata State
  interface FlashcardMeta { confidence: number; lastSeen: number; }
  const [metaMap, setMetaMap] = useState<Record<string, FlashcardMeta>>(() => {
    try {
      return JSON.parse(localStorage.getItem(`flashcardMeta_${id}`) || '{}');
    } catch { return {}; }
  });

  const [viewState, setViewState] = useState<'deck' | 'learn'>('deck');

  // Calculate real stats and lists
  const learningCards = useMemo(() => questions.filter(q => metaMap[q.id]?.lastSeen > 0 && metaMap[q.id]?.confidence < 80), [questions, metaMap]);
  const newCards = useMemo(() => questions.filter(q => !metaMap[q.id] || metaMap[q.id]?.lastSeen === 0), [questions, metaMap]);
  const masteredCards = useMemo(() => questions.filter(q => metaMap[q.id]?.lastSeen > 0 && metaMap[q.id]?.confidence >= 80), [questions, metaMap]);

  const stats = useMemo(() => ({
    learning: learningCards.length,
    new: newCards.length,
    mastered: masteredCards.length
  }), [learningCards.length, newCards.length, masteredCards.length]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: quizezData } = await supabase.from('quizez').select().eq('id', id);
      if (quizezData) setQuizez(quizezData);

      const { data: transcriptData } = await supabase.from('transcript').select('transcribe_text').eq('quiz_id', id).single();
      if (transcriptData) setTranscript(transcriptData);
    };
    fetchData();
  }, [id]);

  const fetchQuestions = useCallback(async () => {
    const { data } = await supabase.from('flashcard').select().eq('quiz_id', id);
    if (data) setQuestions(data);
  }, [id]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const { currentUser } = useAuth();

  if(!id) return null;

  const handleGenerateFlashcard = async () => {
    if (!transcript || isGenerating.current) return;
    isGenerating.current = true;
    setQuizLoading(true);
    
    const formData = new FormData();
    formData.append("transcript", transcript.transcribe_text || "Tidak ada transcript ditemukan");
    formData.append("user_id", currentUser?.id || "");
    formData.append("quiz_id", id);

    try {
      const { AxiosConfig } = await import('../../config/AxiosConfig');
      const response = await AxiosConfig.post('/generate/flashcards', {
        transcript: transcript.transcribe_text || "Tidak ada transcript ditemukan",
        user_id: currentUser?.id || "",
        quiz_id: id
      });
      const result = response.data;
      
      if (result.flashcards && result.flashcards.length > 0) {
        await fetchQuestions();
      } else {
        setTimeout(() => {
          setQuizLoading(false);
          toast.success("Flashcards generated successfully!");
        }, 2000);
        await fetchQuestions();
      }
    } catch (error) {
       console.error(error);
    } finally {
       setQuizLoading(false);
       isGenerating.current = false;
    }
  }

  // Auto Generate trigger if pool gets too small
  useEffect(() => {
    if (questions.length > 0 && questions.length <= 15 && !quizLoading && !isGenerating.current && transcript && !hasAttemptedRefill.current) {
       hasAttemptedRefill.current = true;
       handleGenerateFlashcard();
    }
  }, [questions.length, transcript, quizLoading]);

  // Adaptive Next Card Selection
  const pickNextCard = useCallback((currentMetaMap: Record<string, FlashcardMeta> = metaMap) => {
    if (questions.length === 0) return;
    
    const now = Date.now();
    const sorted = [...questions].sort((a, b) => {
      const metaA = currentMetaMap[a.id] || { confidence: 50, lastSeen: 0 };
      const metaB = currentMetaMap[b.id] || { confidence: 50, lastSeen: 0 };
      
      if (metaA.lastSeen === 0 && metaB.lastSeen !== 0) return -1;
      if (metaB.lastSeen === 0 && metaA.lastSeen !== 0) return 1;
      
      const elapsedHoursA = (now - metaA.lastSeen) / (1000 * 60 * 60);
      const elapsedHoursB = (now - metaB.lastSeen) / (1000 * 60 * 60);
      
      const scoreA = metaA.confidence - (elapsedHoursA * 2);
      const scoreB = metaB.confidence - (elapsedHoursB * 2);
      
      let finalA = scoreA;
      let finalB = scoreB;
      
      // Penalize drawing the same card sequentially
      if (questions.length > 1) {
        if (a.id === currentQuestionId) finalA += 9999;
        if (b.id === currentQuestionId) finalB += 9999;
      }
      return finalA - finalB;
    });
    
    setCurrentQuestionId(sorted[0].id);
    setIsFlipped(false);
  }, [questions, metaMap, currentQuestionId]);

  // Initial load hook
  useEffect(() => {
    if (questions.length > 0 && !currentQuestionId) {
      pickNextCard();
    }
  }, [questions, currentQuestionId, pickNextCard]);

  // Sync to local storage
  useEffect(() => {
    if (id) localStorage.setItem(`flashcardMeta_${id}`, JSON.stringify(metaMap));
  }, [metaMap, id]);

  const handleRating = (rating: 'know' | 'dont_know') => {
    if (!currentQuestionId) return;
    const meta = metaMap[currentQuestionId] || { confidence: 50, lastSeen: 0 };
    let newConf = meta.confidence;
    
    if (rating === 'know') newConf = 100;
    if (rating === 'dont_know') newConf = 40;
    
    const newMetaMap = {
      ...metaMap,
      [currentQuestionId]: { confidence: newConf, lastSeen: Date.now() }
    };
    
    setMetaMap(newMetaMap);
    pickNextCard(newMetaMap);
  };

  const handleResetProgress = () => {
    if (window.confirm("Are you sure you want to completely reset your Flashcard progress for this topic?")) {
      setMetaMap({});
      if (id) localStorage.removeItem(`flashcardMeta_${id}`);
      toast.success("Progress reset successfully!");
      pickNextCard({});
    }
  };

  if (viewState === 'deck') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#11141c] text-gray-900 dark:text-white flex flex-col font-sans selection:bg-orange-500/30 w-full" style={{ fontFamily: "'Inter', sans-serif" }}>
        <PageMeta title="Deck Viewer - Quizora Learn" description="Review flashcard deck progress." />
        
        {/* Top Navbar Area */}
        <div className="w-full px-6 py-4 flex items-center justify-between border-b border-gray-200 dark:border-[#252834] bg-white dark:bg-transparent">
           <div className="flex items-center gap-4">
              <button onClick={() => navigate('/notes')} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                 <FaChevronLeft size={16} />
              </button>
              <h1 className="font-bold text-lg text-gray-800 dark:text-gray-200">
                 {quizez.length > 0 ? quizez[0].topic : "Deck Viewer"}
              </h1>
           </div>
        </div>

        <div className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 flex flex-col items-center pb-20">
           
           {/* Empty State Fallback if no questions initially generated */}
           {questions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full w-full py-20 mt-10">
                 <div className="bg-white dark:bg-[#242735] p-12 rounded-3xl border border-gray-200 dark:border-[#303444] flex flex-col items-center max-w-lg text-center shadow-xl">
                   <div className="w-16 h-16 bg-gray-50 dark:bg-[#2d3142] rounded-full flex items-center justify-center mb-6">
                     <BiBookOpen className="text-gray-400 text-2xl" />
                   </div>
                   <h1 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">Deck is Empty</h1>
                   <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                     Generate flashcards from your transcript to start studying.
                   </p>
                   <button
                      onClick={handleGenerateFlashcard}
                      disabled={quizLoading}
                      className="bg-indigo-600 hover:bg-indigo-700 dark:bg-[#ff6b00] dark:hover:bg-[#e66000] text-white font-bold py-3.5 px-8 rounded-xl transition-colors flex items-center gap-2 w-full sm:w-auto justify-center"
                   >
                      {quizLoading ? (
                        <><AiOutlineLoading3Quarters className="animate-spin"/> Generating...</>
                      ) : (
                        "Generate Flashcards"
                      )}
                   </button>
                 </div>
              </div>
           ) : (
              <>
                 {/* Stats Row */}
                 <div className="grid grid-cols-3 gap-3 sm:gap-6 w-full mb-8">
                   {/* LEARNING */}
                   <div className="bg-white dark:bg-[#242735] border border-gray-200 dark:border-[#303444] rounded-xl p-4 flex flex-col items-center justify-center shadow-sm dark:shadow-none">
                      <span className="text-3xl font-bold text-[#f7b045]">{learningCards.length}</span>
                      <span className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-widest mt-1">LEARNING</span>
                   </div>
                   {/* NEW */}
                   <div className="bg-white dark:bg-[#242735] border border-gray-200 dark:border-[#303444] rounded-xl p-4 flex flex-col items-center justify-center shadow-sm dark:shadow-none">
                      <span className="text-3xl font-bold text-[#449aff]">{newCards.length}</span>
                      <span className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-widest mt-1">NEW</span>
                   </div>
                   {/* MASTERED */}
                   <div className="bg-white dark:bg-[#242735] border border-gray-200 dark:border-[#303444] rounded-xl p-4 flex flex-col items-center justify-center shadow-sm dark:shadow-none">
                      <span className="text-3xl font-bold text-[#4ade80]">{masteredCards.length}</span>
                      <span className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-widest mt-1">MASTERED</span>
                   </div>
                 </div>

                 {/* Action Button */}
                 <div className="w-full mb-8">
                    <button 
                      onClick={() => setViewState('learn')}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-[#ff6b00] dark:hover:bg-[#e66000] text-white font-bold py-4 rounded-xl shadow-[0_4px_14px_0_rgb(79,70,229,0.39)] dark:shadow-none transition-transform hover:-translate-y-0.5"
                    >
                      Start Learning
                    </button>
                 </div>

                 {/* Card List Sequence */}
                 <div className="w-full flex flex-col gap-6">
                    {/* Learning Cards */}
                    {learningCards.length > 0 && (
                      <div className="w-full">
                         <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 tracking-widest uppercase mb-3 border-b border-gray-200 dark:border-gray-800 pb-2">Learning Cards ({learningCards.length})</h2>
                         <div className="flex flex-col gap-2">
                           {learningCards.map(q => (
                              <div key={q.id} className="p-4 bg-white dark:bg-[#242735] border border-gray-200 dark:border-[#303444] rounded-xl shadow-sm dark:shadow-none">
                                 <p className="font-medium text-gray-800 dark:text-gray-200 line-clamp-2">{q.question}</p>
                              </div>
                           ))}
                         </div>
                      </div>
                    )}
                    {/* New Cards */}
                    {newCards.length > 0 && (
                      <div className="w-full">
                         <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 tracking-widest uppercase mb-3 border-b border-gray-200 dark:border-gray-800 pb-2">New ({newCards.length})</h2>
                         <div className="flex flex-col gap-2">
                           {newCards.map(q => (
                              <div key={q.id} className="p-4 bg-white dark:bg-[#242735] border border-gray-200 dark:border-[#303444] rounded-xl shadow-sm dark:shadow-none">
                                 <p className="font-medium text-gray-800 dark:text-gray-200 line-clamp-2">{q.question}</p>
                              </div>
                           ))}
                         </div>
                      </div>
                    )}
                    {/* Mastered Cards */}
                    {masteredCards.length > 0 && (
                      <div className="w-full">
                         <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 tracking-widest uppercase mb-3 border-b border-gray-200 dark:border-gray-800 pb-2">Mastered ({masteredCards.length})</h2>
                         <div className="flex flex-col gap-2">
                           {masteredCards.map(q => (
                              <div key={q.id} className="p-4 bg-white dark:bg-[#242735] border border-gray-200 dark:border-[#303444] rounded-xl shadow-sm dark:shadow-none opacity-60">
                                 <p className="font-medium text-gray-800 dark:text-gray-200 line-clamp-2">{q.question}</p>
                              </div>
                           ))}
                         </div>
                      </div>
                    )}
                 </div>
              </>
           )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#11141c] text-gray-900 dark:text-white flex flex-col font-sans selection:bg-orange-500/30 w-full" style={{ fontFamily: "'Inter', sans-serif" }}>
      <PageMeta title="Flashcards - Quizora Learn" description="Spaced repetition flashcards." />

      {/* Top Navbar Area for Learn Mode */}
      <div className="w-full px-6 py-4 flex items-center justify-between border-b border-gray-200 dark:border-[#252834] bg-white dark:bg-transparent">
         <div className="flex items-center gap-4">
            <button onClick={() => setViewState('deck')} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors flex items-center gap-2 text-sm font-medium">
               <FaChevronLeft size={14} /> Back to Deck
            </button>
         </div>
         <div className="flex items-center gap-3">
            <h1 className="font-bold text-sm text-gray-500 dark:text-gray-400">
               Learning mode
            </h1>
         </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-center pb-20 relative">
         
         {quizLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
                <AiOutlineLoading3Quarters className="animate-spin text-indigo-500 text-4xl mb-4" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">Loading Learning Engine...</p>
            </div>
         ) : questions.length > 0 ? (
            <>

            {/* Realtime Stats Bar */}
            <div className="flex items-center justify-center gap-6 sm:gap-12 mb-8 w-full max-w-md bg-white dark:bg-[#242735] border border-gray-200 dark:border-[#303444] rounded-2xl py-3 px-6 shadow-sm dark:shadow-none transition-all duration-300">
               <div className="flex flex-col items-center">
                  <span className="text-lg sm:text-xl font-bold text-[#449aff]">{stats.new}</span>
                  <span className="text-[10px] sm:text-xs font-bold text-gray-400 tracking-widest uppercase mt-0.5">New</span>
               </div>
               <div className="w-px h-8 bg-gray-200 dark:bg-gray-700"></div>
               <div className="flex flex-col items-center">
                  <span className="text-lg sm:text-xl font-bold text-[#f7b045]">{stats.learning}</span>
                  <span className="text-[10px] sm:text-xs font-bold text-gray-400 tracking-widest uppercase mt-0.5">Learning</span>
               </div>
               <div className="w-px h-8 bg-gray-200 dark:bg-gray-700"></div>
               <div className="flex flex-col items-center">
                  <span className="text-lg sm:text-xl font-bold text-[#4ade80]">{stats.mastered}</span>
                  <span className="text-[10px] sm:text-xs font-bold text-gray-400 tracking-widest uppercase mt-0.5">Mastered</span>
               </div>
            </div>

            {stats.mastered === questions.length && questions.length > 0 ? (
               <div className="w-full flex flex-col items-center justify-center py-12 sm:py-20 animate-fade-in-up text-center">
                 <div className="w-24 h-24 md:w-32 md:h-32 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mb-6 shadow-sm dark:shadow-none">
                    <span className="text-5xl md:text-6xl">🎉</span>
                 </div>
                 <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">Deck Conquered!</h2>
                 <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base max-w-sm mb-10 leading-relaxed">
                   You have successfully mastered all <strong className="text-gray-800 dark:text-gray-200">{questions.length}</strong> cards in this deck. Outstanding memory work!
                 </p>
                 <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <button 
                      onClick={() => setViewState('deck')}
                      className="px-8 py-3.5 bg-gray-100 dark:bg-[#2d3142] hover:bg-gray-200 dark:hover:bg-[#3a3f52] text-gray-800 dark:text-white font-bold rounded-xl transition-colors min-w-[160px]"
                    >
                      View Stats
                    </button>
                    <button 
                      onClick={handleResetProgress}
                      className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-[#ff6b00] dark:hover:bg-[#e66000] text-white font-bold rounded-xl shadow-[0_4px_14px_0_rgb(79,70,229,0.39)] dark:shadow-none transition-transform hover:-translate-y-0.5 min-w-[160px]"
                    >
                      Learn Again
                    </button>
                 </div>
               </div>
            ) : (
               <div className="relative w-full max-w-4xl flex flex-col items-center justify-center">
               
                  <div className="relative w-full flex items-center justify-center">

                    {/* The Flashcard */}
                    <div className="w-full">
                      {questions.map((question, index) =>
                        question.id === currentQuestionId ? (
                           <div 
                             key={question.id || index}
                             className="flex-1 w-full flex items-center justify-center cursor-pointer perspective-1000 h-[350px] sm:h-[400px]"
                             onClick={() => setIsFlipped(!isFlipped)}
                           >
                             <div className={`w-full h-full relative preserve-3d transition-transform duration-700 ${isFlipped ? 'rotate-y-180' : ''}`}>
                               
                               {/* Front */}
                               <div className="absolute w-full h-full backface-hidden bg-white dark:bg-[#2d3142] border border-gray-200 dark:border-[#3d4255] rounded-3xl flex flex-col items-center justify-center p-8 text-center shadow-xl dark:shadow-2xl">
                                 <div className="absolute top-6">
                                    <span className="px-5 py-1.5 rounded-full border border-gray-200 dark:border-[#4a5065] text-xs font-bold tracking-widest text-gray-500 dark:text-gray-300 uppercase">
                                      {isAnswerFirst ? 'ANSWER' : 'QUESTION'}
                                    </span>
                                 </div>
                                 <div className="flex-1 flex items-center justify-center w-full px-4 overflow-y-auto no-scrollbar py-12">
                                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white text-center leading-relaxed whitespace-pre-wrap">
                                      {isAnswerFirst ? question.answer : question.question}
                                    </h1>
                                 </div>
                                 <div className="absolute bottom-6 flex items-center gap-2 text-gray-400 dark:text-gray-500 font-medium text-sm animate-pulse">
                                    <span>👆</span> Click to flip
                                 </div>
                               </div>

                               {/* Back */}
                               <div className="absolute w-full h-full backface-hidden bg-white dark:bg-[#2d3142] border border-gray-200 dark:border-[#3d4255] rounded-3xl flex flex-col items-center justify-center p-8 text-center rotate-y-180 shadow-xl dark:shadow-[0_0_40px_rgba(79,70,229,0.3)]">
                                 <div className="absolute top-6">
                                    <span className="px-5 py-1.5 rounded-full border border-indigo-200 dark:border-[#4a5065] text-xs font-bold tracking-widest text-indigo-500 dark:text-[#449aff] bg-indigo-50 dark:bg-transparent uppercase">
                                      {isAnswerFirst ? 'QUESTION' : 'ANSWER'}
                                    </span>
                                 </div>
                                 <div className="flex-1 flex items-center justify-center w-full px-4 overflow-y-auto no-scrollbar py-12">
                                    <h1 className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-[#a5c2ff] text-center leading-relaxed whitespace-pre-wrap">
                                      {isAnswerFirst ? question.question : question.answer}
                                    </h1>
                                 </div>
                                 <div className="absolute bottom-6 flex items-center gap-2 text-gray-400 dark:text-gray-500 font-medium text-sm">
                                    <span>📘</span> Tap to flip back
                                 </div>
                               </div>

                             </div>
                           </div>
                        ) : null
                      )}
                    </div>

                    {/* Skip Button (Floating Right) */}
                    <button 
                      onClick={() => pickNextCard()}
                      title="Skip card"
                      className="absolute -right-4 sm:-right-16 z-20 w-12 h-12 bg-white dark:bg-[#2d3142] hover:bg-gray-100 dark:hover:bg-[#3a3f52] rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 transition-colors shadow-lg border border-gray-200 dark:border-transparent"
                    >
                      <FaChevronRight size={16} />
                    </button>
                  </div>
                  
                  {/* Know/Don't Know Rating Buttons */}
                  <div className={`transition-all duration-500 flex flex-col gap-3 mt-8 w-full max-w-lg ${isFlipped ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
                    <p className="text-center text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Did you know this?</p>
                    <div className="flex items-center gap-4 w-full">
                      <button 
                        onClick={() => handleRating('dont_know')}
                        className="flex-1 bg-red-50 dark:bg-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/30 text-red-700 dark:text-red-400 font-bold py-4 rounded-xl border border-red-200 dark:border-red-500/30 transition-transform active:scale-95 shadow-sm dark:shadow-none"
                      >
                        Don't Know
                      </button>
                      <button 
                        onClick={() => handleRating('know')}
                        className="flex-1 bg-green-50 dark:bg-green-500/20 hover:bg-green-100 dark:hover:bg-green-500/30 text-green-700 dark:text-green-400 font-bold py-4 rounded-xl border border-green-200 dark:border-green-500/30 transition-transform active:scale-95 shadow-sm dark:shadow-none"
                      >
                        Know
                      </button>
                    </div>
                  </div>

               </div>
            )}

            {/* Bottom Controls Area */}
            <div className="mt-8 w-full max-w-3xl flex flex-col items-center">
              
              {/* Progress Bar mapped out differently to show mastered cards instead, as 'due' is no longer appropriate */}
              <div className="w-full flex items-center gap-4">
                 <span className="text-xs font-bold text-gray-500 dark:text-gray-400">PROGRESS</span>
                 <div className="flex-1 h-2 bg-gray-200 dark:bg-[#2d3142] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 dark:bg-[#4ade80] rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(2, (stats.mastered / (questions.length || 1)) * 100)}%` }}
                    />
                 </div>
              </div>

              {/* Minor Links */}
              <div className="flex items-center gap-6 text-sm font-medium text-gray-500 dark:text-gray-400 mt-8">
                 <button onClick={handleResetProgress} className="hover:text-gray-800 dark:hover:text-white flex items-center gap-2 transition-colors">
                    <FiRefreshCw size={14} /> Reset Progress
                 </button>
                 <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
                 <button onClick={() => setIsAnswerFirst(!isAnswerFirst)} className="hover:text-gray-800 dark:hover:text-white flex items-center gap-2 transition-colors">
                    <FiArrowUp size={14} /> {isAnswerFirst ? 'Question First' : 'Answer First'}
                 </button>
              </div>

            </div>

          </>
        ) : (

          /* Empty State for Flashcards */
          <div className="flex flex-col items-center justify-center h-full w-full py-20 mt-10">
             <div className="bg-white dark:bg-[#242735] p-12 rounded-3xl border border-gray-200 dark:border-[#303444] flex flex-col items-center max-w-lg text-center shadow-xl">
               <div className="w-16 h-16 bg-gray-50 dark:bg-[#2d3142] rounded-full flex items-center justify-center mb-6">
                 <BiBookOpen className="text-gray-400 text-2xl" />
               </div>
               <h1 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">Deck is Empty</h1>
               <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                 Generate flashcards from your transcript to start studying.
               </p>
               <button
                  onClick={handleGenerateFlashcard}
                  disabled={quizLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 dark:bg-[#ff6b00] dark:hover:bg-[#e66000] text-white font-bold py-3.5 px-8 rounded-xl transition-colors flex items-center gap-2 w-full sm:w-auto justify-center"
               >
                  {quizLoading ? (
                    <><AiOutlineLoading3Quarters className="animate-spin"/> Generating...</>
                  ) : (
                    "Generate Flashcards"
                  )}
               </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}