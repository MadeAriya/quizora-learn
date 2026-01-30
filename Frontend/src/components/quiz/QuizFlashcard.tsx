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
        title="React.js Blank Dashboard | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Blank Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />

      {quizez.map((quiz) => (
        <PageBreadcrumb key={quiz.id} pageTitle={quiz.topic} />
      ))}
    
      <div className="rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-white/[0.03] xl:p-12">
        <div className="flex flex-col items-center justify-center w-full text-center mx-auto max-w-4xl">
          {questions.length > 0 ? (
            <>
              {questions.map((question, index) =>
                index === currentQuestion ? (
                  <Flashcard
                    key={question.id || index}
                    className="custom-flashcard"
                    front={{
                      html: (
                        <div className="w-full h-full flex flex-col items-center justify-center p-6 rounded-2xl shadow-xl border-t-4 border-l-4 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-700 dark:to-gray-800 text-gray-900 dark:text-white transform transition-transform duration-300 hover:scale-105 active:scale-100 cursor-pointer relative overflow-hidden">
                          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/lined-paper.png')] opacity-10 dark:opacity-5"></div>
                          <h1 className="relative z-10 text-sm md:text-base font-extrabold text-center text-wrap break-words leading-normal">
                            {question.question}
                          </h1>
                          <span className="absolute bottom-4 right-4 text-gray-400 dark:text-gray-500 text-sm">Tap to reveal</span>
                        </div>
                      ),
                    }}
                    back={{
                      html: (
                        <div className="w-full h-full flex flex-col items-center justify-center p-6 rounded-2xl shadow-xl border-t-4 border-l-4 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-700 dark:to-gray-800 text-gray-900 dark:text-white transform transition-transform duration-300 hover:scale-105 active:scale-100 cursor-pointer relative overflow-hidden">
                          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/lined-paper.png')] opacity-10 dark:opacity-5"></div>
                          <h1 className="relative z-10 text-2xl md:text-base font-extrabold text-center text-wrap break-words leading-normal">
                            {question.answer}
                          </h1>
                          <span className="absolute bottom-4 right-4 text-gray-400 dark:text-gray-500 text-sm">Tap to flip back</span>
                        </div>
                      ),
                    }}
                  />
                ) : null
              )}

              <div className="mt-8 w-full max-w-md">
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mb-4">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
                    style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-dark dark:text-white text-lg font-medium">
                  <button
                    onClick={prevQuestion}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-full shadow-md hover:bg-blue-700 transition duration-300 ease-in-out transform hover:scale-105"
                  >
                    <FaArrowLeft /> Prev
                  </button>
                  <span>
                    Question {currentQuestion + 1} / {questions.length}
                  </span>
                  <button
                    onClick={nextQuestion}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-full shadow-md hover:bg-blue-700 transition duration-300 ease-in-out transform hover:scale-105"
                  >
                    Next <FaArrowRight />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center p-10 border border-dashed border-gray-300 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-800 shadow-lg text-center">
              <svg
                className="w-24 h-24 text-gray-400 dark:text-gray-600 mb-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                ></path>
              </svg>
              <h1 className="text-black dark:text-white text-3xl font-extrabold mb-4">
                No Flashcards Yet
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg max-w-md">
                Generate flashcards from your quiz transcript to start an interactive learning experience.
              </p>
              <Button
                onClick={handleGenerateFlashcard}
                disabled={quizLoading}
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-bold py-3 px-8 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <AiOutlineLoading3Quarters
                  color="white"
                  className={`text-xl ${quizLoading ? "block animate-spin" : "hidden"}`}
                />
                {quizLoading ? "Generating Flashcards..." : "Generate Flashcards"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}