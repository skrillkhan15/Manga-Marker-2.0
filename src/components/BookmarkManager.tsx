"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import useLocalStorage from "@/hooks/use-local-storage";
import type { Bookmark } from "@/types";
import BookmarkList from "./BookmarkList";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

const formSchema = z.object({
  title: z.string().min(1, { message: "Title cannot be empty." }),
  url: z.string().url({ message: "Please enter a valid URL." }),
});

export default function BookmarkManager() {
  const [bookmarks, setBookmarks] = useLocalStorage<Bookmark[]>("manga-bookmarks", []);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      url: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setBookmarks((prevBookmarks) => {
      const existingBookmarkIndex = prevBookmarks.findIndex(
        (b) => b.title.toLowerCase() === values.title.toLowerCase()
      );

      const updatedBookmarks = [...prevBookmarks];
      const now = new Date();

      if (existingBookmarkIndex > -1) {
        // Update existing bookmark
        const oldBookmark = updatedBookmarks[existingBookmarkIndex];
        updatedBookmarks[existingBookmarkIndex] = {
          ...oldBookmark,
          url: values.url,
          lastUpdated: now.toISOString(),
        };
        toast({
          title: "Bookmark Updated",
          description: `Updated '${values.title}' to the new chapter.`,
        });
      } else {
        // Add new bookmark
        const newBookmark: Bookmark = {
          id: now.getTime().toString(),
          title: values.title,
          url: values.url,
          lastUpdated: now.toISOString(),
        };
        updatedBookmarks.push(newBookmark);
        toast({
          title: "Bookmark Added",
          description: `Successfully added '${values.title}'.`,
        });
      }
       // Sort by last updated date descending
       return updatedBookmarks.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
    });
    form.reset();
  }

  const deleteBookmark = (id: string) => {
    setBookmarks((prev) => {
        const bookmarkToDelete = prev.find(b => b.id === id);
        const newBookmarks = prev.filter((b) => b.id !== id);
        if (bookmarkToDelete) {
            toast({
                title: "Bookmark Removed",
                description: `Removed '${bookmarkToDelete.title}' from your list.`,
                variant: "destructive"
            });
        }
        return newBookmarks;
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <Card className="bg-background/50 backdrop-blur-sm border-white/20 shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle>Add or Update Bookmark</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Solo Leveling" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chapter URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://.../chapter-123" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">
                  <Plus className="mr-2 h-4 w-4" /> Add/Update
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
      <div className="md:col-span-2">
        <BookmarkList bookmarks={bookmarks} onDelete={deleteBookmark} />
      </div>
    </div>
  );
}
