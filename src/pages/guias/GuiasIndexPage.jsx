import { Link } from "react-router-dom";
import PremiumCard from "../../components/PremiumCard";
import SeoMeta from "../../components/SeoMeta";
import { guides } from "../../data/content";

export default function GuiasIndexPage() {
  return (
    <div className="page">
      <SeoMeta
        title="Guías educativas financieras | Zyvola Finanzas"
        description="Conceptos básicos de finanzas explicados de forma clara, con ejemplos y visualizaciones simples."
      />
      <header className="page-header">
        <h1>Módulo 2: Guías educativas</h1>
        <p>Páginas SEO friendly con explicaciones directas, ejemplos prácticos y visualización breve.</p>
      </header>

      <section className="grid cards">
        {guides.map((guide) => (
          <PremiumCard key={guide.slug} title={guide.title}>
            <p>{guide.intro}</p>
            <Link className="btn" to={`/guias/${guide.slug}`}>
              Leer guía
            </Link>
          </PremiumCard>
        ))}
      </section>
    </div>
  );
}
