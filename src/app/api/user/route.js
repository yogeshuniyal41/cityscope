import { connectDB } from "@/lib/db";
import User from "@/Models/User";

export async function PUT(req) {
  await connectDB();

  try {
    const body = await req.json();
    const { userId, firstName, lastName, country, mobile } = body;

  
    if (!userId) {
      return new Response(JSON.stringify({ message: "User ID is required" }), { status: 400 });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { firstName, lastName, country, mobile },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return new Response(JSON.stringify({ message: "User not found" }), { status: 404 });
    }

    return new Response(JSON.stringify(updatedUser), { status: 200 });
  } catch (error) {
    console.error("Error updating profile:", error);
    return new Response(JSON.stringify({ message: "Error updating profile", error: error.message }), { status: 500 });
  }
}