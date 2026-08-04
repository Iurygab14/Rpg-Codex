import { NavLink, useNavigate } from "react-router-dom";
import { useCampaign } from "../context/CampaignContext.jsx";
import "../assets/navbar.css";
import "../assets/Link.css";

function Navbar() {
  const navigate = useNavigate();
  const { currentUserProfile, clearSelection, signOutUser } = useCampaign();

  const links = [
    { to: "/home", label: "Início" },
    { to: "/characters", label: "Personagens" },
    { to: "/factions", label: "Facções" },
    { to: "/locations", label: "Locais" },
    { to: "/missions", label: "Missões" },
    { to: "/bestiary", label: "Bestiário" },
    { to: "/worldmap", label: "Mapa" },
  ];

  const handleMyCampaigns = () => {
    clearSelection();
    navigate("/");
  };

  const handleLogout = async () => {
    await signOutUser();
    navigate("/");
  };

  return (
    <nav className="app-navbar">
      <div className="nav-brand">RPG Codex</div>
      <div className="nav-links">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `nav-link${isActive ? " active" : ""}`
            }
          >
            {link.label}
          </NavLink>
        ))}

        <div className="user-menu">
          <button type="button" className="user-menu-trigger">
            <img
              src={currentUserProfile?.foto || currentUserProfile?.imagem || "https://placehold.co/80x80?text=U"}
              alt={currentUserProfile?.nome || "Usuário"}
            />
          </button>
          <div className="user-menu-panel">
            <NavLink to="/profile" className="user-menu-item">Meu Perfil</NavLink>
            <button type="button" className="user-menu-item" onClick={handleMyCampaigns}>
              Minhas Campanhas
            </button>
            <button type="button" className="user-menu-item user-menu-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;