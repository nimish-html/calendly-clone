"use server";

import { z } from "zod";
import { db } from "@/db";
import { schedules, scheduleAvailability } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";

const timeSlotSchema = z.object({
  dayOfWeek: z.union([z.string(), z.number()]).transform(val => String(val)),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  enabled: z.boolean(),
});

const availabilitySchema = z.object({
  timezone: z.string(),
  slots: z.array(timeSlotSchema),
  changedDays: z.array(z.union([z.string(), z.number()])).transform(days => 
    days.map(day => String(day))
  ).optional(),
});

export async function updateAvailability(userId: string, data: z.infer<typeof availabilitySchema>) {
  try {
    console.log('Received data for update:', JSON.stringify(data, null, 2));
    
    let validatedData;
    try {
      validatedData = availabilitySchema.parse(data);
      console.log('Data validation successful');
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        console.error('Zod Validation Error Details:', JSON.stringify({
          errors: validationError.errors,
          received: data
        }, null, 2));
      }
      throw validationError;
    }

    // Find or create schedule
    let userSchedule = await db.query.schedules.findFirst({
      where: eq(schedules.clerkUserId, userId),
    });

    console.log('Found user schedule:', userSchedule ? 'yes' : 'no');

    if (!userSchedule) {
      console.log('Creating new schedule for user');
      const [newSchedule] = await db.insert(schedules).values({
        clerkUserId: userId,
        timezone: validatedData.timezone,
      }).returning();
      userSchedule = newSchedule;
    }

    // Update timezone if it changed
    if (userSchedule.timezone !== validatedData.timezone) {
      await db.update(schedules)
        .set({ timezone: validatedData.timezone })
        .where(eq(schedules.id, userSchedule.id));
    }

    // Delete existing availability for changed days
    if (validatedData.changedDays?.length) {
      await db.delete(scheduleAvailability)
        .where(
          and(
            eq(scheduleAvailability.scheduleId, userSchedule.id),
            inArray(scheduleAvailability.dayOfWeek, validatedData.changedDays.map(Number))
          )
        );
    }

    // Insert new availability slots
    if (validatedData.slots.length > 0) {
      const slotsToInsert = validatedData.slots
        .filter(slot => slot.enabled)
        .map(slot => ({
          scheduleId: userSchedule.id,
          dayOfWeek: parseInt(slot.dayOfWeek),
          startTime: slot.startTime,
          endTime: slot.endTime,
        }));

      if (slotsToInsert.length > 0) {
        await db.insert(scheduleAvailability).values(slotsToInsert);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error in updateAvailability:', error);
    if (error instanceof z.ZodError) {
      return { error: "Invalid data format", details: error.errors };
    }
    return { error: "Failed to update availability" };
  }
}

export async function getAvailability(userId: string) {
  try {
    // First get the user's schedule using the passed userId
    let userSchedule = await db.query.schedules.findFirst({
      where: eq(schedules.clerkUserId, userId),
      with: {
        availability: true
      }
    });

    if (!userSchedule) {
      // Create a new schedule with default availability
      const [newSchedule] = await db.insert(schedules)
        .values({
          clerkUserId: userId,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        })
        .returning();

      // Add default availability (Mon-Fri, 9am-5pm)
      const defaultAvailability = [1, 2, 3, 4, 5].map(dayOfWeek => ({
        scheduleId: newSchedule.id,
        dayOfWeek: dayOfWeek.toString(),
        startTime: "09:00",
        endTime: "17:00",
      }));

      await db.insert(scheduleAvailability).values(defaultAvailability);

      // Fetch the newly created schedule with its availability
      userSchedule = await db.query.schedules.findFirst({
        where: eq(schedules.clerkUserId, userId),
        with: {
          availability: true
        }
      });
    }

    // Get all availability including date-specific hours
    const allAvailability = await db.query.scheduleAvailability.findMany({
      where: eq(scheduleAvailability.scheduleId, userSchedule.id),
    });

    // Split into regular and date-specific availability
    const regularAvailability = allAvailability.filter(slot => !slot.specificDate);
    const dateSpecificHours = allAvailability.filter(slot => slot.specificDate);

    console.log('Found date-specific hours:', dateSpecificHours);

    // Format the schedule data for the frontend
    const formattedSchedule = {
      id: userSchedule.id,
      clerkUserId: userSchedule.clerkUserId,
      timezone: userSchedule.timezone,
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
        date: slot.specificDate, // specificDate is already a string in YYYY-MM-DD format
        startTime: slot.startTime.toString().slice(0, 5),
        endTime: slot.endTime.toString().slice(0, 5),
      }))
    };

    console.log('Formatted schedule:', formattedSchedule);
    return { schedule: formattedSchedule };
  } catch (error) {
    console.error('Error in getAvailability:', error);
    return {
      error: "Failed to get schedule"
    };
  }
}
