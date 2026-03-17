import { Link, useParams, useNavigate } from "react-router-dom";
import type { Cookbook, RecipeInput } from "../../../types/types";
import RecipeForm from "../../components/recipe/RecipeForm";
import { createRecipe } from "../../api/recipes";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useState, useRef } from "react";
import { getCookbook } from "../../api/cookbooks";

export default function RecipeNew() {
  const { cookbookId } = useParams<{ cookbookId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [cookbook, setCookbook] = useState<Cookbook | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Move initial state into React state so it can be updated by OCR
  const [recipeData, setRecipeData] = useState<RecipeInput>({
    name: "",
    description: "",
    instructions: [],
    notes: "",
    servings: 1,
    image_url: "",
    ingredients: [],
    cookbook_id: cookbookId ? Number(cookbookId) : 0,
    creator_id: user?.id || 0,
    category: "Main",
    tags: [],
  });

  useEffect(() => {
    if (!cookbookId) return;
    const fetchCookbook = async () => {
      try {
        const data = await getCookbook(Number(cookbookId));
        setCookbook(data);
      } catch (error) {
        console.error("Failed to fetch cookbook", error);
      }
    };
    fetchCookbook();
  }, [cookbookId]);

  const handleOCRUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch("/api/ocr/process-recipe", {
        method: "POST",
        body: formData,
      });
      const ocrData = await response.json();

      setRecipeData((prev) => ({
        ...prev,
        name: ocrData.recipe_name || prev.name,
        instructions: ocrData.instructions ?? prev.instructions,
        ingredients: ocrData.ingredients?.map((ing: any) => ({
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
        })) || prev.ingredients,
      }));
    } catch (error) {
      console.error("OCR Error:", error);
      alert("Failed to process image.");
    } finally {
      setIsProcessing(false);
    }
  };
  
  if (!user) {
    return <p>Please log in to create a recipe.</p>;
  }

  const handleCreate = async (
  recipeInput: RecipeInput,
  imageFile?: File
) => {
  try {
    let imageUrl = recipeInput.image_url;

    // 1️⃣ Upload image if selected
    if (imageFile) {
      const formData = new FormData();
      formData.append("file", imageFile);

      const uploadRes = await fetch("/api/uploads/file", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const text = await uploadRes.text();
        console.error("Upload failed:", text);
        throw new Error("Image upload failed");
      }

      const uploadData = await uploadRes.json();
      imageUrl = uploadData.url; // returned from backend
    }

    // 2️⃣ Send recipe JSON with image_url included
    const result = await createRecipe({
      ...recipeInput,
      image_url: imageUrl,
    });

    console.log("Created:", result);
    navigate(`/recipe/${result.recipe.id}`);
  } catch (error) {
    console.error("Failed to create recipe", error);
    alert("Failed to create recipe");
  }
};

  return (
    <>
      <div className="flex items-center justify-between mb-8 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-semibold text-stone-800">New Recipe</h1>
          {cookbookId && (
            <p className="text-sm text-stone-500 mt-1">
              Adding to: {cookbook ? cookbook.name : "Loading..."}
            </p>
          )}
        </div>

        <div className="flex gap-3">
          {/* OCR Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 disabled:opacity-50"
          >
            {isProcessing ? "Processing..." : "✨ Scan from Image"}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleOCRUpload}
            className="hidden"
            accept="image/*"
          />

          <Link
            to={cookbookId ? `/cookbook/${cookbookId}` : "/cookbooks"}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 transition-all duration-200"
          >
            ← Cancel
          </Link>
        </div>
      </div>

      {/* Key: Adding 'key' helps React reset the form state when recipeData changes */}
      <RecipeForm
        key={recipeData.name} 
        initialData={recipeData}
        onSubmit={handleCreate}
        submitLabel="Create Recipe"
      />
    </>
  );
}