'use server';

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { schedules, scheduleAvailability } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getUserSchedule() {
  try {
    const { userId } = auth();
    console.log("User ID from auth:", userId);
    
    if (!userId) {
      console.log("No user ID found");
      return { error: "Not authenticated" };
    }

    // First, try to find the user's schedule
    const userSchedule = await db.query.schedules.findFirst({
      where: eq(schedules.clerkUserId, userId),
      with: {
        availability: true,
      },
    });

    console.log("Found user schedule:", userSchedule ? "yes" : "no");

    if (!userSchedule) {
      console.log("Creating new schedule for user");
      // Create a new schedule for the user
      const [newSchedule] = await db.insert(schedules).values({
        clerkUserId: userId,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }).returning();

      console.log("New schedule created:", newSchedule);

      return {
        schedule: {
          ...newSchedule,
          availability: [],
          dateSpecificHours: [],
        }
      };
    }

    // Get all availability including date-specific hours
    const availability = await db.query.scheduleAvailability.findMany({
      where: eq(scheduleAvailability.scheduleId, userSchedule.id),
    });

    // Separate regular availability and date-specific hours
    const regularAvailability = availability.filter(slot => slot.dayOfWeek !== -1);
    const dateSpecificHours = availability.filter(slot => slot.dayOfWeek === -1);

    return {
      schedule: {
        ...userSchedule,
        availability: regularAvailability.map(slot => ({
          id: slot.id,
          scheduleId: slot.scheduleId,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime.toString().slice(0, 5),
          endTime: slot.endTime.toString().slice(0, 5),
        })),
        dateSpecificHours: dateSpecificHours.map(slot => ({
          id: slot.id,
          scheduleId: slot.scheduleId,
          date: slot.specificDate,
          startTime: slot.startTime.toString().slice(0, 5),
          endTime: slot.endTime.toString().slice(0, 5),
        })),
      }
    };
  } catch (error) {
    console.error('Error in getUserSchedule:', error);
    return {
      error: "Failed to get schedule"
    };
  }
}

export async function updateSchedule(schedule: {
  id: string;
  timezone: string;
  availability: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;
}) {
  try {
    const { userId } = auth();
    if (!userId) {
      return { error: "Not authenticated" };
    }

    // Verify the schedule belongs to the user
    const existingSchedule = await db.query.schedules.findFirst({
      where: eq(schedules.id, schedule.id),
    });

    if (!existingSchedule || existingSchedule.clerkUserId !== userId) {
      return { error: "Schedule not found or unauthorized" };
    }

    // Update schedule timezone
    await db.update(schedules)
      .set({ timezone: schedule.timezone })
      .where(eq(schedules.id, schedule.id));

    // Delete existing regular availability (keep date-specific ones)
    await db.delete(scheduleAvailability)
      .where(eq(scheduleAvailability.scheduleId, schedule.id));

    // Insert new availability
    if (schedule.availability.length > 0) {
      await db.insert(scheduleAvailability)
        .values(schedule.availability.map(slot => ({
          scheduleId: schedule.id,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
        })));
    }

    revalidatePath("/dashboard/availability");
    return { success: true };
  } catch (error) {
    console.error("Error in updateSchedule:", error);
    return { error: "Failed to update schedule" };
  }
}

export async function addDateSpecificHours(date: string, slots: Array<{ startTime: string; endTime: string }>, userId: string) {
  try {
    console.log('addDateSpecificHours called with:', { date, slots, userId });

    if (!userId) {
      console.error('No userId provided');
      return { error: "Not authenticated" };
    }

    // Get the user's schedule using the provided userId
    const userSchedule = await db.query.schedules.findFirst({
      where: eq(schedules.clerkUserId, userId),
      with: {
        availability: true
      }
    });

    console.log('Found user schedule:', userSchedule);

    if (!userSchedule) {
      console.error('No schedule found for user:', userId);
      return { error: "No schedule found for user" };
    }

    try {
      // Delete existing date-specific hours for this date
      const deleteResult = await db.delete(scheduleAvailability)
        .where(and(
          eq(scheduleAvailability.scheduleId, userSchedule.id),
          eq(scheduleAvailability.specificDate, date)
        ))
        .returning();
      
      console.log('Deleted existing date-specific hours:', deleteResult);

      // Insert new date-specific hours
      if (slots.length > 0) {
        const insertResult = await db.insert(scheduleAvailability)
          .values(slots.map(slot => ({
            scheduleId: userSchedule.id,
            dayOfWeek: -1, // Special value for date-specific slots
            startTime: slot.startTime,
            endTime: slot.endTime,
            specificDate: date,
          })))
          .returning();
        
        console.log('Inserted new date-specific hours:', insertResult);
      }

      revalidatePath("/dashboard/availability");
      return { success: true };
    } catch (dbError) {
      console.error('Database operation failed:', dbError);
      return { error: "Database operation failed" };
    }
  } catch (error) {
    console.error("Error in addDateSpecificHours:", error);
    return { error: "Failed to add date-specific hours" };
  }
}
