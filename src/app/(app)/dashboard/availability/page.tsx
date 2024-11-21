'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from "next/navigation";
import { AvailabilityForm } from "@/components/availability/availability-form";
import { getUserSchedule } from "@/actions/schedule";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Clock, AlertCircle, Globe } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarIcon, Plus, Trash2 } from 'lucide-react';
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar as DatePickerCalendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { addDateSpecificHours } from "@/actions/schedule";
import { toast } from "@/components/ui/use-toast";
import { useState, useEffect } from "react";

interface Schedule {
  id: string;
  clerkUserId: string;
  timezone: string;
  availability: {
    id: string;
    scheduleId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }[];
  dateSpecificHours: {
    id: string;
    scheduleId: string;
    date: string;
    startTime: string;
    endTime: string;
  }[];
}

export default function AvailabilityPage() {
  const { userId, isLoaded, isSignedIn, getToken } = useAuth();
  const router = useRouter();
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [timeSlots, setTimeSlots] = useState([{ startTime: "09:00", endTime: "17:00" }]);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }

    async function fetchSchedule() {
      try {
        setLoading(true);
        const token = await getToken();
        const response = await fetch('/api/availability', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            // Unauthorized - redirect to sign in
            router.push('/sign-in');
            return;
          }
          throw new Error(`Failed to load schedule: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
          setError(data.error);
          toast({
            title: "Error",
            description: data.error,
            variant: "destructive",
          });
        } else {
          setSchedule(data);
        }
      } catch (err) {
        console.error("Error loading schedule:", err);
        setError(err instanceof Error ? err.message : "Failed to load schedule");
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to load schedule",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchSchedule();
    }
  }, [isLoaded, isSignedIn, userId, router, getToken]);

  const handleAddDateSpecificHours = async () => {
    if (!selectedDate) return;

    try {
      console.log('Adding date-specific hours:', {
        date: selectedDate.toISOString().split('T')[0],
        timeSlots
      });

      // Get the auth token
      const token = await getToken();
      
      // Call the API endpoint instead of the server action directly
      const response = await fetch('/api/availability/date-specific', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: selectedDate.toISOString().split('T')[0],
          slots: timeSlots,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add date-specific hours');
      }

      const result = await response.json();
      console.log('Result from API:', result);

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Date-specific hours added successfully",
        });
        setIsDialogOpen(false);
        
        // Refresh the schedule data
        const scheduleResponse = await fetch('/api/availability', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (!scheduleResponse.ok) {
          throw new Error('Failed to refresh schedule');
        }
        
        const data = await scheduleResponse.json();
        if (data.error) {
          throw new Error(data.error);
        }
        
        setSchedule(data);
      }
    } catch (error) {
      console.error('Error in handleAddDateSpecificHours:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add date-specific hours",
        variant: "destructive",
      });
    }
  };

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Availability Settings</h2>
          <p className="text-lg text-muted-foreground">
            Customize your availability to streamline your scheduling process.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Weekly Availability - Left Column (2/3 width) */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <CardHeader className="bg-blue-50 border-b border-blue-100">
                <CardTitle className="flex items-center text-blue-800">
                  <Clock className="mr-2 h-5 w-5" />
                  Weekly Hours
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                ) : error ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : (
                  <AvailabilityForm 
                    initialSchedule={schedule} 
                    userId={userId}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Date-Specific Hours - Right Column (1/3 width) */}
          <div>
            <Card>
              <CardHeader className="bg-blue-50 border-b border-blue-100">
                <CardTitle className="flex items-center text-blue-800">
                  <CalendarIcon className="mr-2 h-5 w-5" />
                  Date-Specific Hours
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full" variant="outline">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Date-Specific Hours
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Date-Specific Hours</DialogTitle>
                      <DialogDescription>
                        Set custom hours for a specific date that override your regular weekly schedule.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Select Date</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !selectedDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <DatePickerCalendar
                              mode="single"
                              selected={selectedDate}
                              onSelect={setSelectedDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-4">
                        {timeSlots.map((slot, index) => (
                          <div key={index} className="flex items-center space-x-4">
                            <div className="flex-1 space-y-2">
                              <label className="text-sm font-medium">Time Slot {index + 1}</label>
                              <div className="flex items-center space-x-2">
                                <Input
                                  type="time"
                                  value={slot.startTime}
                                  onChange={(e) => {
                                    const newSlots = [...timeSlots];
                                    newSlots[index].startTime = e.target.value;
                                    setTimeSlots(newSlots);
                                  }}
                                  className="w-32"
                                />
                                <span>-</span>
                                <Input
                                  type="time"
                                  value={slot.endTime}
                                  onChange={(e) => {
                                    const newSlots = [...timeSlots];
                                    newSlots[index].endTime = e.target.value;
                                    setTimeSlots(newSlots);
                                  }}
                                  className="w-32"
                                />
                              </div>
                            </div>
                            {index > 0 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setTimeSlots(slots => slots.filter((_, i) => i !== index));
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setTimeSlots(slots => [...slots, { startTime: "09:00", endTime: "17:00" }]);
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Time Slot
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddDateSpecificHours}
                        disabled={!selectedDate}
                      >
                        Save
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Display existing date-specific hours */}
                {schedule?.dateSpecificHours && schedule.dateSpecificHours.length > 0 && (
                  <div className="mt-4 space-y-4">
                    <h3 className="font-medium">Existing Date-Specific Hours</h3>
                    <div className="space-y-3">
                      {schedule.dateSpecificHours.map((hours) => (
                        <div
                          key={hours.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div>
                            <p className="font-medium text-gray-900">
                              {new Date(hours.date).toLocaleDateString(undefined, {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                            <p className="text-sm text-gray-600">
                              {hours.startTime} - {hours.endTime}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              try {
                                const token = await getToken();
                                const response = await fetch('/api/availability/date-specific', {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`,
                                  },
                                  body: JSON.stringify({
                                    date: hours.date,
                                    slots: [], // Empty slots to remove the date-specific hours
                                  }),
                                });

                                if (!response.ok) {
                                  throw new Error('Failed to remove date-specific hours');
                                }

                                // Refresh the schedule data
                                const scheduleResponse = await fetch('/api/availability', {
                                  headers: {
                                    'Authorization': `Bearer ${token}`,
                                  },
                                });
                                
                                if (!scheduleResponse.ok) {
                                  throw new Error('Failed to refresh schedule');
                                }
                                
                                const data = await scheduleResponse.json();
                                if (data.error) {
                                  throw new Error(data.error);
                                }
                                
                                setSchedule(data);

                                toast({
                                  title: "Success",
                                  description: "Date-specific hours have been removed.",
                                });
                              } catch (error) {
                                console.error('Error removing date-specific hours:', error);
                                toast({
                                  title: "Error",
                                  description: error instanceof Error ? error.message : "Failed to remove date-specific hours",
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}