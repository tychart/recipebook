import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Cookbooks from './pages/Cookbooks';
import CookbookNew from './pages/CookbookNew';
import Cookbook from './pages/Cookbook';
import Recipe from './pages/Recipe';
import RecipeNew from './pages/RecipeNew';
import RecipeEdit from './pages/RecipeEdit';
import Search from './pages/Search';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/cookbooks" element={<Cookbooks />} />
          <Route path="/cookbooks/new" element={<CookbookNew />} />
          <Route path="/cookbook/:id" element={<Cookbook />} />
          <Route path="/cookbook/:cookbookId/recipe/new" element={<RecipeNew />} />
          <Route path="/recipe/new" element={<RecipeNew />} />
          <Route path="/recipe/:id" element={<Recipe />} />
          <Route path="/recipe/:id/edit" element={<RecipeEdit />} />
          <Route path="/search" element={<Search />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
