
"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { extractMetadata } from '@/ai/flows/extract-metadata-flow';
import { addDays, formatISO } from 'date-fns';

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { Bookmark, ReadingStatus, BookmarkHistory, Folder } from "@/types";
import { Badge } from "./ui/badge";
import { X, Upload, Sparkles, Loader2, History, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ScrollArea } from "./ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { StarRating } from "./StarRating";

const formSchema = z.object({
  title: z.string().min(1, { message: "Title cannot be empty." }),
  alias: z.string().optional(),
  url: z.string().url({ message: "Please enter a valid URL." }),
  chapter: z.coerce.number().min(0).optional(),
  totalChapters: z.coerce.number().min(0).optional(),
  tags: z.array(z.string()).optional(),
  coverImage: z.string().optional(),
  statusId: z.string({ required_error: "Please select a status." }),
  notes: z.string().optional(),
  folderId: z.string().optional(),
  reminderDays: z.coerce.number().min(0).optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
});

type BookmarkFormValues = z.infer<typeof formSchema>;

interface BookmarkDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: Omit<Bookmark, 'id' | 'lastUpdated' | 'isFavorite' | 'history'>, id?: string) => void;
    onRevert: (bookmarkId: string, historyEntry: BookmarkHistory) => void;
    bookmark: Bookmark | null;
    readingStatuses: ReadingStatus[];
    folders: Folder[];
}

export function BookmarkDialog({ open, onOpenChange, onSubmit, onRevert, bookmark, readingStatuses, folders }: BookmarkDialogProps) {
  const [tagInput, setTagInput] = useState('');
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const form = useForm<BookmarkFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      alias: "",
      url: "",
      chapter: 0,
      totalChapters: 0,
      tags: [],
      coverImage: "",
      statusId: readingStatuses[0]?.id || "plan-to-read",
      notes: "",
      folderId: "",
      reminderDays: 0,
      rating: 0,
    },
  });
  
  useEffect(() => {
    if (open) {
      if (bookmark) {
        form.reset({
          title: bookmark.title,
          alias: bookmark.alias || "",
          url: bookmark.url,
          chapter: bookmark.chapter || 0,
          totalChapters: bookmark.totalChapters || 0,
          tags: bookmark.tags || [],
          coverImage: bookmark.coverImage || "",
          statusId: bookmark.statusId || readingStatuses[0]?.id,
          notes: bookmark.notes || "",
          folderId: bookmark.folderId || "",
          reminderDays: 0, // Don't pre-fill reminder, it's a one-time action
          rating: bookmark.rating || 0,
        });
        setCoverPreview(bookmark.coverImage || null);
      } else {
        form.reset({
          title: "",
          alias: "",
          url: "",
          chapter: 0,
          totalChapters: 0,
          tags: [],
          coverImage: "",
          statusId: readingStatuses.find(s => s.id === 'plan-to-read')?.id || readingStatuses[0]?.id,
          notes: "",
          folderId: "",
          reminderDays: 0,
          rating: 0,
        });
        setCoverPreview(null);
      }
    }
  }, [bookmark, form, open, readingStatuses]);

  const urlValue = form.watch('url');

  useEffect(() => {
    if (urlValue && !isFetching) { // Don't auto-detect while AI is fetching
      const match = urlValue.match(/(?:[/-]|chapter(?:-|_))(\d+(?:\.\d+)?)(?=[/?#]|$)/i);
      if (match && match[1]) {
        const chapterNumber = parseFloat(match[1]);
        if (!isNaN(chapterNumber)) {
          form.setValue('chapter', chapterNumber, { shouldValidate: true });
        }
      }
    }
  }, [urlValue, form, isFetching]);

  const handleFetchMetadata = async () => {
    const url = form.getValues('url');
    if (!url || !z.string().url().safeParse(url).success) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL to fetch metadata.",
        variant: "destructive",
      });
      return;
    }
    
    setIsFetching(true);
    try {
      const { title, chapter } = await extractMetadata({ url });
      form.setValue('title', title, { shouldValidate: true });
      form.setValue('chapter', chapter, { shouldValidate: true });
      toast({
        title: "Metadata Extracted!",
        description: "Title and chapter have been filled in.",
      });
    } catch (error) {
      console.error("Failed to fetch metadata:", error);
      toast({
        title: "Extraction Failed",
        description: "Could not automatically extract metadata. Please fill in the details manually.",
        variant: "destructive",
      });
    } finally {
      setIsFetching(false);
    }
  };

  const handleFormSubmit = (values: BookmarkFormValues) => {
    const reminderDate = values.reminderDays && values.reminderDays > 0
      ? formatISO(addDays(new Date(), values.reminderDays))
      : undefined;

    const dataToSubmit = {
      ...values,
      folderId: values.folderId === '__none__' ? undefined : values.folderId,
      reminderDate,
    };
    onSubmit(dataToSubmit, bookmark?.id);
    onOpenChange(false);
    form.reset();
    setCoverPreview(null);
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
  
  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        form.setValue('coverImage', result);
        setCoverPreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const hasHistory = bookmark && bookmark.history && bookmark.history.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{bookmark ? 'Edit Bookmark' : 'Add New Bookmark'}</DialogTitle>
          <DialogDescription>
            {bookmark ? 'Update the details for your bookmark.' : 'Add a new manga or manhwa to your list.'}
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="history" disabled={!hasHistory}>
                <History className="w-4 h-4 mr-2" />
                History
            </TabsTrigger>
          </TabsList>
          <TabsContent value="details">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 max-h-[60vh] overflow-y-auto p-1 mt-2">
                 <FormField
                    control={form.control}
                    name="coverImage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cover Image</FormLabel>
                        <FormControl>
                            <div className="w-full">
                                <input
                                    type="file"
                                    accept="image/*"
                                    ref={fileInputRef}
                                    onChange={handleCoverImageChange}
                                    className="hidden"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload className="mr-2 h-4 w-4" />
                                    Upload Image
                                </Button>
                            </div>
                        </FormControl>
                        {coverPreview && (
                            <div className="mt-4 relative w-32 h-48 mx-auto rounded-md overflow-hidden">
                               <Image src={coverPreview} alt="Cover preview" layout="fill" objectFit="cover" />
                            </div>
                        )}
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
                      <div className="flex gap-2">
                        <FormControl>
                          <Input placeholder="https://.../chapter-123" {...field} />
                        </FormControl>
                        <Button type="button" variant="outline" size="icon" onClick={handleFetchMetadata} disabled={isFetching} aria-label="Fetch metadata">
                          {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        </Button>
                      </div>
                      <FormDescription>
                        Enter a URL and click the ✨ button to auto-fill details.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                  name="alias"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alias (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Solo Lvl" {...field} />
                      </FormControl>
                      <FormDescription>
                        A shorter name for display in lists.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="chapter"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Chapter</FormLabel>
                            <FormControl>
                            <Input type="number" placeholder="Current chapter" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="totalChapters"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Total Chapters</FormLabel>
                            <FormControl>
                            <Input type="number" placeholder="e.g., 150" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="statusId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a status" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {readingStatuses.map(status => (
                                            <SelectItem key={status.id} value={status.id}>
                                                {status.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="folderId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Folder</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || '__none__'}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="No folder" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="__none__">No folder</SelectItem>
                                        {folders.map(folder => (
                                            <SelectItem key={folder.id} value={folder.id}>
                                                {folder.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                 </div>
                <FormField
                  control={form.control}
                  name="rating"
                  render={({ field }) => (
                    <FormItem>
                        <FormLabel>Rating</FormLabel>
                         <FormControl>
                            <StarRating rating={field.value || 0} setRating={field.onChange} size={6} />
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
                                <button type="button" onClick={() => removeTag(tag)} className="rounded-full hover:bg-muted-foreground/20">
                                    <X className="w-3 h-3"/>
                                </button>
                            </Badge>
                            ))}
                        </div>
                        <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                            <Textarea
                                placeholder="Add personal notes here..."
                                className="resize-y"
                                {...field}
                            />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                />
                <FormField
                  control={form.control}
                  name="reminderDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Set a reminder (in days)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 7 for one week" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />
                      </FormControl>
                       <FormDescription>
                        Leave at 0 to not set a reminder.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className="pt-4">
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button type="submit">{bookmark ? 'Save Changes' : 'Add Bookmark'}</Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
          <TabsContent value="history">
            <ScrollArea className="h-96 w-full p-1 mt-2">
               <div className="space-y-4">
                 {bookmark?.history?.map((entry, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-center">
                            <p className="text-sm font-medium">
                                Version from {formatDistanceToNow(new Date(entry.date), { addSuffix: true })}
                            </p>
                             <Button size="sm" variant="outline" onClick={() => bookmark && onRevert(bookmark.id, entry)}>
                                <RotateCcw className="w-3 h-3 mr-2" />
                                Revert
                            </Button>
                        </div>
                        <ul className="mt-2 text-xs text-muted-foreground list-disc pl-4 space-y-1">
                           {Object.entries(entry.state).map(([key, value]) => {
                                const originalValue = (bookmark as any)[key];
                                if (JSON.stringify(originalValue) !== JSON.stringify(value)) {
                                    return <li key={key}><b>{key}:</b> {JSON.stringify(value)}</li>
                                }
                                return null;
                           })}
                        </ul>
                    </div>
                 ))}
               </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

    