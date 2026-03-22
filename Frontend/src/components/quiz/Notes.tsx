import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from 'react';
import { FaFire } from 'react-icons/fa';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { supabase } from "../../config/SupabaseConfig";
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
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const editorRef = useRef<ClassicEditor | null>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const LICENSE_KEY = import.meta.env.VITE_CKEDITOR_LICENSE_KEY;

  useEffect(() => {
    const fetchData = async () => {
      const { data: quizData, error: quizError } = await supabase.from('quizez').select().eq('id', id).single();
      if (quizError) console.error(quizError.message);
      else setQuiz(quizData);

      const { data: noteData, error: noteError } = await supabase.from('notes').select().eq('quiz_id', id).single();
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
          if (payload.eventType === 'UPDATE') {
            setSelectedNote(payload.new as Note);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

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
          <p>Tidak ada catatan ditemukan.</p>
        )}
      </div>
    </div>
  );
}