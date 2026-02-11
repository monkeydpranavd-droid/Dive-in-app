"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Requests() {
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    getUser();
  }, []);

  async function getUser() {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
    fetchRequests(data.user.id);
  }

  async function fetchRequests(uid) {
    const { data } = await supabase
      .from("collab_requests")
      .select("*, projects(title)")
      .eq("receiver_id", uid)
      .eq("status", "pending");

    setRequests(data || []);
  }

  async function accept(req) {
    await supabase
      .from("collab_requests")
      .update({ status: "accepted" })
      .eq("id", req.id);

    await supabase.from("project_members").insert({
      project_id: req.project_id,
      user_id: user.id,
    });

    fetchRequests(user.id);
  }

  async function reject(id) {
    await supabase
      .from("collab_requests")
      .update({ status: "rejected" })
      .eq("id", id);

    fetchRequests(user.id);
  }

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 20 }}>
      <h2>🤝 Collaboration Requests</h2>

      {requests.map((r) => (
        <div key={r.id} style={{ border: "1px solid gray", padding: 10 }}>
          <p>Project: {r.projects?.title}</p>
          <button onClick={() => accept(r)}>Accept</button>
          <button onClick={() => reject(r.id)}>Reject</button>
        </div>
      ))}
    </div>
  );
}