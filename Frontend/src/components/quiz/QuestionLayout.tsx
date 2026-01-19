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

export default function QuestionLayout() {
  const { id } = useParams<{ id: string }>();
  const [questions, setQuestions] = useState<any[]>([]);
  const [quizez, setQuizez] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState({ correct: 0, wrong: 0 });
  const [modalResult, setModalResultOpen] = useState<boolean>(false);
  const [popUp, setPopUpOpen] = useState<boolean>(false);
  const navigate = useNavigate();

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
  }, [id]);

  const prevQuestion = () => {
    if (questions.length === 0) return;
    setCurrentQuestion((currentQuestion - 1 + questions.length) % questions.length
    );
  }
  const nextQuestion = () => {
    if (questions.length === 0) return;
    setCurrentQuestion((currentQuestion + 1) % questions.length);
  };

  const activeQuestion = questions[currentQuestion];
  const [pickedByQid, setPickedByQid] = useState<Record<string, string>>({});
  const selected = activeQuestion ? pickedByQid[activeQuestion.id] : undefined;

  const handleAnswer = (selectedChoice: string) => {
    if (!activeQuestion) return;
    if (pickedByQid[activeQuestion.id]) return;
    setPickedByQid(prev => ({ ...prev, [activeQuestion.id]: selectedChoice }));
  }

  useEffect(() => {
    let correct = 0;
    let wrong = 0;

    for (const question of questions) {
      const userAnswer = pickedByQid[question.id]; // ambil jawaban user
      if (!userAnswer) continue; // kalau user belum jawab, skip

      if (userAnswer === question.answer) {
        correct++;
      } else {
        wrong++;
      }
      setScore({ correct, wrong });
    }
  }, [questions, pickedByQid])

  useEffect(() => {
    if (questions.length > 0 && Object.keys(pickedByQid).length === questions.length) {
      setPopUpOpen(true);
      setTimeout(() => {
        setPopUpOpen(false);
      }, 5000);
      setModalResultOpen(true);
    }
  }, [id, navigate, pickedByQid, questions.length,]);

  return (
    <div>
      <PageMeta
        title="React.js Blank Dashboard | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Blank Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      {quizez.map((quiz) => (
        <PageBreadcrumb pageTitle={quiz.topic} />
      ))}
      <div className="bg-white dark:border-white/[0.05] dark:bg-white/[0.03] rounded-lg border border-gray-200 transition text-start dark:text-gray-400">
        <div className="mx-auto w-full p-3 text-center">
          {questions.map((question, index) => index === currentQuestion ? (
            <div key={question.id}>
              <h1 className="text-2xl my-2">{question.question}</h1>
            </div>
          ) : null
          )}
          <div className="grid grid-cols-[full_200px_200px_200px] gap-4 ">
            {questions[currentQuestion]?.choices.map((choice, index) => (
              <div key={index} className="">
                <button disabled={!!selected} onClick={() => handleAnswer(choice)} className={
                  "mt-2 px-4 py-2 rounded w-full h-full " + (
                    selected
                      ? (choice === activeQuestion.answer
                        ? "bg-green-500 text-white"       // jawaban benar
                        : choice === selected
                          ? "bg-red-500 text-white"       // jawaban yang dipilih tapi salah
                          : "bg-gray-200")                // pilihan lain setelah jawaban terkunci
                      : "flex items-center justify-center p-4 rounded-lg border border-gray-200 dark:border-white/[0.05] bg-gray-50 hover:bg-gray-100 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] transition text-start dark:text-gray-400"     // default sebelum menjawab
                  )
                }>{choice}</button>
              </div>
            ))}
          </div>
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
                    Correct
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
            <h1>Question {currentQuestion} / {questions.length}</h1>
            <button
              onClick={nextQuestion}
              className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-600"
            >
              Next
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
  );
}
