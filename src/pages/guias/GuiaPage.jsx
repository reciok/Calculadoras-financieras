import { useParams } from "react-router-dom";
import LineChartCard from "../../components/LineChartCard";
import PremiumCard from "../../components/PremiumCard";
import SeoMeta from "../../components/SeoMeta";
import { guides } from "../../data/content";

export default function GuiaPage() {
  const { slug } = useParams();
  const guide = guides.find((item) => item.slug === slug);

  if (!guide) {
    return (
      <div className="page">
        <h1>Guía no encontrada</h1>
      </div>
    );
  }

  return (
    <article className="page">
      <SeoMeta title={`${guide.title} | Guía financiera`} description={guide.intro} />

      <header className="page-header">
        <span className="tag">Guía educativa</span>
        <h1>{guide.title}</h1>
        <p>{guide.intro}</p>
      </header>

      <section className="grid split-grid">
        <PremiumCard title="Explicación clara">
          <p>{guide.intro}</p>
          <p>
            Este concepto se usa para analizar decisiones de ahorro, inversión o financiación sin depender de
            tecnicismos complejos.
          </p>
        </PremiumCard>

        <PremiumCard title="Ejemplo práctico">
          <p>{guide.practicalExample}</p>
        </PremiumCard>
      </section>

      <section className="stack-top">
        <LineChartCard
          title="Mini gráfico de referencia"
          labels={["Año 1", "Año 2", "Año 3", "Año 4", "Año 5"]}
          seriesLabel="Evolución"
          dataPoints={guide.miniData}
        />
      </section>
    </article>
  );
}
