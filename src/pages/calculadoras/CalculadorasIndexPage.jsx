import { Link } from "react-router-dom";
import SeoMeta from "../../components/SeoMeta";
import PremiumCard from "../../components/PremiumCard";
import { calculators } from "../../data/content";

export default function CalculadorasIndexPage() {
  return (
    <div className="page">
      <SeoMeta
        title="Calculadoras financieras | Zyvola Finanzas"
        description="Calculadoras de interés compuesto, amortización, inflación, jubilación y crecimiento patrimonial."
      />

      <header className="page-header">
        <h1>Módulo 1: Calculadoras financieras</h1>
        <p>
          Cada herramienta incluye entradas claras, resultados en tarjetas premium, visualización de datos,
          explicación educativa y ejemplo real.
        </p>
      </header>

      <section className="grid cards">
        {calculators.map((item) => (
          <PremiumCard key={item.slug} title={item.title}>
            <p>{item.description}</p>
            <Link className="btn" to={`/calculadoras/${item.slug}`}>
              Abrir calculadora
            </Link>
          </PremiumCard>
        ))}
      </section>
    </div>
  );
}
