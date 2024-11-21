'use client';

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addMinutes, parseISO } from "date-fns";
import { formatInTimeZone, toDate } from "date-fns-tz";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { createBooking } from "@/actions/bookings";
import { BookingSuccess } from "./booking-success";

const bookingFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

export function BookingForm({ event }: { event: any }) {
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [userTimezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [successBooking, setSuccessBooking] = useState<any>(null);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      name: "",
      email: "",
      date: "",
      time: "",
    },
  });

  useEffect(() => {
    if (selectedDate) {
      // Fetch available slots for the selected date
      fetchAvailableSlots(selectedDate);
    }
  }, [selectedDate]);

  const fetchAvailableSlots = async (date: string) => {
    try {
      const response = await fetch(
        `/api/events/${event.id}/available-slots?date=${date}&timezone=${userTimezone}`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch available slots");
      }

      const data = await response.json();
      setAvailableSlots(data.slots);
    } catch (error) {
      console.error("Error fetching slots:", error);
      toast.error("Failed to load available time slots");
    }
  };

  const onSubmit = async (data: BookingFormValues) => {
    try {
      const startTime = toDate(`${data.date}T${data.time}`, { timeZone: userTimezone });
      const endTime = addMinutes(startTime, event.durationInMinutes);

      const booking = await createBooking({
        eventId: event.id,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        attendeeName: data.name,
        attendeeEmail: data.email,
        attendeeTimezone: userTimezone,
      });

      setSuccessBooking({
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        attendeeName: data.name,
        attendeeEmail: data.email,
        attendeeTimezone: userTimezone,
      });
    } catch (error) {
      console.error("Booking error:", error);
      toast.error("Failed to create booking. Please try again.");
    }
  };

  if (successBooking) {
    return <BookingSuccess booking={successBooking} event={event} />;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Your name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="your@email.com" type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    setSelectedDate(e.target.value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="time"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Time</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={!selectedDate}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a time slot" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableSlots.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          Schedule Meeting
        </Button>
      </form>
    </Form>
  );
}
