"use server";

import { db } from "@/db";
import { bookings, events } from "@/db/schema";
import { auth } from "@clerk/nextjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq, and, or, lte, gt, lt, gte } from "drizzle-orm";
import { GoogleCalendarService } from "@/lib/google/calendar";

const createBookingSchema = z.object({
  eventId: z.string().uuid(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  attendeeName: z.string().min(1),
  attendeeEmail: z.string().email(),
  attendeeTimezone: z.string().min(1),
});

export async function createBooking(input: z.infer<typeof createBookingSchema>) {
  const { eventId, startTime, endTime, attendeeName, attendeeEmail, attendeeTimezone } = createBookingSchema.parse(input);

  try {
    // Get the event to get the owner's clerk_user_id
    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId),
      columns: {
        clerkUserId: true,
      },
    });

    if (!event) {
      throw new Error("Event not found");
    }

    // Check if the slot is still available
    const existingBooking = await db.query.bookings.findFirst({
      where: (booking) => {
        return and(
          eq(booking.eventId, eventId),
          eq(booking.status, "confirmed"),
          or(
            // New booking starts during an existing booking
            and(
              lte(booking.startTime, new Date(startTime)),
              gt(booking.endTime, new Date(startTime))
            ),
            // New booking ends during an existing booking
            and(
              lt(booking.startTime, new Date(endTime)),
              gte(booking.endTime, new Date(endTime))
            ),
            // New booking completely contains an existing booking
            and(
              gte(booking.startTime, new Date(startTime)),
              lte(booking.endTime, new Date(endTime))
            )
          )
        );
      },
    });

    if (existingBooking) {
      throw new Error("This time slot is no longer available");
    }

    // Create the booking
    const [booking] = await db
      .insert(bookings)
      .values({
        eventId,
        clerkUserId: event.clerkUserId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        attendeeName,
        attendeeEmail,
        attendeeTimezone,
        status: "confirmed",
      })
      .returning();

    try {
      // Create Google Calendar event and Meet link
      const { eventId: googleEventId, meetLink } = await GoogleCalendarService.createCalendarEvent(
        event.clerkUserId,
        {
          summary: `Meeting with ${attendeeName}`,
          description: `Calendlier booking with ${attendeeName} (${attendeeEmail})`,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          attendeeEmail,
        }
      );

      // Update booking with Google Calendar event ID and Meet link
      await db
        .update(bookings)
        .set({
          googleCalendarEventId: googleEventId,
          googleMeetLink: meetLink,
        })
        .where(eq(bookings.id, booking.id));

      booking.googleCalendarEventId = googleEventId;
      booking.googleMeetLink = meetLink;
    } catch (error: any) {
      console.error("Error creating Google Calendar event:", error);
      
      // If user is not connected to Google Calendar, throw a specific error
      if (error.message === 'User not connected to Google Calendar') {
        const connectUrl = await GoogleCalendarService.getAuthUrl();
        throw new Error(`Please connect your Google Calendar first: ${connectUrl}`);
      }
      
      // For other errors, don't throw as the booking is still valid
      // The user can manually sync with Google Calendar later
    }

    // TODO: Send confirmation emails

    revalidatePath("/dashboard/bookings");
    return booking;
  } catch (error) {
    console.error("Error creating booking:", error);
    throw error;
  }
}

export async function getUpcomingBookings(userId: string) {
  try {
    const now = new Date();
    const upcomingBookings = await db.query.bookings.findMany({
      where: and(
        eq(bookings.clerkUserId, userId),
        eq(bookings.status, "confirmed"),
        gte(bookings.startTime, now)
      ),
      orderBy: (bookings, { asc }) => [asc(bookings.startTime)],
      with: {
        event: true
      }
    });

    return { data: upcomingBookings, success: true };
  } catch (error) {
    console.error("Failed to get upcoming bookings:", error);
    return { error: "Failed to get upcoming bookings" };
  }
}
