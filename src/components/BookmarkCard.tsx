
"use client";

import { useState, useEffect } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { Trash2, ArrowUpRight } from 'lucide-react';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Bookmark } from "@/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"


interface BookmarkCardProps {
  bookmark: Bookmark;
  onDelete: (id: string) => void;
}

export default function BookmarkCard({ bookmark, onDelete }: BookmarkCardProps) {
  const [lastUpdatedText, setLastUpdatedText] = useState(
    format(new Date(bookmark.lastUpdated), 'PPP')
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setLastUpdatedText(formatDistanceToNow(new Date(bookmark.lastUpdated), { addSuffix: true }));
    }, 1000 * 60); // Update every minute

    setLastUpdatedText(formatDistanceToNow(new Date(bookmark.lastUpdated), { addSuffix: true }));

    return () => clearInterval(timer);
  }, [bookmark.lastUpdated]);
  
  return (
    <Card className="bg-background/30 backdrop-blur-lg border border-white/20 shadow-lg hover:shadow-primary/20 transition-all duration-300 transform hover:-translate-y-1">
      <CardHeader>
        <CardTitle className="truncate">{bookmark.title}</CardTitle>
        <CardDescription>Last updated: {lastUpdatedText}</CardDescription>
      </CardHeader>
      <CardFooter className="flex justify-between">
        <Button asChild variant="link" className="p-0 h-auto hover:text-accent">
          <a href={bookmark.url} target="_blank" rel="noopener noreferrer">
            Read Chapter
            <ArrowUpRight className="w-4 h-4 ml-1" />
          </a>
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="icon" className="w-9 h-9 opacity-70 hover:opacity-100 transition-opacity">
                <Trash2 className="w-4 h-4" />
                <span className="sr-only">Delete</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the bookmark for "{bookmark.title}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(bookmark.id)}>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </CardFooter>
    </Card>
  );
}
