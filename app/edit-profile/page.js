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

  // New profile fields
  const [niche, setNiche] = useState("");
  const [skills, setSkills] = useState("");

  useEffect(() => {
    getProfile();
  }, []);

  // =====================
  // GET USER + PROFILE
  // =====================
  async function getProfile() {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      router.push("/login");
      return;
    }

    setUser(data.user);

    const { data: profile } = await supabase
      .from("profiles")
      .select("username, avatar_url, niche, skills")
      .eq("id", data.user.id)
      .single();

    if (profile) {
      setUsername(profile.username || "");
      setAvatarUrl(profile.avatar_url || "");
      setNiche(profile.niche || "");
      setSkills(profile.skills || "");
    }
  }

  // =====================
  // AVATAR UPLOAD
  // =====================
  async function uploadAvatar(e) {
    try {
      if (!user) {
        alert("User not loaded yet.");
        return;
      }

      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(true);

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.error(uploadError);
        alert(uploadError.message);
        return;
      }

      const { data } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      if (data?.publicUrl) {
        setAvatarUrl(data.publicUrl);
      }

    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed. Check console.");
    } finally {
      setUploading(false);
    }
  }

  // =====================
  // SAVE PROFILE
  // =====================
  async function saveProfile() {
    if (!user) return;

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      username: username,
      avatar_url: avatarUrl,
      niche: niche,
      skills: skills,
    });

    if (error) {
      console.error(error);
      alert("Failed to update profile.");
      return;
    }

    alert("Profile updated!");
    router.push("/dashboard");
  }

  return (
    <div className="ds-page">
      <div className="ds-card max-w-[500px]">
        <h2 className="ds-h2">✏️ Edit Profile</h2>

        {avatarUrl && (
          <img
            src={avatarUrl}
            width={120}
            height={120}
            alt="Avatar"
            className="ds-avatar mb-5 block"
          />
        )}

        {/* Avatar Upload */}
        <div className="ds-form-group">
          <label>Upload Avatar</label>
          <input
            type="file"
            onChange={uploadAvatar}
            className="ds-input"
            accept="image/*"
          />
          {uploading && (
            <p className="ds-text-muted mt-2">Uploading...</p>
          )}
        </div>

        {/* Username */}
        <div className="ds-form-group">
          <label>Username</label>
          <input
            className="ds-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
          />
        </div>

        {/* Niche */}
        <div className="ds-form-group">
          <label>Niche</label>
          <select
            className="ds-input"
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
          >
            <option value="">Select your niche</option>
            <option value="music">Music</option>
            <option value="dance">Dance</option>
            <option value="writing">Writing</option>
            <option value="art">Art</option>
            <option value="video">Video</option>
          </select>
        </div>

        {/* Skills */}
        <div className="ds-form-group">
          <label>Skills</label>
          <input
            className="ds-input"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="Singer, Editor, Poet..."
          />
        </div>

        <div className="ds-form-row mt-4">
          <button
            className="ds-btn ds-btn-primary"
            onClick={saveProfile}
          >
            Save Profile
          </button>

          <button
            className="ds-btn ds-btn-secondary"
            onClick={() => router.push("/dashboard")}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}