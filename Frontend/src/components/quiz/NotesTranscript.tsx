import { useEffect, useRef, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { supabase } from "../../config/SupabaseConfig";
import { useParams } from "react-router";
import { FaPaperPlane, FaAlignJustify, FaRobot, FaUserCircle } from "react-icons/fa";
import { CiSettings } from "react-icons/ci";
import { useAuth } from "../../context/AuthContext";
import YouTube from "react-youtube";
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from "react-resizable-panels";

interface Transcript {
    transcribe_text: string;
}

interface Quiz {
    topic: string;
    source: string;
}

type MessageType = {
    id: string;
    role: "user" | "assistant";
    text: string;
    created_at?: string;
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
                .order("created_at", { ascending: true });

            if (!error && data) {
                setMessages(
                    data.map(m => ({
                        id: m.id.toString(),
                        role: m.role,
                        text: m.text,
                    })).sort((a, b) => (a.id) - parseInt(b.id))
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

                    if (newMsg.role !== "assistant" || !newMsg.ai_id) return;

                    setMessages(prev => {
                        const index = prev.findIndex(m => m.id === newMsg.ai_id);

                        if (index !== -1) {
                            const next = [...prev];
                            next[index] = {
                                id: newMsg.id.toString(),
                                role: "assistant",
                                text: newMsg.text,
                            };
                            return next;
                        }

                        return [
                            ...prev,
                            {
                                id: newMsg.id.toString(),
                                role: "assistant",
                                text: newMsg.text,
                            },
                        ];
                    });

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
            id: `user-${Date.now()}`,
            role: "user",
            text: message.trim(),
        };

        const aiId = `ai-${Date.now()}`;
        const aiPlaceholder: MessageType = {
            id: aiId,
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
        formData.append("ai_id", aiId);

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
    const videoSource = quizez[0]?.source;
    let videoId = null;
    if (videoSource) {
        if (videoSource.includes('youtu.be/')) {
            videoId = videoSource.split('youtu.be/')[1]?.split("?")[0];
        } else if (videoSource.includes('watch?v=')) {
            videoId = videoSource.split('v=')[1]?.split("&")[0];
        }
    }

    const opts = {
    height: "360",
    width: "640",
    playerVars: {
        autoplay: 0,
    },
    };
    return (
        <div className="h-[calc(100vh-80px)] md:h-screen flex flex-col bg-gray-50 dark:bg-gray-900 font-sans -mx-4 sm:-mx-6 lg:-mx-8 lg:-mt-4 relative z-0">
            <PageMeta
                title="Notes Transcript - Quizora Learn"
                description="View your notes and chat with our AI-powered chatbot"
            />
            {/* Minimal Header for Breadcrumb */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white/50 dark:bg-gray-900/50 backdrop-blur-md sticky top-0 z-10 shrink-0">
                <div className="flex items-center gap-3">
                   {quizez.map((text, idx) =>
                       <div key={idx} className="font-semibold text-gray-900 dark:text-white text-lg tracking-tight flex items-center gap-2">
                           <span className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center text-sm shadow-sm border border-indigo-100 dark:border-indigo-800">
                               <FaAlignJustify />
                           </span>
                           {text.topic}
                       </div>
                   )}
                </div>
            </div>

            <div className="flex-1 overflow-hidden relative">
                <PanelGroup orientation="horizontal" className="h-full w-full">
                    {/* Left Panel: Transcript & Video */}
                    <Panel defaultSize={50} minSize={30} className="flex flex-col h-full bg-gray-50/50 dark:bg-gray-900/20 relative z-0">
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10">
                            <div className="max-w-3xl mx-auto">
                                {videoId && (
                                    <div className="w-full rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100 dark:border-gray-800 mb-8 aspect-video bg-black relative z-10">
                                        <YouTube videoId={videoId} opts={{ width: '100%', height: '100%', playerVars: { autoplay: 0 } }} className="w-full h-full" />
                                    </div>
                                )}
                                
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-2 h-6 bg-indigo-600 rounded-full"></div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Transcript</h2>
                                </div>
                                
                                <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800 relative z-10">
                                    {transcript.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                            <FaAlignJustify className="w-12 h-12 mb-4 opacity-20" />
                                            <p>No transcript available for this note.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {transcript.map((text, idx) => (
                                                <p key={idx} className="text-lg leading-relaxed text-gray-700 dark:text-gray-300">
                                                    {text.transcribe_text}
                                                </p>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Panel>

                    <PanelResizeHandle className="w-1.5 hover:w-2 bg-transparent hover:bg-indigo-500/20 active:bg-indigo-500/40 transition-all cursor-col-resize flex flex-col justify-center items-center group relative z-20">
                        <div className="h-12 w-1 bg-gray-200 dark:bg-gray-700 rounded-full group-hover:bg-indigo-400 transition-colors" />
                    </PanelResizeHandle>

                    {/* Right Panel: AI Chat */}
                    <Panel defaultSize={50} minSize={30} className="flex flex-col h-full bg-white dark:bg-gray-900 shadow-[-10px_0_30px_rgba(0,0,0,0.02)] relative z-20 border-l border-gray-100 dark:border-gray-800">
                        {/* Chat Header */}
                        <div className="h-16 px-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-200 dark:shadow-none">
                                    <FaRobot size={18} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">Quizora AI Guide</h3>
                                    <p className="text-xs text-green-500 font-medium flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Online
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Chat Messages */}
                        <div className="flex-1 overflow-y-auto p-6 scroll-smooth custom-scrollbar">
                            {messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center px-4 text-center animate-in fade-in duration-700">
                                    <div className="w-20 h-20 rounded-3xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 shadow-sm border border-indigo-100 dark:border-indigo-800">
                                        <FaRobot size={40} />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
                                        Good Morning, {currentUser?.user_metadata?.full_name?.split(' ')[0] || 'Learner'}!
                                    </h2>
                                    <p className="text-gray-500 dark:text-gray-400 max-w-sm leading-relaxed">
                                        I am your personal AI study assistant. Ask me to summarize the video, explain complex topics, or quiz you on specific points.
                                    </p>
                                    <div className="mt-8 flex flex-wrap justify-center gap-2">
                                        <button onClick={() => setMessage("Summarize the main points of this video.")} className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-sm">
                                            Summarize this
                                        </button>
                                        <button onClick={() => setMessage("What are the key takeaways?")} className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-sm">
                                            Key Takeaways
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {messages.map((m) => (
                                        <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                                            <div className={`flex gap-3 max-w-[85%] ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                                                {/* Avatar */}
                                                <div className="shrink-0">
                                                    {m.role === "user" ? (
                                                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400">
                                                            <FaUserCircle size={20} />
                                                        </div>
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-sm">
                                                            <FaRobot size={14} />
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {/* Bubble */}
                                                <div className={`p-4 rounded-2xl ${
                                                    m.role === "user" 
                                                        ? "bg-indigo-600 text-white rounded-tr-sm shadow-sm" 
                                                        : "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-sm shadow-sm"
                                                    }`}
                                                >
                                                    {m.loading ? (
                                                        <div className="flex items-center gap-1.5 h-6 px-2">
                                                            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                                                            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                                                            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                                                        </div>
                                                    ) : (
                                                        <p className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">{m.text}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={bottomRef} className="h-1" />
                                </div>
                            )}
                        </div>

                        {/* Chat Input Container */}
                        <div className="p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-t border-gray-100 dark:border-gray-800 shrink-0">
                            <form
                                onSubmit={handleSendMessage}
                                className="relative flex items-center max-w-4xl mx-auto"
                            >
                                <button
                                    type="button"
                                    className="absolute left-3 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                    title="Settings"
                                >
                                    <CiSettings size={24} />
                                </button>

                                <input
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Ask anything about your notes..."
                                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-full pl-12 pr-14 py-4 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-inner dark:shadow-none placeholder-gray-400"
                                />

                                <button
                                    type="submit"
                                    disabled={!message.trim()}
                                    className="absolute right-2 w-10 h-10 flex items-center justify-center bg-indigo-600 text-white rounded-full hover:bg-indigo-700 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed transition-all shadow-sm"
                                >
                                    <FaPaperPlane size={14} className="ml-1" />
                                </button>
                            </form>
                            <p className="text-center text-[11px] text-gray-400 font-medium mt-3">
                                Quizora AI can make mistakes. Consider verifying important information.
                            </p>
                        </div>
                    </Panel>
                </PanelGroup>
            </div>
        </div>
    );
}
