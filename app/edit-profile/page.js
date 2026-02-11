"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function EditProfile() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    getProfile();
  }, []);

  // ✅ GET USER + PROFILE
  async function getProfile() {
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      router.push("/login");
      return;
    }

    setUser(data.user);

    const { data: profile } = await supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", data.user.id)
      .single();

    if (profile) {
      setUsername(profile.username || "");
      setAvatarUrl(profile.avatar_url || "");
    }
  }

  // ✅ AVATAR UPLOAD
  async function uploadAvatar(e) {
    try {
      setUploading(true);

      const file = e.target.files[0];
      if (!file) return;

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}.${fileExt}`;

      // Upload to Supabase Storage
      const { error } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      const { data } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      setAvatarUrl(data.publicUrl);

    } catch (err) {
      alert("Upload failed");
      console.log(err);
    } finally {
      setUploading(false);
    }
  }

  // ✅ SAVE PROFILE
  async function saveProfile() {
    await supabase.from("profiles").upsert({
      id: user.id,
      username: username,
      avatar_url: avatarUrl,
    });

    alert("Profile updated!");
    router.push("/dashboard");
  }

  return (
    <div style={{ padding: 20, maxWidth: 500, margin: "auto" }}>
      <h2>✏️ Edit Profile</h2>

      {/* AVATAR PREVIEW */}
      {avatarUrl && (
        <img
          src={avatarUrl}
          width={120}
          height={120}
          style={{ borderRadius: "50%", marginBottom: 20 }}
        />
      )}

      {/* AVATAR UPLOAD */}
      <p>Upload Avatar</p>
      <input type="file" onChange={uploadAvatar} />
      {uploading && <p>Uploading...</p>}

      {/* USERNAME */}
      <p>Username</p>
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Enter username"
        style={{ width: "100%", padding: 8 }}
      />

      {/* SAVE */}
      <button
        onClick={saveProfile}
        style={{ marginTop: 20 }}
      >
        Save Profile
      </button>

      {/* BACK */}
      <button
        onClick={() => router.push("/dashboard")}
        style={{ marginLeft: 10 }}
      >
        Cancel
      </button>
    </div>
  );
}