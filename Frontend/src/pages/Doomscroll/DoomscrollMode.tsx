import { useState, useEffect, useRef, useCallback } from 'react';
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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Track seen IDs to pass to backend
  const seenIdsRef = useRef<string[]>([]);

  // Touch swipe tracking
  const touchStartRef = useRef<number>(0);
  const touchDeltaRef = useRef<number>(0);
  const touchStartXRef = useRef<number>(0);
  const touchDeltaXRef = useRef<number>(0);
  
  const fetchNextItem = useCallback(async (currentSeenIds: string[], score: number) => {
    try {
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
  }, [currentUser?.id, id]);

  const loadInitialItems = useCallback(async () => {
    setLoading(true);
    const item1 = await fetchNextItem(seenIdsRef.current, confidenceScore);
    if (item1) {
      seenIdsRef.current.push(item1.id);
      const item2 = await fetchNextItem(seenIdsRef.current, confidenceScore);
      if (item2) seenIdsRef.current.push(item2.id);
      
      setItems([item1, ...(item2 ? [item2] : [])]);
    }
    setLoading(false);
  }, [fetchNextItem, confidenceScore]);

  useEffect(() => {
    if (id) {
      loadInitialItems();
    }
  }, [id, loadInitialItems]);

  // Buffer mechanic: always try to keep 2 items ahead
  useEffect(() => {
    const prefetch = async () => {
      if (items.length > 0 && currentIndex >= items.length - 2) {
        const next = await fetchNextItem(seenIdsRef.current, confidenceScore);
        if (next) {
          seenIdsRef.current.push(next.id);
          setItems(prev => [...prev, next]);
        }
      }
    };
    prefetch();
  }, [currentIndex, items.length, fetchNextItem, confidenceScore]);

  const handleNext = useCallback((performanceDelta: number = 0) => {
    if (isTransitioning) return;

    setConfidenceScore(prev => Math.min(100, Math.max(0, prev + performanceDelta)));
    
    // Send feedback asynchronously
    if (items[currentIndex]) {
       axios.post(`${API_URL}/api/learning/feedback`, {
          user_id: currentUser?.id,
          quiz_id: id,
          item_id: items[currentIndex].id,
          performanceDelta
       }).catch(() => {});
    }

    // Animate transition
    if (currentIndex < items.length - 1) {
      setIsTransitioning(true);
      setCurrentIndex(prev => prev + 1);
      setTimeout(() => setIsTransitioning(false), 550);
    }
  }, [isTransitioning, items, currentIndex, currentUser?.id, id]);

  // Touch swipe handler for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientY;
    touchStartXRef.current = e.touches[0].clientX;
    touchDeltaRef.current = 0;
    touchDeltaXRef.current = 0;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchDeltaRef.current = touchStartRef.current - e.touches[0].clientY;
    touchDeltaXRef.current = Math.abs(touchStartXRef.current - e.touches[0].clientX);
  }, []);

  const handleTouchEnd = useCallback(() => {
    // Only swipe up if vertical delta > 100px and more vertical than horizontal
    if (touchDeltaRef.current > 100 && touchDeltaRef.current > touchDeltaXRef.current * 1.5) {
      handleNext(0);
    }
    touchDeltaRef.current = 0;
    touchDeltaXRef.current = 0;
  }, [handleNext]);

  // Keyboard navigation for desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        handleNext(0);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext]);

  if (loading && items.length === 0) {
    return (
      <div className="w-full h-dvh bg-gray-50 dark:bg-[#0b0e14] flex flex-col items-center justify-center text-gray-900 dark:text-white">
        <AiOutlineLoading3Quarters className="animate-spin text-indigo-500 text-4xl" />
        <p className="mt-4 font-semibold text-gray-500 dark:text-gray-400 tracking-widest uppercase text-xs sm:text-sm">Loading Infinite Feed...</p>
      </div>
    );
  }

  if (items.length === 0) {
     return (
      <div className="w-full h-dvh bg-gray-50 dark:bg-[#0b0e14] flex flex-col items-center justify-center text-gray-900 dark:text-white px-6">
        <p className="mb-4 text-base sm:text-lg">No content available for this topic.</p>
        <button onClick={() => navigate(-1)} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors">Go Back</button>
      </div>
     );
  }

  return (
    <div 
      className="w-full h-dvh bg-gray-100 dark:bg-black overflow-hidden relative flex justify-center" 
      style={{ fontFamily: "'Inter', sans-serif" }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <PageMeta title="Doomscroll Mode - Quizora Learn" description="Infinite AI learning feed" />

      {/* Main Container — fills entire screen at all breakpoints */}
      <div className="w-full h-full relative bg-white dark:bg-[#0f1219] overflow-hidden">
        
        {/* Top overlay navigation */}
        <div className="absolute top-0 left-0 w-full px-4 py-3 sm:px-6 sm:py-5 lg:px-10 lg:py-6 z-50 flex items-center justify-between pointer-events-none">
          <button 
            onClick={() => navigate('/notes')} 
            className="w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-gray-800 dark:text-white transition-all pointer-events-auto border border-gray-200 dark:border-white/10 shadow-lg active:scale-95"
          >
            <FaArrowLeft size={12} className="sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4" />
          </button>
          
          <div className="pointer-events-auto">
            <div className="bg-indigo-600/90 backdrop-blur text-white text-[10px] sm:text-xs lg:text-sm font-bold px-3 sm:px-4 lg:px-5 py-1 sm:py-1.5 rounded-full flex items-center gap-1.5 shadow-md">
              🔥 Streak: {currentIndex + 1}
            </div>
          </div>
        </div>

        {/* Confidence progress bar */}
        <div className="absolute top-0 left-0 w-full h-0.5 z-50 bg-gray-200 dark:bg-white/5">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700 ease-out" 
            style={{ width: `${confidenceScore}%` }} 
          />
        </div>

        {/* Feed container: translateY-based vertical scroll */}
        <div 
          className="w-full h-dvh flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
          style={{ transform: `translateY(-${currentIndex * 100}dvh)` }}
        >
          {items.map((item, index) => {
            const isActive = index === currentIndex;
            return (
              <div 
                key={`${item.id}-${index}`} 
                className="w-full h-dvh flex-shrink-0 flex items-center justify-center px-2 py-1.5 sm:px-4 sm:py-3 lg:px-8 lg:py-4"
              >
                 {/* Card wrapper — fills the screen with responsive rounding */}
                 <div className={`
                   w-full h-full max-h-[calc(100dvh-0.75rem)] sm:max-h-[calc(100dvh-1.5rem)] lg:max-h-[calc(100dvh-2rem)]
                   transition-all duration-500 
                   rounded-xl sm:rounded-2xl lg:rounded-3xl 
                   overflow-y-auto
                   ${isActive 
                     ? 'scale-100 opacity-100 shadow-[0_4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_0_40px_rgba(79,70,229,0.15)]' 
                     : 'scale-[0.95] opacity-30 blur-[2px]'}
                 `}>
                   <LearningCard 
                     isActive={isActive} 
                     onNext={handleNext}
                   >
                     {item.type === 'quiz' && (
                       <QuizCard content={item.content} onComplete={(isCorrect) => handleNext(isCorrect ? 10 : -10)} />
                     )}
                     {item.type === 'flashcard' && (
                       <FlashcardCard content={item.content} onComplete={(confidenceStr: string) => {
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
