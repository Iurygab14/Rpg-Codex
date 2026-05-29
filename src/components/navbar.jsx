import { Link } from "react-router-dom";
import "../assets/navbar.css"
import "../assets/Link.css"

function Navbar() {
  return (
    <nav>
      <Link to="/">Início</Link>
      <Link to="/characters">Personagens</Link>
      <Link to="/locations">Locais</Link>
      <Link to="/reports">Relatórios</Link>
      <Link to="/bestiary">Bestiário</Link>
    </nav>
  );
}

export default Navbar;