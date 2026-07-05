import { createGopherClient } from "@gopher/supabase-client";

async function getProfileCount() {
  const supabase = createGopherClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    storage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    },
  });

  const { data, error, count } = await supabase
    .from("public_profiles")
    .select("*", { count: "exact" });

  return { data, error, count };
}

export default async function Home() {
  const { data, error, count } = await getProfileCount();

  return (
    <main style={{ padding: 40, fontFamily: "monospace" }}>
      <h1>Gopher — Supabase Connection Smoke Test</h1>
      <p>Querying public_profiles...</p>
      <p>Row count: {count ?? "null"}</p>
      {error ? (
        <pre style={{ color: "red" }}>{JSON.stringify(error, null, 2)}</pre>
      ) : (
        <pre>{JSON.stringify(data, null, 2)}</pre>
      )}
    </main>
  );
}