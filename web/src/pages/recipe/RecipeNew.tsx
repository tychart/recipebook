import { Link, useParams, useNavigate } from "react-router-dom";
import type { Cookbook, RecipeInput } from "../../../types/types";
import RecipeForm from "../../components/recipe/RecipeForm";
import { createRecipeWithImage } from "../../api/recipes";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useState, useRef } from "react";
import { getCookbook } from "../../api/cookbooks";

type ParsedRecipeResponse = {
  recipe_name?: string;
  instructions?: string[];
  ingredients?: { name: string; amount: number; unit: string }[];
};

export default function RecipeNew() {
  const { cookbookId } = useParams<{ cookbookId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [cookbook, setCookbook] = useState<Cookbook | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTextImportOpen, setIsTextImportOpen] = useState(false);
  const [textImportValue, setTextImportValue] = useState("");
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

  const applyParsedRecipe = (parsedRecipe: ParsedRecipeResponse) => {
    setRecipeData((prev) => ({
      ...prev,
      name: parsedRecipe.recipe_name || prev.name,
      instructions: parsedRecipe.instructions ?? prev.instructions,
      ingredients:
        parsedRecipe.ingredients?.map((ing) => ({
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
        })) || prev.ingredients,
    }));
  };

  const handleOCRUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch("/api/generate/ocr", {
        method: "POST",
        body: formData,
      });
      const ocrData = await response.json();

      applyParsedRecipe(ocrData);
    } catch (error) {
      console.error("OCR Error:", error);
      alert("Failed to process image.");
    } finally {
      setIsProcessing(false);
      event.target.value = "";
    }
  };

  const handleTextImport = async () => {
    setIsProcessing(true);

    try {
      const response = await fetch("/api/generate/text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: textImportValue }),
      });
      const textData = await response.json();

      applyParsedRecipe(textData);
      setIsTextImportOpen(false);
      setTextImportValue("");
    } catch (error) {
      console.error("Text import error:", error);
      alert("Failed to import recipe text.");
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
    const result = await createRecipeWithImage(recipeInput, imageFile);

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
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 disabled:opacity-50"
          >
            {isProcessing ? "Processing..." : "✨ Scan from Image"}
          </button>
          <button
            onClick={() => setIsTextImportOpen((prev) => !prev)}
            disabled={isProcessing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-100 text-stone-700 border border-stone-300 hover:bg-stone-200 disabled:opacity-50"
          >
            Import from Text
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

      {isTextImportOpen && (
        <div className="mb-8 max-w-4xl mx-auto rounded-2xl border border-stone-200 bg-stone-50 p-4">
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Paste recipe text
          </label>
          <textarea
            value={textImportValue}
            onChange={(event) => setTextImportValue(event.target.value)}
            placeholder="Paste a recipe, blog excerpt, or handwritten transcription here..."
            className="w-full min-h-48 rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-200"
          />
          <div className="mt-3 flex gap-3">
            <button
              onClick={handleTextImport}
              disabled={isProcessing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50"
            >
              {isProcessing ? "Processing..." : "Submit Text"}
            </button>
            <button
              onClick={() => {
                setIsTextImportOpen(false);
                setTextImportValue("");
              }}
              disabled={isProcessing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <RecipeForm
        key={recipeData.name} 
        initialData={recipeData}
        onSubmit={handleCreate}
        submitLabel="Create Recipe"
      />
    </>
  );
}
