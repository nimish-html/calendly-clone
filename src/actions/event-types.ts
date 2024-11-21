'use server';

import { db } from "@/db";
import { events } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";

const createEventTypeSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  durationInMinutes: z.number().min(1),
});

const updateEventTypeSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  durationInMinutes: z.number().min(1),
  isActive: z.boolean(),
});

export async function createEventType(data: {
  name: string;
  description?: string;
  durationInMinutes: number;
}) {
  try {
    const user = await currentUser();
    if (!user) {
      return { error: "Not authenticated" };
    }

    const validatedFields = createEventTypeSchema.safeParse(data);

    if (!validatedFields.success) {
      return { error: "Invalid form data" };
    }

    const { name, description, durationInMinutes } = validatedFields.data;

    const eventType = await db.insert(events).values({
      name,
      description,
      durationInMinutes,
      clerkUserId: user.id,
      isActive: true,
    }).returning();

    revalidatePath("/dashboard/event-types");
    return { data: eventType[0], success: true };
  } catch (error) {
    console.error("Failed to create event type:", error);
    return { error: "Failed to create event type" };
  }
}

export async function updateEventType(data: {
  id: string;
  name: string;
  description?: string;
  durationInMinutes: number;
  isActive: boolean;
}) {
  try {
    const user = await currentUser();
    if (!user) {
      return { error: "Not authenticated" };
    }

    const validatedFields = updateEventTypeSchema.safeParse(data);

    if (!validatedFields.success) {
      return { error: "Invalid form data" };
    }

    const { id, name, description, durationInMinutes, isActive } = validatedFields.data;

    // Verify ownership
    const existingEvent = await db.select().from(events).where(eq(events.id, id)).limit(1);
    if (!existingEvent.length || existingEvent[0].clerkUserId !== user.id) {
      return { error: "Event type not found or unauthorized" };
    }

    const eventType = await db.update(events)
      .set({
        name,
        description,
        durationInMinutes,
        isActive,
      })
      .where(eq(events.id, id))
      .returning();

    revalidatePath("/dashboard/event-types");
    return { data: eventType[0], success: true };
  } catch (error) {
    console.error("Failed to update event type:", error);
    return { error: "Failed to update event type" };
  }
}

export async function deleteEventType(id: string) {
  try {
    const user = await currentUser();
    if (!user) {
      return { error: "Not authenticated" };
    }

    // Verify ownership
    const existingEvent = await db.select().from(events).where(eq(events.id, id)).limit(1);
    if (!existingEvent.length || existingEvent[0].clerkUserId !== user.id) {
      return { error: "Event type not found or unauthorized" };
    }

    await db.delete(events).where(eq(events.id, id));

    revalidatePath("/dashboard/event-types");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete event type:", error);
    return { error: "Failed to delete event type" };
  }
}

export async function getUserEventTypes(userId: string) {
  try {
    const eventTypesList = await db
      .select()
      .from(events)
      .where(eq(events.clerkUserId, userId));

    return { data: eventTypesList, success: true };
  } catch (error) {
    console.error("Failed to get event types:", error);
    return { error: "Failed to get event types" };
  }
}

export async function getEventType(id: string) {
  try {
    const user = await currentUser();
    if (!user) {
      return { error: "Not authenticated" };
    }

    const eventType = await db
      .select()
      .from(events)
      .where(eq(events.id, id))
      .limit(1);

    if (!eventType.length) {
      return { error: "Event type not found" };
    }

    if (eventType[0].clerkUserId !== user.id) {
      return { error: "Unauthorized" };
    }

    return { data: eventType[0], success: true };
  } catch (error) {
    console.error("Failed to fetch event type:", error);
    return { error: "Failed to fetch event type" };
  }
}
