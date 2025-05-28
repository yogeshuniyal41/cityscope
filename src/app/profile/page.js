"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
export default function Profile() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false); //  Controls edit mode
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [country, setCountry] = useState("");
  const [mobile, setMobile] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchUserAndPosts = async () => {
      try {
        const res = await fetch("/api/check-auth", { credentials: "include" });
        const data = await res.json();
        if (!res.ok || !data.authenticated) throw new Error("Authentication failed");

        setUser(data);
        setFirstName(data.firstName || "");
        setLastName(data.lastName || "");
        setCountry(data.country || "");
        setMobile(data.mobile || "");

        const postsRes = await fetch(`/api/posts?userId=${data.userId}`);
        const postsData = await postsRes.json();
        setPosts(postsData);
      } catch (error) {
        console.error("Error fetching profile:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndPosts();
  }, [router]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const updateData = {userId: user.userId, firstName, lastName, country, mobile };
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
      if (!res.ok) throw new Error("Profile update failed");
      const updatedUser = await res.json();
      setUser(updatedUser);
      setEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  if (loading) return <p className="text-center text-gray-500">Loading...</p>;
  if (!user) return <p className="text-center text-red-500">User not found</p>;

  return (
    <>
      <Navbar userId={user.userId}></Navbar>
    <main className="max-w-2xl mx-auto p-6">
      {/* Profile Card */}
      <div className="bg-white shadow-lg rounded-lg p-6 flex flex-col items-center text-center mb-6">
       
        <h1 className="text-2xl font-bold text-gray-800">{user.firstName} {user.lastName}</h1>
        <p className="text-gray-600">{user.email}</p>
        <p className="text-sm text-gray-500 mt-2">{user.country || "Country not set"}</p>
        <p className="text-sm text-gray-500">{user.mobile || "Mobile number not set"}</p>
        <button onClick={() => setEditing(true)} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition">
          Edit Profile
        </button>
      </div>

      {/* Edit Profile Form (Only Visible When Editing) */}
      {editing && (
        <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Edit Profile</h2>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Country</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
              <input
                type="text"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex justify-between">
              <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition">
                Save Profile
              </button>
              <button onClick={() => setEditing(false)} className="bg-gray-400 text-white px-4 py-2 rounded-md hover:bg-gray-500 transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* User Posts */}
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Your Posts</h2>
      <div className="space-y-4">
        {posts.length > 0 ? (
          posts.map((post) => (
            <div key={post._id} className="bg-white p-4 rounded-lg shadow-md">
              <p className="text-gray-800">{post.text}</p>
              <span className="text-sm text-gray-500">{post.type}</span>
              <p className="text-xs text-gray-400">{post.city}</p>
              {post.imageUrl && <Image src={post.imageUrl} layout="responsive" height={300} width={500} alt="Post" className="mt-2 rounded-md max-h-60 object-cover shadow-sm" />}
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">No posts yet.</p>
        )}
      </div>
    </main></>
  
  );
}