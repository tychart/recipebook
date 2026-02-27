export default function Logo({ size = "large" }: { size?: "large" | "medium" }) {
  const sizeClasses =
    size === "large"
      ? "text-5xl"
      : "text-3xl";

  return (
    <h1 className={`${sizeClasses} font-bold text-red-500 tracking-tight`}>
      RecipeBook
    </h1>
  );
}