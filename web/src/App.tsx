import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Cookbooks from './pages/Cookbooks';
import CookbookNew from './pages/CookbookNew';
import Cookbook from "./pages/Cookbook";
import RecipeNew from './pages/RecipeNew';
import "./App.css";
import "./style/shared.css";
import RecipePage from './pages/RecipePage';
import { useEffect, useState } from "react";
import RecipeEdit from "./pages/RecipeEdit";
import Search from "./pages/Search";

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
    <BrowserRouter>
      <div className="w-full">
        <Routes>
          <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/cookbooks" element={<Cookbooks />} />
          <Route path="/cookbooks/new" element={<CookbookNew />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/cookbook/:id" element={<Cookbook />} />
          <Route path="/cookbook/:cookbookId/recipe/new" element={<RecipeNew />} />
          <Route path="/recipe/new" element={<RecipeNew />} />
          <Route path="/recipe/:id" element={<RecipePage />} />
          <Route path="/recipe/:id/edit" element={<RecipeEdit />} />
          <Route path="/search" element={<Search />} />
          <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </div>
          {/* <div>
      {testApi}
    </div> */}
    </BrowserRouter>
  );
}

export default App;
