"use client";
/** Demo auth: pick any seeded user. OWNER: h1. */
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { useApi } from "@/lib/use-api";

export function DemoSwitcher() {
  const router = useRouter();
  const { data, reload } = useApi(() => api.demo.users(), []);

  async function onChange(userId: string) {
    if (userId) await api.demo.switchTo(userId);
    else await api.demo.signOut();
    await reload();
    router.push("/");
    router.refresh();
  }

  async function onReset() {
    if (!confirm("Reset all sample data to the demo starting state?")) return;
    await api.demo.reset();
    await reload();
    router.refresh();
    window.location.reload();
  }

  return (
    <div className="row small">
      <label htmlFor="demo-user" className="muted">Demo user</label>
      <select id="demo-user" value={data?.currentUserId ?? ""} onChange={(e) => onChange(e.target.value)}>
        <option value="">— signed out —</option>
        {data?.users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name} · {u.hint}
          </option>
        ))}
      </select>
      <button className="btn secondary" type="button" onClick={onReset} title="Reseed sample data">
        Reset
      </button>
    </div>
  );
}
