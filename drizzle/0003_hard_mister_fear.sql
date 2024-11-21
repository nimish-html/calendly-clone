ALTER TABLE "schedule_availability" RENAME TO "schedules_availability";--> statement-breakpoint
ALTER TABLE "schedules_availability" DROP CONSTRAINT "schedule_availability_schedule_id_schedules_id_fk";
--> statement-breakpoint
ALTER TABLE "schedules_availability" ADD COLUMN "specific_date" date;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "schedules_availability" ADD CONSTRAINT "schedules_availability_schedule_id_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."schedules"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
