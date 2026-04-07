import { Link } from "react-router-dom";
import PremiumCard from "../components/PremiumCard";
import SeoMeta from "../components/SeoMeta";

const modules = [
  {
    title: "Calculadoras financieras",
    text: "10 mini apps para interés compuesto, ahorro, deuda, jubilación y más.",
    to: "/calculadoras"
  },
  {
    title: "Guías educativas",
    text: "Explicaciones simples de conceptos clave para mejorar tu criterio financiero.",
    to: "/guias"
  },
  {
    title: "Glosario visual",
    text: "Términos técnicos explicados con ejemplos reales y fórmulas cuando aplican.",
    to: "/glosario"
  },
  {
    title: "Economía explicada fácil",
    text: "Contexto económico en lenguaje claro: tipos, recesión, déficit y deuda pública.",
    to: "/economia"
  }
];

export default function HomePage() {
  return (
    <div className="page">
      <SeoMeta
        title="Zyvola Finanzas | Plataforma educativa premium"
        description="Calculadoras financieras, guías, glosario y economía explicada fácil con estilo premium."
      />

      <header className="page-header">
        <span className="tag">Plataforma modular premium</span>
        <h1>Finanzas claras, visuales y accionables</h1>
        <p>
          Proyecto preparado para evolucionar a PWA con una arquitectura limpia, reutilizable y pensada para
          escalar contenido educativo sin perder elegancia.
        </p>
      </header>

      <section className="grid cards">
        {modules.map((module) => (
          <PremiumCard key={module.title} title={module.title}>
            <p>{module.text}</p>
            <Link className="btn" to={module.to}>
              Entrar
            </Link>
          </PremiumCard>
        ))}
      </section>
    </div>
  );
}
