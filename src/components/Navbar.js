"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

export default function Navbar({ userId }) {
  const router = useRouter();
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [availableCities, setAvailableCities] = useState([]);
  const [availableTypes, setAvailableTypes] = useState([]);
  const [loadingFilters, setLoadingFilters] = useState(true);

  const fetchFilterOptions = useCallback(async () => {
    try {
      const res = await fetch("/api/posts");
      if (!res.ok) throw new Error("Failed to fetch posts for filters");

      const data = await res.json();
      const cities = [...new Set(data.map((post) => post.city))];
      const types = [...new Set(data.map((post) => post.type))];

      setAvailableCities(cities);
      setAvailableTypes(types);
    } catch (err) {
      console.error("Error fetching filters:", err);
    } finally {
      setLoadingFilters(false);
    }
  }, []);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  const handleLogout = async () => {
    if (!confirm("Are you sure you want to logout?")) return;

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
      // const data = await res.json();
      // You can use `setFilteredPosts(data)` if needed
    } catch (error) {
      console.error("Error fetching sorted posts:", error);
    }
  };

  const FilterDropdown = ({ label, value, onChange, options, disabled }) => (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="border border-gray-300 rounded-md px-3 py-2 bg-white shadow-sm focus:outline-none focus:ring focus:ring-blue-300"
    >
      <option value="">{`All ${label}`}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );

  if (!userId) return null;

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

        {/* Filters & Actions */}
        <div className="flex items-center gap-4">
          <FilterDropdown
            label="Cities"
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            options={availableCities}
            disabled={loadingFilters}
          />

          <FilterDropdown
            label="Types"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            options={availableTypes}
            disabled={loadingFilters}
          />

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
