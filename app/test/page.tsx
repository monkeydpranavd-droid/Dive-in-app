import { supabase } from "@/lib/supabase"

export default async function TestPage() {
  const { data: users } = await supabase
    .from("users")
    .select("*")

  return (
    <pre>
      {JSON.stringify(users, null, 2)}
    </pre>
  )
}