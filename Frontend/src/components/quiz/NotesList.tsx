import PageBreadcrumb from "../common/PageBreadCrumb";
import PageMeta from "../common/PageMeta";
import Button from "../ui/button/Button";
import { FaFolderPlus, FaYoutube, FaFilePdf } from "react-icons/fa";
import { IoMdMore } from "react-icons/io";
import { Modal } from "../ui/modal";
import { useEffect, useState } from "react";
import {supabase} from "../../config/SupabaseConfig";
import { Link } from "react-router-dom";

interface Quiz {
  id: number;
  topic: string;
  source?: string;
}

export default function NotesList() {
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [openModal1, setOpenModal1] = useState<boolean>(false);
  const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null);
  const [quizez, setQuizez] = useState<Quiz[]>([]);

  const closeModal = () => {
    setOpenModal(false);
  };
  const closeModal1 = () => {
    setOpenModal1(false);
    setSelectedQuizId(null);
  };

  useEffect(() => {
    const fetchQuizez = async () => {
      const { data, error } = await supabase.from("quizez").select();
      if (error) {
        console.error("Gagal fetch data:", error.message);
      } else if (data) {
        setQuizez(data);
      }
    };
    fetchQuizez();
  }, []);

  const handleQuizDelete = async (id: number) => {
    const { error } = await supabase.from("quizez").delete().eq("id", id);
    if (error) {
      console.error("Gagal delete:", error.message);
    } else {
      setQuizez((prev) => prev.filter((quiz) => quiz.id !== id));
    }
  };

  const handleQuizUpdate = async (id: number, newTitle: string) => {
    const { error } = await supabase
      .from("quizez")
      .update({ topic: newTitle })
      .eq("id", id);
    if (error) {
      console.error("Gagal update:", error.message);
    } else {
      setQuizez((prev) =>
        prev.map((quiz) =>
          quiz.id === id ? { ...quiz, topic: newTitle } : quiz
        )
      );
    }
  };

  const selectedQuiz = quizez.find((q) => q.id === selectedQuizId);

  return (
    <div>
      <PageMeta
        title="Notes Manager - Quizora Learn"
        description="Manage your notes"
      />
      <PageBreadcrumb pageTitle="Notes Folder" />
      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <div>
          <Button
            onClick={() => {
              setOpenModal(true);
            }}
            size="sm"
            variant="primary"
            startIcon={<FaFolderPlus className="size-5" />}
          >
            New Folder
          </Button>
        </div>
        <div className="max-w-full flex flex-col gap-4 mt-4">
          {quizez.map((quiz) => (
            <Link
              to={`/notes/${quiz.id}/quiz`}
              key={quiz.id}
              className="flex justify-between mt-4 rounded-lg border border-gray-200 dark:border-white/[0.05] bg-gray-50 hover:bg-gray-100 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] transition text-start dark:text-gray-400"
            >
              <div className="flex items-center gap-5">
                {quiz.source?.includes("youtu.be") ? (
                  <FaYoutube size={50} color="red" className="ml-4" />
                ) : (
                  <FaFilePdf size={50} color="red" className="ml-4 my-2" />
                )}
                <div className="flex flex-col ">
                  <h1 className="text-2xl my-2">{quiz.topic}</h1>
                  <p className="my-2">{quiz.source}</p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedQuizId(quiz.id);
                  setOpenModal1(true);
                }}
              >
                <IoMdMore size={40} className="justify-self-end self-center" />
              </button>
            </Link>
          ))}
        </div>
      </div>

      <Modal
        isOpen={openModal1}
        onClose={closeModal1}
        className="max-w-[700px] m-4"
      >
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Note Settings
            </h4>
          </div>
          {selectedQuiz && (
            <div>
              <div className="form-group grid">
                <label htmlFor="link" className="text-md my-2">
                  Note Topic Title
                </label>
                <input
                  type="text"
                  className="mt-3 outline-2 w-full h-[40px] p-2 rounded-sm"
                  name="link"
                  id="link"
                  placeholder="Insert Title"
                  value={selectedQuiz.topic}
                  onChange={(e) =>
                    handleQuizUpdate(selectedQuiz.id, e.target.value)
                  }
                />
              </div>
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  if (selectedQuizId) {
                    handleQuizDelete(selectedQuizId);
                    setOpenModal1(false);
                  }
                }}
                className="mt-4 w-full"
              >
                Delete
              </Button>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={openModal}
        onClose={closeModal}
        className="max-w-[700px] m-4"
      >
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Generate Quiz for Youtube
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Click the button below to generate a quiz for the selected
              category. You can customize the quiz settings after generation.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
