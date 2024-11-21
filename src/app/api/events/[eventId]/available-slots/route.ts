import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { events, schedules, scheduleAvailability, bookings } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { addMinutes, format, parseISO, startOfDay, endOfDay } from "date-fns";
import { formatInTimeZone, toDate } from "date-fns-tz";

export async function GET(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const date = searchParams.get("date");
    const timezone = searchParams.get("timezone");

    if (!date || !timezone) {
      return NextResponse.json(
        { error: "Date and timezone are required" },
        { status: 400 }
      );
    }

    // Get event details and associated schedule with availability in a single query
    const result = await db
      .select({
        event: events,
        schedule: schedules,
        availability: scheduleAvailability,
      })
      .from(events)
      .innerJoin(schedules, eq(events.clerkUserId, schedules.clerkUserId))
      .innerJoin(scheduleAvailability, eq(scheduleAvailability.scheduleId, schedules.id))
      .where(eq(events.id, params.eventId))
      .execute();

    if (!result || result.length === 0) {
      return NextResponse.json({ error: "Event or schedule not found" }, { status: 404 });
    }

    const event = result[0].event;
    const schedule = result[0].schedule;
    
    const targetDate = parseISO(date);
    const dayOfWeek = targetDate.getDay();

    // Get schedule availability for the day
    const dayAvailability = result
      .map((r) => r.availability)
      .filter((slot) => slot.dayOfWeek === dayOfWeek);

    if (dayAvailability.length === 0) {
      return NextResponse.json({ slots: [] });
    }

    // Get existing bookings for the day to filter out booked slots
    const existingBookings = await db.query.bookings.findMany({
      where: and(
        eq(bookings.eventId, params.eventId),
        gte(bookings.startTime, startOfDay(targetDate)),
        lte(bookings.startTime, endOfDay(targetDate)),
        eq(bookings.status, "confirmed")
      ),
    });

    // Generate all possible time slots for the day based on availability
    const availableSlots: string[] = [];
    for (const slot of dayAvailability) {
      let currentTime = toDate(`${date}T${slot.startTime}`, { timeZone: timezone });
      const endTime = toDate(`${date}T${slot.endTime}`, { timeZone: timezone });

      while (currentTime < endTime) {
        const slotEndTime = addMinutes(currentTime, event.durationInMinutes);
        if (slotEndTime > endTime) break;

        // Check if the slot overlaps with any existing booking
        const isSlotAvailable = !existingBookings.some(booking => {
          const bookingStart = new Date(booking.startTime);
          const bookingEnd = new Date(booking.endTime);
          return (
            (currentTime >= bookingStart && currentTime < bookingEnd) ||
            (slotEndTime > bookingStart && slotEndTime <= bookingEnd) ||
            (currentTime <= bookingStart && slotEndTime >= bookingEnd)
          );
        });

        if (isSlotAvailable) {
          availableSlots.push(format(currentTime, "HH:mm"));
        }
        
        currentTime = addMinutes(currentTime, event.durationInMinutes);
      }
    }

    return NextResponse.json({ slots: availableSlots });
  } catch (error) {
    console.error("Error fetching available slots:", error);
    return NextResponse.json(
      { error: "Failed to fetch available slots" },
      { status: 500 }
    );
  }
}
