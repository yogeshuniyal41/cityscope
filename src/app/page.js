"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Image from "next/image";

function HomeContent() {
  const [state, setState] = useState({
    userId: null,
    text: "",
    type: "Recommend a place",
    image: null,
    city: "",
    posts: [],
    loading: true,
    replyTexts: {},
  });

  const fileInputRef = useRef(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  const setPartialState = (partial) =>
    setState((prev) => ({ ...prev, ...partial }));

  useEffect(() => {
    let isMounted = true;

    const checkAuthAndInit = async () => {
      try {
        const authRes = await fetch("/api/check-auth", { credentials: "include" });
        const authData = await authRes.json();
        if (!authRes.ok || !authData.authenticated) {
          router.push("/login");
          return;
        }

        const userId = authData.userId;
        const [posts, city] = await Promise.all([fetchPosts(), getLocation()]);
        if (isMounted) {
          setPartialState({ userId, posts, city, loading: false });
        }
      } catch (error) {
        console.error("Auth or Init Error:", error);
        router.push("/login");
      }
    };

    checkAuthAndInit();

    return () => {
      isMounted = false;
    };
  }, [router, searchParams.toString()]); // Added searchParams as dependency so posts refetch on query change

  const getLocation = async () => {
    if (!navigator.geolocation) return "Unknown";

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async ({ coords }) => {
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`
            );
            const data = await res.json();
            resolve(
              data.address.city ||
                data.address.state_district ||
                data.address.county ||
                "Unknown"
            );
          } catch {
            resolve("Unknown");
          }
        },
        () => {
          // on error or permission denied
          resolve("Unknown");
        }
      );
    });
  };

  const fetchPosts = async () => {
    try {
      const query = searchParams.toString();
      const res = await fetch(`/api/posts/sort?${query}`);
      if (!res.ok) throw new Error("Failed to fetch posts");
      const data = await res.json();
      return data;
    } catch (err) {
      console.error("Failed to fetch posts", err);
      return [];
    }
  };

  const uploadImage = async () => {
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_PRESET;
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    if (!preset || !cloudName) {
      console.error("Missing Cloudinary environment variables.");
      return "";
    }

    const form = new FormData();
    form.append("file", state.image);
    form.append("upload_preset", preset);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: form }
    );
    if (!res.ok) {
      console.error("Failed to upload image");
      return "";
    }
    const data = await res.json();
    return data.secure_url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let imageUrl = "";
    if (state.image) imageUrl = await uploadImage();

    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: state.text,
        type: state.type,
        city: state.city,
        imageUrl,
        userId: state.userId,
      }),
    });

    if (!res.ok) {
      console.error("Failed to create post");
      return;
    }

    const updatedPosts = await fetchPosts();
    setPartialState({
      text: "",
      image: null,
      posts: updatedPosts,
    });
    if (fileInputRef.current) fileInputRef.current.value = null;
  };

  const updatePostAction = async (postId, endpoint) => {
    if (!state.userId) return;
    try {
      const res = await fetch(`/api/posts/${postId}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: state.userId }),
      });
      if (res.ok) {
        const updatedPosts = await fetchPosts();
        setPartialState({ posts: updatedPosts });
      } else {
        console.error(`Failed to ${endpoint} post, status: ${res.status}`);
      }
    } catch (error) {
      console.error(`Failed to ${endpoint} post`, error);
    }
  };

  const handleReplySubmit = async (postId) => {
    const replyText = state.replyTexts[postId];
    if (!replyText || replyText.trim() === "") return;
    try {
      const res = await fetch(`/api/posts/${postId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: replyText }),
      });
      if (res.ok) {
        const updatedPosts = await fetchPosts();
        setPartialState({
          replyTexts: { ...state.replyTexts, [postId]: "" },
          posts: updatedPosts,
        });
      } else {
        console.error("Failed to post reply, status:", res.status);
      }
    } catch (error) {
      console.error("Failed to post reply", error);
    }
  };

  if (state.loading) return null;

  return (
    <>
      <Navbar userId={state.userId} />
      <main className="max-w-2xl mx-auto p-6 bg-gray-50">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Cityscope Community
        </h1>
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-lg rounded-lg p-6 mb-8 space-y-4"
        >
          <textarea
            required
            value={state.text}
            onChange={(e) => setPartialState({ text: e.target.value })}
            maxLength={280}
            className="w-full border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-blue-400"
            placeholder="What's happening in your neighborhood?"
          />
          <select
            value={state.type}
            onChange={(e) => setPartialState({ type: e.target.value })}
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
              onChange={(e) => setPartialState({ image: e.target.files[0] })}
              className="hidden"
              ref={fileInputRef}
            />
          </label>
          <p className="text-sm text-gray-500">
            {state.image ? state.image.name : "No file chosen"}
          </p>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
          >
            Post
          </button>
        </form>

        <div className="space-y-6">
          {state.posts.length > 0 ? (
            state.posts.map((post) => (
              <div
                key={post._id}
                className="bg-white p-6 rounded-lg shadow-md"
              >
                <p className="text-gray-800 text-lg">{post.text}</p>
                <span className="text-sm text-gray-500">{post.type}</span>
                <p className="text-xs text-gray-400">{post.city}</p>
                {post.imageUrl && (
                  <Image
                    src={post.imageUrl}
                    alt="Post"
                    height={300}
                    width={500}
                    style={{ objectFit: "cover" }}
                    className="mt-3 rounded-lg w-full max-h-80 shadow-sm"
                    priority={false}
                  />
                )}
                <div className="flex items-center justify-between mt-3">
                  <button
                    onClick={() => updatePostAction(post._id, "like")}
                    className="text-green-500 font-semibold hover:text-green-600 transition"
                  >
                    👍 Like ({post.likes?.length || 0})
                  </button>
                  <button
                    onClick={() => updatePostAction(post._id, "dislike")}
                    className="text-red-500 font-semibold hover:text-red-600 transition"
                  >
                    👎 Dislike ({post.dislikes?.length || 0})
                  </button>
                </div>
                <div className="mt-4">
                  <h4 className="font-semibold text-gray-700 mb-2">Replies</h4>
                  {post.replies?.length > 0 ? (
                    <ul className="space-y-2 max-h-40 overflow-auto border border-gray-200 p-2 rounded-md bg-gray-50">
                      {post.replies.map((reply) => (
                        <li
                          key={reply._id}
                          className="p-3 bg-white rounded-md shadow-sm"
                        >
                          <p className="text-gray-700">{reply.text}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(reply.createdAt).toLocaleString()}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-400">No replies yet.</p>
                  )}
                  <div className="flex mt-2">
                    <input
                      type="text"
                      placeholder="Write a reply..."
                      value={state.replyTexts[post._id] || ""}
                      onChange={(e) =>
                        setPartialState({
                          replyTexts: {
                            ...state.replyTexts,
                            [post._id]: e.target.value,
                          },
                        })
                      }
                      className="flex-grow border border-gray-300 p-2 rounded-md shadow-sm focus:ring-2 focus:ring-blue-400"
                    />
                    <button
                      type="button"
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
            <p className="text-gray-500 text-center">
              No posts found for selected filters.
            </p>
          )}
        </div>
      </main>
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
