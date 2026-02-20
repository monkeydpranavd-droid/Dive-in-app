"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function CreatePost() {
  const router = useRouter();

  const [caption, setCaption] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [skills, setSkills] = useState("");

  const [postType, setPostType] = useState("normal");
  const [lookingFor, setLookingFor] = useState("");
  const [projectGoal, setProjectGoal] = useState("");
  const [deadline, setDeadline] = useState("");

  const [niche, setNiche] = useState("music");

  const [loading, setLoading] = useState(false);

  const createPost = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Login required");
      setLoading(false);
      return;
    }

    let imageUrl = "";

    if (imageFile) {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("posts")
        .upload(fileName, imageFile);

      if (uploadError) {
        alert(uploadError.message);
        setLoading(false);
        return;
      }

      const { data } = supabase.storage
        .from("posts")
        .getPublicUrl(fileName);

      imageUrl = data.publicUrl;
    }

    const { error } = await supabase.from("posts").insert({
      user_id: user.id,
      caption,
      image_url: imageUrl,
      skills,
      post_type: postType,
      looking_for: postType === "collab" ? lookingFor : null,
      project_goal: postType === "collab" ? projectGoal : null,
      deadline: postType === "collab" ? deadline : null,
      niche,
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    alert("Post created!");
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-black text-white flex justify-center items-center px-4">
      <div className="w-full max-w-xl bg-zinc-900 p-8 rounded-2xl shadow-xl border border-zinc-800">

        <h1 className="text-2xl font-bold mb-6 text-center">
          🚀 Create Post
        </h1>

        {/* Post Type */}
        <div className="mb-4">
          <label className="text-sm text-zinc-400">Post Type</label>
          <select
            value={postType}
            onChange={(e) => setPostType(e.target.value)}
            className="w-full mt-1 p-3 bg-zinc-800 rounded-lg border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-purple-600"
          >
            <option value="normal">Normal Post</option>
            <option value="collab">Collaboration Request</option>
          </select>
        </div>

        {/* Niche */}
        <div className="mb-4">
          <label className="text-sm text-zinc-400">Niche</label>
          <select
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            className="w-full mt-1 p-3 bg-zinc-800 rounded-lg border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-purple-600"
          >
            <option value="music">🎵 Music</option>
            <option value="dance">💃 Dance</option>
            <option value="writing">✍️ Writing</option>
            <option value="art">🎨 Art</option>
            <option value="video">🎥 Video</option>
          </select>
        </div>

        {/* Caption */}
        <div className="mb-4">
          <label className="text-sm text-zinc-400">Caption</label>
          <textarea
            placeholder="What's on your mind?"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            className="w-full mt-1 p-3 bg-zinc-800 rounded-lg border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-purple-600 resize-none"
          />
        </div>

        {/* Image Upload */}
        <div className="mb-4">
          <label className="text-sm text-zinc-400">Upload Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                setImageFile(e.target.files[0]);
              }
            }}
            className="w-full mt-1 text-sm file:bg-purple-600 file:text-white file:border-0 file:px-4 file:py-2 file:rounded-lg file:cursor-pointer bg-zinc-800 rounded-lg border border-zinc-700"
          />
        </div>

        {/* Skills */}
        <div className="mb-4">
          <label className="text-sm text-zinc-400">Skills</label>
          <input
            placeholder="Singer, Editor, Dancer..."
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            className="w-full mt-1 p-3 bg-zinc-800 rounded-lg border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
        </div>

        {/* Collab Fields */}
        {postType === "collab" && (
          <div className="mt-6 p-4 bg-zinc-800 rounded-xl border border-purple-600/30">
            <h3 className="text-lg font-semibold mb-4 text-purple-400">
              🤝 Collaboration Details
            </h3>

            <input
              placeholder="Looking for (Singer, Dancer...)"
              value={lookingFor}
              onChange={(e) => setLookingFor(e.target.value)}
              className="w-full mb-4 p-3 bg-zinc-900 rounded-lg border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-purple-600"
            />

            <input
              placeholder="Project Goal"
              value={projectGoal}
              onChange={(e) => setProjectGoal(e.target.value)}
              className="w-full mb-4 p-3 bg-zinc-900 rounded-lg border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-purple-600"
            />

            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full p-3 bg-zinc-900 rounded-lg border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>
        )}

        <button
          onClick={createPost}
          disabled={loading}
          className="w-full mt-6 bg-purple-600 hover:bg-purple-700 transition duration-200 py-3 rounded-lg font-semibold"
        >
          {loading ? "Posting..." : "Post"}
        </button>

      </div>
    </div>
  );
}