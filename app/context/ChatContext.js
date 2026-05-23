'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

const ChatContext = createContext();

export function ChatContextProvider({ children }) {
  const pathname = usePathname();
  const [currentPage, setCurrentPage] = useState('');
  const [currentDestination, setCurrentDestination] = useState('');
  const [currentItinerary, setCurrentItinerary] = useState('');

  useEffect(() => {
    setCurrentPage(pathname || '');
    if (pathname && pathname.startsWith('/destination/')) {
      setCurrentDestination(pathname.split('/').pop());
      setCurrentItinerary('');
    } else if (pathname && pathname.includes('/itinerary/')) {
      setCurrentItinerary(pathname.split('/').pop());
      setCurrentDestination('');
    } else {
      setCurrentDestination('');
      setCurrentItinerary('');
    }
  }, [pathname]);

  return (
    <ChatContext.Provider value={{ currentPage, currentDestination, currentItinerary }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  return useContext(ChatContext);
}
