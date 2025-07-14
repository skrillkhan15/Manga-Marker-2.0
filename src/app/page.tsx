import BookmarkManager from '@/components/BookmarkManager';
import { BookMarked } from 'lucide-react';

export default function Home() {
  return (
    <main className="container mx-auto p-4 md:p-8">
      <header className="flex items-center gap-3 mb-8">
        <BookMarked className="w-10 h-10 text-primary" />
        <h1 className="text-4xl font-bold tracking-tighter text-foreground">
          MangaMarks
        </h1>
      </header>
      <BookmarkManager />
    </main>
  );
}
