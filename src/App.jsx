import { Routes, Route, Navigate } from "react-router-dom";
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
import CampaignSelection from "./pages/CampaignSelection.jsx";
import CampaignDetails from "./pages/CampaignDetails.jsx";
import Profile from "./pages/Profile.jsx";
import AccessDenied from "./pages/AccessDenied.jsx";
import { useCampaign } from "./context/CampaignContext.jsx";

function App() {
  const { currentCampaign, campaignMembership, currentUserId } = useCampaign();

  const hasCampaignAccess = Boolean(currentCampaign && campaignMembership);

  return (
    <div className="app-shell">
      {hasCampaignAccess && <Navbar />}
      <main className="app-main">
        <Routes>
          <Route
            path="/"
            element={
              currentCampaign
                ? hasCampaignAccess
                  ? <Navigate to="/home" replace />
                  : <AccessDenied />
                : <CampaignSelection />
            }
          />
          <Route path="/home" element={hasCampaignAccess ? <Home /> : <Navigate to="/" replace />} />
          <Route path="/characters" element={hasCampaignAccess ? <Characters /> : <Navigate to="/" replace />} />
          <Route path="/factions" element={hasCampaignAccess ? <Factions /> : <Navigate to="/" replace />} />
          <Route path="/factions/:id" element={hasCampaignAccess ? <FactionDetails /> : <Navigate to="/" replace />} />
          <Route path="/locations" element={hasCampaignAccess ? <Locations /> : <Navigate to="/" replace />} />
          <Route path="/locations/:id" element={hasCampaignAccess ? <LocationDetails /> : <Navigate to="/" replace />} />
          <Route path="/characters/:id" element={hasCampaignAccess ? <CharacterDetails /> : <Navigate to="/" replace />} />
          <Route path="/missions" element={hasCampaignAccess ? <Missions /> : <Navigate to="/" replace />} />
          <Route path="/missions/:id" element={hasCampaignAccess ? <MissionDetails /> : <Navigate to="/" replace />} />
          <Route path="/bestiary" element={hasCampaignAccess ? <Bestiary /> : <Navigate to="/" replace />} />
          <Route path="/worldmap" element={hasCampaignAccess ? <WorldMap /> : <Navigate to="/" replace />} />
          <Route path="/campaigns/:id" element={hasCampaignAccess ? <CampaignDetails /> : <Navigate to="/" replace />} />
          <Route path="/profile" element={currentUserId ? <Profile /> : <Navigate to="/" replace />} />
          <Route path="/denied" element={<AccessDenied />} />
        </Routes>
      </main>
    </div>
  );
}
export default App;