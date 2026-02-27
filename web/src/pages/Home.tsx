import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/cookbooks" replace />;
  }

  return (
    <div className="flex flex-col items-center text-center max-w-2xl mx-auto py-20">
      <h1 className="text-5xl font-bold text-red-500 mb-6">
        RecipeBook
      </h1>

      <p className="text-lg text-stone-600 mb-10">
        Save and organize your favorite recipes.
        Share them with the people you love.
        Never lose a family recipe again.
      </p>

      <div className="flex gap-4">
        <Link
          to="/register"
          className="px-6 py-3 rounded-md bg-red-500 text-white hover:bg-red-600 transition"
        >
          Get Started
        </Link>

        <Link
          to="/login"
          className="px-6 py-3 rounded-md border border-black hover:bg-stone-100 transition"
        >
          Log In
        </Link>
      </div>
    </div>
  );
}