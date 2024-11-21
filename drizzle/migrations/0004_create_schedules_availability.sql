CREATE TABLE IF NOT EXISTS "schedules_availability" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "schedule_id" uuid NOT NULL REFERENCES "schedules"("id"),
  "start_time" time NOT NULL,
  "end_time" time NOT NULL,
  "day_of_week" integer NOT NULL,
  "specific_date" date,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
