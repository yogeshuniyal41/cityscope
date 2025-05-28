"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function Home() {
  const [userId, setUserId] = useState(null);
  const [text, setText] = useState("");
  const [type, setType] = useState("Recommend a place");
  const [image, setImage] = useState(null);
  const [city, setCity] = useState("");
  const [posts, setPosts] = useState([]);
  const fileInputRef = useRef();
  const searchParams = useSearchParams();

  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // New state to hold replies text per post
  const [replyTexts, setReplyTexts] = useState({});

  useEffect(() => {
  const checkAuth = async () => {
    try {
      const res = await fetch("/api/check-auth", { credentials: "include" });
      const data = await res.json();

      if (!res.ok || !data.authenticated) {
        router.push("/login");
        return;
      }

      // Authenticated
      setUserId(data.userId)
      getLocation();
      fetchPosts();
      setLoading(false);
    } catch (error) {
      console.error("Auth check failed:", error);
      router.push("/login");
    }
  };

  checkAuth();
}, []);

const fetchFilteredPosts = async () => {
    const query = searchParams.toString(); // Get current filters from URL
    const res = await fetch(`/api/posts/sort?${query}`); // Uses sorted API
    const data = await res.json();
    setPosts(data);
  };

  //  Re-fetch posts whenever filters change
  useEffect(() => {
    fetchFilteredPosts();
  }, [searchParams]);

  const getLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
      );
      const data = await res.json();
      
      setCity(
        data.address.city ||
          data.address.state_district ||
          data.address.county||
          "Unknown"
      );
    });
  };

  const uploadImage = async () => {
    const form = new FormData();
    form.append("file", image);
    form.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_PRESET);
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: "POST", body: form }
    );
    const data = await res.json();
    return data.secure_url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let imageUrl = "";
    if (image) imageUrl = await uploadImage();
    await fetch("/api/posts", {
      method: "POST",
      body: JSON.stringify({ text, type, city, imageUrl,userId }),
      headers: { "Content-Type": "application/json" },
    });
    setText("");
    setImage(null);
    fileInputRef.current.value = null;
    fetchPosts();
  };

  const fetchPosts = async () => {
    const res = await fetch("/api/posts");
    const data = await res.json();
    setPosts(data);
  };
const handleLike = async (postId) => {
  
  if (!userId) {
    console.error("User ID missing.");
    return;
  }

  try {
    const res = await fetch(`/api/posts/${postId}/like`, {
      method: "POST",
      body: JSON.stringify({ userId }), 
      headers: { "Content-Type": "application/json" }
    });

    if (res.ok) fetchPosts();
  } catch (error) {
    console.error("Failed to like post", error);
  }
};

const handleDislike = async (postId) => {
 
  if (!userId) {
    console.error("User ID missing.");
    return;
  }

  try {
    const res = await fetch(`/api/posts/${postId}/dislike`, {
      method: "POST",
      body: JSON.stringify({ userId }), 
      headers: { "Content-Type": "application/json" }
    });

    if (res.ok) fetchPosts();
  } catch (error) {
    console.error("Failed to dislike post", error);
  }
};
  // New: handle reply input change per post
  const handleReplyChange = (postId, value) => {
    setReplyTexts((prev) => ({ ...prev, [postId]: value }));
  };

  // New: submit reply to API
  const handleReplySubmit = async (postId) => {
    const replyText = replyTexts[postId];
    if (!replyText || replyText.trim() === "") return;
    try {
      const res = await fetch(`/api/posts/${postId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: replyText }),
      });
      if (res.ok) {
        setReplyTexts((prev) => ({ ...prev, [postId]: "" }));
        fetchPosts();
      }
    } catch (error) {
      console.error("Failed to post reply", error);
    }
  };

  if (loading) return null;

 return (
  
  <> 
  <Navbar userId={userId}></Navbar>
   <main className="max-w-2xl mx-auto p-6 bg-gray-50">
    
    <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">Cityscope Community</h1>

    {/* Create Post */}
    <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg p-6 mb-8 space-y-4">
      <textarea
        required
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={280}
        className="w-full border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-blue-400"
        placeholder="What's happening in your neighborhood?"
      />
      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="w-full border border-gray-300 p-3 rounded-md bg-white shadow-sm"
      >
        <option>Recommend a place</option>
        <option>Ask for help</option>
        <option>Share a local update</option>
        <option>Event announcement</option>
      </select>

      <label className="block text-center bg-blue-500 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-blue-600 transition">
        Upload Image
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0])}
          className="hidden"
          ref={fileInputRef}
        />
      </label>
      <p className="text-sm text-gray-500">{image ? image.name : "No file chosen"}</p>

      <button className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition">
        Post
      </button>
    </form>

    {/* Posts List */}
    <div className="space-y-6">
      {posts.length > 0 ? (
        posts.map((post) => (
          <div key={post._id} className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-gray-800 text-lg">{post.text}</p>
            <span className="text-sm text-gray-500">{post.type}</span>
            <p className="text-xs text-gray-400">{post.city}</p>
            {post.imageUrl && (
              <img src={post.imageUrl} alt="Post" className="mt-3 rounded-lg w-full max-h-80 object-cover shadow-sm" />
            )}

            <div className="flex items-center justify-between mt-3">
              <button
                onClick={() => handleLike(post._id)}
                className="text-green-500 font-semibold hover:text-green-600 transition"
              >
                👍 Like ({post.likes?.length || 0})
              </button>
              <button
                onClick={() => handleDislike(post._id)}
                className="text-red-500 font-semibold hover:text-red-600 transition"
              >
                👎 Dislike ({post.dislikes?.length || 0})
              </button>
            </div>

            {/* Replies */}
            <div className="mt-4">
              <h4 className="font-semibold text-gray-700 mb-2">Replies</h4>
              {post.replies && post.replies.length > 0 ? (
                <ul className="space-y-2 max-h-40 overflow-auto border border-gray-200 p-2 rounded-md bg-gray-50">
                  {post.replies.map((reply) => (
                    <li key={reply._id} className="p-3 bg-white rounded-md shadow-sm">
                      <p className="text-gray-700">{reply.text}</p>
                      <p className="text-xs text-gray-500">{new Date(reply.createdAt).toLocaleString()}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400">No replies yet.</p>
              )}

              {/* Reply Box */}
              <div className="flex mt-2">
                <input
                  type="text"
                  placeholder="Write a reply..."
                  value={replyTexts[post._id] || ""}
                  onChange={(e) => handleReplyChange(post._id, e.target.value)}
                  className="flex-grow border border-gray-300 p-2 rounded-md shadow-sm focus:ring-2 focus:ring-blue-400"
                />
                <button
                  onClick={() => handleReplySubmit(post._id)}
                  className="ml-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
                >
                  Reply
                </button>
              </div>
            </div>
          </div>
        ))
      ) : (
        <p className="text-gray-500 text-center">No posts found for selected filters.</p>
      )}
    </div>
  </main></>

  
)};