import { Link, useParams } from "react-router-dom";

export default function RecipeOptions() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
      <h2 className="text-3xl font-semibold text-center mb-12">
        How would you like to add your recipe?
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-5xl">
        {/* Manual Entry */}
        <Link
          to={`/cookbook/${id}/recipe/new`}
          className="group flex flex-col justify-center p-12 rounded-3xl 
                     border border-gray-200 bg-white
                     shadow-md hover:shadow-xl
                     hover:border-red-300 hover:scale-[1.03]
                     transition-all duration-200"
        >
          <div className="flex justify-center text-7xl mb-6">📝</div>

          <h3 className="text-2xl font-semibold mb-3 group-hover:text-red-500">
            Manually Enter Recipe
          </h3>

          <p className="text-gray-500 text-lg">
            Type in ingredients and instructions yourself.
          </p>
        </Link>

        {/* Image Upload */}
        <Link
          to={`/cookbook/${id}/recipe/upload`}
          className="group flex flex-col justify-center p-12 rounded-3xl 
                     border border-gray-200 bg-white
                     shadow-md hover:shadow-xl
                     hover:border-red-300 hover:scale-[1.03]
                     transition-all duration-200"
        >
          <div className="flex justify-center text-7xl mb-6">📷</div>

          <h3 className="text-2xl font-semibold mb-3 group-hover:text-red-500">
            Upload Recipe Image
          </h3>

          <p className="text-gray-500 text-lg">
            Upload a photo and we'll help extract the recipe.
          </p>
        </Link>
      </div>
    </div>
  );
}