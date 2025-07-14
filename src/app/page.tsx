"use client";

import { useState, useEffect } from 'react';
import BookmarkManager from '@/components/BookmarkManager';
import { BookMarked, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useLocalStorage from '@/hooks/use-local-storage';

export default function Home() {
  const [theme, setTheme] = useLocalStorage('theme', 'dark');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <main className="container mx-auto p-4 md:p-8">
      <header className="flex items-center justify-between gap-3 mb-8">
        <div className="flex items-center gap-3">
          <BookMarked className="w-10 h-10 text-primary" />
          <h1 className="text-4xl font-bold tracking-tighter text-foreground">
            MangaMarks
          </h1>
        </div>
        <Button onClick={toggleTheme} variant="ghost" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </header>
      <BookmarkManager />
    </main>
  );
}
