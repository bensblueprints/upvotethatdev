import { useEffect } from 'react';

export const usePageTitle = (title: string) => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = `Dashboard - ${title}`;
    
    return () => {
      document.title = previousTitle;
    };
  }, [title]);
};

export default usePageTitle; 