'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getEventType, updateEventType, deleteEventType } from "@/actions/event-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Share2, ArrowLeft, Clock, Trash2, Save } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface EventType {
  id: string;
  name: string;
  description: string | null;
  durationInMinutes: number;
  isActive: boolean;
}

export default function EventTypePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [eventType, setEventType] = useState<EventType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    loadEventType();
  }, [params.id]);

  async function loadEventType() {
    if (!params.id || typeof params.id !== 'string') return;

    try {
      const result = await getEventType(params.id);
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
        if (result.error === "Event type not found" || result.error === "Unauthorized") {
          router.push("/dashboard/event-types");
        }
        return;
      }
      setEventType(result.data);
    } catch (error) {
      console.error("Failed to load event type:", error);
      toast({
        title: "Error",
        description: "Failed to load event type",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!eventType) return;

    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      id: eventType.id,
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      durationInMinutes: parseInt(formData.get('durationInMinutes') as string),
      isActive: formData.get('isActive') === 'on',
    };

    try {
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
      setEventType(result.data);
    } catch (error) {
      console.error("Failed to update event type:", error);
      toast({
        title: "Error",
        description: "Failed to update event type",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!eventType) return;

    try {
      const result = await deleteEventType(eventType.id);
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
      router.push("/dashboard/event-types");
    } catch (error) {
      console.error("Failed to delete event type:", error);
      toast({
        title: "Error",
        description: "Failed to delete event type",
        variant: "destructive",
      });
    } finally {
      setShowDeleteModal(false);
    }
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-6 p-8 pt-6">
        <Skeleton className="h-10 w-1/3 rounded-md" />
        <Card className="shadow-sm">
          <CardHeader className="p-4">
            <Skeleton className="h-6 w-1/4 rounded-md" />
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-24 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
          </CardContent>
          <CardFooter className="p-4 flex justify-end space-x-2">
            <Skeleton className="h-10 w-24 rounded-md" />
            <Skeleton className="h-10 w-32 rounded-md" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!eventType) {
    return null;
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 min-h-screen">
      {/* Header Section */}
      <div className="flex items-center justify-between bg-white p-6 rounded-lg shadow-sm">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Edit Event Type</h2>
          <p className="text-gray-600 mt-1">
            Customize your event type details and settings.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/event-types")}
          className="flex items-center text-blue-600 border-blue-600 hover:bg-blue-50"
        >
          <ArrowLeft className="mr-2 h-5 w-5" /> Back to Event Types
        </Button>
      </div>

      {/* Form Section */}
      <Card className="mt-6 shadow-sm">
        <form onSubmit={handleSubmit}>
          <CardHeader className="bg-gray-50 p-4 rounded-t-lg">
            <CardTitle className="flex items-center justify-between">
              <span className="text-xl font-semibold text-gray-800">{eventType.name}</span>
              <Badge variant={eventType.isActive ? "success" : "secondary"}>
                {eventType.isActive ? "Active" : "Inactive"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Name Field */}
            <div className="space-y-1">
              <Label htmlFor="name" className="text-gray-700">Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={eventType.name}
                required
                className="mt-1"
              />
            </div>
            {/* Description Field */}
            <div className="space-y-1">
              <Label htmlFor="description" className="text-gray-700">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={eventType.description || ''}
                rows={4}
                className="mt-1"
              />
            </div>
            {/* Duration Field */}
            <div className="space-y-1">
              <Label htmlFor="durationInMinutes" className="text-gray-700 flex items-center">
                <Clock className="mr-2 h-5 w-5 text-blue-500" /> Duration (minutes)
              </Label>
              <Input
                id="durationInMinutes"
                name="durationInMinutes"
                type="number"
                defaultValue={eventType.durationInMinutes}
                required
                min="1"
                className="mt-1"
              />
            </div>
            {/* Active Switch */}
            <div className="flex items-center mt-4">
              <Switch
                id="isActive"
                name="isActive"
                defaultChecked={eventType.isActive}
                className="mr-2"
              />
              <Label htmlFor="isActive" className="text-gray-700">Active</Label>
            </div>
          </CardContent>
          <CardFooter className="flex flex-row justify-between items-center p-4 bg-gray-50 rounded-b-lg">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const bookingLink = `${window.location.origin}/book/${eventType.id}`;
                navigator.clipboard.writeText(bookingLink);
                toast({
                  title: "Success",
                  description: "Booking link copied to clipboard",
                });
              }}
              className="flex items-center text-blue-600 border-blue-600 hover:bg-blue-50"
            >
              <Share2 className="mr-2 h-5 w-5" /> Share Booking Link
            </Button>
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center bg-red-600 text-white hover:bg-red-700"
              >
                <Trash2 className="mr-2 h-5 w-5" /> Delete
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="flex items-center bg-blue-600 text-white hover:bg-blue-700"
              >
                <Save className="mr-2 h-5 w-5" /> {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>

      {/* Deletion Confirmation Modal */}
      {showDeleteModal && (
        <Modal onClose={() => setShowDeleteModal(false)}>
          <ModalHeader>
            <h3 className="text-xl font-semibold">Confirm Deletion</h3>
          </ModalHeader>
          <ModalBody>
            <p>Are you sure you want to delete this event type? This action cannot be undone.</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </ModalFooter>
        </Modal>
      )}

      {/* Alert Section */}
      <Alert className="mt-6 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md">
        <div className="flex items-center">
          <AlertTitle className="text-blue-800 font-semibold">Booking Page Preview</AlertTitle>
        </div>
        <AlertDescription className="mt-2 text-blue-700 flex items-center justify-between">
          <span>View how your event type appears to invitees.</span>
          <Button
            variant="outline"
            className="text-blue-600 border-blue-600 hover:bg-blue-50 ml-4"
            onClick={() => window.open(`/book/${eventType.id}`, '_blank')}
          >
            Open Preview
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}
