"use client";

import { useEffect,useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Notifications(){
  const [notes,setNotes]=useState([]);

  useEffect(()=>{fetchNotes();},[]);

  async function fetchNotes(){
    const { data:user } = await supabase.auth.getUser();

    const { data } = await supabase
      .from("notifications")
      .select(`
        *,
        sender:sender_id(username,avatar_url)
      `)
      .eq("user_id",user.user.id)
      .order("created_at",{ascending:false});

    setNotes(data||[]);
  }

  return(
    <div style={{padding:20}}>
      <h2>🔔 Notifications</h2>

      {notes.map(n=>(
        <div key={n.id} style={{border:"1px solid #333",padding:10,marginTop:10}}>
          <b>{n.sender?.username}</b>

          {n.type==="follow" && " followed you"}
          {n.type==="like" && " liked your post"}
          {n.type==="comment" && " commented on your post"}
        </div>
      ))}
    </div>
  );
}