import { useAuth } from "@/lib/auth";

export default function ProfilePage() {
  const { user } = useAuth();
  return (
    <div className="p-4 max-w-xl">
      <h1 className="text-xl font-semibold mb-4">My profile</h1>
      {user ? (
        <div className="space-y-2">
          <div><b>ID:</b> {user.id}</div>
          <div><b>Email:</b> {user.email}</div>
          <div><b>Role:</b> {user.role}</div>
          <div><b>Tenant:</b> {user.tenant_id ?? "—"}</div>
        </div>
      ) : (
        <div>Loading…</div>
      )}
    </div>
  );
}

