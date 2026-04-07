export const calculators = [
  {
    slug: "interes-compuesto",
    title: "Calculadora de interés compuesto",
    description: "Simula cómo crece tu capital con aportaciones periódicas y rendimiento anual.",
    fields: [
      { key: "initial", label: "Capital inicial (EUR)", value: 5000 },
      { key: "monthly", label: "Aporte mensual (EUR)", value: 250 },
      { key: "annualRate", label: "Rentabilidad anual (%)", value: 6, step: 0.1 },
      { key: "years", label: "Horizonte (años)", value: 15 }
    ],
    compute: ({ initial, monthly, annualRate, years }) => {
      const mRate = annualRate / 100 / 12;
      const months = years * 12;
      const chart = [];
      let amount = initial;

      for (let i = 1; i <= months; i += 1) {
        amount = amount * (1 + mRate) + monthly;
        if (i % 12 === 0) {
          chart.push(Number(amount.toFixed(2)));
        }
      }

      const contributed = initial + monthly * months;
      return {
        principal: contributed,
        finalValue: amount,
        gain: amount - contributed,
        labels: Array.from({ length: years }, (_, i) => `Año ${i + 1}`),
        chart
      };
    },
    explanation:
      "El interés compuesto reinvierte los rendimientos. Con el tiempo, la curva de crecimiento se acelera.",
    realExample:
      "Si aportas 250 EUR al mes durante 15 años al 6%, puedes superar los 80.000 EUR, con una parte relevante explicada por los rendimientos acumulados."
  },
  {
    slug: "ahorro-mensual",
    title: "Calculadora de ahorro mensual",
    description: "Calcula cuánto debes ahorrar cada mes para llegar a un objetivo.",
    fields: [
      { key: "goal", label: "Objetivo (EUR)", value: 20000 },
      { key: "years", label: "Plazo (años)", value: 5 },
      { key: "annualRate", label: "Rentabilidad anual esperada (%)", value: 2.5, step: 0.1 }
    ],
    compute: ({ goal, years, annualRate }) => {
      const months = years * 12;
      const r = annualRate / 100 / 12;
      const monthly = r === 0 ? goal / months : (goal * r) / (Math.pow(1 + r, months) - 1);
      const chart = Array.from({ length: years }, (_, index) => Number((monthly * 12 * (index + 1)).toFixed(2)));

      return {
        monthly,
        finalValue: goal,
        labels: Array.from({ length: years }, (_, i) => `Año ${i + 1}`),
        chart
      };
    },
    explanation: "Define una meta y un plazo para convertir un objetivo grande en un plan mensual concreto.",
    realExample: "Para alcanzar 20.000 EUR en 5 años con 2,5% anual, el ahorro mensual ronda los 315 EUR."
  },
  {
    slug: "amortizacion-prestamos",
    title: "Calculadora de amortización de préstamos",
    description: "Estima cuota mensual y coste total de un préstamo con sistema francés.",
    fields: [
      { key: "amount", label: "Importe del préstamo (EUR)", value: 180000 },
      { key: "annualRate", label: "Tipo anual (%)", value: 3.3, step: 0.1 },
      { key: "years", label: "Plazo (años)", value: 25 }
    ],
    compute: ({ amount, annualRate, years }) => {
      const n = years * 12;
      const r = annualRate / 100 / 12;
      const fee = (amount * r) / (1 - Math.pow(1 + r, -n));
      const totalPaid = fee * n;

      return {
        monthly: fee,
        finalValue: totalPaid,
        gain: totalPaid - amount,
        labels: ["Capital", "Intereses"],
        chart: [amount, totalPaid - amount]
      };
    },
    explanation: "La amortización descompone cada cuota en principal e intereses.",
    realExample: "En 180.000 EUR a 25 años y 3,3%, la cuota ronda 880 EUR y el coste financiero supera 80.000 EUR."
  },
  {
    slug: "inflacion",
    title: "Calculadora de inflación",
    description: "Mide cómo pierde poder adquisitivo una cantidad con el paso del tiempo.",
    fields: [
      { key: "amount", label: "Cantidad actual (EUR)", value: 10000 },
      { key: "annualRate", label: "Inflación anual (%)", value: 3, step: 0.1 },
      { key: "years", label: "Años", value: 10 }
    ],
    compute: ({ amount, annualRate, years }) => {
      const futureCost = amount * Math.pow(1 + annualRate / 100, years);
      const purchasingPower = amount / Math.pow(1 + annualRate / 100, years);
      return {
        finalValue: futureCost,
        gain: amount - purchasingPower,
        labels: ["Valor actual", "Poder adquisitivo futuro"],
        chart: [amount, purchasingPower]
      };
    },
    explanation: "Con inflación, el mismo dinero compra menos bienes y servicios en el futuro.",
    realExample: "Con 3% anual, 10.000 EUR hoy equivalen a unos 7.440 EUR de poder adquisitivo en 10 años."
  },
  {
    slug: "jubilacion",
    title: "Calculadora de jubilación",
    description: "Proyecta el capital necesario y el ritmo de ahorro para la jubilación.",
    fields: [
      { key: "monthlyNeed", label: "Gasto mensual esperado en jubilación (EUR)", value: 1800 },
      { key: "yearsRetired", label: "Años de jubilación", value: 25 },
      { key: "annualRate", label: "Rentabilidad anual durante acumulación (%)", value: 5, step: 0.1 },
      { key: "years", label: "Años hasta jubilarte", value: 30 }
    ],
    compute: ({ monthlyNeed, yearsRetired, annualRate, years }) => {
      const target = monthlyNeed * 12 * yearsRetired;
      const r = annualRate / 100 / 12;
      const months = years * 12;
      const monthly = r === 0 ? target / months : (target * r) / (Math.pow(1 + r, months) - 1);
      return {
        finalValue: target,
        monthly,
        labels: ["Objetivo de capital", "Aporte mensual"],
        chart: [target, monthly * 12]
      };
    },
    explanation: "Un plan de jubilación combina objetivo de capital y disciplina de ahorro.",
    realExample: "Para cubrir 1.800 EUR al mes durante 25 años, el objetivo bruto supera 500.000 EUR."
  },
  {
    slug: "presupuesto",
    title: "Calculadora de presupuesto",
    description: "Distribuye ingresos en necesidades, estilo de vida y ahorro.",
    fields: [
      { key: "income", label: "Ingreso mensual neto (EUR)", value: 2600 },
      { key: "needs", label: "Necesidades (%)", value: 50 },
      { key: "wants", label: "Deseos (%)", value: 30 },
      { key: "savings", label: "Ahorro (%)", value: 20 }
    ],
    compute: ({ income, needs, wants, savings }) => {
      return {
        finalValue: income,
        labels: ["Necesidades", "Deseos", "Ahorro"],
        chart: [income * (needs / 100), income * (wants / 100), income * (savings / 100)]
      };
    },
    explanation: "La regla 50/30/20 ayuda a equilibrar consumo presente y estabilidad futura.",
    realExample: "Con 2.600 EUR, reservar 20% implica ahorrar 520 EUR cada mes."
  },
  {
    slug: "deuda",
    title: "Calculadora de deuda",
    description: "Evalúa la carga de deuda frente a tus ingresos mensuales.",
    fields: [
      { key: "monthlyDebt", label: "Cuotas mensuales de deuda (EUR)", value: 680 },
      { key: "income", label: "Ingreso mensual neto (EUR)", value: 2400 }
    ],
    compute: ({ monthlyDebt, income }) => {
      const ratio = (monthlyDebt / income) * 100;
      return {
        finalValue: ratio,
        labels: ["Deuda", "Renta disponible"],
        chart: [monthlyDebt, Math.max(income - monthlyDebt, 0)]
      };
    },
    explanation: "Un ratio alto de deuda reduce margen para ahorro y emergencias.",
    realExample: "Si pagas 680 EUR con 2.400 EUR netos, tu ratio de deuda mensual es del 28,3%."
  },
  {
    slug: "inversion-largo-plazo",
    title: "Calculadora de inversión a largo plazo",
    description: "Visualiza el potencial de una estrategia sostenida de inversión.",
    fields: [
      { key: "initial", label: "Capital inicial (EUR)", value: 12000 },
      { key: "monthly", label: "Aporte mensual (EUR)", value: 300 },
      { key: "annualRate", label: "Rentabilidad anual (%)", value: 7, step: 0.1 },
      { key: "years", label: "Años invertidos", value: 20 }
    ],
    compute: ({ initial, monthly, annualRate, years }) => {
      const mRate = annualRate / 100 / 12;
      const months = years * 12;
      let value = initial;
      const chart = [];
      for (let i = 1; i <= months; i += 1) {
        value = value * (1 + mRate) + monthly;
        if (i % 12 === 0) {
          chart.push(Number(value.toFixed(2)));
        }
      }
      return {
        finalValue: value,
        principal: initial + monthly * months,
        gain: value - (initial + monthly * months),
        labels: Array.from({ length: years }, (_, i) => `Año ${i + 1}`),
        chart
      };
    },
    explanation: "La inversión a largo plazo reduce el impacto del ruido de mercado a corto plazo.",
    realExample: "Invertir 300 EUR al mes durante 20 años al 7% puede superar los 180.000 EUR."
  },
  {
    slug: "tasa-ahorro",
    title: "Calculadora de tasa de ahorro",
    description: "Calcula qué porcentaje de tus ingresos estás ahorrando realmente.",
    fields: [
      { key: "income", label: "Ingreso mensual (EUR)", value: 3200 },
      { key: "saved", label: "Ahorro mensual (EUR)", value: 640 }
    ],
    compute: ({ income, saved }) => {
      const rate = (saved / income) * 100;
      return {
        finalValue: rate,
        labels: ["Ahorro", "No ahorrado"],
        chart: [saved, Math.max(income - saved, 0)]
      };
    },
    explanation: "La tasa de ahorro es un indicador simple de capacidad de acumulación.",
    realExample: "Ahorrar 640 EUR sobre 3.200 EUR representa una tasa del 20%."
  },
  {
    slug: "crecimiento-patrimonial",
    title: "Calculadora de crecimiento patrimonial",
    description: "Proyecta la evolución de tu patrimonio neto en el tiempo.",
    fields: [
      { key: "assets", label: "Activos actuales (EUR)", value: 90000 },
      { key: "liabilities", label: "Pasivos actuales (EUR)", value: 30000 },
      { key: "annualGrowth", label: "Crecimiento anual de activos (%)", value: 4.5, step: 0.1 },
      { key: "years", label: "Años", value: 10 }
    ],
    compute: ({ assets, liabilities, annualGrowth, years }) => {
      const chart = [];
      let currentAssets = assets;
      for (let i = 1; i <= years; i += 1) {
        currentAssets *= 1 + annualGrowth / 100;
        chart.push(Number((currentAssets - liabilities).toFixed(2)));
      }
      return {
        finalValue: currentAssets - liabilities,
        labels: Array.from({ length: years }, (_, i) => `Año ${i + 1}`),
        chart
      };
    },
    explanation: "El patrimonio neto es activos menos pasivos y refleja tu posición financiera global.",
    realExample: "Con 90.000 EUR en activos y 30.000 EUR en deudas, tu patrimonio inicial es 60.000 EUR."
  }
];

export const guides = [
  {
    slug: "que-es-el-interes-compuesto",
    title: "Qué es el interés compuesto",
    intro: "El interés compuesto es el crecimiento de tu dinero cuando los intereses generados vuelven a invertirse.",
    practicalExample:
      "Si inviertes 1.000 EUR al 8% anual y no retiras ganancias, el segundo año generas intereses sobre 1.080 EUR, no sobre 1.000 EUR.",
    miniData: [1000, 1080, 1166, 1260, 1361]
  },
  {
    slug: "que-es-la-inflacion",
    title: "Qué es la inflación",
    intro: "La inflación es el aumento sostenido de precios en una economía.",
    practicalExample:
      "Una cesta de la compra que costaba 100 EUR puede costar 103 EUR un año después si la inflación es del 3%.",
    miniData: [100, 103, 106, 109, 112]
  },
  {
    slug: "que-es-un-prestamo",
    title: "Qué es un préstamo",
    intro: "Un préstamo es dinero que una entidad te entrega hoy y que devuelves en cuotas con intereses.",
    practicalExample:
      "Si pides 10.000 EUR, la cuota mensual incluye una parte del capital y otra de coste financiero.",
    miniData: [10000, 8500, 6900, 5200, 3200]
  },
  {
    slug: "que-es-un-activo",
    title: "Qué es un activo",
    intro: "Un activo es un bien o derecho con valor económico que puede generar ingresos o conservar valor.",
    practicalExample:
      "Un fondo indexado, una vivienda alquilada o efectivo disponible son ejemplos de activos.",
    miniData: [10, 12, 14, 16, 18]
  },
  {
    slug: "que-es-un-pasivo",
    title: "Qué es un pasivo",
    intro: "Un pasivo es una obligación financiera que requiere pagos futuros.",
    practicalExample:
      "Una hipoteca de 150.000 EUR o una deuda de tarjeta son pasivos en tu balance personal.",
    miniData: [150, 144, 138, 131, 124]
  },
  {
    slug: "que-es-el-ipc",
    title: "Qué es el IPC",
    intro: "El IPC mide la variación media de precios de un conjunto representativo de bienes y servicios.",
    practicalExample:
      "Si el IPC sube del 2% al 3%, la inflación anual registrada es mayor.",
    miniData: [100, 102, 104, 107, 110]
  },
  {
    slug: "que-es-el-euribor",
    title: "Qué es el Euríbor",
    intro: "El Euríbor es una referencia de tipos de interés entre bancos europeos, clave en muchas hipotecas variables.",
    practicalExample:
      "Si el Euríbor sube, la cuota de una hipoteca variable suele aumentar en la revisión.",
    miniData: [0.1, 0.5, 1.2, 2.8, 3.4]
  },
  {
    slug: "que-es-un-fondo-indexado",
    title: "Qué es un fondo indexado",
    intro: "Un fondo indexado replica un índice de mercado de forma pasiva y diversificada.",
    practicalExample:
      "Un fondo que replica el MSCI World invierte en cientos de empresas globales según su peso en el índice.",
    miniData: [100, 108, 103, 116, 123]
  }
];

export const glossary = [
  {
    slug: "tae",
    title: "TAE",
    definition: "Tasa Anual Equivalente. Refleja el coste o rendimiento anual incluyendo comisiones y frecuencia de pagos.",
    example: "Un depósito con 2,5% TAE permite comparar mejor que uno con 2,4% sin conocer su liquidación.",
    formula: "TAE = (1 + i / n)^n - 1",
    miniData: [1.8, 2.0, 2.3, 2.5]
  },
  {
    slug: "tin",
    title: "TIN",
    definition: "Tipo de Interés Nominal. Es el porcentaje de interés pactado, sin integrar gastos adicionales.",
    example: "Una hipoteca puede anunciar 2,2% TIN, pero su TAE final puede ser superior por comisiones.",
    formula: "Intereses = Capital x TIN",
    miniData: [2.2, 2.2, 2.2, 2.2]
  },
  {
    slug: "liquidez",
    title: "Liquidez",
    definition: "Capacidad de convertir un activo en dinero rápido y con poca pérdida de valor.",
    example: "El efectivo tiene liquidez muy alta; una vivienda, mucho menor.",
    formula: "No tiene formula unica",
    miniData: [95, 80, 45, 20]
  },
  {
    slug: "diversificacion",
    title: "Diversificación",
    definition: "Estrategia de repartir inversiones para reducir el impacto de riesgos concretos.",
    example: "Combinar renta variable global, renta fija y liquidez reduce dependencia de un único mercado.",
    formula: "Riesgo agregado < suma de riesgos individuales",
    miniData: [100, 90, 85, 78]
  },
  {
    slug: "amortizacion",
    title: "Amortización",
    definition: "Proceso de devolver una deuda en pagos periódicos, reduciendo principal e intereses.",
    example: "En una hipoteca, al principio pagas más intereses y menos capital.",
    formula: "Cuota = P x r / (1 - (1 + r)^-n)",
    miniData: [180, 162, 143, 122, 97]
  },
  {
    slug: "capitalizacion",
    title: "Capitalización",
    definition: "Reinversión de rendimientos para aumentar el capital sobre el que se generan nuevos rendimientos.",
    example: "Si reinviertes dividendos, aceleras crecimiento en el largo plazo.",
    formula: "Capital final = C x (1 + r)^t",
    miniData: [100, 106, 112, 119, 126]
  }
];

export const economyTopics = [
  {
    slug: "subida-tipos-interes",
    title: "Qué significa que suban los tipos de interés",
    text:
      "Cuando suben los tipos, pedir dinero suele ser más caro y ahorrar puede ser mejor remunerado. Esto enfría el consumo y la inversión a corto plazo, y puede ayudar a moderar la inflación.",
    example:
      "Si tu hipoteca es variable, una subida de tipos puede aumentar la cuota mensual en la revisión.",
    chart: [1.5, 2.0, 2.8, 3.4]
  },
  {
    slug: "que-implica-una-recesion",
    title: "Qué implica una recesión",
    text:
      "Una recesión suele implicar menor actividad económica durante varios trimestres, con impacto en empleo, consumo y beneficios empresariales.",
    example:
      "En recesión, familias y empresas retrasan decisiones de gasto, y la demanda puede caer.",
    chart: [102, 100, 98, 97]
  },
  {
    slug: "deficit-publico",
    title: "Qué es el déficit público",
    text:
      "Existe déficit público cuando el Estado gasta más de lo que ingresa en un periodo.",
    example:
      "Si un país ingresa 500.000 millones y gasta 550.000 millones, tiene un déficit de 50.000 millones.",
    chart: [3.1, 4.2, 4.8, 3.9]
  },
  {
    slug: "deuda-publica",
    title: "Qué es la deuda pública",
    text:
      "La deuda pública es el acumulado de préstamos del Estado para financiar déficits pasados.",
    example:
      "Una deuda del 100% del PIB significa que el volumen de deuda equivale a un año de producción del país.",
    chart: [92, 97, 101, 99]
  }
];
