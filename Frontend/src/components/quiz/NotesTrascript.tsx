import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { supabase } from "../../config/SupabaseConfig";
import { useParams } from "react-router";

export default function Blank() {
  const { id } = useParams<{ id: string }>();
  const [transcript, setTranscript] = useState<any[]>([]);
  const [quizez, setQuizez] = useState<any[]>([]);

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

  useEffect(() => {
    const fetchTranscript = async () => {
      const { data, error } = await supabase.from('transcript').select().eq('quiz_id', id);
      if (error) {
        console.error("Gagal fetch data:", error.message);
      } else if (data) {
        setTranscript(data);
      }
    };
    fetchTranscript();
  }, [id]);

  console.log(transcript)
  return (
    <div>
      <PageMeta
        title="React.js Blank Dashboard | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Blank Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      {quizez.map((text) =>
        <PageBreadcrumb pageTitle={text.topic} />
      )}
      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <div className="w-full">
          {transcript.map((text) => (
            <p className="leading-8 text-md text-black dark:text-gray-400 sm:text-base">
              {text.transcribe_text}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
