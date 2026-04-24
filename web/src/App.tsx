import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useParams,
} from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Cookbooks from "./pages/cookbook/Cookbooks";
import CookbookNew from "./pages/cookbook/CookbookNew";
import Cookbook from "./pages/cookbook/Cookbook";
import RecipeNew from "./pages/recipe/RecipeNew";
import RecipePage from "./pages/recipe/RecipePage";
import RecipeEdit from "./pages/recipe/RecipeEdit";
import Search from "./pages/Search";
import Account from "./pages/account/Account";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import Jobs from "./pages/Jobs";
import CookbookEdit from "./pages/cookbook/CookbookEdit";

function LegacyRecipeOptionsRedirect() {
  const { id } = useParams<{ id: string }>();

  return <Navigate to={id ? `/cookbook/${id}/recipe/new` : "/cookbooks"} replace />;
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <div className="app-shell">
            <div className="routes-root app-shell-surface">
              <Routes>
                <Route element={<Layout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/cookbook/:id" element={<Cookbook />} />
                  <Route path="/recipe/:id" element={<RecipePage />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/jobs" element={<Jobs />} />
                  <Route path="/account" element={<Account />} />
                  <Route
                    path="/cookbook/:id/recipe/options"
                    element={<LegacyRecipeOptionsRedirect />}
                  />
                  <Route path="/cookbooks" element={<Cookbooks />} />
                  <Route path="/cookbooks/new" element={<CookbookNew />} />
                  <Route path="/cookbook/:id/edit" element={<CookbookEdit />} />
                  <Route
                    path="/cookbook/:cookbookId/recipe/new"
                    element={<RecipeNew />}
                  />
                  <Route path="/recipe/new" element={<RecipeNew />} />
                  <Route path="/recipe/:id/edit" element={<RecipeEdit />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </div>
          </div>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
