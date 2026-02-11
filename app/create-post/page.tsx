"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function CreatePost() {
  const router = useRouter();

  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [skills, setSkills] = useState("");

  // 🔥 New states for collab
  const [postType, setPostType] = useState("normal");
  const [lookingFor, setLookingFor] = useState("");
  const [projectGoal, setProjectGoal] = useState("");
  const [deadline, setDeadline] = useState("");

  const createPost = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert("Login required");
      return;
    }

    const { error } = await supabase.from("posts").insert({
      user_id: user.id,
      caption,
      image_url: imageUrl,
      skills,

      // 🔥 Collab fields
      post_type: postType,
      looking_for: postType === "collab" ? lookingFor : null,
      project_goal: postType === "collab" ? projectGoal : null,
      deadline: postType === "collab" ? deadline : null
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Post created!");
    router.push("/dashboard");
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Create Post</h1>

      {/* POST TYPE SELECT */}
      <label>Post Type</label>
      <br />
      <select onChange={(e) => setPostType(e.target.value)}>
        <option value="normal">Normal Post</option>
        <option value="collab">Collaboration Request</option>
      </select>

      <br /><br />

      {/* CAPTION */}
      <input
        placeholder="Caption"
        onChange={(e) => setCaption(e.target.value)}
      />

      <br /><br />

      {/* IMAGE URL */}
      <input
        placeholder="Image URL"
        onChange={(e) => setImageUrl(e.target.value)}
      />

      <br /><br />

      {/* SKILLS */}
      <input
        placeholder="Skills (Singer, Editor...)"
        onChange={(e) => setSkills(e.target.value)}
      />

      <br /><br />

      {/* 🔥 COLLAB FIELDS */}
      {postType === "collab" && (
        <>
          <h3>Collaboration Details</h3>

          <input
            placeholder="Looking for (Singer, Dancer...)"
            onChange={(e) => setLookingFor(e.target.value)}
          />

          <br /><br />

          <input
            placeholder="Project Goal"
            onChange={(e) => setProjectGoal(e.target.value)}
          />

          <br /><br />

          <input
            type="date"
            onChange={(e) => setDeadline(e.target.value)}
          />

          <br /><br />
        </>
      )}

      <button onClick={createPost}>
        Post
      </button>
    </div>
  );
}