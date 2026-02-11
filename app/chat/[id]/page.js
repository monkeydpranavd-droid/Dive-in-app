"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ChatPage() {
  const { id: convoId } = useParams();

  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const bottomRef = useRef(null);

  // =========================
  // GET USER
  // =========================
  useEffect(() => {
    getUser();
  }, []);

  async function getUser() {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
  }

  // =========================
  // FETCH + REALTIME
  // =========================
  useEffect(() => {
    if (!convoId) return;

    fetchMessages();

    const channel = supabase
      .channel("chat")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${convoId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
          scrollDown();
          markSeen(payload.new.id);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [convoId]);

  async function fetchMessages() {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convoId)
      .order("created_at", { ascending: true });

    setMessages(data || []);
    scrollDown();
  }

  // =========================
  // SEND MESSAGE (FIXED)
  // =========================
  async function sendMessage() {
    if (!text.trim() || !user) return;

    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: convoId,
        sender_id: user.id,
        content: text,
      })
      .select()
      .single();

    if (!error && data) {
      // instant UI update
      setMessages((prev) => [...prev, data]);
      setText("");
      scrollDown();
    }
  }

  // =========================
  // SEEN STATUS
  // =========================
  async function markSeen(messageId) {
    if (!user) return;

    await supabase
      .from("messages")
      .update({ seen: true })
      .eq("id", messageId)
      .neq("sender_id", user.id);
  }

  // =========================
  // AUTO SCROLL
  // =========================
  function scrollDown() {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }

  if (!user) return null;

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "auto",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* HEADER */}
      <h3>Chat</h3>

      {/* MESSAGES */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          border: "1px solid #333",
          padding: 10,
        }}
      >
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              textAlign: m.sender_id === user.id ? "right" : "left",
              margin: "8px 0",
            }}
          >
            <div
              style={{
                display: "inline-block",
                background:
                  m.sender_id === user.id ? "#4caf50" : "#444",
                padding: 10,
                borderRadius: 10,
                color: "white",
              }}
            >
              {m.content}
            </div>

            {/* Seen tick */}
            {m.sender_id === user.id && (
              <div style={{ fontSize: 12 }}>
                {m.seen ? "✓✓ Seen" : "✓ Sent"}
              </div>
            )}
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div style={{ display: "flex", gap: 10, padding: 10 }}>
        <input
          style={{ flex: 1 }}
          placeholder="Type message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}