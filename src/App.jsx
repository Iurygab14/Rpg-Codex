import { Routes, Route } from "react-router-dom";
import Home from "./pages/home.jsx";
import Characters from "./pages/characters.jsx";
import CharacterDetails from "./pages/CharacterDetails.jsx";
import Locations from "./pages/locations.jsx";
import LocationDetails from "./pages/LocationDetails.jsx";
import Bestiary from "./pages/bestiary.jsx";
import WorldMap from "./pages/worldMap.jsx";
import Factions from "./pages/factions.jsx";
import FactionDetails from "./pages/FactionDetails.jsx";
import Missions from "./pages/missions.jsx";
import MissionDetails from "./pages/MissionDetails.jsx";
import Navbar from "./components/navbar.jsx";

function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/characters" element={<Characters />} />
          <Route path="/factions" element={<Factions />} />
          <Route path="/factions/:id" element={<FactionDetails />} />
          <Route path="/locations" element={<Locations />} />
          <Route path="/locations/:id" element={<LocationDetails />} />
          <Route path="/characters" element={<Characters />} />
          <Route path="/characters/:id" element={<CharacterDetails />} />
          <Route path="/missions" element={<Missions />} />
          <Route path="/missions/:id" element={<MissionDetails />} />
          <Route path="/bestiary" element={<Bestiary />} />
          <Route path="/worldmap" element={<WorldMap />} />
        </Routes>
      </main>
    </div>
  );
}
export default App;