import { connectDB } from '@/lib/db';
import mongoose from 'mongoose';
import Post from '@/Models/Post';

export async function POST(req, context) { 
  try {
    await connectDB();
  } catch (dbError) {
    return new Response(JSON.stringify({ message: "Database connection failed" }), { status: 500 });
  }

  const  params  = await context.params;
  const postId = params?.id;

  if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
    return new Response(JSON.stringify({ message: "Invalid post ID" }), { status: 400 });
  }

  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return new Response(JSON.stringify({ message: "Invalid user ID" }), { status: 400 });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return new Response(JSON.stringify({ message: "Post not found" }), { status: 404 });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const hasLiked = post.likes.some(id => id.equals(userObjectId));
    const hasDisliked = post.dislikes.some(id => id.equals(userObjectId));

    if (hasDisliked) {
      post.dislikes = post.dislikes.filter(id => !id.equals(userObjectId));
    } else {
      post.dislikes.push(userObjectId);
      post.likes = post.likes.filter(id => !id.equals(userObjectId)); // Remove like if it exists
    }

    await post.save();
    return new Response(JSON.stringify({ message: "Dislike updated", dislikes: post.dislikes.length }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ message: "Error processing request", error: error.message }), { status: 500 });
  }
}