import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { Flashcard } from "react-quizlet-flashcard";
import "react-quizlet-flashcard/dist/index.css";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router";
import { supabase } from "../../config/SupabaseConfig";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import Button from "../ui/button/Button";
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';

interface Question {
  id: string;
  question: string;
  answer: string;
}

interface Quiz {
  id: string;
  topic: string;
}

export default function Blank() {
  const { id } = useParams<{ id: string }>();
  const [quizLoading, setQuizLoading] = useState<boolean>(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizez, setQuizez] = useState<Quiz[]>([]);
  const [transcript, setTranscript] = useState<{ transcribe_text: string } | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(1);

  const prevQuestion = () => {
    if (questions.length === 0) return;
    setCurrentQuestion((currentQuestion - 1 + questions.length) % questions.length
    );
  }
  const nextQuestion = () => {
    if (questions.length === 0) return;
    setCurrentQuestion((currentQuestion + 1) % questions.length);
  };

  useEffect(() => {
    const fetchData = async () => {
      const { data: quizezData, error: quizezError } = await supabase.from('quizez').select().eq('quiz_id', id);
      if (quizezError) {
        console.error("Gagal fetch data:", quizezError.message);
      } else if (quizezData) {
        setQuizez(quizezData);
      }

      const { data: transcriptData, error: transcriptError } = await supabase.from('transcript').select('transcribe_text').eq('quiz_id', id).single();
      if (transcriptError) {
        console.error("Gagal fetch data:", transcriptError.message);
      } else if (transcriptData) {
        setTranscript(transcriptData);
      }
    };
    fetchData();
  }, [id]);

  const fetchQuestions = useCallback(async () => {
    const { data, error } = await supabase
      .from('flashcard')
      .select()
      .eq('quiz_id', id);

    console.log("Fetch result from flashcard:", { data, error });

    if (error) {
      console.error("Gagal fetch data:", error.message);
    } else {
      setQuestions(data || []);
    }
  }, [id]);

  useEffect(() => {
    fetchQuestions();
  }, [id, fetchQuestions]);

  const { currentUser } = useAuth();
  console.log(id);

  if(!id) return;
  if(!transcript) return;
  const handleGenerateFlashcard = async () => {
    
    const formData = new FormData();
    formData.append("transcript", transcript.transcribe_text || "Tidak ada transcript ditemukan");
    formData.append("user_id", currentUser?.id || "");
    formData.append("quiz_id", id);

    setQuizLoading(true);
    try {
      const response = await fetch("https://n8n.ayakdev.web.id/webhook/a3de8bc7-e44a-4b6b-93ce-e698f92e623b",
        {
          method: "POST",
          body: formData
        }
      );

      const result = await response.json();
      if (result.success) {
        console.log("succes");
        await fetchQuestions();
      } else {
        setTimeout(() => {
          setQuizLoading(false);
          toast.success("Quiz generated successfully! You can now customize it in the quizzes section.");
        }, 2000);
        await fetchQuestions();
      }
    } catch (error) {
      console.log((error as Error).message);
    }
  }
  return (
    <div>
      <PageMeta
        title="Flashcards - Quizora Learn"
        description="Practice and memorize with interactive AI generated flashcards."
      />

      {quizez.map((quiz) => (
        <PageBreadcrumb key={quiz.id} pageTitle={quiz.topic} />
      ))}
    
      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 xl:p-10 mb-8 max-w-5xl mx-auto">
        <div className="flex flex-col items-center justify-center w-full mx-auto max-w-3xl">
          {questions.length > 0 ? (
            <>
              {questions.map((question, index) =>
                index === currentQuestion ? (
                  <Flashcard
                    key={question.id || index}
                    className="custom-flashcard w-full"
                    front={{
                      html: (
                        <div className="w-full h-full flex flex-col items-center justify-center p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 transition-all duration-500 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] cursor-pointer group relative">
                          <div className="absolute top-6 left-6 flex items-center gap-2 text-xs sm:text-sm font-bold text-blue-500 dark:text-blue-400 uppercase tracking-widest">
                             <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                             Question
                          </div>
                          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-center text-wrap break-words leading-relaxed px-4">
                            {question.question}
                          </h1>
                          <div className="absolute bottom-6 flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                             <span className="text-gray-400 dark:text-gray-500 text-sm font-medium">Click to reveal</span>
                          </div>
                        </div>
                      ),
                    }}
                    back={{
                      html: (
                        <div className="w-full h-full flex flex-col items-center justify-center p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/50 dark:bg-indigo-900/20 text-gray-800 dark:text-gray-100 transition-all duration-500 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] cursor-pointer group relative">
                          <div className="absolute top-6 left-6 flex items-center gap-2 text-xs sm:text-sm font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">
                             <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                             Answer
                          </div>
                          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-center text-wrap break-words leading-relaxed px-4 text-indigo-900 dark:text-indigo-100">
                            {question.answer}
                          </h1>
                          <div className="absolute bottom-6 flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                             <span className="text-indigo-300 dark:text-indigo-500 text-sm font-medium">Click to flip back</span>
                          </div>
                        </div>
                      ),
                    }}
                  />
                ) : null
              )}

              <div className="mt-12 w-full max-w-xl px-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs sm:text-sm font-semibold text-gray-400 dark:text-gray-500 tracking-wider uppercase">Progress</span>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    {currentQuestion + 1} <span className="text-gray-400 dark:text-gray-600 font-medium">/ {questions.length}</span>
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 dark:bg-gray-800 mb-8 overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                  ></div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4">
                  <button
                    onClick={prevQuestion}
                    disabled={questions.length <= 1}
                    className="group outline-none flex flex-1 items-center justify-center gap-3 px-6 py-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaArrowLeft className="transition-transform group-hover:-translate-x-1" />
                    <span>Previous</span>
                  </button>
                  
                  <button
                    onClick={nextQuestion}
                    disabled={questions.length <= 1}
                    className="group outline-none flex flex-1 items-center justify-center gap-3 px-6 py-4 bg-blue-600 text-white font-medium rounded-2xl shadow-[0_8px_20px_rgb(37,99,235,0.24)] hover:bg-blue-700 hover:shadow-[0_8px_20px_rgb(37,99,235,0.4)] transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>Next Card</span>
                    <FaArrowRight className="transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-6 sm:px-12 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl bg-gray-50/50 dark:bg-gray-800/30 text-center w-full max-w-2xl">
              <div className="w-20 h-20 mb-8 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center -rotate-3 shadow-sm border border-blue-100 dark:border-blue-800/50">
                <svg className="w-10 h-10 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                </svg>
              </div>
              <h1 className="text-gray-900 dark:text-white text-2xl sm:text-3xl font-extrabold mb-4 tracking-tight">
                No Flashcards Yet
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mb-8 text-base sm:text-lg max-w-md leading-relaxed">
                Generate AI-powered flashcards from your quiz transcript to start an interactive learning session.
              </p>
              <Button
                onClick={handleGenerateFlashcard}
                disabled={quizLoading}
                size="lg"
                className="group bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-2xl shadow-[0_8px_20px_rgb(37,99,235,0.24)] hover:shadow-[0_8px_20px_rgb(37,99,235,0.4)] transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 flex items-center justify-center gap-3 w-full sm:w-auto"
              >
                {quizLoading ? (
                  <>
                    <AiOutlineLoading3Quarters className="w-5 h-5 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <span>Generate Flashcards</span>
                    <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}