import PageBreadcrumb from "../common/PageBreadCrumb";
import PageMeta from "../common/PageMeta";
import Button from "../ui/button/Button";
import { FaFolderPlus, FaYoutube, FaFilePdf, FaFolder, FaArrowLeft, FaTrash } from "react-icons/fa";
import { IoMdMore } from "react-icons/io";
import { Modal } from "../ui/modal";
import { useEffect, useState } from "react";
import {supabase} from "../../config/SupabaseConfig";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";

interface Quiz {
  id: number;
  topic: string;
  source?: string;
}

interface Folder {
  id: string;
  name: string;
}

export default function NotesList() {
  const { currentUser } = useAuth();
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [openModal1, setOpenModal1] = useState<boolean>(false);
  const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null);
  const [quizez, setQuizez] = useState<Quiz[]>([]);

  // Folder state persistence through localStorage (scoped to user)
  const folderKey = `quizora_folders_${currentUser?.id || 'anon'}`;
  const noteFolderKey = `quizora_note_folders_${currentUser?.id || 'anon'}`;

  const [folders, setFolders] = useState<Folder[]>(() => {
    try {
      const stored = localStorage.getItem(folderKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [noteFolderMap, setNoteFolderMap] = useState<Record<number, string>>(() => {
    try {
      const stored = localStorage.getItem(noteFolderKey);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");

  const closeModal = () => {
    setOpenModal(false);
    setNewFolderName("");
  };

  const closeModal1 = () => {
    setOpenModal1(false);
    setSelectedQuizId(null);
  };

  useEffect(() => {
    if (!currentUser?.id) return;
    const fetchQuizez = async () => {
      const { data, error } = await supabase.from("quizez").select().eq("user_id", currentUser.id);
      if (error) {
        console.error("Gagal fetch data:", error.message);
      } else if (data) {
        setQuizez(data);
      }
    };
    fetchQuizez();
  }, [currentUser?.id]);

  // Automatically save folder structures to memory on every change
  useEffect(() => {
    localStorage.setItem(folderKey, JSON.stringify(folders));
  }, [folders, folderKey]);

  useEffect(() => {
    localStorage.setItem(noteFolderKey, JSON.stringify(noteFolderMap));
  }, [noteFolderMap, noteFolderKey]);

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    const newFolder = { id: Date.now().toString(), name: newFolderName };
    setFolders([...folders, newFolder]);
    closeModal();
  };

  const handleDeleteFolder = (folderId: string) => {
    if (!window.confirm("Are you sure you want to delete this folder? Notes inside will be moved back to Root.")) return;
    
    setNoteFolderMap(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(key => {
         if (updated[Number(key)] === folderId) delete updated[Number(key)];
      });
      return updated;
    });
    setFolders(prev => prev.filter(f => f.id !== folderId));
  };

  const handleMoveNote = (noteId: number, folderId: string) => {
    setNoteFolderMap(prev => {
      const updated = { ...prev };
      if (!folderId) {
         delete updated[noteId];
      } else {
         updated[noteId] = folderId;
      }
      return updated;
    });
  };

  const handleQuizDelete = async (id: number) => {
    const { error } = await supabase.from("quizez").delete().eq("id", id);
    if (error) {
      console.error("Gagal delete:", error.message);
    } else {
      setQuizez((prev) => prev.filter((quiz) => quiz.id !== id));
      // Discard from folder maps
      setNoteFolderMap(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
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

  // Filter items for current view exactly
  const visibleQuizez = quizez.filter(quiz => 
    currentFolderId === null 
      ? !noteFolderMap[quiz.id] 
      : noteFolderMap[quiz.id] === currentFolderId 
  );

  const currentFolder = folders.find(f => f.id === currentFolderId);

  return (
    <div>
      <PageMeta
        title="Notes Manager - Quizora Learn"
        description="Manage your notes"
      />
      <PageBreadcrumb pageTitle={currentFolder ? `Notes Folder / ${currentFolder.name}` : "Notes Folder"} />
      
      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-4 sm:px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 dark:border-gray-800 pb-6 mb-6">
          <div className="flex items-center gap-4">
            {currentFolderId !== null && (
              <button 
                onClick={() => setCurrentFolderId(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors flex items-center justify-center border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-900"
                title="Back to Root"
              >
                <FaArrowLeft className="text-gray-600 dark:text-gray-400" />
              </button>
            )}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {currentFolder ? currentFolder.name : "My Notes"}
            </h2>
          </div>
          
          <Button
            onClick={() => setOpenModal(true)}
            size="sm"
            variant="primary"
            startIcon={<FaFolderPlus className="size-5" />}
          >
            {currentFolderId !== null ? "New Sub-Folder (Not Supported)" : "New Folder"}
          </Button>
        </div>

        <div className="max-w-full flex flex-col gap-4">
          {/* Render Folders (only in root) */}
          {currentFolderId === null && folders.map((folder) => (
            <div 
              key={folder.id}
              className="flex justify-between items-center mt-2 p-4 sm:p-5 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/50 hover:bg-indigo-50 dark:bg-indigo-900/10 dark:hover:bg-indigo-900/20 transition-all shadow-sm hover:shadow-md group cursor-pointer"
              onClick={() => setCurrentFolderId(folder.id)}
            >
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-800/80 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-300">
                  <FaFolder size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-0.5">{folder.name}</h3>
                  <p className="text-sm font-medium text-gray-500">
                    {quizez.filter(q => noteFolderMap[q.id] === folder.id).length} notes inside
                  </p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteFolder(folder.id);
                }}
                className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all sm:opacity-0 group-hover:opacity-100 hover:scale-105"
                title="Delete Folder"
              >
                <FaTrash size={20} />
              </button>
            </div>
          ))}

          {/* Empty States */}
          {visibleQuizez.length === 0 && (currentFolderId !== null || folders.length === 0) && (
            <div className="py-16 flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl mt-4 bg-gray-50/50 dark:bg-gray-900/20">
              <FaFilePdf className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">No notes here</h3>
              <p className="text-gray-500 mt-2 max-w-sm">Generate a new quiz using the generator dashboard or move existing notes into this folder.</p>
            </div>
          )}

          {/* Render Notes */}
          {visibleQuizez.map((quiz) => (
            <Link
              to={`/notes/${quiz.id}/quiz`}
              key={quiz.id}
              className="flex items-center justify-between mt-2 p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-white/[0.05] bg-white hover:bg-gray-50 dark:bg-white/[0.02] dark:hover:bg-white/[0.05] transition-all shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
            >
              <div className="flex items-center gap-5 flex-1 min-w-0">
                <div className="w-14 h-14 shrink-0 rounded-xl flex items-center justify-center bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                  {quiz.source?.includes("youtu.be") || quiz.source?.includes("youtube.com") ? (
                    <FaYoutube size={28} className="text-red-500" />
                  ) : (
                    <FaFilePdf size={28} className="text-red-500" />
                  )}
                </div>
                <div className="flex flex-col min-w-0 pr-4">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">{quiz.topic}</h1>
                  <p className="text-sm font-medium text-gray-500 truncate mt-1">{quiz.source || "Uploaded Document"}</p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedQuizId(quiz.id);
                  setOpenModal1(true);
                }}
                className="p-3 shrink-0 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all self-center border border-transparent hover:border-indigo-100"
              >
                <IoMdMore size={28} />
              </button>
            </Link>
          ))}
        </div>
      </div>

      {/* Note Settings Modal */}
      <Modal
        isOpen={openModal1}
        onClose={closeModal1}
        className="max-w-[500px] m-4"
      >
        <div className="no-scrollbar relative w-full max-w-[500px] overflow-y-auto rounded-[2rem] bg-white p-6 dark:bg-gray-900 lg:p-8 shadow-2xl border border-gray-100 dark:border-gray-800">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-2xl font-extrabold text-gray-900 dark:text-white">
              Note Settings
            </h4>
            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl flex items-center justify-center">
               <IoMdMore size={24} />
            </div>
          </div>
          {selectedQuiz && (
            <div className="space-y-6">
              <div className="form-group grid">
                <label htmlFor="topic" className="text-sm font-bold tracking-wide uppercase text-gray-500 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-semibold focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-inner"
                  name="topic"
                  id="topic"
                  placeholder="Insert Title"
                  value={selectedQuiz.topic}
                  onChange={(e) =>
                    handleQuizUpdate(selectedQuiz.id, e.target.value)
                  }
                />
              </div>

              <div className="form-group grid relative">
                <label htmlFor="folder" className="text-sm font-bold tracking-wide uppercase text-gray-500 mb-2 mt-4">
                  Move to Folder
                </label>
                <select
                  id="folder"
                  value={noteFolderMap[selectedQuiz.id] || ""}
                  onChange={(e) => handleMoveNote(selectedQuiz.id, e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-semibold focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-inner appearance-none cursor-pointer"
                >
                  <option value="">📱 Root (No Folder)</option>
                  {folders.map(f => (
                    <option key={f.id} value={f.id}>📁 {f.name}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center mt-12 px-4 text-gray-700 dark:text-gray-300">
                   <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>

              <div className="pt-6 mt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  onClick={() => {
                    if (selectedQuizId) {
                      if (window.confirm("Are you sure you want to delete this note definitively?")) {
                        handleQuizDelete(selectedQuizId);
                        setOpenModal1(false);
                      }
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold bg-white text-red-600 hover:bg-red-50 hover:text-red-700 transition-all border border-red-200 hover:border-red-300 shadow-[0_2px_10px_rgba(239,68,68,0.1)] hover:-translate-y-0.5"
                >
                  <FaTrash size={16} /> Delete Note completely
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* New Folder Modal */}
      <Modal
        isOpen={openModal}
        onClose={closeModal}
        className="max-w-[400px] m-4"
      >
        <div className="no-scrollbar relative w-full max-w-[400px] overflow-y-auto rounded-[2rem] bg-white p-6 dark:bg-gray-900 lg:p-8 shadow-2xl border border-gray-100 dark:border-gray-800">
          <div className="mb-8">
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
               <FaFolderPlus size={24} />
            </div>
            <h4 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">
              Create Folder
            </h4>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Organize your notes into specific categories.
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="form-group grid">
               <input
                 type="text"
                 autoFocus
                 className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-semibold focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-inner"
                 placeholder="e.g. Biology 101"
                 value={newFolderName}
                 onChange={e => setNewFolderName(e.target.value)}
                 onKeyDown={e => {
                   if (e.key === 'Enter') handleCreateFolder();
                 }}
               />
            </div>
            
            <div className="flex gap-3 pt-4">
               <button 
                  onClick={closeModal}
                  className="flex-1 py-3 px-4 rounded-xl font-bold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm"
               >
                 Cancel
               </button>
               <button 
                  onClick={handleCreateFolder}
                  disabled={!newFolderName.trim()}
                  className="flex-1 py-3 px-4 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-[0_4px_14px_0_rgb(79,70,229,0.39)] disabled:opacity-50 disabled:hover:-translate-y-0 hover:-translate-y-0.5"
               >
                 Create
               </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
