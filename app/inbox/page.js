"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function Inbox() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  const [search, setSearch] = useState("");

  // =====================
  // GET USER
  // =====================
  useEffect(() => {
    getUser();
  }, []);

  async function getUser() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return router.push("/login");

    setUser(data.user);
    fetchInbox(data.user.id);

    trackOnline(data.user.id);
    subscribeMessages(data.user.id);
  }

  // =====================
  // FETCH INBOX
  // =====================
  async function fetchInbox(uid) {
    const { data: parts } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", uid);

    const ids = parts?.map(p => p.conversation_id) || [];
    if (!ids.length) return setConversations([]);

    const list = await Promise.all(
      ids.map(async (cid) => {

        const { data: lastMsg } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", cid)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const { data: other } = await supabase
          .from("conversation_participants")
          .select("user_id, profiles(username,avatar_url)")
          .eq("conversation_id", cid)
          .neq("user_id", uid)
          .single();

        return {
          id: cid,
          lastMsg,
          otherUserId: other?.user_id,
          otherUser: other?.profiles
        };
      })
    );

    setConversations(list);
  }

  // =====================
  // REALTIME NEW MSG
  // =====================
  function subscribeMessages(uid) {
    supabase
      .channel("messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => fetchInbox(uid)
      )
      .subscribe();
  }

  // =====================
  // ONLINE PRESENCE
  // =====================
  function trackOnline(uid) {
    const channel = supabase.channel("online-users", {
      config: { presence: { key: uid } }
    });

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();

      const online = {};
      Object.keys(state).forEach(id => {
        online[id] = true;
      });

      setOnlineUsers(online);
    });

    channel.subscribe(async status => {
      if (status === "SUBSCRIBED") {
        await channel.track({ online: true });
      }
    });
  }

  // =====================
  // TYPING CHANNEL
  // =====================
  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel("typing");

    channel.on("broadcast", { event: "typing" }, payload => {
      setTypingUsers(prev => ({
        ...prev,
        [payload.userId]: payload.typing
      }));
    });

    channel.subscribe();

    return () => channel.unsubscribe();
  }, [user]);

  // =====================
  // SEARCH FILTER
  // =====================
  const filtered = conversations.filter(c =>
    c.otherUser?.username
      ?.toLowerCase()
      .includes(search.toLowerCase())
  );

  if (!user) return null;

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 20 }}>

      <h2>📩 Inbox</h2>

      {/* SEARCH */}
      <input
        placeholder="Search chats..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%",
          padding: 10,
          marginBottom: 15
        }}
      />

      {filtered.map(c => (
        <div
          key={c.id}
          onClick={() => router.push(`/chat/${c.id}`)}
          style={{
            display: "flex",
            gap: 10,
            padding: 12,
            borderBottom: "1px solid #333",
            cursor: "pointer"
          }}
        >

          {/* AVATAR */}
          <div style={{ position: "relative" }}>
            <img
              src={c.otherUser?.avatar_url || "/avatar.png"}
              width={45}
              height={45}
              style={{ borderRadius: "50%" }}
            />

            {/* ONLINE DOT */}
            {onlineUsers[c.otherUserId] && (
              <span style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 12,
                height: 12,
                background: "limegreen",
                borderRadius: "50%"
              }} />
            )}
          </div>

          <div>
            <b>{c.otherUser?.username || "User"}</b>

            <p style={{ opacity: 0.7 }}>
              {typingUsers[c.otherUserId]
                ? "typing..."
                : c.lastMsg?.content || "Start chatting"}
            </p>
          </div>

          {/* UNREAD DOT */}
          {!c.lastMsg?.seen &&
            c.lastMsg?.sender_id !== user.id && (
              <span style={{ marginLeft: "auto" }}>
                🔵
              </span>
            )}

        </div>
      ))}

    </div>
  );
}