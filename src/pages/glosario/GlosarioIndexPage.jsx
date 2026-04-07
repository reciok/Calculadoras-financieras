import { Link } from "react-router-dom";
import PremiumCard from "../../components/PremiumCard";
import SeoMeta from "../../components/SeoMeta";
import { glossary } from "../../data/content";

export default function GlosarioIndexPage() {
  return (
    <div className="page">
      <SeoMeta
        title="Glosario financiero visual | Zyvola Finanzas"
        description="Definiciones de términos financieros con ejemplos, fórmulas y mini visualizaciones."
      />
      <header className="page-header">
        <h1>Módulo 3: Glosario financiero visual</h1>
        <p>Definiciones concretas y aplicables para dominar lenguaje financiero con mayor confianza.</p>
      </header>

      <section className="grid cards">
        {glossary.map((term) => (
          <PremiumCard key={term.slug} title={term.title}>
            <p>{term.definition}</p>
            <Link className="btn" to={`/glosario/${term.slug}`}>
              Ver término
            </Link>
          </PremiumCard>
        ))}
      </section>
    </div>
  );
}
