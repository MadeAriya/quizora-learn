import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from 'react';
import { FaFire } from 'react-icons/fa';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { supabase } from "../../config/SupabaseConfig";
import { useAuth } from '../../context/AuthContext';
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";

interface Quiz {
  id: string;
  topic: string;
}

interface Note {
  id:string;
  html: string;
  quiz_id: string;
}

export default function Notes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const editorRef = useRef<ClassicEditor | null>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const LICENSE_KEY = import.meta.env.VITE_CKEDITOR_LICENSE_KEY;

  useEffect(() => {
    const fetchData = async () => {
      const { data: quizData, error: quizError } = await supabase.from('quizez').select().eq('id', id).single();
      if (quizError) console.error(quizError.message);
      else setQuiz(quizData);

      const { data: noteData, error: noteError } = await supabase.from('notes').select().eq('quiz_id', id).maybeSingle();
      if (noteError) console.error(noteError.message);
      else setSelectedNote(noteData);
      
      setIsLoaded(true);
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`notes_changes_${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notes',
          filter: `quiz_id=eq.${id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setSelectedNote(payload.new as Note);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const handleGenerateNotes = async () => {
    if (!id || isGenerating) return;
    setIsGenerating(true);

    try {
      const { AxiosConfig } = await import('../../config/AxiosConfig');
      const response = await AxiosConfig.post('/generate/notes', {
        quiz_id: id,
        user_id: currentUser?.id || '',
      });

      if (response.data.success) {
        // Refetch the note from DB to get the full row with id
        const { data: noteData } = await supabase.from('notes').select().eq('quiz_id', id).maybeSingle();
        if (noteData) setSelectedNote(noteData);
      }
    } catch (error: any) {
      console.error('Notes generation failed:', error?.response?.data?.error || error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditorChange = () => {
    if (!editorRef.current) return;
    const newContent = editorRef.current.getData();
    if (!selectedNote) return;

    setSelectedNote((prev: Note | null) => (prev ? { ...prev, html: newContent } : null));

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(async () => {
      const { error } = await supabase
        .from('notes')
        .update({ html: newContent })
        .eq('id', selectedNote.id);

      if (error) console.error(error.message);
    }, 500);
  };

  return (
    <div>
      <PageMeta title="Notes Editor" description="Quizora Learn" />
      
      {quiz && (
        <div className="flex items-center justify-between flex-wrap gap-4 mt-4">
          <PageBreadcrumb pageTitle={quiz.topic} />
          <button 
            onClick={() => navigate(`/notes/${id}/doomscroll`)}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-indigo-600 hover:from-orange-600 hover:to-indigo-700 text-white px-5 py-2.5 rounded-full font-bold shadow-[0_4px_15px_rgba(249,115,22,0.4)] transition-all xl:mr-10 mb-6"
          >
            <FaFire className="text-yellow-300" /> Doomscroll Mode
          </button>
        </div>
      )}

      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        {!isLoaded ? (
          <p>Loading...</p>
        ) : selectedNote ? (
          <CKEditor
            editor={ClassicEditor}
            config={{
              licenseKey: LICENSE_KEY,
            }}
            data={selectedNote.html || ''}
            onReady={(editor) => {
              editorRef.current = editor;
            }}
            onChange={handleEditorChange}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Tidak ada catatan ditemukan</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm">Catatan belum dibuat untuk materi ini. Klik tombol di bawah untuk membuat catatan secara otomatis.</p>
            <button
              onClick={handleGenerateNotes}
              disabled={isGenerating}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold shadow-[0_4px_15px_rgba(79,70,229,0.3)] hover:shadow-[0_4px_15px_rgba(79,70,229,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <AiOutlineLoading3Quarters className="w-5 h-5 animate-spin" />
                  Membuat Catatan...
                </>
              ) : (
                'Buat Catatan'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}