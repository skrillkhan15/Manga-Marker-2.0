"use client";
import type { Bookmark } from "@/types";
import BookmarkCard from "./BookmarkCard";
import { BookOpenCheck } from "lucide-react";

interface BookmarkListProps {
  bookmarks: Bookmark[];
  onDelete: (id: string) => void;
}

export default function BookmarkList({ bookmarks, onDelete }: BookmarkListProps) {
  if (bookmarks.length === 0) {
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
