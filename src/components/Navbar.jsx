import { NavLink } from "react-router-dom";
import "./Navbar.css";

const links = [
  { to: "/calculadoras", label: "Calculadoras" },
  { to: "/guias", label: "Guías" },
  { to: "/glosario", label: "Glosario" },
  { to: "/economia", label: "Economía" }
];

export default function Navbar({ theme, onToggleTheme }) {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="brand">
          Zyvola Finanzas
        </NavLink>

        <nav className="links">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <button type="button" className="theme-btn" onClick={onToggleTheme}>
          {theme === "light" ? "Modo oscuro" : "Modo claro"}
        </button>
      </div>
    </header>
  );
}
