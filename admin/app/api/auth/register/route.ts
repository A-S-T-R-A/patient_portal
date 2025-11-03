import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

// This is a simple registration endpoint for creating admin accounts
// In production, you might want to protect this or use a seed script
export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, password, and name are required" },
        { status: 400 }
      );
    }

    // Check if doctor already exists
    const existing = await prisma.doctor.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Doctor with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create doctor
    const doctor = await prisma.doctor.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
    });

    return NextResponse.json({
      success: true,
      doctor: { id: doctor.id, email: doctor.email, name: doctor.name },
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
