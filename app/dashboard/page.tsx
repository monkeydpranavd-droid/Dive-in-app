"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [commentInputs, setCommentInputs] = useState({});
  const [followingMap, setFollowingMap] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);

  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);

  // =====================
  // GET USER
  // =====================
  useEffect(() => {
    getUser();
  }, []);

  async function getUser() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return router.push("/login");

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();

    setUser({
      ...data.user,
      username: profile?.username,
      avatar_url: profile?.avatar_url,
    });

    fetchNotifications(data.user.id);
    subscribeNotifications(data.user.id);
  }

  // =====================
  // REALTIME NOTIFICATIONS
  // =====================
  function subscribeNotifications(uid) {
    supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          if (payload.new.user_id === uid) {
            setNotifications((prev) => [payload.new, ...prev]);
          }
        }
      )
      .subscribe();
  }

  // =====================
  // FETCH POSTS
  // =====================
  useEffect(() => {
    if (user) fetchPosts();
  }, [user]);

  async function fetchPosts() {
    // get following list
    const { data: following } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id);

    const ids = following?.map((f) => f.following_id) || [];
    ids.push(user.id);

    const map = {};
    ids.forEach((id) => (map[id] = true));
    setFollowingMap(map);

    const { data } = await supabase
      .from("posts")
      .select(`*, profiles(*)`)
      .in("user_id", ids)
      .order("created_at", { ascending: false });

    const enriched = await Promise.all(
      data.map(async (post) => {
        const { count } = await supabase
          .from("likes")
          .select("*", { count: "exact", head: true })
          .eq("post_id", post.id);

        const { data: liked } = await supabase
          .from("likes")
          .select("id")
          .eq("post_id", post.id)
          .eq("user_id", user.id)
          .maybeSingle();

        const { data: comments } = await supabase
          .from("comments")
          .select(`*, profiles(username)`)
          .eq("post_id", post.id);

        return {
          ...post,
          likeCount: count || 0,
          liked: !!liked,
          comments: comments || [],
        };
      })
    );

    setPosts(enriched);
    setLoading(false);
  }

  // =====================
  // LIKE TOGGLE
  // =====================
  async function toggleLike(post) {
    if (post.liked) {
      await supabase
        .from("likes")
        .delete()
        .eq("post_id", post.id)
        .eq("user_id", user.id);
    } else {
      await supabase.from("likes").insert({
        post_id: post.id,
        user_id: user.id,
      });

      if (post.user_id !== user.id) {
        await supabase.from("notifications").insert({
          user_id: post.user_id,
          sender_id: user.id,
          type: "like",
          post_id: post.id,
        });
      }
    }

    fetchPosts();
  }

  // =====================
  // COMMENT
  // =====================
  async function addComment(postId, ownerId) {
    const text = commentInputs[postId];
    if (!text) return;

    await supabase.from("comments").insert({
      post_id: postId,
      user_id: user.id,
      content: text,
    });

    if (ownerId !== user.id) {
      await supabase.from("notifications").insert({
        user_id: ownerId,
        sender_id: user.id,
        type: "comment",
        post_id: postId,
      });
    }

    setCommentInputs({ ...commentInputs, [postId]: "" });
    fetchPosts();
  }

  // =====================
  // FOLLOW
  // =====================
  async function followUser(id) {
    await supabase.from("follows").insert({
      follower_id: user.id,
      following_id: id,
    });

    await supabase.from("notifications").insert({
      user_id: id,
      sender_id: user.id,
      type: "follow",
    });

    fetchPosts();
  }

  async function unfollowUser(id) {
    await supabase
      .from("follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("following_id", id);

    fetchPosts();
  }

  // =====================
  // SEARCH
  // =====================
  useEffect(() => {
    const delay = setTimeout(searchUsers, 400);
    return () => clearTimeout(delay);
  }, [search]);

  async function searchUsers() {
    if (!search) return setResults([]);

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .ilike("username", `%${search}%`);

    setResults(data || []);
  }

  // =====================
  // NOTIFICATIONS
  // =====================
  async function fetchNotifications(uid) {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    setNotifications(data || []);
  }

  // =====================
  // START CHAT
  // =====================
  async function startChat(otherUserId) {
    const { data: convo } = await supabase
      .from("conversations")
      .insert({})
      .select()
      .single();

    await supabase.from("conversation_participants").insert([
      { conversation_id: convo.id, user_id: user.id },
      { conversation_id: convo.id, user_id: otherUserId },
    ]);

    router.push(`/chat/${convo.id}`);
  }

  // =====================
  // LOGOUT
  // =====================
  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (!user) return null;

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 20 }}>
      {/* HEADER */}
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => router.push("/create-post")}>➕</button>
        <button onClick={() => router.push("/edit-profile")}>✏️</button>

        <button onClick={() => setShowNotif(!showNotif)}>
          🔔 ({notifications.length})
        </button>

        <button onClick={() => router.push("/inbox")}>💬</button>
        <button onClick={logout}>🚪</button>
      </div>

      {/* NOTIFICATION PANEL */}
      {showNotif && (
        <div style={{ border: "1px solid gray", padding: 10 }}>
          {notifications.map((n) => (
            <p key={n.id}>
              {n.type} from {n.sender_id}
            </p>
          ))}
        </div>
      )}

      {/* SEARCH */}
      <input
        placeholder="Search users..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {results.map((r) => (
        <div key={r.id}>
          {r.username}
          <button onClick={() => startChat(r.id)}>💬</button>
        </div>
      ))}

      <h2>Feed</h2>

      {posts.map((post) => (
        <div key={post.id} style={{ border: "1px solid #333", padding: 15 }}>
          <b
            style={{ cursor: "pointer" }}
            onClick={() => router.push(`/profile/${post.user_id}`)}
          >
            {post.profiles?.username}
          </b>

          {post.user_id !== user.id &&
            (followingMap[post.user_id] ? (
              <button onClick={() => unfollowUser(post.user_id)}>
                Unfollow
              </button>
            ) : (
              <button onClick={() => followUser(post.user_id)}>
                Follow
              </button>
            ))}

          {post.image_url && (
            <img src={post.image_url} style={{ width: "100%" }} />
          )}

          <p>{post.caption}</p>

          <button onClick={() => toggleLike(post)}>
          {post.liked ? "❤️" : "🤍"} {post.likeCount}
          </button>

          {post.user_id !== user.id && (
            <button onClick={() => startChat(post.user_id)}>
              Message
            </button>
          )}

          {/* COMMENTS */}
          {post.comments.map((c) => (
            <p key={c.id}>
              <b>{c.profiles?.username}:</b> {c.content}
            </p>
          ))}

          <input
            placeholder="Comment..."
            value={commentInputs[post.id] || ""}
            onChange={(e) =>
              setCommentInputs({
                ...commentInputs,
                [post.id]: e.target.value,
              })
            }
          />

          <button onClick={() => addComment(post.id, post.user_id)}>
            Post
          </button>
        </div>
      ))}
    </div>
  );
}