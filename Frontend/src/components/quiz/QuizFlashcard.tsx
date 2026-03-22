import PageMeta from "../../components/common/PageMeta";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../config/SupabaseConfig";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { FiRefreshCw, FiArrowUp } from 'react-icons/fi';
import { BiBookOpen, BiTargetLock } from 'react-icons/bi';

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
  const [studyMode, setStudyMode] = useState<'all' | 'due'>('all');
  const [isAnswerFirst, setIsAnswerFirst] = useState(false);
  const isGenerating = useRef(false);

  // Spaced Repetition Metadata State
  interface FlashcardMeta { confidence: number; lastSeen: number; }
  const [metaMap, setMetaMap] = useState<Record<string, FlashcardMeta>>(() => {
    try {
      return JSON.parse(localStorage.getItem(`flashcardMeta_${id}`) || '{}');
    } catch { return {}; }
  });

  // Calculate real stats
  const stats = useMemo(() => {
    let due = 0, newCards = 0, learning = 0, mastered = 0;
    questions.forEach(q => {
      const meta = metaMap[q.id];
      if (!meta || meta.lastSeen === 0) newCards++;
      else if (meta.confidence >= 80) mastered++;
      else if (meta.confidence < 50) due++;
      else learning++;
    });
    return { due, new: newCards, learning, mastered };
  }, [questions, metaMap]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: quizezData } = await supabase.from('quizez').select().eq('quiz_id', id);
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
      const response = await fetch("https://n8n.ayakdev.web.id/webhook/a3de8bc7-e44a-4b6b-93ce-e698f92e623b", {
        method: "POST", body: formData
      });
      const result = await response.json();
      if (result.success) {
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
    if (questions.length > 0 && questions.length <= 15 && !quizLoading && !isGenerating.current && transcript) {
       handleGenerateFlashcard();
    }
  }, [questions.length, transcript, quizLoading]);

  // Adaptive Next Card Selection
  const pickNextCard = useCallback((currentMetaMap: Record<string, FlashcardMeta> = metaMap, modeOverride?: 'all' | 'due') => {
    if (questions.length === 0) return;
    
    const currentMode = modeOverride || studyMode;
    const dueQuestions = questions.filter(q => {
      const meta = currentMetaMap[q.id];
      return !meta || meta.lastSeen === 0 || meta.confidence < 50;
    });

    // If 'due' mode is selected, but there are no due questions, default to all
    const pool = (currentMode === 'due' && dueQuestions.length > 0) ? dueQuestions : questions;

    const now = Date.now();
    const sorted = [...pool].sort((a, b) => {
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

  const handleRating = (rating: 'hard' | 'good' | 'easy') => {
    if (!currentQuestionId) return;
    const meta = metaMap[currentQuestionId] || { confidence: 50, lastSeen: 0 };
    let newConf = meta.confidence;
    
    if (rating === 'hard') newConf = Math.max(0, newConf - 20);
    if (rating === 'good') newConf = Math.min(100, newConf + 10);
    if (rating === 'easy') newConf = Math.min(100, newConf + 30);
    
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#11141c] text-gray-900 dark:text-white flex flex-col font-sans selection:bg-orange-500/30 w-full" style={{ fontFamily: "'Inter', sans-serif" }}>
      <PageMeta title="Flashcards - Quizora Learn" description="Spaced repetition flashcards." />

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
    
      <div className="flex-1 flex flex-col items-center pt-8 pb-12 px-4 sm:px-6 w-full max-w-5xl mx-auto">
        
        {questions.length > 0 ? (
          <>
            {/* Top Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 w-full max-w-4xl mb-12">
               {/* DUE */}
               <div className="bg-white dark:bg-[#242735] border border-gray-200 dark:border-[#303444] rounded-xl p-4 flex flex-col items-center justify-center shadow-sm dark:shadow-none">
                  <span className="text-2xl font-bold text-[#ff8c42]">{stats.due}</span>
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-widest mt-1">DUE</span>
               </div>
               {/* NEW */}
               <div className="bg-white dark:bg-[#242735] border border-gray-200 dark:border-[#303444] rounded-xl p-4 flex flex-col items-center justify-center shadow-sm dark:shadow-none">
                  <span className="text-2xl font-bold text-[#449aff]">{stats.new}</span>
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-widest mt-1">NEW</span>
               </div>
               {/* LEARNING */}
               <div className="bg-white dark:bg-[#242735] border border-gray-200 dark:border-[#303444] rounded-xl p-4 flex flex-col items-center justify-center shadow-sm dark:shadow-none">
                  <span className="text-2xl font-bold text-[#f7b045]">{stats.learning}</span>
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-widest mt-1">LEARNING</span>
               </div>
               {/* MASTERED */}
               <div className="bg-white dark:bg-[#242735] border border-gray-200 dark:border-[#303444] rounded-xl p-4 flex flex-col items-center justify-center shadow-sm dark:shadow-none">
                  <span className="text-2xl font-bold text-[#4ade80]">{stats.mastered}</span>
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-widest mt-1">MASTERED</span>
               </div>
            </div>

            {/* Flashcard Area */}
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
               
               {/* How did you do Rating Buttons */}
               <div className={`transition-all duration-500 flex flex-col gap-3 mt-8 w-full max-w-lg ${isFlipped ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
                 <p className="text-center text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">How did you do?</p>
                 <div className="flex items-center gap-3 w-full">
                   <button 
                     onClick={() => handleRating('hard')}
                     className="flex-1 bg-red-50 dark:bg-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/30 text-red-700 dark:text-red-400 font-bold py-3.5 rounded-xl border border-red-200 dark:border-red-500/30 transition-colors shadow-sm dark:shadow-none"
                   >
                     Hard
                   </button>
                   <button 
                     onClick={() => handleRating('good')}
                     className="flex-1 bg-yellow-50 dark:bg-yellow-500/20 hover:bg-yellow-100 dark:hover:bg-yellow-500/30 text-yellow-700 dark:text-yellow-400 font-bold py-3.5 rounded-xl border border-yellow-200 dark:border-yellow-500/30 transition-colors shadow-sm dark:shadow-none"
                   >
                     Good
                   </button>
                   <button 
                     onClick={() => handleRating('easy')}
                     className="flex-1 bg-green-50 dark:bg-green-500/20 hover:bg-green-100 dark:hover:bg-green-500/30 text-green-700 dark:text-green-400 font-bold py-3.5 rounded-xl border border-green-200 dark:border-green-500/30 transition-colors shadow-sm dark:shadow-none"
                   >
                     Easy
                   </button>
                 </div>
               </div>

            </div>

            {/* Bottom Controls Area */}
            <div className="mt-4 sm:mt-8 w-full max-w-3xl flex flex-col items-center">
              
              {/* Progress Bar (Optional context) */}
              <div className="w-full h-1.5 bg-gray-200 dark:bg-[#2d3142] rounded-full overflow-hidden mb-6">
                 <div 
                   className="h-full bg-indigo-500 dark:bg-[#ff6b00] rounded-full transition-all duration-300"
                   style={{ width: `${Math.max(10, (stats.mastered / (questions.length || 1)) * 100)}%` }}
                 />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center w-full gap-4 mb-6">
                 <button 
                    onClick={() => {
                      setStudyMode('due');
                      pickNextCard(metaMap, 'due');
                    }}
                    className={`flex-1 w-full font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-colors shadow-sm dark:shadow-none border ${studyMode === 'due' ? 'bg-indigo-50 dark:bg-indigo-500/20 border-indigo-200 dark:border-indigo-500/50 text-indigo-700 dark:text-indigo-400' : 'bg-white dark:bg-[#2d3142] hover:bg-gray-50 dark:hover:bg-[#3a3f52] border-gray-200 dark:border-[#3b4054] text-gray-800 dark:text-white'}`}
                 >
                    <BiTargetLock className={studyMode === 'due' ? 'text-indigo-500 dark:text-indigo-400' : 'text-gray-400 dark:text-[#ff6b00]'} size={20} />
                    Study {stats.due} Due
                 </button>
                 <button 
                    onClick={() => {
                      setStudyMode('all');
                      pickNextCard(metaMap, 'all');
                    }}
                    className={`flex-1 w-full font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-colors shadow-sm dark:shadow-none border ${studyMode === 'all' ? 'bg-indigo-50 dark:bg-indigo-500/20 border-indigo-200 dark:border-indigo-500/50 text-indigo-700 dark:text-indigo-400' : 'bg-gray-50 dark:bg-[#242735] hover:bg-gray-100 dark:hover:bg-[#2d3142] border-gray-200 dark:border-[#3b4054] text-gray-600 dark:text-gray-300'}`}
                 >
                    <BiBookOpen size={20} className={studyMode === 'all' ? 'text-indigo-500' : ''} />
                    Practice All
                 </button>
              </div>

              {/* Minor Links */}
              <div className="flex items-center gap-6 text-sm font-medium text-gray-500 dark:text-gray-400">
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