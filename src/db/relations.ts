import { relations } from 'drizzle-orm';
import { schedules, scheduleAvailability } from './schema';

export const schedulesRelations = relations(schedules, ({ many }) => ({
  availability: many(scheduleAvailability),
}));

export const scheduleAvailabilityRelations = relations(scheduleAvailability, ({ one }) => ({
  schedule: one(schedules, {
    fields: [scheduleAvailability.scheduleId],
    references: [schedules.id],
  }),
}));
