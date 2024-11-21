'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { createEventType } from "@/actions/event-types";
import Link from "next/link";
import { useState } from "react";

const eventTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  durationInMinutes: z.number().min(1, "Duration must be at least 1 minute"),
});

type EventTypeFormData = z.infer<typeof eventTypeSchema>;

export default function NewEventTypePage() {
  const router = useRouter();
  const { userId } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const form = useForm<EventTypeFormData>({
    resolver: zodResolver(eventTypeSchema),
    defaultValues: {
      name: "",
      description: "",
      durationInMinutes: 30,
    },
  });

  async function onSubmit(data: EventTypeFormData) {
    if (!userId) return;

    try {
      setIsSubmitting(true);
      setError(null);
      
      const result = await createEventType({
        ...data,
        userId,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      router.push("/dashboard/event-types");
      router.refresh();
    } catch (error) {
      console.error("Failed to create event type:", error);
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Create Event Type</h2>
        <Link
          href="/dashboard/event-types"
          className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent"
        >
          Cancel
        </Link>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Name
            </label>
            <input
              {...form.register("name")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              placeholder="One-on-one Meeting"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Description
            </label>
            <textarea
              {...form.register("description")}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              placeholder="A brief meeting to discuss..."
            />
          </div>

          <div>
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Duration (minutes)
            </label>
            <input
              type="number"
              {...form.register("durationInMinutes", { valueAsNumber: true })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            />
            {form.formState.errors.durationInMinutes && (
              <p className="text-sm text-red-500">
                {form.formState.errors.durationInMinutes.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            type="submit"
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="mr-2">Creating...</span>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
              </>
            ) : (
              "Create Event Type"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
