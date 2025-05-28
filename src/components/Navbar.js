"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function Navbar({ userId }) {
  const router = useRouter();

  // If no userId is provided, don't render anything.
  if (!userId) return null;

  // States for filter logic
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [availableCities, setAvailableCities] = useState([]);
  const [availableTypes, setAvailableTypes] = useState([]);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [filteredPosts, setFilteredPosts] = useState([]);

  // Fetch filters for posts
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const res = await fetch("/api/posts");
        if (!res.ok) throw new Error("Failed to fetch posts for filters");
        const data = await res.json();
        const cities = [...new Set(data.map((post) => post.city))];
        const types = [...new Set(data.map((post) => post.type))];
        setAvailableCities(cities);
        setAvailableTypes(types);
      } catch (error) {
        console.error("Error fetching filter data:", error);
      } finally {
        setLoadingFilters(false);
      }
    };

    fetchFilters();
  }, []);

  const handleLogout = async () => {
    if (!window.confirm("Are you sure you want to logout?")) return;
    try {
      await fetch("/api/logout", { method: "POST" });
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const applyFilters = async () => {
    const query = new URLSearchParams();
    if (selectedCity) query.set("location", selectedCity);
    if (selectedType) query.set("tag", selectedType);

    router.replace("/?" + query.toString());

    try {
      const res = await fetch(`/api/posts/sort?${query.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch sorted posts");
      const data = await res.json();
      setFilteredPosts(data);
    } catch (error) {
      console.error("Error fetching sorted posts:", error);
    }
  };

  return (
    <nav className="bg-gray-100 py-4 shadow-md">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4 px-4">
        {/* Navigation Links */}
        <div className="flex gap-6 text-lg font-medium">
          <Link href="/" className="hover:text-blue-500">
            Home
          </Link>
          <Link href="/profile" className="hover:text-blue-500">
            My Profile
          </Link>
        </div>

        {/* Filters (disabled while filter data is loading) */}
        <div className="flex items-center gap-4">
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            disabled={loadingFilters}
            className="border border-gray-300 rounded-md px-3 py-2 bg-white shadow-sm focus:outline-none focus:ring focus:ring-blue-300"
          >
            <option value="">All Cities</option>
            {availableCities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            disabled={loadingFilters}
            className="border border-gray-300 rounded-md px-3 py-2 bg-white shadow-sm focus:outline-none focus:ring focus:ring-blue-300"
          >
            <option value="">All Types</option>
            {availableTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <button
            onClick={applyFilters}
            className="bg-blue-500 text-white px-4 py-2 rounded-md shadow-sm hover:bg-blue-600 transition"
          >
            Apply Filters
          </button>

          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-md shadow-sm hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}