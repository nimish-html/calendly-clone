import { notFound } from "next/navigation";
import { db } from "@/db";
import { events } from "@/db/schema";
import { eq } from "drizzle-orm";
import { BookingForm } from "@/components/booking/booking-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, User } from 'lucide-react';

export default async function BookingPage({
  params,
}: {
  params: { eventId: string };
}) {
  const event = await db.query.events.findFirst({
    where: eq(events.id, params.eventId),
    columns: {
      id: true,
      name: true,
      description: true,
      isActive: true,
      clerkUserId: true,
      durationInMinutes: true,
    },
  });

  if (!event || !event.isActive) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-8">
      <div className="container max-w-3xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">{event.name}</h1>
          {event.description && (
            <p className="text-lg text-muted-foreground">{event.description}</p>
          )}
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="bg-blue-50 border-b border-blue-100">
            <CardTitle className="flex items-center justify-between text-blue-800">
              <span>Book Your Session</span>
              <Badge variant="secondary" className="text-blue-600 bg-blue-100">
                {event.durationInMinutes} minutes
              </Badge>
            </CardTitle>
            <CardDescription className="text-blue-600">
              Select a date and time that works for you
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <BookingForm event={event} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="mr-2 h-4 w-4 text-blue-500" />
              Duration: {event.durationInMinutes} minutes
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="mr-2 h-4 w-4 text-blue-500" />
              Flexible scheduling
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <User className="mr-2 h-4 w-4 text-blue-500" />
              One-on-one session
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}