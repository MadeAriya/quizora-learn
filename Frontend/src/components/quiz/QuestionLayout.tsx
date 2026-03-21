import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { useParams } from "react-router";
import {supabase} from "../../config/SupabaseConfig";
import { useEffect } from "react";
import { useState } from "react";
import { Modal } from "../ui/modal";
import { useNavigate } from "react-router-dom";
import { IoIosCheckmarkCircle } from "react-icons/io";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { FaCheck } from "react-icons/fa";
import { TbXboxX } from "react-icons/tb";

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

import QuestionPlaceholder from "./QuestionPlaceholder";
import { useAuth } from "../../context/AuthContext";

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
  const ctx = initAudio();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  // A bright chime sound for correct answer
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(600, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);

  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05); // quick attack
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5); // decay

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.5);
};

const playWrongSound = () => {
  const ctx = initAudio();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  // A low buzz sound for wrong answer
  oscillator.type = 'square';
  oscillator.frequency.setValueAtTime(150, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);

  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05); // quick attack
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4); // decay

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.4);
};

export default function QuestionLayout() {
  const { id } = useParams<{ id: string }>();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizez, setQuizez] = useState<Quiz[]>([]);
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
  const [score, setScore] = useState({ correct: 0, wrong: 0 });
  const [modalResult, setModalResultOpen] = useState<boolean>(false);
  const [popUp, setPopUpOpen] = useState<boolean>(false);
  const [hideCorrect, setHideCorrect] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const closeModalResult = () => {
    setModalResultOpen(false);
    navigate("/notes");
  }

  const closePopUp = () => {
    setPopUpOpen(false);
  }

  useEffect(() => {
    const fetchQuestion = async () => {
      const { data, error } = await supabase.from('questions').select().eq('quiz_id', id);
      if (error) {
        console.error("Gagal fetch data:", error.message);
      } else if (data) {
        setQuestions(data);
      }
    };
    fetchQuestion();
  }, [id]);

  useEffect(() => {
    const fetchQuizez = async () => {
      const { data, error } = await supabase.from('quizez').select().eq('id', id);
      if (error) {
        console.error("Gagal fetch data:", error.message);
      } else if (data) {
        setQuizez(data);
      }
    };
    fetchQuizez();

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

  const [generating] = useState(false);
  const [generatingQuestion, setGeneratingQuestion] = useState(false);

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
        await fetch(
          'https://n8n.ayakdev.web.id/webhook/661ad6c1-7142-4b32-a71a-bb458abd9135',
          {
            method: 'POST',
            body: formData,
          }
        );
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
    
    // Play sound based on result
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

  useEffect(() => {
    let correct = 0;
    let wrong = 0;

    for (const question of questions) {
      const userAnswer = answers[question.id]; // ambil jawaban user
      if (!userAnswer) continue; // kalau user belum jawab, skip

      if (userAnswer.isCorrect) {
        correct++;
      } else {
        wrong++;
      }
      setScore({ correct, wrong });
    }
  }, [questions, answers])

  useEffect(() => {
    if (questions.length > 0 && Object.keys(answers).length === questions.length) {
      setPopUpOpen(true);
      setTimeout(() => {
        setPopUpOpen(false);
      }, 5000);
      setModalResultOpen(true);
    }
  }, [id, navigate, answers, questions.length,]);

  return (
    <div>
      <PageMeta
        title="Questions"
        description="This is React.js Blank Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      {quizez.map((quiz) => (
        <PageBreadcrumb pageTitle={quiz.topic} />
      ))}
      <div className="flex">
        <div className="w-3/4">
          <div className="bg-white dark:border-white/[0.05] dark:bg-white/[0.03] rounded-lg border border-gray-200 transition text-start dark:text-gray-400">
            <div className="mx-auto w-full p-3 text-center">
              {generating || generatingQuestion ? (
                <QuestionPlaceholder />
              ) : (
                <>
                  {questions.map((question, index) => index === currentQuestion ? (
                    <div key={question.id}>
                      {answers[question.id] && !hideCorrect[question.id] && (
                        <div className={`absolute top-2 right-2 px-4 py-2 rounded-md ${answers[question.id].isCorrect ? 'bg-green-500' : 'bg-red-500'
                          } text-white font-semibold`}>
                          {answers[question.id].isCorrect ? "Correct" : "Wrong"}
                        </div>
                      )}

                      {answers[question.id]?.isCorrect && hideCorrect[question.id] && (
                        <div className="mb-4 mt-2 p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between border border-indigo-100 dark:border-indigo-800 gap-4">
                          <span className="text-indigo-700 dark:text-indigo-300 font-medium text-sm text-left">
                            💡 You've correctly answered this question before.
                          </span>
                          <button 
                            onClick={() => setHideCorrect(prev => ({...prev, [question.id]: false}))}
                            className="px-4 py-2 bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 rounded-lg text-sm font-bold hover:bg-indigo-50 dark:hover:bg-indigo-900/50 transition-colors shadow-sm whitespace-nowrap"
                          >
                            View Answer
                          </button>
                        </div>
                      )}
                      
                      {answers[question.id]?.isCorrect && !hideCorrect[question.id] && (
                        <div className="mb-4 mt-2 flex justify-end">
                           <button 
                            onClick={() => setHideCorrect(prev => ({...prev, [question.id]: true}))}
                            className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 rounded-md text-xs font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-sm"
                          >
                            Hide Answer
                          </button>
                        </div>
                      )}

                      <h1 className="text-2xl my-2">{question.question}</h1>
                    </div>
                  ) : null
                  )}
                  <div className="grid grid-cols-[full_200px_200px_200px] gap-4 ">
                    {questions[currentQuestion]?.choices.map((choice: string, index: number) => {
                      let btnClass = "flex items-center justify-center p-4 rounded-lg border border-gray-200 dark:border-white/[0.05] bg-gray-50 dark:bg-white/[0.05] transition text-start dark:text-gray-400";
                      
                      const showColors = selected && (!selected.isCorrect || !hideCorrect[activeQuestion.id]);

                      if (showColors) {
                         if (choice === activeQuestion.answer) {
                            btnClass = "bg-green-500 border border-green-600 dark:border-green-400 text-white flex items-center justify-center p-4 rounded-lg";
                         } else if (choice === selected?.selectedChoice) {
                            btnClass = "bg-red-500 border border-red-600 dark:border-red-400 text-white flex items-center justify-center p-4 rounded-lg";
                         } else {
                            btnClass = "bg-gray-200 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 text-gray-500 dark:text-gray-400 flex items-center justify-center p-4 rounded-lg";
                         }
                      } else if (!selected) {
                         btnClass += " hover:bg-gray-100 dark:hover:bg-white/[0.1] cursor-pointer";
                      } else {
                         // selected but hidden
                         btnClass += " opacity-90";
                      }

                      return (
                        <div key={index} className="">
                          <button disabled={!!selected} onClick={() => handleAnswer(choice)} className={`mt-2 w-full h-full font-medium ${btnClass}`}>
                            {choice}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
              <Modal isOpen={modalResult} onClose={closeModalResult} className="max-w-[700px] m-4">
                <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                  <div className="px-2 pr-14">
                    <h4 className="mb-2 text-2xl text-center font-semibold text-gray-800 dark:text-white/90">
                      Summary
                    </h4>
                  </div>
                  <div className="flex flex-col justify-center items-center">
                    <h1>Performance Stats</h1>
                    <div className="flex gap-3">
                      <div className="flex flex-col rounded-md p-2 border bg- border-black dark:border-white/[0.05] bg-gray-50 dark:bg-white/[0.05]">
                        <span className="flex"><FaCheck size={30} color="lightgreen" className="mr-4" />{score.correct}</span>
                        Correct
                      </div>
                      <div className="flex flex-col rounded-md p-2 border bg- border-black dark:border-white/[0.05] bg-gray-50 dark:bg-white/[0.05]">
                        <span className="flex"><TbXboxX size={30} color="red" className="mr-4" />{score.wrong}</span>
                        Wrong
                      </div>
                    </div>
                  </div>
                  <h1>This window will automaticly closed after 10 Seconds</h1>
                </div>
              </Modal>
              <Modal isOpen={popUp} onClose={closePopUp} className="max-w-[700px] m-4 transition">
                <div className="no-scrollbar flex flex-col items-center justify-center relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                  <div className="flex justify-center">
                    <IoIosCheckmarkCircle color="lightgreen" size={70} />
                  </div>
                  <h1 className="text-2xl mt-4">
                    Well Done 🎉
                  </h1>
                  <p>You've answered all the question</p>
                  <div className="flex items-center gap-2 mt-3">
                    <AiOutlineLoading3Quarters size={20} color="blue" className="animate-spin" />
                    <p>Calculating the Result..</p>
                  </div>
                </div>
              </Modal>
              <div className="mt-6 flex justify-between">
                <button
                  onClick={prevQuestion}
                  className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-600"
                >
                  Prev
                </button>
                <h1>Question {currentQuestion + 1} / {questions.length}</h1>
                <button
                  onClick={nextQuestion}
                  className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-600"
                >
                  {currentQuestion === questions.length - 1 ? 'Generate New Question' : 'Next'}
                </button>
                {/* <button
              onClick={handleResult}
              className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-600"
            >
              Submit Quiz
            </button> */}
              </div>
            </div>
          </div>
        </div>
        <div className="w-1/4 ml-4">
          <div className="bg-white dark:border-white/[0.05] dark:bg-white/[0.03] rounded-lg border border-gray-200 transition text-start dark:text-gray-400 p-4">
            <h2 className="text-lg font-semibold mb-4">Questions</h2>
            <div className="flex flex-wrap">
              {questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => navigateToQuestion(index)}
                  className={`w-10 h-10 rounded-full mx-1 my-1 ${index === currentQuestion ? 'bg-blue-500 text-white' : 'bg-gray-300'
                    }`}
                  style={{ flex: '0 0 calc(10% - 8px)' }}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
