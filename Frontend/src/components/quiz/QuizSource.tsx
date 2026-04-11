
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
        
        setQuizLoading(true);

        try {
            const { AxiosConfig } = await import('../../config/AxiosConfig');
            
            const response = await AxiosConfig.post('/materials/youtube', {
              link: link,
              user_id: currentUser?.id || ""
            });

            const result = response.data;

            if (result.success) {
                setTimeout(() => {
                    setQuizLoading(false);
                    setOpenModal1(false);
                    toast.success("YouTube transcript extracted and quiz generation started!");
                }, 2000);
            } else {
                setQuizLoading(false);
                toast.error(result.error || "Failed to extract transcript.");
                console.error("Transcript extraction error:", result.error);
            }
        } catch (error) {
            setQuizLoading(false);
            toast.error("An error occurred while connecting to the transcript service.");
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
            const { AxiosConfig } = await import('../../config/AxiosConfig');
            
            const response = await AxiosConfig.post('/materials/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            const result = response.data;

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
        <div className="w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 w-full">
                {/* YouTube Source Button */}
                <button
                    onClick={() => setOpenModal1(true)}
                    className="group relative flex items-start gap-4 p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 bg-white hover:bg-gray-50/50 dark:border-gray-800 dark:bg-gray-900/50 dark:hover:bg-gray-800 text-left transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-transparent dark:from-red-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="w-14 h-14 shrink-0 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center shadow-sm border border-red-100 dark:border-red-900/30 group-hover:scale-110 transition-transform duration-300 relative z-10">
                        <FaYoutube size={26} />
                    </div>
                    <div className="flex flex-col relative z-10 w-full pt-1">
                        <span className="text-lg font-bold text-gray-900 dark:text-white mb-1">YouTube Video</span>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 leading-relaxed">Paste a link to generate a quiz from video captions.</span>
                        
                        <div className="mt-4 flex items-center text-red-600 dark:text-red-400 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0">
                            Start generation <span className="ml-2 text-lg leading-none">&rarr;</span>
                        </div>
                    </div>
                </button>

                {/* File Upload Button */}
                <button
                    onClick={() => setOpenModal2(true)}
                    className="group relative flex items-start gap-4 p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 bg-white hover:bg-gray-50/50 dark:border-gray-800 dark:bg-gray-900/50 dark:hover:bg-gray-800 text-left transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-transparent dark:from-indigo-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="w-14 h-14 shrink-0 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 flex items-center justify-center shadow-sm border border-indigo-100 dark:border-indigo-900/30 group-hover:scale-110 transition-transform duration-300 relative z-10">
                        <IoIosDocument size={26} />
                    </div>
                    <div className="flex flex-col relative z-10 w-full pt-1">
                        <span className="text-lg font-bold text-gray-900 dark:text-white mb-1">Upload Document</span>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 leading-relaxed">Upload PDF, Word, or Excel to extract study notes.</span>
                        
                        <div className="mt-4 flex items-center text-indigo-600 dark:text-indigo-400 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0">
                            Start generation <span className="ml-2 text-lg leading-none">&rarr;</span>
                        </div>
                    </div>
                </button>
            </div>

            {/* YouTube Modal */}
            <Modal isOpen={openModal1} onClose={closeModal1} className="max-w-[600px] w-full mx-4 rounded-3xl p-0 overflow-hidden shadow-2xl">
                <div className="no-scrollbar relative w-full overflow-y-auto bg-white dark:bg-gray-900">
                    <div className="p-8 md:p-10 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
                        <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/30 text-red-500 flex items-center justify-center mb-6 shadow-sm border border-red-200 dark:border-red-800">
                            <FaYoutube size={24} />
                        </div>
                        <h4 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                            Generate from YouTube
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-sm">
                            Paste the URL of any educational YouTube video below and our AI will automatically extract a transcript and build a quiz.
                        </p>
                    </div>
                    <div className="p-8 md:p-10">
                        <form onSubmit={handleGenerateQuiz} className="flex flex-col gap-6">
                            <div>
                                <label htmlFor="link" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Video URL</label>
                                <input 
                                    type="url" 
                                    className="w-full px-5 py-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" 
                                    name="link" 
                                    id="link" 
                                    placeholder="https://www.youtube.com/watch?v=..." 
                                    required 
                                    value={link} 
                                    onChange={(e) => setLink(e.target.value)} 
                                />
                            </div>
                            <div className="flex items-center gap-3 pt-4">
                                <Button 
                                    disabled={quizLoading || !link.trim()} 
                                    size="lg" 
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-[0_8px_20px_rgb(79,70,229,0.24)] hover:shadow-[0_8px_20px_rgb(79,70,229,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed h-14 flex items-center justify-center"
                                >
                                    {quizLoading ? (
                                        <>
                                            <AiOutlineLoading3Quarters className="w-5 h-5 animate-spin mr-3" />
                                            Generating...
                                        </>
                                    ) : (
                                        "Generate Quiz"
                                    )}
                                </Button>
                                <Button size="lg" variant="outline" onClick={closeModal1} className="flex-1 h-14 rounded-xl font-medium border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </Modal>

            {/* File Upload Modal */}
            <Modal isOpen={openModal2} onClose={closeModal2} className="max-w-[600px] w-full mx-4 rounded-3xl p-0 overflow-hidden shadow-2xl">
                <div className="no-scrollbar relative w-full overflow-y-auto bg-white dark:bg-gray-900">
                    <div className="p-8 md:p-10 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-500 flex items-center justify-center mb-6 shadow-sm border border-indigo-200 dark:border-indigo-800">
                            <IoIosDocument size={24} />
                        </div>
                        <h4 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                            Generate from Document
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6 max-w-sm">
                            Upload a document and our AI will extract the core concepts into a set of questions and flashcards.
                        </p>
                        <div className="flex items-center gap-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Supported formats:</span>
                            <div className="flex gap-3">
                                <div className="p-1.5 rounded-lg bg-red-50 text-red-500 border border-red-100 flex shadow-sm"><FaFilePdf size={16} /></div>
                                <div className="p-1.5 rounded-lg bg-green-50 text-green-600 border border-green-100 flex shadow-sm"><FaFileExcel size={16} /></div>
                                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex shadow-sm"><FaFileWord size={16} /></div>
                            </div>
                        </div>
                    </div>
                    <div className="p-8 md:p-10">
                        <form onSubmit={handleFile} className="flex flex-col gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Upload File</label>
                                <div className="mt-1 w-full rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 bg-gray-50 dark:bg-gray-800/50 transition-colors">
                                    <FileInput className="w-full min-h-[120px]" onChange={handleFileChange} />
                                </div>
                            </div>
                            <div className="flex items-center gap-3 pt-4">
                                <Button 
                                    disabled={quizLoading || !file} 
                                    size="lg" 
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-[0_8px_20px_rgb(79,70,229,0.24)] hover:shadow-[0_8px_20px_rgb(79,70,229,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed h-14 flex items-center justify-center"
                                >
                                    {quizLoading ? (
                                        <>
                                            <AiOutlineLoading3Quarters className="w-5 h-5 animate-spin mr-3" />
                                            Processing...
                                        </>
                                    ) : (
                                        "Generate Quiz"
                                    )}
                                </Button>
                                <Button size="lg" variant="outline" onClick={closeModal2} className="flex-1 h-14 rounded-xl font-medium border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
