import { useState } from "react";
import Footer from "./Footer";
import Navbar from "./Navbar";

export default function Layout({ children }) {
  const [theme, setTheme] = useState("light");

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
  };

  return (
    <>
      <Navbar theme={theme} onToggleTheme={toggleTheme} />
      <main>{children}</main>
      <Footer />
    </>
  );
}
