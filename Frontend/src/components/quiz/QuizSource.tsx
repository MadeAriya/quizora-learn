
// import { FaComputer, FaMountainSun } from "react-icons/fa6";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import { useState } from "react";
import { FaYoutube } from 'react-icons/fa';
import { FaFilePdf } from 'react-icons/fa';
import { FaFileExcel } from 'react-icons/fa';
import { FaFileWord } from 'react-icons/fa';
import { IoIosDocument } from "react-icons/io";
import { toast } from "react-toastify";
import FileInput from "../form/input/FileInput";
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { useAuth } from '../../context/AuthContext';

export default function QuizSource() {
    const [quizLoading, setQuizLoading] = useState<boolean>(false);
    const [openModal1, setOpenModal1] = useState<boolean>(false);
    const [openModal2, setOpenModal2] = useState<boolean>(false);
    const [link, setLink] = useState("")
    const [file, setFile] = useState<File | null >(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        setFile(e.target.files[0]);
    };

    // method to close modal
    const closeModal1 = () => {
        setOpenModal1(false);
    }

    const closeModal2 = () => {
        setOpenModal2(false);
    }

    const { currentUser } = useAuth();
    
    // method to handle generate quiz
    const handleGenerateQuiz = async (e: any) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append("link", link);
        formData.append("user_id", currentUser?.id || "")

        setQuizLoading(true);
        // simulate quiz generation

        try {
            const response = await fetch("https://n8n.ayakdev.web.id/webhook/d21b3b4e-1ca4-4d3b-9dd3-3c583a90eedc",
                {
                    method: "POST",
                    body: formData
                },
            );

            const result = await response.json();

            if (result.success) {
                console.log("succes")
            } else {
                setTimeout(() => {
                    setQuizLoading(false);
                    setOpenModal1(false);
                    toast.success("Quiz generated successfully! You can now customize it in the quizzes section.");
                }, 2000);
                console.log(result)
            }
        } catch (error) {
            console.log((error as Error).message);
        }
    };

    const handleFile = async (e: any) => {
        e.preventDefault();

        if (!file) return;
        const formData = new FormData();
        formData.append("file", file);
        formData.append("user_id", currentUser?.id || "")
        
        setQuizLoading(true);
        try {
            const response = await fetch("https://n8n.ayakdev.web.id/webhook/f3a1f876-1128-4cb3-9292-eddf1c8f2978",
                {
                    method: "POST",
                    body: formData
                },
            );

            const result = await response.json();

            if (result.success) {
                console.log("succes")
            } else {
                setTimeout(() => {
                    setQuizLoading(false);
                    setOpenModal1(false);
                    toast.success("Quiz generated successfully! You can now customize it in the quizzes section.");
                }, 2000);
                console.log(result)
            }
        } catch (error) {
            console.log((error as Error).message);
        }
    };

    return (
        <>
            <div className="flex">
                <div className="overflow-hidden bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
                    <div className="">
                        <button
                            onClick={() => {
                                setOpenModal1(true);
                            }}
                            className="flex items-center justify-center p-4 rounded-lg border border-gray-200 dark:border-white/[0.05] bg-gray-50 hover:bg-gray-100 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] transition text-start dark:text-gray-400"
                        >
                            <FaYoutube size={40} color="red" className="mr-3"></FaYoutube>
                            <div className="flex flex-col">
                                Youtube
                                <span className="text-base font-medium text-gray-600 dark:text-gray-400">Paste a youtube Link</span>
                            </div>
                        </button>
                    </div>
                </div>
                <Modal isOpen={openModal1} onClose={closeModal1} className="max-w-[700px] m-4">
                    <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                        <div className="px-2 pr-14">
                            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                                Generate Quiz for Youtube
                            </h4>
                            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
                                Click the button below to generate a quiz for the selected category. You can customize the quiz settings after generation.
                            </p>
                        </div>
                        <div className="p-4">
                            <form onSubmit={handleGenerateQuiz}>
                                <div className="form-group">
                                    <label htmlFor="link"></label>
                                    <input type="text" className="outline-2 w-[500px] h-[40px] p-2 rounded-sm" name="link" id="link" placeholder="Insert Link" required value={link} onChange={(e) => setLink(e.target.value)} />
                                </div>
                                <Button disabled={quizLoading} size="sm" className="bg-blue-600/55 hover:bg-blue-700 mt-3 flex items-center">
                                    <AiOutlineLoading3Quarters
                                        color="blue"
                                        className={`mr-2 ${quizLoading ? "block animate-spin" : "hidden"}`}
                                    />
                                    {quizLoading ? "Generating Quiz..." : "Generate Quiz"}
                                </Button>
                                <Button size="sm" variant="outline" onClick={closeModal1} className="ml-3">
                                    Close
                                </Button>
                            </form>
                        </div>
                    </div>
                </Modal>

                <div className="overflow-hidden bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
                    <div className="ml-4">
                        <button
                            onClick={() => {
                                setOpenModal2(true);
                            }}
                            className="flex items-center justify-center p-4 rounded-lg border border-gray-200 dark:border-white/[0.05] bg-gray-50 hover:bg-gray-100 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] transition text-start dark:text-gray-400"
                        >
                            <IoIosDocument size={40} color="gray-400" />
                            <div className="flex flex-col ml-3">
                                Upload your Document
                                <span className="text-base font-medium text-gray-600 dark:text-gray-400">Upload an document file</span>
                            </div>
                        </button>
                    </div>
                </div>
                <Modal isOpen={openModal2} onClose={closeModal2} className="max-w-[700px] m-4">
                    <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                        <div className="px-2 pr-14">
                            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                                Generate Quiz from File
                            </h4>
                            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-1">
                                Click the button below to generate a quiz for the selected category. You can customize the quiz settings after generation.
                            </p>
                            <div className="mb-7">
                                <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-2">
                                    Current supported type of File :
                                </p>
                                <div className="flex gap-2">
                                    <FaFilePdf size={40} color="red" className="mr-3 cap"></FaFilePdf>
                                    <FaFileExcel size={40} color="green" className="mr-3"></FaFileExcel>
                                    <FaFileWord size={40} color="blue" className="mr-3"></FaFileWord>
                                </div>
                            </div>
                        </div>
                        <div className="p-4">
                            <form onSubmit={handleFile}>
                                <div className="form-group">
                                    <label htmlFor="link"></label>
                                    <FileInput className="outline-2 w-full h-full p-2 rounded-sm" onChange={handleFileChange} />
                                </div>
                                <Button disabled={quizLoading} size="sm" className="bg-blue-600/55 hover:bg-blue-700 mt-3 flex items-center">
                                    <AiOutlineLoading3Quarters
                                        color="blue"
                                        className={`mr-2 ${quizLoading ? "block animate-spin" : "hidden"}`}
                                    />
                                    {quizLoading ? "Generating Quiz..." : "Generate Quiz"}
                                </Button>
                                <Button size="sm" variant="outline" onClick={closeModal2} className="ml-3">
                                    Close
                                </Button>
                            </form>
                        </div>
                    </div>
                </Modal>
            </div>
        </>
    );
}
