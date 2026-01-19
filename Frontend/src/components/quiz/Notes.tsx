import { useParams } from "react-router";
import { useState, useEffect } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { supabase } from "../../config/SupabaseConfig";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";

export default function Notes() {
  const { id } = useParams<{ id: string }>();
  const [quizez, setQuizez] = useState<any[]>([]);
  const [selectedNote, setSelectedNote] = useState<any | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const LICENSE_KEY =
    'eyJhbGciOiJFUzI1NiJ9.eyJleHAiOjE3NjEyNjM5OTksImp0aSI6ImQ0MzNhMjc4LTIwNGEtNGU1Yi04Y2IzLTAzMTZhZTM3YjllMyIsInVzYWdlRW5kcGpbnQiOiJodHRwczovL3Byb3h5LWV2ZW50LmNrZWRpdG9yLmNvbSIsImRpc3RyaWJ1dGlvbkNoYW5uZWwiOlsiY2xvdWQiLCJkcnVwYWwiLCJzaCJdLCJ3aGl0ZUxhYmVsIjp0cnVlLCJsaWNlbnNlVHlwZSI6InRyaWFsIiwiZmVhdHVyZXMiOlsiKiJdLCJ2YyI6IjIyZGFhNThlIn0.mNr2T4lv-j5FoMaGvzL_wqb0alNopx8nqNXcuWnurdMyTKV5kwTJ2P9aMJT7U6ckuJn71vjzZGhaE2EucCClNg';

  useEffect(() => {
    const fetchQuiz = async () => {
      const { data, error } = await supabase.from('quizez').select().eq('id', id).single();
      if (error) console.error(error.message);
      else setQuizez([data]);
    };
    fetchQuiz();
  }, [id]);

  useEffect(() => {
    const fetchNotes = async () => {
      const { data, error } = await supabase.from('notes').select().eq('quiz_id', id).single();
      if (error) console.error(error.message);
      else setSelectedNote(data);
      setIsLoaded(true);
    };
    fetchNotes();
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
            setSelectedNote(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const handleEditorChange = async (_event: any, editor: any) => {
    const newContent = editor.getData();
    if (!selectedNote) return;

    setSelectedNote((prev: any) => ({ ...prev, html: newContent }));

    const { error } = await supabase
      .from('notes')
      .update({ html: newContent })
      .eq('id', selectedNote.id);

    if (error) console.error(error.message);
  };

  return (
    <div>
      <PageMeta title="Notes Editor" description="Quizora Learn" />
      {quizez.map(quiz => <PageBreadcrumb key={quiz.id} pageTitle={quiz.topic} />)}
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
            onChange={handleEditorChange}
          />
        ) : (
          <p>Tidak ada catatan ditemukan.</p>
        )}
      </div>
    </div>
  );
}