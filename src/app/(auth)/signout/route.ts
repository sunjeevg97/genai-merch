/**
 * Sign Out API Route
 *
 * Handles user sign out and redirects to home page
 */

import { signOut } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    await signOut();
    return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_APP_URL!));
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to sign out" },
      { status: 500 }
    );
  }
}

// Also support GET for simple link-based signout
export async function GET() {
  try {
    await signOut();
    return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_APP_URL!));
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to sign out" },
      { status: 500 }
    );
  }
}
