import { FaBrain, FaFilm } from "react-icons/fa";
import { MdOutlineScience, MdOutlineSportsFootball } from "react-icons/md";
import { BiMath } from "react-icons/bi";
import { TiWorld } from "react-icons/ti";
import { FaComputer, FaMountainSun } from "react-icons/fa6";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import { useState } from "react";
import { toast } from "react-toastify";

// define quiz category props
type quizCategoryProps = {
    category: string;
    icon: React.ReactNode;
}

const quizClassname = "text-3xl mb-2 dark:text-white/60 text-gray-800";

// define quiz categories
const quizCategories: quizCategoryProps[] = [
    { category: "General Knowledge", icon: <FaBrain className={quizClassname} /> },
    { category: "Mathematics", icon: <BiMath className={quizClassname} /> },
    { category: "Science", icon: <MdOutlineScience className={quizClassname} /> },
    { category: "History", icon: <TiWorld className={quizClassname} /> },
    { category: "Geography", icon: <FaMountainSun className={quizClassname} /> },
    { category: "Technology & Computers", icon: <FaComputer className={quizClassname} /> },
    { category: "Sports", icon: <MdOutlineSportsFootball className={quizClassname} /> },
    { category: "Entertainment", icon: <FaFilm className={quizClassname} /> },
];

export default function QuizCategory() {
    const [openModal, setOpenModal] = useState<boolean>(false);
    const [selectedCategory, setSelectedCategory] = useState<typeof quizCategories[0] | null>(null);
    const [quizLoading, setQuizLoading] = useState<boolean>(false);

    // method to close modal
    const closeModal = () => {
        setOpenModal(false);
    }

    // method to handle generate quiz
    const handleGenerateQuiz = () => {
        setQuizLoading(true);
        // simulate quiz generation
        setTimeout(() => {
            setQuizLoading(false);
            setOpenModal(false);
            toast.success("Quiz generated successfully! You can now customize it in the quizzes section.");
        }, 2000);
    }
    return (
        <>
            <div className="overflow-hidden bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {quizCategories.map((item, index) => (
                        <button
                            key={index}
                            onClick={() => {
                                setSelectedCategory(item);
                                setOpenModal(true);
                            }}
                            className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 dark:border-white/[0.05] bg-gray-50 hover:bg-gray-100 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] transition"
                        >
                            {item.icon}
                            <span className="text-base font-medium text-gray-600 dark:text-gray-400">{item.category}</span>
                        </button>
                    ))}
                </div>
            </div>
            <Modal isOpen={openModal} onClose={closeModal} className="max-w-[700px] m-4">
                <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                    <div className="px-2 pr-14">
                        <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                            Generate Quiz for {selectedCategory?.category}
                        </h4>
                        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
                            Click the button below to generate a quiz for the selected category. You can customize the quiz settings after generation.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                        <Button size="sm" variant="outline" onClick={closeModal}>
                            Close
                        </Button>
                        <Button disabled={quizLoading} onClick={handleGenerateQuiz} size="sm" className="bg-blue-600/55 hover:bg-blue-700">
                            {quizLoading ? "Generating Quiz..." : "Generate Quiz"}
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
