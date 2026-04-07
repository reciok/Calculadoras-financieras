import { useParams } from "react-router-dom";
import LineChartCard from "../../components/LineChartCard";
import PremiumCard from "../../components/PremiumCard";
import SeoMeta from "../../components/SeoMeta";
import { glossary } from "../../data/content";

export default function GlosarioTermPage() {
  const { slug } = useParams();
  const term = glossary.find((item) => item.slug === slug);

  if (!term) {
    return (
      <div className="page">
        <h1>Termino no encontrado</h1>
      </div>
    );
  }

  return (
    <div className="page">
      <SeoMeta title={`${term.title} | Glosario financiero`} description={term.definition} />

      <header className="page-header">
        <span className="tag">Glosario visual</span>
        <h1>{term.title}</h1>
        <p>{term.definition}</p>
      </header>

      <section className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
        <PremiumCard title="Definicion">
          <p>{term.definition}</p>
        </PremiumCard>
        <PremiumCard title="Ejemplo real">
          <p>{term.example}</p>
        </PremiumCard>
        <PremiumCard title="Formula">
          <p>{term.formula}</p>
        </PremiumCard>
      </section>

      <section className="stack-top">
        <LineChartCard
          title="Mini visualización"
          labels={term.miniData.map((_, index) => `Paso ${index + 1}`)}
          seriesLabel={term.title}
          dataPoints={term.miniData}
        />
      </section>
    </div>
  );
}
