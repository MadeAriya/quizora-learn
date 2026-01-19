import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { Flashcard } from "react-quizlet-flashcard";
import "react-quizlet-flashcard/dist/index.css";
import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { supabase } from "../../config/SupabaseConfig";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import Button from "../ui/button/Button";
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';

export default function Blank() {
  const { id } = useParams<{ id: string }>();
  const [quizLoading, setQuizLoading] = useState<boolean>(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [quizez, setQuizez] = useState<any[]>([]);
  const [transcript, setTranscript] = useState<any[]>({});
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
    const fetchQuizez = async () => {
      const { data, error } = await supabase.from('quizez').select().eq('quiz_id', id);
      if (error) {
        console.error("Gagal fetch data:", error.message);
      } else if (data) {
        setQuizez(data);
      }
    };
    fetchQuizez();
  }, [id]);

  useEffect(() => {
    const fetchTranscript = async () => {
      const { data, error } = await supabase.from('transcript').select('transcribe_text').eq('quiz_id', id).single();
      if (error) {
        console.error("Gagal fetch data:", error.message);
      } else if (data) {
        setTranscript(data);
      }
    };
    fetchTranscript();
  }, [id]);

  const fetchQuestions = async () => {
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
  };

  useEffect(() => {
    fetchQuestions();
  }, [id]);

  const { currentUser } = useAuth();
  console.log(id);

  const handleGenerateFlashcard = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("transcript", transcript.transcribe_text || "Tidak ada transcript ditemukan");
    formData.append("user_id", currentUser?.id || "");
    formData.append("quiz_id", id);

    setQuizLoading(true);
    try {
      const response = await fetch("https://driving-lemming-neutral.ngrok-free.app/webhook/a3de8bc7-e44a-4b6b-93ce-e698f92e623b",
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
      console.log(error.message);
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
                        <div className="w-full flex items-center justify-center p-6 rounded-xl shadow-lg bg-gradient-to-br from-white to-gray-100 dark:from-gray-800 dark:to-gray-900 text-gray-900 dark:text-white transform transition-transform duration-300 hover:scale-105">
                          <h1 className="text-lg md:text-xl font-semibold text-center text-wrap break-words text-balance">{question.question}</h1>
                        </div>
                      ),
                    }}
                    back={{
                      html: (
                        <div className="w-full flex items-center justify-center p-6 rounded-xl shadow-lg bg-gradient-to-br from-white to-gray-100 dark:from-gray-800 dark:to-gray-900 text-center text-gray-900 dark:text-white transform transition-transform duration-300 hover:scale-105">
                          <h1 className="text-lg md:text-xl font-semibold text-center text-wrap break-words text-balance">{question.answer}</h1>
                        </div>
                      ),
                    }}
                  />
                ) : null
              )}

              <div className="mt-8 flex justify-center gap-6">
                <button
                  onClick={prevQuestion}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-full shadow-md hover:bg-blue-700 transition duration-300 ease-in-out transform hover:scale-105"
                >
                  <FaArrowLeft /> Prev
                </button>
                <h1 className="text-dark dark:text-white self-center text-lg font-medium">
                  Question {currentQuestion + 1} / {questions.length}
                </h1>
                <button
                  onClick={nextQuestion}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-full shadow-md hover:bg-blue-700 transition duration-300 ease-in-out transform hover:scale-105"
                >
                  Next <FaArrowRight />
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center p-10 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
              <h1 className="text-black dark:text-white text-3xl font-bold mb-4">
                Your flashcard is Empty
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
                Generate flashcards from your quiz transcript to start learning!
              </p>
              <Button
                onClick={handleGenerateFlashcard}
                disabled={quizLoading}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-full shadow-md transition duration-300 ease-in-out mt-6 flex items-center justify-center gap-2"
              >
                <AiOutlineLoading3Quarters
                  color="white"
                  className={`text-xl ${quizLoading ? "block animate-spin" : "hidden"}`}
                />
                {quizLoading ? "Generating Flashcard..." : "Generate Flashcards"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}