-- Rename the table
ALTER TABLE IF EXISTS "schedule_availability" RENAME TO "schedules_availability";

-- Add the specific_date column
ALTER TABLE "schedules_availability" ADD COLUMN IF NOT EXISTS "specific_date" date;
