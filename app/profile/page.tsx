"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Profile() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: session } = await supabase.auth.getSession();

    if (!session.session) {
      router.push("/login");
      return;
    }

    const user = session.session.user;

    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (data) {
      setUsername(data.username || "");
      setBio(data.bio || "");
    }
  };

  const updateProfile = async () => {
    setLoading(true);

    const { data: session } = await supabase.auth.getSession();
    const user = session.session?.user;

    if (!user) return;

    await supabase
      .from("users")
      .update({
        username,
        bio,
      })
      .eq("id", user.id);

    alert("Profile updated!");
    setLoading(false);
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Edit Profile</h1>

      <input
        value={username}
        placeholder="Username"
        onChange={(e) => setUsername(e.target.value)}
      />

      <br /><br />

      <textarea
        value={bio}
        placeholder="Bio"
        onChange={(e) => setBio(e.target.value)}
      />

      <br /><br />

      <button onClick={updateProfile} disabled={loading}>
        {loading ? "Saving..." : "Save"}
      </button>
    </div>
  );
}