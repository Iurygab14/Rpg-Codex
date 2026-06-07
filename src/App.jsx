import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/home.jsx"
import Characters from "./pages/characters.jsx"; 
import Locations from "./pages/locations.jsx";
import Reports from "./pages/reports.jsx";
import Bestiary from "./pages/bestiary.jsx";
import Navbar from "./components/navbar.jsx";

function App() {
  return (
    <div>
      <Navbar/>

      <main style={{ width: "100%", padding: "0px 20px 20px 20px" }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/characters" element={<Characters />} />
          <Route path="/locations" element={<Locations />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/bestiary" element={<Bestiary />} />
        </Routes>
      </main>

    </div>
  );
}
export default App;