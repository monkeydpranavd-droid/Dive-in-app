"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function RequestsPage() {
  const [requests, setRequests] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {
    if (user) fetchRequests();
  }, [user]);

  async function getUser() {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
  }

  async function fetchRequests() {
    const { data } = await supabase
      .from("collab_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setRequests(data);
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>🤝 Collaboration Requests</h2>

      {requests.length === 0 && <p>No requests yet.</p>}

      {requests.map((req) => (
        <div
          key={req.id}
          style={{
            border: "1px solid #ccc",
            padding: 12,
            marginBottom: 10,
            borderRadius: 8,
          }}
        >
          <p><b>Status:</b> {req.status}</p>
          <p>
            <b>Created:</b>{" "}
            {new Date(req.created_at).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}