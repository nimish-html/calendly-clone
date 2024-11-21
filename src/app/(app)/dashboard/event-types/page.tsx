'use client';

import { useAuth } from '@clerk/nextjs';
import Link from "next/link";
import { useEffect, useState } from "react";
import { getUserEventTypes, updateEventType, deleteEventType } from "@/actions/event-types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Share2Icon, Pencil, Trash2, Plus, Clock, Calendar } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EventType {
  id: string;
  name: string;
  description: string | null;
  durationInMinutes: number;
  isActive: boolean;
}

export default function EventTypesPage() {
  const { userId } = useAuth();
  const { toast } = useToast();
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<EventType | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    loadEventTypes();
  }, [userId]);

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

  async function handleUpdateEventType(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingEvent) return;

    const formData = new FormData(e.currentTarget);
    const data = {
      id: editingEvent.id,
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      durationInMinutes: parseInt(formData.get('durationInMinutes') as string),
      isActive: editingEvent.isActive,
    };

    const result = await updateEventType(data);
    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Event type updated successfully",
    });
    setIsEditDialogOpen(false);
    loadEventTypes();
  }

  async function handleDeleteEventType(id: string) {
    if (!confirm("Are you sure you want to delete this event type?")) return;

    const result = await deleteEventType(id);
    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Event type deleted successfully",
    });
    loadEventTypes();
  }

  if (loading) {
    return (
      <div className="container mx-auto flex-1 space-y-6 pt-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Event Types</h2>
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" /> Create Event Type
          </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-4">
                <Skeleton className="h-6 w-2/3" />
              </CardHeader>
              <CardContent className="pb-4">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto flex-1 space-y-4 pt-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Event Types</h2>
        </div>
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex-1 space-y-6 pt-6 bg-gradient-to-b from-gray-50 to-white min-h-screen">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Event Types</h2>
        <Link href="/dashboard/event-types/new">
          <Button className="bg-blue-600 hover:bg-blue-700 transition-colors duration-200">
            <Plus className="mr-2 h-4 w-4" /> Create Event Type
          </Button>
        </Link>
      </div>

      {eventTypes.length === 0 ? (
        <Card className="border-dashed bg-gray-50 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Calendar className="h-16 w-16 text-blue-600 mb-6 animate-pulse" />
            <h3 className="text-2xl font-semibold text-gray-800 mb-2">No event types yet</h3>
            <p className="text-md text-muted-foreground mb-6 text-center max-w-md">
              Create your first event type to start scheduling meetings with ease
            </p>
            <Link href="/dashboard/event-types/new">
              <Button className="bg-blue-600 hover:bg-blue-700 transition-colors duration-200">
                <Plus className="mr-2 h-4 w-4" /> Create Your First Event Type
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[calc(100vh-12rem)]">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 pb-6">
            {eventTypes.map((eventType) => (
              <Card key={eventType.id} className="overflow-hidden transition-all duration-200 hover:shadow-lg hover:scale-105">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xl font-bold text-gray-800">{eventType.name}</CardTitle>
                    <Badge variant={eventType.isActive ? "default" : "secondary"}>
                      {eventType.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    {eventType.description || "No description provided"}
                  </p>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="mr-2 h-4 w-4 text-blue-500" />
                    {eventType.durationInMinutes} minutes
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      const bookingLink = `${window.location.origin}/book/${eventType.id}`;
                      navigator.clipboard.writeText(bookingLink);
                      toast({
                        title: "Success",
                        description: "Booking link copied to clipboard",
                      });
                    }}
                  >
                    <Share2Icon className="h-4 w-4 mr-2" /> Share
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setEditingEvent(eventType);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4 mr-2" /> Edit
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => handleDeleteEventType(eventType.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Event Type</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateEventType} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <Input
                id="name"
                name="name"
                defaultValue={editingEvent?.name}
                required
                className="mt-1"
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <Textarea
                id="description"
                name="description"
                defaultValue={editingEvent?.description || ''}
                className="mt-1"
              />
            </div>
            <div>
              <label htmlFor="durationInMinutes" className="block text-sm font-medium text-gray-700">
                Duration (minutes)
              </label>
              <Input
                id="durationInMinutes"
                name="durationInMinutes"
                type="number"
                defaultValue={editingEvent?.durationInMinutes}
                required
                min="1"
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}