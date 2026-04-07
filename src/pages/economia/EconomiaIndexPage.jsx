import { Link } from "react-router-dom";
import PremiumCard from "../../components/PremiumCard";
import SeoMeta from "../../components/SeoMeta";
import { economyTopics } from "../../data/content";

export default function EconomiaIndexPage() {
  return (
    <div className="page">
      <SeoMeta
        title="Economía explicada fácil | Zyvola Finanzas"
        description="Explicaciones sencillas sobre tipos de interés, recesión, déficit y deuda pública."
      />
      <header className="page-header">
        <h1>Módulo 4: Economía explicada fácil</h1>
        <p>Contenido 100% informativo, sin recomendaciones de inversión ni asesoramiento personalizado.</p>
      </header>

      <section className="grid cards">
        {economyTopics.map((topic) => (
          <PremiumCard key={topic.slug} title={topic.title}>
            <p>{topic.text}</p>
            <Link className="btn" to={`/economia/${topic.slug}`}>
              Leer explicación
            </Link>
          </PremiumCard>
        ))}
      </section>
    </div>
  );
}
