import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function fieldBox(label: string, children: ReactNode) {
  return (
    <div className="rounded-lg border border-black/10 bg-stone-50 p-6 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-stone-500 mb-2">
        {label}
      </p>
      <div className="text-lg text-black break-all">{children}</div>
    </div>
  );
}

export default function Account() {
  const { user, isInitializing } = useAuth();

  if (isInitializing) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return (
      <div className="py-6">
        <p className="mb-4">Please log in to view your account details.</p>
        <Link
          to="/login"
          className="text-red-500 font-medium hover:text-red-600 underline"
        >
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <div className="py-6 max-w-lg">
      <h1 className="text-2xl font-semibold mb-6">Account Details</h1>

      <div className="flex flex-col gap-4">
        {fieldBox("Username", user.username)}
        {fieldBox("Email", user.email)}
      </div>
    </div>
  );
}
