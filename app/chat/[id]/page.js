"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams } from "next/navigation";

export default function ProfilePage() {
  const { id } = useParams(); // ID of profile being viewed

  const [profile, setProfile] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    getCurrentUser();
    fetchProfile();
  }, []);

  // ✅ Get logged in user
  async function getCurrentUser() {
    const { data } = await supabase.auth.getUser();
    setCurrentUser(data.user);
  }

  // ✅ Fetch profile you're viewing
  async function fetchProfile() {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    setProfile(data);
  }

  // ✅ Send collaboration request
  async function sendCollabRequest() {
    if (!currentUser || !profile) return;

    const { error } = await supabase
      .from("collab_requests")
      .insert({
        sender_id: currentUser.id,
        receiver_id: profile.id,
        message: "Let's collaborate!",
        status: "pending"
      });

    if (!error) {
      alert("🤝 Collaboration request sent!");
    } else {
      alert("Error sending request");
      console.log(error);
    }
  }

  if (!profile) return null;

  return (
    <div style={{ padding: 20 }}>
      <h2>{profile.username}</h2>

      {/* ✅ SHOW BUTTON ONLY IF NOT YOUR PROFILE */}
      {currentUser?.id !== profile.id && (
        <button
          onClick={sendCollabRequest}
          style={{
            padding: 10,
            background: "black",
            color: "white",
            borderRadius: 8
          }}
        >
          🤝 Collaborate
        </button>
      )}
    </div>
  );
}