"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Projects() {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");

  const [inviteUsername, setInviteUsername] = useState("");

  useEffect(() => {
    getUser();
  }, []);

  async function getUser() {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
    fetchProjects(data.user.id);
  }

  // =====================
  // FETCH PROJECTS
  // =====================
  async function fetchProjects(uid) {
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("owner_id", uid)
      .order("created_at", { ascending: false });

    setProjects(data || []);
  }

  // =====================
  // CREATE PROJECT
  // =====================
  async function createProject() {
    if (!title) return;

    await supabase.from("projects").insert({
      owner_id: user.id,
      title,
      description: desc,
    });

    setTitle("");
    setDesc("");
    fetchProjects(user.id);
  }

  // =====================
  // SEND INVITE
  // =====================
  async function sendInvite(projectId) {
    if (!inviteUsername) return;

    // find user by username
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", inviteUsername)
      .single();

    if (!profile) return alert("User not found");

    await supabase.from("collab_requests").insert({
      project_id: projectId,
      sender_id: user.id,
      receiver_id: profile.id,
      message: "Let's collaborate!",
    });

    alert("Invite sent!");
    setInviteUsername("");
  }

  if (!user) return null;

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 20 }}>
      <h2>🚀 Projects</h2>

      {/* CREATE PROJECT */}
      <input
        placeholder="Project title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <input
        placeholder="Description"
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
      />
      <button onClick={createProject}>Create</button>

      <hr />

      {/* PROJECT LIST */}
      {projects.map((p) => (
        <div key={p.id} style={{ border: "1px solid gray", padding: 10 }}>
          <h3>{p.title}</h3>
          <p>{p.description}</p>

          <input
            placeholder="Invite username"
            value={inviteUsername}
            onChange={(e) => setInviteUsername(e.target.value)}
          />
          <button onClick={() => sendInvite(p.id)}>
            Invite Collaborator
          </button>
        </div>
      ))}
    </div>
  );
}