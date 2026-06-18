import { NavLink } from "react-router-dom";
import "../assets/navbar.css";
import "../assets/Link.css";

function Navbar() {
  const links = [
    { to: "/", label: "Início" },
    { to: "/characters", label: "Personagens" },
    { to: "/factions", label: "Facções" },
    { to: "/locations", label: "Locais" },
    { to: "/reports", label: "Relatórios" },
    { to: "/bestiary", label: "Bestiário" },
    { to: "/worldmap", label: "Mapa" },
  ];

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
      </div>
    </nav>
  );
}

export default Navbar;