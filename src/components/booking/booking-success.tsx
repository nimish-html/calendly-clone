'use client';

import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, MapPin, User, Mail, CheckCircle, Download, PlusCircle } from 'lucide-react';
import { Separator } from "@/components/ui/separator";

interface BookingSuccessProps {
  booking: {
    startTime: string;
    endTime: string;
    attendeeName: string;
    attendeeEmail: string;
    attendeeTimezone: string;
  };
  event: {
    name: string;
    description?: string | null;
  };
}

export function BookingSuccess({ booking, event }: BookingSuccessProps) {
  const startTime = new Date(booking.startTime);
  const endTime = new Date(booking.endTime);

  const addToGoogleCalendar = () => {
    const googleCalendarUrl = new URL("https://calendar.google.com/calendar/render");
    googleCalendarUrl.searchParams.append("action", "TEMPLATE");
    googleCalendarUrl.searchParams.append("text", event.name);
    if (event.description) {
      googleCalendarUrl.searchParams.append("details", event.description);
    }
    googleCalendarUrl.searchParams.append("dates", 
      `${format(startTime, "yyyyMMdd'T'HHmmss")}/${format(endTime, "yyyyMMdd'T'HHmmss")}`
    );
    window.open(googleCalendarUrl.toString(), "_blank");
  };

  const downloadICSFile = () => {
    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      `DTSTART:${format(startTime, "yyyyMMdd'T'HHmmss")}`,
      `DTEND:${format(endTime, "yyyyMMdd'T'HHmmss")}`,
      `SUMMARY:${event.name}`,
      event.description ? `DESCRIPTION:${event.description}` : "",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = "event.ics";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 p-6">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
          <CheckCircle className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Booking Confirmed</h1>
        <p className="text-xl text-muted-foreground">You are scheduled for {event.name}</p>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="bg-blue-50 border-b border-blue-100">
          <CardTitle className="text-blue-800">Event Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="flex items-start gap-4">
            <Calendar className="h-5 w-5 text-blue-500 mt-1" />
            <div>
              <p className="font-medium text-gray-900">{format(startTime, "EEEE, MMMM d, yyyy")}</p>
              <p className="text-muted-foreground">
                {format(startTime, "h:mm a")} - {format(endTime, "h:mm a")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <MapPin className="h-5 w-5 text-blue-500" />
            <p className="text-muted-foreground">{booking.attendeeTimezone}</p>
          </div>

          <Separator />

          <div className="space-y-2">
            <h3 className="font-medium text-gray-900">Invitee Information</h3>
            <div className="flex items-center gap-4">
              <User className="h-5 w-5 text-blue-500" />
              <p>{booking.attendeeName}</p>
            </div>
            <div className="flex items-center gap-4">
              <Mail className="h-5 w-5 text-blue-500" />
              <p className="text-muted-foreground">{booking.attendeeEmail}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Button
          variant="outline"
          className="w-full bg-white hover:bg-gray-50 text-blue-600 border-blue-200"
          onClick={addToGoogleCalendar}
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Add to Google Calendar
        </Button>

        <Button
          variant="outline"
          className="w-full bg-white hover:bg-gray-50 text-blue-600 border-blue-200"
          onClick={downloadICSFile}
        >
          <Download className="mr-2 h-4 w-4" /> Download ICS File
        </Button>
      </div>
    </div>
  );
}