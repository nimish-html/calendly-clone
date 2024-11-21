import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { addDateSpecificHours } from "@/actions/schedule";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    console.log('API: POST date-specific - User ID from auth:', userId);
    
    if (!userId) {
      console.error('API: POST date-specific - Unauthorized request - No user ID found');
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    console.log('API: POST date-specific - Request body:', body);

    const { date, slots } = body;
    
    if (!date || !slots) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await addDateSpecificHours(date, slots, userId);
    console.log('API: POST date-specific - Result:', result);
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('API: POST date-specific - Server error:', error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
