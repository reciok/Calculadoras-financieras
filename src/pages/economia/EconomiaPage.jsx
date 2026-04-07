import { useParams } from "react-router-dom";
import LineChartCard from "../../components/LineChartCard";
import PremiumCard from "../../components/PremiumCard";
import SeoMeta from "../../components/SeoMeta";
import { economyTopics } from "../../data/content";

export default function EconomiaPage() {
  const { slug } = useParams();
  const topic = economyTopics.find((item) => item.slug === slug);

  if (!topic) {
    return (
      <div className="page">
        <h1>Contenido no encontrado</h1>
      </div>
    );
  }

  return (
    <article className="page">
      <SeoMeta title={`${topic.title} | Economía explicada fácil`} description={topic.text} />

      <header className="page-header">
        <span className="tag">Economía explicada fácil</span>
        <h1>{topic.title}</h1>
        <p>{topic.text}</p>
      </header>

      <section className="grid split-grid">
        <PremiumCard title="Qué implica en la práctica">
          <p>{topic.text}</p>
        </PremiumCard>

        <PremiumCard title="Ejemplo claro">
          <p>{topic.example}</p>
          <p>Este contenido es informativo y no representa asesoramiento financiero individual.</p>
        </PremiumCard>
      </section>

      <section className="stack-top">
        <LineChartCard
          title="Visual de contexto"
          labels={topic.chart.map((_, index) => `Periodo ${index + 1}`)}
          seriesLabel="Indicador"
          dataPoints={topic.chart}
        />
      </section>
    </article>
  );
}
