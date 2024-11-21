'use client';

import { useAuth } from '@clerk/nextjs';
import Link from "next/link";
import { useEffect, useState } from "react";
import { getUserEventTypes } from "@/actions/event-types";
import { getUpcomingBookings } from "@/actions/bookings";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { checkGoogleCalendarConnection } from "@/actions/google-calendar";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Calendar, Clock, Users, Link as LinkIcon, Video } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface EventType {
  id: string;
  name: string;
  description: string | null;
  durationInMinutes: number;
  isActive: boolean;
}

interface Booking {
  id: string;
  startTime: Date;
  endTime: Date;
  attendeeName: string;
  attendeeEmail: string;
  googleMeetLink: string | null;
  event: {
    name: string;
    description: string | null;
  };
}

export default function DashboardPage() {
  const { userId } = useAuth();
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean>(true);
  const [googleAuthUrl, setGoogleAuthUrl] = useState<string>("");

  useEffect(() => {
    async function checkGoogleConnection() {
      if (!userId) return;
      try {
        const { connected, authUrl } = await checkGoogleCalendarConnection();
        setIsGoogleConnected(connected);
        if (authUrl) setGoogleAuthUrl(authUrl);
      } catch (error) {
        console.error('Failed to check Google Calendar connection:', error);
      }
    }
    checkGoogleConnection();
  }, [userId]);

  useEffect(() => {
    async function loadEventTypes() {
      if (!userId) return;
      try {
        const result = await getUserEventTypes(userId);
        if (result.error) {
          setError(result.error);
          return;
        }
        setEventTypes(result.data || []);
      } catch (error) {
        console.error("Failed to load event types:", error);
        setError("Failed to load event types");
      } finally {
        setLoading(false);
      }
    }
    loadEventTypes();
  }, [userId]);

  useEffect(() => {
    async function loadUpcomingBookings() {
      if (!userId) return;
      try {
        const result = await getUpcomingBookings(userId);
        if (result.error) {
          setBookingsError(result.error);
          return;
        }
        setBookings(result.data || []);
      } catch (error) {
        console.error("Failed to load upcoming bookings:", error);
        setBookingsError("Failed to load upcoming bookings");
      } finally {
        setLoadingBookings(false);
      }
    }
    loadUpcomingBookings();
  }, [userId]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Google Calendar Alert */}
        {!isGoogleConnected && googleAuthUrl && (
          <Alert className="mb-6 flex items-center bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md shadow-sm">
            <Calendar className="h-6 w-6 text-yellow-600 mr-3" />
            <div className="flex-1">
              <AlertTitle className="text-lg font-semibold text-yellow-800">Connect Google Calendar</AlertTitle>
              <AlertDescription className="text-yellow-700">Sync your events automatically with Google Calendar.</AlertDescription>
            </div>
            <Button asChild variant="outline" className="ml-4 bg-yellow-600 text-white hover:bg-yellow-700">
              <Link href={googleAuthUrl}>Connect Now</Link>
            </Button>
          </Alert>
        )}

        {/* Event Types Grid */}
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {/* Create Event Type Card */}
          <Card className="bg-white rounded-lg border-2 border-dashed border-gray-200 hover:border-blue-500 transition-colors">
            <Link href="/dashboard/event-types/new">
              <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px] cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                  <Plus className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-sm font-medium text-gray-600">Create New Event Type</p>
              </CardContent>
            </Link>
          </Card>

          {/* Event Type Cards */}
          {loading ? (
            <div className="col-span-full flex items-center justify-center h-64">
              <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            </div>
          ) : error ? (
            <div className="col-span-full">
              <Alert variant="destructive" className="shadow-md">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          ) : eventTypes.map((eventType) => (
            <Card key={eventType.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
              <CardHeader className="p-4">
                <CardTitle className="flex justify-between items-center">
                  <span className="text-xl font-semibold text-gray-800">{eventType.name}</span>
                  <Badge variant={eventType.isActive ? "success" : "secondary"}>
                    {eventType.isActive ? "Active" : "Inactive"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-sm text-gray-600 mb-4">
                  {eventType.description || "No description provided"}
                </p>
                <div className="flex items-center text-sm text-gray-600 space-x-6">
                  <div className="flex items-center">
                    <Clock className="mr-2 h-5 w-5 text-blue-500" />
                    {eventType.durationInMinutes} minutes
                  </div>
                  <div className="flex items-center">
                    <Users className="mr-2 h-5 w-5 text-blue-500" />
                    1-on-1
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end items-center p-4 bg-gray-50">
                <Button asChild variant="ghost" className="text-blue-600 hover:text-blue-700">
                  <Link href={`/dashboard/event-types/${eventType.id}`}>
                    Edit
                  </Link>
                </Button>
                <Button asChild variant="outline" className="ml-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white">
                  <Link href={`/book/${eventType.id}`}>
                    <LinkIcon className="mr-2 h-5 w-5" /> Copy Link
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Upcoming Events Section */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Upcoming Events</h2>
          <div className="bg-white rounded-lg shadow">
            {loadingBookings ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
              </div>
            ) : bookingsError ? (
              <div className="p-6">
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{bookingsError}</AlertDescription>
                </Alert>
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming events</h3>
                <p className="text-gray-600">When people book time with you, their scheduled events will appear here.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {bookings.map((booking) => (
                  <div key={booking.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">
                          {booking.event.name}
                        </h3>
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-4 w-4 mr-2" />
                            {format(new Date(booking.startTime), "EEEE, MMMM d, yyyy")}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Clock className="h-4 w-4 mr-2" />
                            {format(new Date(booking.startTime), "h:mm a")} - {format(new Date(booking.endTime), "h:mm a")}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Users className="h-4 w-4 mr-2" />
                            {booking.attendeeName} ({booking.attendeeEmail})
                          </div>
                        </div>
                      </div>
                      {booking.googleMeetLink && (
                        <Button 
                          asChild 
                          variant="outline" 
                          className="ml-4 text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          <Link href={booking.googleMeetLink} target="_blank">
                            <Video className="h-4 w-4 mr-2" />
                            Join Meet
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
