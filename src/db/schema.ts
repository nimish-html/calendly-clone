import { pgTable, text, timestamp, integer, uuid, boolean, time, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Events table (as per PRD 6.1.1)
export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  durationInMinutes: integer("duration_in_minutes").notNull(),
  clerkUserId: text("clerk_user_id").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  location: text("location").default("google_meet").notNull(), // google_meet, physical, other
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const eventsRelations = relations(events, ({ many }) => ({
  bookings: many(bookings),
}));

// Schedule table (as per PRD 6.1.2)
export const schedules = pgTable("schedules", {
  id: uuid("id").primaryKey().defaultRandom(),
  timezone: text("timezone").notNull(),
  clerkUserId: text("clerk_user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Schedule Availability table (as per PRD 6.1.3)
export const scheduleAvailability = pgTable("schedules_availability", {
  id: uuid("id").primaryKey().defaultRandom(),
  scheduleId: uuid("schedule_id").references(() => schedules.id).notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 0=Sunday to 6=Saturday
  specificDate: date("specific_date"), // For date-specific availability
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Define relations
export const schedulesRelations = relations(schedules, ({ many }) => ({
  availability: many(scheduleAvailability),
}));

export const scheduleAvailabilityRelations = relations(scheduleAvailability, ({ one }) => ({
  schedule: one(schedules, {
    fields: [scheduleAvailability.scheduleId],
    references: [schedules.id],
  }),
}));

// Bookings table (needed for actual scheduled meetings)
export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").references(() => events.id).notNull(),
  clerkUserId: text("clerk_user_id").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  attendeeEmail: text("attendee_email").notNull(),
  attendeeName: text("attendee_name").notNull(),
  attendeeTimezone: text("attendee_timezone").notNull(),
  googleCalendarEventId: text("google_calendar_event_id"),
  googleMeetLink: text("google_meet_link"),
  status: text("status").notNull().default("confirmed"), // confirmed, cancelled, rescheduled
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const bookingsRelations = relations(bookings, ({ one }) => ({
  event: one(events, {
    fields: [bookings.eventId],
    references: [events.id],
  }),
}));

// Google OAuth table
export const googleAuth = pgTable("google_auth", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  scope: text("scope").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
