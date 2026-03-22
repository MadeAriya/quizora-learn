import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import PageMeta from '../../components/common/PageMeta';
import LearningCard from '../../components/doomscroll/LearningCard';
import QuizCard from '../../components/doomscroll/QuizCard';
import FlashcardCard from '../../components/doomscroll/FlashcardCard';
import ExplanationCard from '../../components/doomscroll/ExplanationCard';
import { useAuth } from '../../context/AuthContext';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { FaArrowLeft } from 'react-icons/fa';

interface DoomscrollItem {
  id: string;
  type: 'quiz' | 'flashcard' | 'explanation';
  content: any;
  difficulty: string;
  topic: string;
}

export default function DoomscrollMode() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [items, setItems] = useState<DoomscrollItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [confidenceScore, setConfidenceScore] = useState(50);
  
  // Track seen IDs to pass to backend
  const seenIdsRef = useRef<string[]>([]);
  
  const fetchNextItem = async (currentSeenIds: string[], score: number) => {
    try {
      // Assuming backend is running on port 3001, we use localhost directly or from env
      let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      if (API_URL === 'your-api-url') API_URL = 'http://localhost:3001';
      const response = await axios.post(`${API_URL}/api/learning/generate`, {
        user_id: currentUser?.id,
        quiz_id: id,
        confidenceScore: score,
        seenIds: currentSeenIds
      });
      
      if (response.data && response.data.item) {
        return response.data.item;
      }
      return null;
    } catch (err) {
      console.error('Error fetching next doomscroll item:', err);
      return null;
    }
  };

  const loadInitialItems = async () => {
    setLoading(true);
    const item1 = await fetchNextItem(seenIdsRef.current, confidenceScore);
    if (item1) {
      seenIdsRef.current.push(item1.id);
      const item2 = await fetchNextItem(seenIdsRef.current, confidenceScore);
      if (item2) seenIdsRef.current.push(item2.id);
      
      setItems([item1, ...(item2 ? [item2] : [])]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (id) {
      loadInitialItems();
    }
    // eslint-disable-next-line
  }, [id]);

  // Buffer mechanic: always try to keep 2 items ahead
  useEffect(() => {
    const prefetch = async () => {
      // If we are at the second to last item, fetch another
      if (items.length > 0 && currentIndex >= items.length - 2) {
        const next = await fetchNextItem(seenIdsRef.current, confidenceScore);
        if (next) {
          seenIdsRef.current.push(next.id);
          setItems(prev => [...prev, next]);
        }
      }
    };
    prefetch();
    // eslint-disable-next-line
  }, [currentIndex, items.length]);

  const handleNext = (performanceDelta: number = 0) => {
    // Modify confidence score based on performance
    // Positive delta mostly for correct answers, negative for struggles
    setConfidenceScore(prev => Math.min(100, Math.max(0, prev + performanceDelta)));
    
    // Send feedback asynchronously
    if (items[currentIndex]) {
       let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
       if (API_URL === 'your-api-url') API_URL = 'http://localhost:3001';
       axios.post(`${API_URL}/api/learning/feedback`, {
          user_id: currentUser?.id,
          quiz_id: id,
          item_id: items[currentIndex].id,
          performanceDelta
       }).catch(() => {});
    }

    // Scroll to next
    if (currentIndex < items.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  if (loading && items.length === 0) {
    return (
      <div className="w-full h-screen bg-gray-50 dark:bg-[#0b0e14] flex flex-col items-center justify-center text-gray-900 dark:text-white">
        <AiOutlineLoading3Quarters className="animate-spin text-indigo-500 text-4xl" />
        <p className="mt-4 font-semibold text-gray-500 dark:text-gray-400 tracking-widest uppercase">Loading Infinite Feed...</p>
      </div>
    );
  }

  if (items.length === 0) {
     return (
      <div className="w-full h-screen bg-gray-50 dark:bg-[#0b0e14] flex flex-col items-center justify-center text-gray-900 dark:text-white">
        <p className="mb-4">No content available for this topic.</p>
        <button onClick={() => navigate(-1)} className="px-6 py-2 bg-indigo-600 text-white rounded-lg">Go Back</button>
      </div>
     );
  }

  return (
    <div className="w-full h-screen bg-gray-100 dark:bg-black overflow-hidden relative flex justify-center" style={{ fontFamily: "'Inter', sans-serif" }}>
      <PageMeta title="Doomscroll Mode - Quizora Learn" description="Infinite AI learning feed" />

      {/* Main Container - restricts width on desktop to mimic mobile view */}
      <div className="w-full max-w-md h-full relative bg-white dark:bg-[#0f1219] shadow-2xl sm:shadow-[0_0_60px_rgba(0,0,0,0.1)] dark:sm:shadow-[0_0_60px_rgba(0,0,0,0.5)] overflow-hidden">
        
        {/* Top overlay navigation */}
        <div className="absolute top-0 left-0 w-full p-6 z-50 flex items-center justify-between pointer-events-none">
          <button 
            onClick={() => navigate('/notes')} 
            className="w-10 h-10 bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-gray-800 dark:text-white transition-all pointer-events-auto border border-gray-200 dark:border-white/10 shadow-lg"
          >
            <FaArrowLeft size={14} />
          </button>
          
          <div className="flex flex-col items-end shadow-sm pointer-events-auto">
            <div className="bg-indigo-600/90 backdrop-blur text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-2 shadow-md">
              🔥 Streak: {currentIndex + 1}
            </div>
          </div>
        </div>

        {/* Feed container: maps the items and uses translate-y to simulate TikTok scroll */}
        <div 
          className="w-full h-[100vh] flex flex-col transition-transform duration-500 ease-in-out"
          style={{ transform: `translateY(-${currentIndex * 100}vh)` }}
        >
          {items.map((item, index) => {
            const isActive = index === currentIndex;
            return (
              <div key={`${item.id}-${index}`} className="w-full h-[100vh] flex-shrink-0 flex items-center justify-center p-3 sm:p-4">
                 {/* Wrapper that handles scaling effect for inactive cards */}
                 <div className={`w-full h-[85vh] transition-all duration-500 rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden ${isActive ? 'scale-100 opacity-100 shadow-[0_10px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_0_50px_rgba(79,70,229,0.2)]' : 'scale-90 opacity-40 blur-[2px]'}`}>
                  <LearningCard 
                    isActive={isActive} 
                    onNext={handleNext}
                  >
                    {item.type === 'quiz' && (
                      <QuizCard content={item.content} onComplete={(isCorrect) => handleNext(isCorrect ? 10 : -10)} />
                    )}
                    {item.type === 'flashcard' && (
                      <FlashcardCard content={item.content} onComplete={(confidenceStr: string) => {
                         // e.g. "easy" -> +10, "hard" -> -10
                         const delta = confidenceStr === 'easy' ? 10 : confidenceStr === 'hard' ? -10 : 0;
                         handleNext(delta);
                      }} />
                    )}
                    {item.type === 'explanation' && (
                      <ExplanationCard content={item.content} onComplete={() => handleNext(5)} />
                    )}
                  </LearningCard>
               </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
