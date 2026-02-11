"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ProfilePage() {
  const { id } = useParams();
  const router = useRouter();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    getUser();
    fetchProfile();
    fetchPosts();
  }, []);

  // =====================
  // GET USER
  // =====================
  async function getUser() {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);

    if (data.user) checkFollow(data.user.id);
  }

  // =====================
  // FETCH PROFILE
  // =====================
  async function fetchProfile() {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    setProfile(data);
  }

  // =====================
  // FETCH POSTS
  // =====================
  async function fetchPosts() {
    const { data } = await supabase
      .from("posts")
      .select("*")
      .eq("user_id", id)
      .order("created_at", { ascending: false });

    setPosts(data || []);
  }

  // =====================
  // FOLLOW CHECK
  // =====================
  async function checkFollow(myId) {
    const { data } = await supabase
      .from("follows")
      .select("*")
      .eq("follower_id", myId)
      .eq("following_id", id)
      .maybeSingle();

    setIsFollowing(!!data);
  }

  async function follow() {
    await supabase.from("follows").insert({
      follower_id: user.id,
      following_id: id,
    });

    setIsFollowing(true);
  }

  async function unfollow() {
    await supabase
      .from("follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("following_id", id);

    setIsFollowing(false);
  }

  // =====================
  // 💬 START CHAT (FIXED)
  // =====================
  async function startChat() {
    if (!user) return;

    try {
      // 1️⃣ Get all conversations current user is in
      const { data: myConvos } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);

      if (myConvos?.length) {
        for (let c of myConvos) {
          // check if target user is in same convo
          const { data: match } = await supabase
            .from("conversation_participants")
            .select("*")
            .eq("conversation_id", c.conversation_id)
            .eq("user_id", id)
            .maybeSingle();

          if (match) {
            router.push(`/chat/${c.conversation_id}`);
            return;
          }
        }
      }

      // 2️⃣ Create new conversation
      const { data: convo, error } = await supabase
        .from("conversations")
        .insert({})
        .select()
        .single();

      if (error || !convo) {
        console.error("Conversation error:", error);
        return;
      }

      // 3️⃣ Add participants
      await supabase.from("conversation_participants").insert([
        { conversation_id: convo.id, user_id: user.id },
        { conversation_id: convo.id, user_id: id },
      ]);

      // 4️⃣ Redirect
      router.push(`/chat/${convo.id}`);

    } catch (err) {
      console.error("Chat error:", err);
    }
  }

  if (!profile) return <p>Loading...</p>;

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "auto" }}>
      
      <button onClick={() => router.push("/dashboard")}>
        ⬅ Back
      </button>

      <div style={{ textAlign: "center", marginTop: 20 }}>
        {profile.avatar_url && (
          <img
            src={profile.avatar_url}
            width={100}
            style={{ borderRadius: "50%" }}
          />
        )}

        <h2>{profile.username}</h2>

        {user?.id !== id && (
          <>
            {isFollowing ? (
              <button onClick={unfollow}>Unfollow</button>
            ) : (
              <button onClick={follow}>Follow</button>
            )}

            <button
              onClick={startChat}
              style={{
                marginLeft: 10,
                background: "#4CAF50",
                color: "white",
                padding: "6px 12px",
                borderRadius: 6
              }}
            >
              💬 Message
            </button>
          </>
        )}
      </div>

      <h3 style={{ marginTop: 30 }}>Posts</h3>

      {posts.map((post) => (
        <div key={post.id} style={{ marginTop: 15 }}>
          {post.image_url && (
            <img
              src={post.image_url}
              style={{ width: "100%", borderRadius: 10 }}
            />
          )}
          <p><b>{post.caption}</b></p>
        </div>
      ))}
    </div>
  );
}