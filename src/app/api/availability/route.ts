import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { updateAvailability, getAvailability } from "@/actions/availability";
import { getUserSchedule } from "@/actions/schedule";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    console.log('API: GET - User ID from auth:', userId);
    
    if (!userId) {
      console.error('API: GET - Unauthorized request - No user ID found');
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const result = await getAvailability(userId);
    console.log('API: GET - Schedule result:', result);
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result.schedule);
  } catch (error) {
    console.error('API: GET - Server error:', error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    console.log('API: User ID from auth:', userId);
    
    if (!userId) {
      console.error('API: Unauthorized request - No user ID found');
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    let body;
    try {
      body = await req.json();
      console.log('API: Received request body:', JSON.stringify(body, null, 2));
    } catch (e) {
      console.error('API: Failed to parse request body:', e);
      return NextResponse.json(
        { error: "Invalid request body", details: e instanceof Error ? e.message : "Failed to parse JSON" },
        { status: 400 }
      );
    }

    // Extract all enabled slots from the days array
    const slots = body.days
      .filter(day => day.enabled)
      .flatMap(day => 
        day.slots
          .filter(slot => slot.enabled)
          .map(slot => ({
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime.includes(':') ? slot.startTime : `${slot.startTime}:00`,
            endTime: slot.endTime.includes(':') ? slot.endTime : `${slot.endTime}:00`,
            enabled: true
          }))
      );

    const result = await updateAvailability(userId, {
      timezone: body.timezone,
      slots: slots,
      changedDays: body.days.map(day => day.dayOfWeek)
    });
    console.log('API: Update result:', result);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('API: Server error:', error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
