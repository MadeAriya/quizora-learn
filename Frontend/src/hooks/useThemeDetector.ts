    import { useState, useEffect } from 'react';

    const useThemeDetector = () => {
      const getCurrentTheme = () => window.matchMedia('(prefers-color-scheme: dark)').matches;
      const [isDarkTheme, setIsDarkTheme] = useState(getCurrentTheme());

      useEffect(() => {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent) => {
          setIsDarkTheme(e.matches);
        };

        mq.addEventListener('change', handleChange);
        return () => mq.removeEventListener('change', handleChange);
      }, []);

      return isDarkTheme;
    };

    export default useThemeDetector;