"use client";
import type { Bookmark } from "@/types";
import BookmarkCard from "./BookmarkCard";
import { BookOpenCheck, SearchX } from "lucide-react";

interface BookmarkListProps {
  bookmarks: Bookmark[];
  onDelete: (id: string) => void;
  searchTerm: string;
}

export default function BookmarkList({ bookmarks, onDelete, searchTerm }: BookmarkListProps) {
  if (bookmarks.length === 0) {
    if (searchTerm) {
      return (
        <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg h-full">
          <SearchX className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">No Results Found</h2>
          <p className="text-muted-foreground">No bookmarks match your search for "{searchTerm}".</p>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg h-full">
        <BookOpenCheck className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">No Bookmarks Yet</h2>
        <p className="text-muted-foreground">Add a manga or manhwa to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
        {bookmarks.map((bookmark) => (
            <BookmarkCard key={bookmark.id} bookmark={bookmark} onDelete={onDelete} />
        ))}
    </div>
  );
}
