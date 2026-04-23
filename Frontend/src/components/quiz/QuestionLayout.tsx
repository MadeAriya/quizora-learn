import PageMeta from "../../components/common/PageMeta";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../config/SupabaseConfig";
import { useEffect, useState } from "react";
import { Modal } from "../ui/modal";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { FaCheck, FaArrowRight, FaArrowLeft, FaLightbulb } from "react-icons/fa";
import { TbXboxX } from "react-icons/tb";
import { BsStars } from "react-icons/bs";
import QuestionPlaceholder from "./QuestionPlaceholder";
import { useAuth } from "../../context/AuthContext";

interface Question {
  id: string;
  question: string;
  choices: string[];
  answer: string;
  quiz_id: string;
}

interface Quiz {
  id: string;
  topic: string;
}

interface Answer {
  isCorrect: boolean;
  selectedChoice: string;
}

let audioCtx: AudioContext | null = null;

const initAudio = () => {
  const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!audioCtx) {
    audioCtx = new AudioCtxClass();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
};

const playCorrectSound = () => {
  try {
    const ctx = initAudio();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(600, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05); 
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5); 

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);
  } catch(e) { /* ignore audio errors */ }
};

const playWrongSound = () => {
  try {
    const ctx = initAudio();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(150, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05); 
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4); 

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.4);
  } catch(e) { /* ignore audio errors */ }
};

export default function QuestionLayout() {
  const { id } = useParams<{ id: string }>();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>(() => {
    try {
      const stored = localStorage.getItem(`quiz_progress_${id}`);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      localStorage.setItem(`quiz_progress_${id}`, JSON.stringify(answers));
    }
  }, [answers, id]);

  const [hideCorrect, setHideCorrect] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [generatingQuestion, setGeneratingQuestion] = useState(false);

  useEffect(() => {
    const fetchQuestion = async () => {
      const { data, error } = await supabase.from('questions').select().eq('quiz_id', id).eq('user_id', currentUser?.id);
      if (error) {
        console.error("Gagal fetch data:", error.message);
      } else if (data) {
        setQuestions(data);
      }
    };
    fetchQuestion();
  }, [id]);

  useEffect(() => {
    const channel = supabase
      .channel('questions')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'questions', filter: `quiz_id=eq.${id}` },
        (payload) => {
          setQuestions((prevQuestions) => {
            const newQuestions = [...prevQuestions, payload.new as Question];
            setCurrentQuestion(newQuestions.length - 1);
            return newQuestions;
          });
          setGeneratingQuestion(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const navigateToQuestion = (index: number) => {
    setCurrentQuestion(index);
    const q = questions[index];
    if (q && answers[q.id]?.isCorrect) {
       setHideCorrect(prev => ({...prev, [q.id]: true}));
    }
  };

  const prevQuestion = () => {
    if (questions.length === 0) return;
    navigateToQuestion((currentQuestion - 1 + questions.length) % questions.length);
  }

  const handleGenerateQuestion = async () => {
    setGeneratingQuestion(true);
    const { data: transcriptData, error: transcriptError } = await supabase
      .from('transcript')
      .select('transcribe_text')
      .eq('quiz_id', id);

    if (transcriptError) {
      console.error('Failed to fetch transcript:', transcriptError.message);
      setGeneratingQuestion(false);
      return;
    }

    if (transcriptData && transcriptData.length > 0) {
      const transcript = transcriptData[0].transcribe_text;
      const formData = new FormData();
      formData.append('user_id', currentUser?.id || '');
      formData.append('quiz_id', id || '');
      formData.append('transcript', transcript);

      try {
        const { AxiosConfig } = await import('../../config/AxiosConfig');
        await AxiosConfig.post('/generate/question', {
          user_id: currentUser?.id || '',
          quiz_id: id || '',
          transcript: transcript,
        });
      } catch (error) {
        console.error('Failed to generate question:', (error as Error).message);
        setGeneratingQuestion(false);
      }
    } else {
      setGeneratingQuestion(false);
    }
  };

  const nextQuestion = () => {
    if (questions.length === 0) return;

    if (currentQuestion === questions.length - 1) {
      handleGenerateQuestion();
    } else {
      navigateToQuestion(currentQuestion + 1);
    }
  };

  const activeQuestion = questions[currentQuestion];
  const selected = activeQuestion ? answers[activeQuestion.id] : undefined;

  const handleAnswer = (selectedChoice: string) => {
    if (!activeQuestion) return;
    if (answers[activeQuestion.id]) return;

    const isCorrect = selectedChoice === activeQuestion.answer;
    
    if (isCorrect) {
      playCorrectSound();
    } else {
      playWrongSound();
    }

    setAnswers(prev => ({
      ...prev,
      [activeQuestion.id]: {
        isCorrect,
        selectedChoice
      }
    }));
    setHideCorrect(prev => ({
      ...prev,
      [activeQuestion.id]: false
    }));
  }

  const progressPercent = questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#fafafa] selection:bg-indigo-100 selection:text-indigo-900 pb-20">
      <PageMeta title="Quiz Mode - Quizora Learn" description="Flow state quiz answering" />
      
      {/* Top Navigation Bar purely for flow context */}
      <div className="max-w-5xl mx-auto pt-6 px-4 sm:px-6 lg:px-8 mb-6 flex items-center justify-between">
         <button onClick={() => navigate('/notes')} className="text-gray-500 hover:text-indigo-600 transition-colors flex items-center gap-2 font-bold bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100 text-sm">
            <FaArrowLeft /> Exit Quiz
         </button>
         <div className="flex items-center gap-2 bg-indigo-50 px-4 py-1.5 rounded-full text-indigo-700 font-bold text-xs sm:text-sm shadow-sm border border-indigo-100">
            <BsStars /> Quizora Quick Flow
         </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Quiz Card */}
        <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden relative transition-all duration-300">
          
          {/* Progress Bar */}
          <div className="h-2 w-full bg-gray-50">
             <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out" 
                style={{ width: `${progressPercent}%` }}
             />
          </div>

          <div className="p-5 sm:p-8 min-h-[300px] flex flex-col justify-center">
            {generatingQuestion ? (
              <div className="py-12">
                 <QuestionPlaceholder />
              </div>
            ) : questions.length > 0 && activeQuestion ? (
              <div className="animate-fade-in-up">
                
                {/* Question Header & Meta */}
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xs sm:text-sm font-bold tracking-widest uppercase text-gray-400">
                    Question {currentQuestion + 1} of {questions.length}
                  </span>
                  
                  {/* Status Badge */}
                  {selected && !hideCorrect[activeQuestion.id] && (
                    <div className={`px-3 py-1 rounded-full text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm ${selected.isCorrect ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                      {selected.isCorrect ? <><FaCheck/> Brilliant!</> : <><TbXboxX/> Incorrect</>}
                    </div>
                  )}
                </div>

                {/* Question Text */}
                <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-[1.4] mb-6">
                  {activeQuestion.question}
                </h1>

                {/* Hide/View Answer Tip for returning users */}
                {selected?.isCorrect && hideCorrect[activeQuestion.id] && (
                  <div className="mb-6 p-4 sm:p-5 bg-indigo-50/70 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between border border-indigo-100/50 gap-4">
                    <div className="flex items-center gap-3 text-indigo-700 font-medium text-sm sm:text-base">
                      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm border border-indigo-100 shrink-0">
                        <FaLightbulb className="text-yellow-500 text-base" />
                      </div>
                      You've flawlessly answered this before!
                    </div>
                    <button 
                      onClick={() => setHideCorrect(prev => ({...prev, [activeQuestion.id]: false}))}
                      className="px-4 py-2 bg-white border border-indigo-200 text-indigo-600 rounded-lg text-xs sm:text-sm font-bold hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm whitespace-nowrap"
                    >
                      Reveal Answer
                    </button>
                  </div>
                )}

                {/* Choices Grid */}
                <div className="flex flex-col gap-3">
                  {activeQuestion.choices.map((choice: string, index: number) => {
                    const isSelected = selected && selected.selectedChoice === choice;
                    const isActualAnswer = choice === activeQuestion.answer;
                    const showResults = selected && (!selected.isCorrect || !hideCorrect[activeQuestion.id]);

                    let btnClass = "w-full p-3 sm:p-4 text-left rounded-xl sm:rounded-2xl border-2 transition-all duration-200 flex items-center justify-between group outline-none ";
                    
                    if (showResults) {
                       if (isActualAnswer) {
                          btnClass += "bg-green-50 border-green-500 text-green-900 shadow-[0_4px_20px_rgba(34,197,94,0.15)] z-10";
                       } else if (isSelected) {
                          btnClass += "bg-red-50 border-red-500 text-red-900 shadow-[0_4px_20px_rgba(239,68,68,0.15)] z-10";
                       } else {
                          btnClass += "bg-gray-50 border-gray-100 text-gray-400 opacity-60";
                       }
                    } else if (!selected) {
                       btnClass += "bg-white border-gray-100 hover:border-indigo-300 hover:bg-indigo-50/50 hover:shadow-md text-gray-800 cursor-pointer";
                    } else {
                       // selected but hidden
                       btnClass += "bg-white border-gray-100 text-gray-400 opacity-60";
                    }

                    return (
                      <button 
                        key={index}
                        disabled={!!selected} 
                        onClick={() => handleAnswer(choice)} 
                        className={btnClass}
                      >
                        <div className="flex items-center gap-3 sm:gap-4 max-w-[90%]">
                          <div className={`shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center font-bold text-sm sm:text-base border transition-colors ${
                            showResults && isActualAnswer ? "bg-green-100 border-green-200 text-green-700" :
                            showResults && isSelected ? "bg-red-100 border-red-200 text-red-700" :
                            !selected ? "bg-gray-50 border-gray-200 text-gray-500 group-hover:bg-indigo-50 group-hover:border-indigo-200 group-hover:text-indigo-600" : 
                            "bg-gray-50 border-gray-100 text-gray-400"
                          }`}>
                             {String.fromCharCode(65 + index)}
                          </div>
                          <span className="text-base sm:text-lg font-semibold leading-relaxed pr-3 break-words text-left">{choice}</span>
                        </div>
                        
                        {/* Custom Radio Circle for visual feedback */}
                        <div className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors shadow-sm ${
                          showResults && isActualAnswer ? "border-green-500 bg-green-500 text-white" :
                          showResults && isSelected ? "border-red-500 bg-red-500 text-white" :
                          !selected ? "border-gray-200 group-hover:border-indigo-400 bg-white" : "border-gray-100 bg-gray-50"
                        }`}>
                           {showResults && isActualAnswer && <FaCheck size={10} />}
                           {showResults && isSelected && !isActualAnswer && <TbXboxX size={12} />}
                        </div>
                      </button>
                    );
                  })}
                </div>

              </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <AiOutlineLoading3Quarters className="animate-spin text-indigo-600 text-4xl mb-4" />
                    <p className="text-gray-500 font-medium">Loading Quiz Data...</p>
                </div>
            )}
          </div>

          {/* Footer Controls */}
          {questions.length > 0 && !generatingQuestion && (
             <div className="bg-gray-50/80 border-t border-gray-100 p-4 sm:px-8 flex items-center justify-between mt-auto">
                <button
                  onClick={prevQuestion}
                  disabled={currentQuestion === 0}
                  className="px-4 py-2 font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-200/50 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                >
                  Previous
                </button>

                {/* The "Flow" Continue Button */}
                <div className="flex-1 flex justify-end">
                   {selected ? (
                     <button
                       onClick={nextQuestion}
                       className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-lg shadow-[0_4px_14px_0_rgb(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] hover:-translate-y-0.5 transition-all flex items-center gap-2 animate-fade-in-up"
                     >
                       {currentQuestion === questions.length - 1 ? 'Generate New Question' : 'Next Question'} <FaArrowRight size={14}/>
                     </button>
                   ) : (
                      <div className="px-6 py-2.5 text-gray-400 font-medium text-sm sm:text-base">
                         Select an answer
                      </div>
                   )}
                </div>
             </div>
          )}
        </div>
        
        {/* Navigation Dots (Optional, keeping it below for context but minimalistic) */}
        {!generatingQuestion && questions.length > 0 && (
           <div className="mt-8 flex flex-wrap justify-center gap-2 px-4">
              {questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => navigateToQuestion(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                     index === currentQuestion 
                        ? 'bg-indigo-600 w-8' 
                        : answers[questions[index].id] 
                           ? (answers[questions[index].id].isCorrect ? 'bg-green-400' : 'bg-red-400') 
                           : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                  title={`Question ${index + 1}`}
                />
              ))}
           </div>
        )}
      </div>
    </div>
  );
}
