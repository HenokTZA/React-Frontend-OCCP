import { useAuth } from "@/lib/auth";

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) return <div className="p-4">Loading…</div>;

  const fullName = (
    (user.full_name || "").trim() ||
    [user.first_name, user.last_name].filter(Boolean).join(" ").trim()
  );

  const phone = (user.phone || user.phone_number || "").trim();

  return (
    <div className="p-4 max-w-xl">
      <h1 className="text-xl font-semibold mb-4">My profile</h1>
      <div className="space-y-2">
        <div><b>ID:</b> {user.id}</div>
        <div><b>Email:</b> {user.email || "—"}</div>
        <div><b>Role:</b> {user.role || "—"}</div>
        <div><b>Full name:</b> {fullName || "—"}</div>
        <div><b>Phone number:</b> {phone || "—"}</div>
        <div><b>Username:</b> {user.username || "—"}</div>
      </div>
    </div>
  );
}

