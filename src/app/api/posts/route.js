import { connectDB } from "@/lib/db";
import Post from "@/Models/Post";

export async function GET(req) {
  await connectDB();
 
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId"); 

  const filter = userId ? { userId } : {}; 
  const posts = await Post.find(filter).sort({ createdAt: -1 });
  

  return Response.json(posts);
}
export async function POST(req) {
  await connectDB();
  try {
    const body = await req.json();
     
    
    const post = await Post.create(body);
    
    
    return Response.json(post);
  } catch (error) {
    console.error("Error creating post:", error);
    return new Response(JSON.stringify({ message: "Failed to create post", error: error.message }), { status: 500 });
  }
}