import { useEffect, useRef, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { supabase } from "../../config/SupabaseConfig";
import { useParams } from "react-router";
import { FaPaperPlane } from "react-icons/fa";
import { CiSettings } from "react-icons/ci";
import { useAuth } from "../../context/AuthContext";
import YouTube from "react-youtube";

interface Transcript {
  transcribe_text: string;
}

interface Quiz {
  topic: string;
  source: string;
}

type MessageType = {
    id: number | string;
    role: "user" | "assistant";
    text: string;
    loading?: boolean;
};

export default function NotesTranscript() {
  const { id } = useParams<{ id: string }>();
  const [transcript, setTranscript] = useState<Transcript[]>([]);
  const [quizez, setQuizez] = useState<Quiz[]>([]);
  const { currentUser } = useAuth();

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [conversation, setConversation] = useState<any[]>([]);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
      const fetchConversation = async () => {
          const { data, error } = await supabase
              .from("conversations")
              .select()
              .eq("quiz_id", id)
              .limit(1);

          if (!error && data) setConversation(data);
      };

      fetchConversation();
  }, [id]);

  const conversationId = conversation[0]?.id;

  useEffect(() => {
      if (!conversationId) return;

      const fetchMessages = async () => {
          const { data, error } = await supabase
              .from("messages")
              .select()
              .eq("conversation_id", conversationId)
              .order("id", { ascending: true });

          if (!error && data) {
              setMessages(
                  data.map((m) => ({
                      id: m.id,
                      role: m.role,
                      text: m.text,
                  }))
              );
          }
      };

      fetchMessages();
  }, [conversationId]);

  useEffect(() => {
      if (!conversationId) return;

      const channel = supabase
          .channel("messages-realtime")
          .on(
              "postgres_changes",
              {
                  event: "INSERT",
                  schema: "public",
                  table: "messages",
                  filter: `conversation_id=eq.${conversationId}`,
              },
              (payload) => {
                  const newMsg = payload.new;

                  if (newMsg.role === "assistant") {
                      setMessages((prev) =>
                          prev.map((msg) =>
                              msg.loading
                                  ? {
                                        id: newMsg.id,
                                        role: "assistant",
                                        text: newMsg.text,
                                    }
                                  : msg
                          )
                      );
                  }
              }
          )
          .subscribe();

      return () => { 
          void supabase.removeChannel(channel);
      };
  }, [conversationId]);

  const handleSendMessage = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!message.trim()) return;

      const userMsg: MessageType = {
          id: Date.now(),
          role: "user",
          text: message.trim(),
      };

      const aiPlaceholder: MessageType = {
          id: "ai-loading",
          role: "assistant",
          text: "",
          loading: true,
      };

      setMessages((prev) => [...prev, userMsg, aiPlaceholder]);
      setMessage("");

      const formData = new FormData();
      formData.append("message", userMsg.text);
      formData.append("user_id", currentUser?.id || "");
      formData.append("quiz_id", id || "");

      await fetch(
          "https://n8n.ayakdev.web.id/webhook/905ef1d3-6db8-4a50-8787-d8e925c6a25e",
          {
              method: "POST",
              body: formData,
          }
      );
  };

  useEffect(() => {
    const fetchQuizez = async () => {
      const { data, error } = await supabase.from('quizez').select('topic, source').eq('id', id);
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

  const videoId = quizez[0]?.source.split('v=')[1];

  return (
    <>
      <PageMeta
        title="Notes Transcript - Quizora Learn"
        description="View your notes and chat with our AI-powered chatbot"
      />
      {quizez.map((text) =>
        <PageBreadcrumb pageTitle={text.topic} />
      )}
      <div className="flex h-screen">
          {/* Transcript Section */}
          <div className="w-1/2 p-4 border-r">
              {videoId && <YouTube videoId={videoId} />}
              <h1 className="text-2xl font-bold mb-4 mt-4">Transcript</h1>
              <div className="h-full overflow-y-auto">
                {transcript.map((text) => (
                  <p className="leading-8 text-md text-black dark:text-gray-400 sm:text-base">
                    {text.transcribe_text}
                  </p>
                ))}
              </div>
          </div>

          {/* Chatbot Section */}
          <div className="w-1/2 flex flex-col items-center px-4">
              <div className="text-center my-8">
                  <h1 className="text-3xl font-bold text-gray-800">
                      Good Morning, {currentUser?.user_metadata.full_name}
                  </h1>
                  <p>How can I assist you today?</p>
              </div>

              {/* CHAT WINDOW */}
              <div className="w-full max-w-3xl flex-1 overflow-y-auto rounded-xl p-4 space-y-3 bg-gray-50">
                  {messages.map((m) => (
                      <div
                          key={m.id}
                          className={
                              m.role === "user"
                                  ? "flex justify-start"
                                  : "flex justify-end"
                          }
                      >
                          <div
                              className={
                                  m.role === "user"
                                      ? "bg-blue-600 text-white px-4 py-2 rounded-xl max-w-xs"
                                      : "bg-gray-200 text-gray-900 px-4 py-2 rounded-xl max-w-xs"
                              }
                          >
                              {m.loading ? (
                                  <div className="flex gap-2">
                                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
                                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-150"></span>
                                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-300"></span>
                                  </div>
                              ) : (
                                  m.text
                              )}
                          </div>
                      </div>
                  ))}
                  <div ref={bottomRef} />
              </div>

              <form
                  onSubmit={handleSendMessage}
                  className="w-full max-w-3xl flex items-center gap-2 border bg-white rounded-full px-3 py-2 my-4"
              >
                  <button
                      type="button"
                      className="w-10 h-10 flex items-center justify-center bg-gray-200 rounded-full"
                  >
                      <CiSettings size={22} />
                  </button>

                  <input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 outline-none px-2"
                  />

                  <button
                      type="submit"
                      disabled={!message.trim()}
                      className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-full"
                  >
                      <FaPaperPlane />
                  </button>
              </form>
          </div>
      </div>
    </>
  );
}
