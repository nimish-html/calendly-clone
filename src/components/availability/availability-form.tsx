"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { Copy, Plus, Trash2, Loader2, Check } from "lucide-react";
import { useAuth } from "@clerk/nextjs";

const timeSlotSchema = z.object({
  id: z.string().optional(),
  dayOfWeek: z.string(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  enabled: z.boolean().default(true),
});

const dayScheduleSchema = z.object({
  dayOfWeek: z.string(),
  enabled: z.boolean().default(true),
  slots: z.array(timeSlotSchema),
});

const availabilityFormSchema = z.object({
  timezone: z.string(),
  days: z.array(dayScheduleSchema),
});

type AvailabilityFormValues = z.infer<typeof availabilityFormSchema>;

const weekDays = [
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
  { value: "0", label: "Sunday" },
];

export function AvailabilityForm({ initialSchedule, userId }: { initialSchedule: any; userId: string }) {
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [changedDays, setChangedDays] = useState<Set<string>>(new Set());
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [editingSlot, setEditingSlot] = useState<number | null>(null);

  const form = useForm<AvailabilityFormValues>({
    resolver: zodResolver(availabilityFormSchema),
    defaultValues: {
      timezone: initialSchedule?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      days: weekDays.map(day => {
        const daySlots = initialSchedule?.availability?.filter((slot: any) => 
          slot.dayOfWeek === parseInt(day.value)
        ) || [];

        return {
          dayOfWeek: day.value,
          enabled: daySlots.length > 0,
          slots: daySlots.length > 0 ? daySlots.map((slot: any) => ({
            id: slot.id,
            dayOfWeek: String(slot.dayOfWeek),
            startTime: slot.startTime,
            endTime: slot.endTime,
            enabled: true,
          })) : [{
            dayOfWeek: day.value,
            startTime: "09:00",
            endTime: "17:00",
            enabled: true,
          }],
        };
      }),
    },
  });

  // Track form changes
  useEffect(() => {
    const subscription = form.watch(() => {
      if (form.formState.isDirty) {
        setIsSaved(false);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const copyAvailability = (fromDay: string) => {
    const days = form.getValues('days');
    const sourceDay = days.find(d => d.dayOfWeek === fromDay);
    if (!sourceDay) return;

    weekDays.forEach((day) => {
      if (day.value !== fromDay) {
        const dayIndex = days.findIndex(d => d.dayOfWeek === day.value);
        const sourceDaySlots = sourceDay.slots.map(slot => ({
          ...slot,
          dayOfWeek: day.value
        }));
        form.setValue(`days.${dayIndex}.slots`, sourceDaySlots, { shouldDirty: true });
        form.setValue(`days.${dayIndex}.enabled`, sourceDay.enabled, { shouldDirty: true });
        setChangedDays(prev => new Set(prev.add(day.value)));
      }
    });
    
    form.trigger();
  };

  async function onSubmit(data: AvailabilityFormValues) {
    setIsLoading(true);
    setIsSaved(false);
    try {
      const token = await getToken();
      
      // Prepare the data for submission
      const formattedData = {
        userId,
        timezone: data.timezone,
        days: data.days.map(day => ({
          ...day,
          dayOfWeek: parseInt(day.dayOfWeek),
          slots: day.slots.map(slot => ({
            ...slot,
            dayOfWeek: parseInt(slot.dayOfWeek),
            startTime: slot.startTime.includes(':') ? slot.startTime : `${slot.startTime}:00`,
            endTime: slot.endTime.includes(':') ? slot.endTime : `${slot.endTime}:00`,
          }))
        }))
      };

      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formattedData),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update availability');
      }

      setIsSaved(true);
      toast({
        title: "Success",
        description: "Your availability has been updated.",
      });
      // Clear changed days after successful save
      setChangedDays(new Set());
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Weekly Hours */}
        <div className="space-y-4">
          {weekDays.map((day, index) => {
            const daySchedule = form.getValues(`days.${index}`);
            return (
              <div key={day.value} className="flex items-center space-x-4 p-4 bg-white rounded-lg border">
                <div className="flex items-center space-x-2 w-48">
                  <FormField
                    control={form.control}
                    name={`days.${index}.enabled`}
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <Switch
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            setChangedDays(prev => new Set(prev.add(day.value)));
                          }}
                        />
                        <FormLabel className="font-medium">{day.label}</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex-1">
                  {daySchedule.slots.map((slot, slotIndex) => (
                    <div key={slotIndex} className="flex items-center space-x-4 mb-2">
                      <div className="flex items-center space-x-2">
                        <Input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) => {
                            form.setValue(`days.${index}.slots.${slotIndex}.startTime`, e.target.value);
                            setChangedDays(prev => new Set(prev.add(day.value)));
                          }}
                          className="w-32"
                        />
                        <span>-</span>
                        <Input
                          type="time"
                          value={slot.endTime}
                          onChange={(e) => {
                            form.setValue(`days.${index}.slots.${slotIndex}.endTime`, e.target.value);
                            setChangedDays(prev => new Set(prev.add(day.value)));
                          }}
                          className="w-32"
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => copyAvailability(day.value)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const slots = form.getValues(`days.${index}.slots`);
                            form.setValue(`days.${index}.slots`, [
                              ...slots,
                              {
                                dayOfWeek: day.value,
                                startTime: "09:00",
                                endTime: "17:00",
                                enabled: true,
                              }
                            ]);
                            setChangedDays(prev => new Set(prev.add(day.value)));
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        {slotIndex > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const slots = form.getValues(`days.${index}.slots`);
                              form.setValue(
                                `days.${index}.slots`,
                                slots.filter((_, i) => i !== slotIndex)
                              );
                              setChangedDays(prev => new Set(prev.add(day.value)));
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Time Zone Settings */}
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="timezone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Timezone</FormLabel>
                <Select 
                  onValueChange={(value) => {
                    field.onChange(value);
                    setChangedDays(prev => new Set(prev.add('timezone')));
                  }} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your timezone" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Intl.supportedValuesOf('timeZone').map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2">
          <Button 
            type="submit" 
            disabled={isLoading || (!form.formState.isDirty && changedDays.size === 0)}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : isSaved ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Saved
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
