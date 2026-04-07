import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Cookbooks from "./pages/cookbook/Cookbooks";
import CookbookNew from "./pages/cookbook/CookbookNew";
import Cookbook from "./pages/cookbook/Cookbook";
import RecipeNew from "./pages/recipe/RecipeNew";
import "./App.css";
import "./style/shared.css";
import RecipePage from "./pages/recipe/RecipePage";
// import { useEffect, useState } from "react";
import RecipeEdit from "./pages/recipe/RecipeEdit";
import Search from "./pages/Search";
import Account from "./pages/account/Account";
import { AuthProvider } from "./context/AuthContext";
// import ProtectedRoute from "./components/ProtectedRoute";
import RecipeOptions from "./pages/recipe/RecipeOptions";
import CookbookEdit from "./pages/cookbook/CookbookEdit";

function App() {
  // const [testApi, setTestApi] = useState<string>("loading...");

  // useEffect(() => {
  //   fetch("/api/helloworld")
  //     .then((res) => res.text()) // or res.json() if your API returns JSON
  //     .then((data) => setTestApi(data))
  //     .catch((err) => {
  //       console.error(err);
  //       setTestApi("error");
  //     });
  // }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="w-full">
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/cookbook/:id" element={<Cookbook />} />
              <Route path="/recipe/:id" element={<RecipePage />} />
              <Route path="/search" element={<Search />} />
              <Route path="/account" element={<Account />} />
              <Route path="/cookbook/:id/recipe/options" element={<RecipeOptions />} />
              

              {/* // Protected routes
              <Route element={<ProtectedRoute />}> */}
                <Route path="/cookbooks" element={<Cookbooks />} />
                <Route path="/cookbooks/new" element={<CookbookNew />} />
                <Route path="/cookbook/:id/edit" element={<CookbookEdit />} />
                <Route
                  path="/cookbook/:cookbookId/recipe/new"
                  element={<RecipeNew />}
                />
                <Route path="/recipe/new" element={<RecipeNew />} />
                <Route path="/recipe/:id/edit" element={<RecipeEdit />} />
              {/* </Route> */}
              
              // Catch-all route
              <Route path="*" element={<Navigate to="/" replace />} />

            </Route>
          </Routes>
        </div>
        {/* <div>
      {testApi}
    </div> */}
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
