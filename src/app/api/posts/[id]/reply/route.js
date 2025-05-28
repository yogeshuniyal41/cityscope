import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Post from '@/Models/Post';
import mongoose from 'mongoose';

export async function POST(req, context) {
  try {
    await connectDB();
  } catch (dbError) {
    console.error("Database connection error:", dbError);
    return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
  }

  const params = await context.params; //  Explicitly await params
  

  const postId = params?.id; // Extract postId correctly

  if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
    return NextResponse.json({ error: "Invalid or missing post ID" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { text } = body;

    if (!text || text.trim() === '') {
      return NextResponse.json({ error: "Reply text is required" }, { status: 400 });
    }

    const reply = {
      _id: new mongoose.Types.ObjectId(),
      text,
      createdAt: new Date(),
    };

    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { $push: { replies: reply } },
      { new: true }
    );

    if (!updatedPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Reply added", reply });
  } catch (error) {
    console.error("Reply API Error:", error);
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 });
  }
}