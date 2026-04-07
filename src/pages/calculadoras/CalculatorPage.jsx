import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import InputField from "../../components/InputField";
import LineChartCard from "../../components/LineChartCard";
import PremiumCard from "../../components/PremiumCard";
import SeoMeta from "../../components/SeoMeta";
import { calculators } from "../../data/content";
import { formatCurrency, formatPercent } from "../../utils/format";

function normalizeFields(fields) {
  return fields.reduce((acc, field) => {
    acc[field.key] = field.value;
    return acc;
  }, {});
}

export default function CalculatorPage() {
  const { slug } = useParams();
  const calculator = calculators.find((item) => item.slug === slug);

  const [values, setValues] = useState(() => normalizeFields(calculator?.fields || []));

  const result = useMemo(() => {
    if (!calculator) {
      return null;
    }
    return calculator.compute(values);
  }, [calculator, values]);

  if (!calculator || !result) {
    return (
      <div className="page">
        <h1>Calculadora no encontrada</h1>
      </div>
    );
  }

  const updateValue = (key, value) => {
    setValues((prev) => ({ ...prev, [key]: Number.isFinite(value) ? value : 0 }));
  };

  return (
    <div className="page">
      <SeoMeta
        title={`${calculator.title} | Zyvola Finanzas`}
        description={`${calculator.description} Herramienta visual con ejemplo práctico.`}
      />

      <header className="page-header">
        <h1>{calculator.title}</h1>
        <p>{calculator.description}</p>
      </header>

      <section className="grid split-grid">
        <PremiumCard title="Datos de entrada">
          <div className="list">
            {calculator.fields.map((field) => (
              <InputField
                key={field.key}
                label={field.label}
                value={values[field.key]}
                min={field.min ?? 0}
                step={field.step ?? 1}
                onChange={(value) => updateValue(field.key, value)}
              />
            ))}
          </div>
        </PremiumCard>

        <PremiumCard title="Resultados clave">
          <div className="list">
            {typeof result.finalValue === "number" ? (
              <div>
                <p>Total estimado</p>
                <strong className="metric">{formatCurrency(result.finalValue)}</strong>
              </div>
            ) : null}

            {typeof result.monthly === "number" ? (
              <div>
                <p>Aporte o cuota mensual</p>
                <strong className="metric">{formatCurrency(result.monthly)}</strong>
              </div>
            ) : null}

            {typeof result.gain === "number" ? (
              <div>
                <p>Diferencia o rendimiento</p>
                <strong className="metric">{formatCurrency(result.gain)}</strong>
              </div>
            ) : null}

            {calculator.slug === "deuda" || calculator.slug === "tasa-ahorro" ? (
              <div>
                <p>Porcentaje resultante</p>
                <strong className="metric">{formatPercent(result.finalValue)}</strong>
              </div>
            ) : null}
          </div>
        </PremiumCard>
      </section>

      <section className="grid stack-top">
        <LineChartCard
          title="Visualización"
          labels={result.labels || ["Escenario"]}
          seriesLabel="Proyección"
          dataPoints={result.chart || [result.finalValue || 0]}
        />

        <PremiumCard title="Explicación simple">
          <p>{calculator.explanation}</p>
        </PremiumCard>

        <PremiumCard title="Ejemplo real">
          <p>{calculator.realExample}</p>
        </PremiumCard>
      </section>
    </div>
  );
}
