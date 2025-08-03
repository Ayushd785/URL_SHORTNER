import { BrowserRouter, Routes, Route } from "react-router-dom";
import Verify from "./pages/verify";
import Home from "./pages/Home";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/verify/:shortCode" element={<Verify />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
