"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Plus, Search, ArrowDownUp, Download, Upload } from "lucide-react";
import React, { useState, useMemo } from 'react';

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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  title: z.string().min(1, { message: "Title cannot be empty." }),
  url: z.string().url({ message: "Please enter a valid URL." }),
});

export default function BookmarkManager() {
  const [bookmarks, setBookmarks] = useLocalStorage<Bookmark[]>("manga-bookmarks", []);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"lastUpdated" | "title">("lastUpdated");
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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
      return updatedBookmarks;
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

  const handleExport = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(bookmarks, null, 2)
    )}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = "mangamarks_backup.json";
    link.click();
    toast({ title: "Export Successful", description: "Your bookmarks have been downloaded."});
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error("File content is not valid text.");
        }
        const importedBookmarks: Bookmark[] = JSON.parse(text);
        // Basic validation
        if (Array.isArray(importedBookmarks) && importedBookmarks.every(b => b.id && b.title && b.url && b.lastUpdated)) {
          setBookmarks(importedBookmarks);
          toast({ title: "Import Successful", description: "Your bookmarks have been loaded." });
        } else {
          throw new Error("Invalid bookmark file format.");
        }
      } catch (error) {
        toast({ title: "Import Failed", description: "Could not import bookmarks. File may be corrupt or in the wrong format.", variant: "destructive" });
      } finally {
        // Reset file input
        if(event.target) event.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const filteredAndSortedBookmarks = useMemo(() => {
    return bookmarks
      .filter((bookmark) =>
        bookmark.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        if (sortOrder === "title") {
          return a.title.localeCompare(b.title);
        }
        // Default to lastUpdated
        return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
      });
  }, [bookmarks, searchTerm, sortOrder]);


  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1 space-y-8">
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
        <Card className="bg-background/50 backdrop-blur-sm border-white/20 shadow-lg transition-all duration-300">
          <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>Import or export your bookmarks.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4">
              <Button onClick={handleImportClick} variant="outline" className="w-full">
                  <Upload className="mr-2 h-4 w-4" /> Import
              </Button>
              <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
              <Button onClick={handleExport} disabled={bookmarks.length === 0} className="w-full">
                  <Download className="mr-2 h-4 w-4" /> Export
              </Button>
          </CardContent>
        </Card>
      </div>
      <div className="md:col-span-2">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search bookmarks..."
              className="pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
             <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as "lastUpdated" | "title")}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <ArrowDownUp className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="lastUpdated">Last Updated</SelectItem>
                    <SelectItem value="title">Title (A-Z)</SelectItem>
                </SelectContent>
            </Select>
          </div>
        </div>
        <BookmarkList bookmarks={filteredAndSortedBookmarks} onDelete={deleteBookmark} searchTerm={searchTerm} />
      </div>
    </div>
  );
}
