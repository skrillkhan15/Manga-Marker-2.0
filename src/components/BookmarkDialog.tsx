"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useState } from 'react';

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import type { Bookmark } from "@/types";
import { Badge } from "./ui/badge";
import { X } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(1, { message: "Title cannot be empty." }),
  url: z.string().url({ message: "Please enter a valid URL." }),
  tags: z.array(z.string()).optional(),
});

type BookmarkFormValues = z.infer<typeof formSchema>;

interface BookmarkDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: BookmarkFormValues, id?: string) => void;
    bookmark: Bookmark | null;
}

export function BookmarkDialog({ open, onOpenChange, onSubmit, bookmark }: BookmarkDialogProps) {
  const [tagInput, setTagInput] = useState('');

  const form = useForm<BookmarkFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      url: "",
      tags: [],
    },
  });

  // Watch for changes in the bookmark prop to reset the form
  React.useEffect(() => {
    if (bookmark) {
      form.reset({
        title: bookmark.title,
        url: bookmark.url,
        tags: bookmark.tags || [],
      });
    } else {
      form.reset({
        title: "",
        url: "",
        tags: [],
      });
    }
  }, [bookmark, form]);

  const handleFormSubmit = (values: BookmarkFormValues) => {
    onSubmit(values, bookmark?.id);
    onOpenChange(false);
    form.reset();
  };
  
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim() !== '') {
      e.preventDefault();
      const newTag = tagInput.trim();
      const currentTags = form.getValues('tags') || [];
      if (!currentTags.includes(newTag)) {
        form.setValue('tags', [...currentTags, newTag]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues('tags') || [];
    form.setValue('tags', currentTags.filter(tag => tag !== tagToRemove));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{bookmark ? 'Edit Bookmark' : 'Add New Bookmark'}</DialogTitle>
          <DialogDescription>
            {bookmark ? 'Update the details for your bookmark.' : 'Add a new manga or manhwa to your list.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
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
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                        <Input
                            placeholder="Add a tag and press Enter"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={handleTagKeyDown}
                        />
                    </FormControl>
                    <div className="flex flex-wrap gap-2 pt-2">
                        {field.value?.map((tag) => (
                        <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                            {tag}
                            <button onClick={() => removeTag(tag)} className="rounded-full hover:bg-muted-foreground/20">
                                <X className="w-3 h-3"/>
                            </button>
                        </Badge>
                        ))}
                    </div>
                    <FormMessage />
                </FormItem>
            )}
            />
            <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit">{bookmark ? 'Save Changes' : 'Add Bookmark'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
