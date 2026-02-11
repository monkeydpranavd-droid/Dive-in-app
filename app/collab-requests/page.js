"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function Requests() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);

  // =====================
  // GET USER
  // =====================
  useEffect(() => {
    getUser();
  }, []);

  async function getUser() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;

    setUser(data.user);
    fetchRequests(data.user.id);
    subscribeRealtime(data.user.id);
  }

  // =====================
  // FETCH REQUESTS
  // =====================
  async function fetchRequests(uid) {
    const { data } = await supabase
      .from("collab_requests")
      .select("*, projects(title)")
      .eq("receiver_id", uid)
      .eq("status", "pending");

    setRequests(data || []);
  }

  // =====================
  // REALTIME UPDATES
  // =====================
  function subscribeRealtime(uid) {
    supabase
      .channel("collab-requests")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "collab_requests" },
        (payload) => {
          if (payload.new.receiver_id === uid) {
            fetchRequests(uid);
          }
        }
      )
      .subscribe();
  }

  // =====================
  // ACCEPT REQUEST
  // =====================
  async function accept(req) {
    if (!user) return;

    try {
      // 1️⃣ Update status
      await supabase
        .from("collab_requests")
        .update({ status: "accepted" })
        .eq("id", req.id);

      // 2️⃣ Notify sender
      await supabase.from("notifications").insert({
        user_id: req.sender_id,
        sender_id: user.id,
        type: "collab_accept"
      });

      // 3️⃣ Add to project members (if exists)
      if (req.project_id) {
        await supabase.from("project_members").insert({
          project_id: req.project_id,
          user_id: user.id,
        });
      }

      // 4️⃣ Check existing conversation
      const { data: myConvos } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);

      if (myConvos?.length) {
        for (let c of myConvos) {
          const { data: match } = await supabase
            .from("conversation_participants")
            .select("*")
            .eq("conversation_id", c.conversation_id)
            .eq("user_id", req.sender_id)
            .maybeSingle();

          if (match) {
            router.push(`/chat/${c.conversation_id}`);
            return;
          }
        }
      }

      // 5️⃣ Create new conversation
      const { data: convo } = await supabase
        .from("conversations")
        .insert({})
        .select()
        .single();

      await supabase.from("conversation_participants").insert([
        { conversation_id: convo.id, user_id: user.id },
        { conversation_id: convo.id, user_id: req.sender_id },
      ]);

      fetchRequests(user.id);

      // 6️⃣ Redirect
      router.push(`/chat/${convo.id}`);

    } catch (err) {
      console.error("Accept error:", err);
      alert("Something went wrong");
    }
  }

  // =====================
  // REJECT REQUEST
  // =====================
  async function reject(id) {
    await supabase
      .from("collab_requests")
      .update({ status: "rejected" })
      .eq("id", id);

    fetchRequests(user.id);
  }

  // =====================
  // UI
  // =====================
  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 20 }}>
      <h2>🤝 Collaboration Requests</h2>

      {requests.length === 0 && (
        <p>No pending requests</p>
      )}

      {requests.map((r) => (
        <div
          key={r.id}
          style={{
            border: "1px solid gray",
            padding: 12,
            marginBottom: 10,
            borderRadius: 8
          }}
        >
          <p>
            <b>Project:</b> {r.projects?.title || "Untitled"}
          </p>

          <p>
            <b>Message:</b> {r.message || "Wants to collaborate"}
          </p>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => accept(r)}
              style={{
                background: "green",
                color: "white",
                padding: "6px 12px",
                borderRadius: 6
              }}
            >
              Accept
            </button>

            <button
              onClick={() => reject(r.id)}
              style={{
                background: "red",
                color: "white",
                padding: "6px 12px",
                borderRadius: 6
              }}
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}