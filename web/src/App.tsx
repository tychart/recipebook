import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Home from './pages/Home';
import Cookbook from './pages/Cookbook';
import Recipe from './pages/Recipe';
import './App.css';

function App() {
  const [testApi, setTestApi] = useState<string>('loading...')

  useEffect(() => {
    fetch('/api/helloworld')
      .then(res => res.text()) // or res.json() if your API returns JSON
      .then(data => setTestApi(data))
      .catch(err => {
        console.error(err)
        setTestApi('error')
      })
  }, [])

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cookbook/:id" element={<Cookbook />} />
          <Route path="/recipe/:id" element={<Recipe />} />
        </Routes>
      </BrowserRouter>
      <div>
        Message from the API: {testApi}
      </div>
    </>
  )
}

export default App
