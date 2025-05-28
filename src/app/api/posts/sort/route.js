import { connectDB } from '@/lib/db';
import Post from '@/Models/Post';

export async function GET(req) {
  try {
    await connectDB();
  } catch (dbError) {
    return new Response(JSON.stringify({ message: "Database connection failed" }), { status: 500 });
  }

  const url = new URL(req.url);
  const tag = url.searchParams.get("tag");
  const location = url.searchParams.get("location");
  const sortBy = url.searchParams.get("sortBy") || "createdAt"; 

  try {
    const filter = {};
    if (tag) filter.type = tag;
    if (location) filter.city = location;

    const posts = await Post.find(filter).sort({ [sortBy]: -1 }); 
    
    return new Response(JSON.stringify(posts), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ message: "Error fetching posts", error: error.message }), { status: 500 });
  }
}