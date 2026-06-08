import { Routes, Route } from "react-router-dom";
import Home from "./pages/home.jsx";
import Characters from "./pages/characters.jsx";
import Locations from "./pages/locations.jsx";
import Reports from "./pages/reports.jsx";
import Bestiary from "./pages/bestiary.jsx";
import WorldMap from "./pages/worldMap.jsx";
import Navbar from "./components/navbar.jsx";

function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/characters" element={<Characters />} />
          <Route path="/locations" element={<Locations />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/bestiary" element={<Bestiary />} />
          <Route path="/worldmap" element={<WorldMap />} />
        </Routes>
      </main>
    </div>
  );
}
export default App;