/**
 * ZYVOLA - Motor inteligente de calculadoras financieras
 * Lógica modular, validaciones, resultados en tiempo real, tablas.
 */

const CURRENCY = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
});

const NUMBER = new Intl.NumberFormat('es-ES', {
    maximumFractionDigits: 2,
});

const PERCENT = new Intl.NumberFormat('es-ES', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
});

const CATEGORY_LABELS = {
    investment: 'Inversión',
    savings: 'Ahorros',
    loans: 'Préstamos',
    'real-estate': 'Inmuebles',
    taxes: 'Impuestos',
};

function getBasePrefix() {
    return window.location.pathname.includes('/calculadoras/') ? '../' : '';
}

function buildUrl(path) {
    return `${getBasePrefix()}${path}`;
}

function registerPwaServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    if (!window.isSecureContext && window.location.hostname !== 'localhost') return;

    window.addEventListener('load', async () => {
        try {
            await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        } catch (error) {
            console.warn('No se pudo registrar el service worker:', error);
        }
    });
}

const FinanceMath = {
    safeNumber(value, fallback = 0) {
        const n = typeof value === 'number' ? value : parseFloat(value);
        return Number.isFinite(n) ? n : fallback;
    },

    safeDiv(a, b, fallback = 0) {
        if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return fallback;
        return a / b;
    },

    futureValueCompound(principal, annualRatePct, years, frequency = 12, contribution = 0) {
        const P = this.safeNumber(principal);
        const r = this.safeNumber(annualRatePct) / 100;
        const t = this.safeNumber(years);
        const n = Math.max(1, this.safeNumber(frequency, 12));
        const c = this.safeNumber(contribution);
        const factor = Math.pow(1 + r / n, n * t);
        const principalGrowth = P * factor;
        const contributionGrowth = c > 0 ? c * ((factor - 1) / (r / n || 1)) : 0;
        return principalGrowth + contributionGrowth;
    },

    monthlyPaymentFrench(principal, annualRatePct, months) {
        const P = this.safeNumber(principal);
        const n = Math.max(1, Math.round(this.safeNumber(months)));
        const i = this.safeNumber(annualRatePct) / 100 / 12;
        if (i === 0) return P / n;
        return P * (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
    },

    amortizationFrench(principal, annualRatePct, months) {
        const P = this.safeNumber(principal);
        const n = Math.max(1, Math.round(this.safeNumber(months)));
        const i = this.safeNumber(annualRatePct) / 100 / 12;
        const payment = this.monthlyPaymentFrench(P, annualRatePct, n);
        let balance = P;
        const rows = [];

        for (let month = 1; month <= n; month++) {
            const interest = balance * i;
            const principalPaid = payment - interest;
            balance = Math.max(0, balance - principalPaid);
            rows.push({
                period: month,
                payment,
                interest,
                principal: principalPaid,
                balance,
            });
        }

        return rows;
    },

    amortizationGerman(principal, annualRatePct, months) {
        const P = this.safeNumber(principal);
        const n = Math.max(1, Math.round(this.safeNumber(months)));
        const i = this.safeNumber(annualRatePct) / 100 / 12;
        const principalPart = P / n;
        let balance = P;
        const rows = [];

        for (let month = 1; month <= n; month++) {
            const interest = balance * i;
            const payment = principalPart + interest;
            balance = Math.max(0, balance - principalPart);
            rows.push({
                period: month,
                payment,
                interest,
                principal: principalPart,
                balance,
            });
        }

        return rows;
    },

    cagr(start, end, years) {
        const s = this.safeNumber(start);
        const e = this.safeNumber(end);
        const y = Math.max(0.01, this.safeNumber(years));
        if (s <= 0 || e <= 0) return 0;
        return (Math.pow(e / s, 1 / y) - 1) * 100;
    },

    realReturn(nominalPct, inflationPct) {
        const nominal = this.safeNumber(nominalPct) / 100;
        const inflation = this.safeNumber(inflationPct) / 100;
        return (((1 + nominal) / (1 + inflation)) - 1) * 100;
    },

    tinToTae(tinPct, periodsPerYear = 12) {
        const tin = this.safeNumber(tinPct) / 100;
        const m = Math.max(1, Math.round(this.safeNumber(periodsPerYear, 12)));
        return (Math.pow(1 + tin / m, m) - 1) * 100;
    },

    annualizedVolatility(periodReturnsPct, periodsPerYear = 12) {
        if (!periodReturnsPct.length) return 0;
        const arr = periodReturnsPct.map((r) => this.safeNumber(r) / 100);
        const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
        const variance = arr.reduce((acc, curr) => acc + Math.pow(curr - mean, 2), 0) / arr.length;
        return Math.sqrt(variance) * Math.sqrt(periodsPerYear) * 100;
    },

    parseSeries(input) {
        return String(input || '')
            .split(/[;,\s]+/)
            .map((v) => parseFloat(v))
            .filter((v) => Number.isFinite(v));
    },

    irpfInvestmentTax(gain) {
        const g = Math.max(0, this.safeNumber(gain));
        const brackets = [
            { limit: 6000, rate: 0.19 },
            { limit: 50000, rate: 0.21 },
            { limit: 200000, rate: 0.23 },
            { limit: Infinity, rate: 0.27 },
        ];

        let remaining = g;
        let tax = 0;
        let previousLimit = 0;

        for (const b of brackets) {
            if (remaining <= 0) break;
            const taxable = Math.min(remaining, b.limit - previousLimit);
            tax += taxable * b.rate;
            remaining -= taxable;
            previousLimit = b.limit;
        }

        return tax;
    },
};

const CALCULATORS_DB = [
    {
        id: 'compound-interest',
        name: 'Interés compuesto',
        category: 'investment',
        order: 1,
        desc: 'Calcula el crecimiento de tu capital con reinversión de intereses.',
        realtime: true,
        inputs: [
            { n: 'principal', l: 'Capital inicial (EUR)', t: 'number', d: 10000, min: 0, step: 100 },
            { n: 'monthly', l: 'Aportación mensual (EUR)', t: 'number', d: 300, min: 0, step: 10 },
            { n: 'rate', l: 'Tasa anual (%)', t: 'number', d: 7, min: 0, step: 0.1 },
            { n: 'years', l: 'Horizonte (años)', t: 'number', d: 15, min: 1, step: 1 },
            { n: 'freq', l: 'Capitalización', t: 'select', d: '12', o: { '1': 'Anual', '4': 'Trimestral', '12': 'Mensual' } },
        ],
        outputs: [
            { n: 'finalValue', l: 'Valor final', f: 'currency' },
            { n: 'contributions', l: 'Aportaciones', f: 'currency' },
            { n: 'interestEarned', l: 'Interés generado', f: 'currency' },
            { n: 'annualized', l: 'Rentabilidad anual equivalente', f: 'percentage' },
        ],
        calculate(inp) {
            const months = inp.years * 12;
            const monthlyRate = inp.rate / 100 / 12;
            let balance = inp.principal;
            const points = [];

            for (let m = 1; m <= months; m++) {
                balance = balance * (1 + monthlyRate) + inp.monthly;
                if (m % 12 === 0 || m === months) {
                    points.push({ x: `Año ${Math.ceil(m / 12)}`, y: balance });
                }
            }

            const contributions = inp.principal + inp.monthly * months;
            const finalValue = balance;
            const interestEarned = finalValue - contributions;
            const annualized = FinanceMath.cagr(Math.max(inp.principal, 1), Math.max(finalValue, 1), inp.years);

            return {
                values: { finalValue, contributions, interestEarned, annualized },
                explanation: 'El interés compuesto acelera el crecimiento porque cada período genera intereses sobre intereses previos.',
            };
        },
    },
    {
        id: 'monthly-contribution-needed',
        name: 'Aportación mensual necesaria',
        category: 'savings',
        order: 2,
        desc: 'Cuánto necesitas aportar cada mes para alcanzar un objetivo.',
        realtime: true,
        inputs: [
            { n: 'target', l: 'Meta objetivo (EUR)', t: 'number', d: 120000, min: 1, step: 1000 },
            { n: 'current', l: 'Capital actual (EUR)', t: 'number', d: 15000, min: 0, step: 100 },
            { n: 'rate', l: 'Rentabilidad anual estimada (%)', t: 'number', d: 5, min: 0, step: 0.1 },
            { n: 'years', l: 'Plazo (años)', t: 'number', d: 10, min: 1, step: 1 },
        ],
        outputs: [
            { n: 'monthlyNeeded', l: 'Aportación mensual requerida', f: 'currency' },
            { n: 'projected', l: 'Valor proyectado', f: 'currency' },
        ],
        calculate(inp) {
            const months = inp.years * 12;
            const i = inp.rate / 100 / 12;
            const currentFuture = inp.current * Math.pow(1 + i, months);
            const remaining = Math.max(0, inp.target - currentFuture);
            const monthlyNeeded = i === 0 ? remaining / months : remaining * i / (Math.pow(1 + i, months) - 1);

            return {
                values: {
                    monthlyNeeded,
                    projected: currentFuture + monthlyNeeded * ((Math.pow(1 + i, months) - 1) / (i || 1)),
                },
                explanation: 'La cuota mensual se calcula con la formula de valor futuro de una anualidad ordinaria.',
            };
        },
    },
    {
        id: 'required-annual-return',
        name: 'Rendimiento anual necesario',
        category: 'investment',
        order: 3,
        desc: 'Tasa anual requerida para llegar de un valor actual a una meta.',
        realtime: true,
        inputs: [
            { n: 'current', l: 'Capital actual (EUR)', t: 'number', d: 40000, min: 1, step: 100 },
            { n: 'target', l: 'Meta futura (EUR)', t: 'number', d: 90000, min: 1, step: 100 },
            { n: 'years', l: 'Plazo (años)', t: 'number', d: 8, min: 1, step: 1 },
        ],
        outputs: [{ n: 'requiredReturn', l: 'Rentabilidad anual requerida', f: 'percentage' }],
        calculate(inp) {
            const requiredReturn = FinanceMath.cagr(inp.current, inp.target, inp.years);
            return {
                values: { requiredReturn },
                explanation: 'Se aplica CAGR para encontrar la tasa constante equivalente que conecta el valor actual con el objetivo.',
            };
        },
    },
    {
        id: 'dca',
        name: 'DCA',
        category: 'investment',
        order: 4,
        desc: 'Simula compras periódicas para obtener precio promedio de entrada.',
        realtime: true,
        inputs: [
            { n: 'monthly', l: 'Inversión mensual (EUR)', t: 'number', d: 400, min: 1, step: 10 },
            { n: 'prices', l: 'Precios históricos (separados por coma)', t: 'text', d: '100,95,90,110,120,105,130,125,140,135,145,150' },
        ],
        outputs: [
            { n: 'invested', l: 'Total invertido', f: 'currency' },
            { n: 'units', l: 'Unidades acumuladas', f: 'number' },
            { n: 'avgPrice', l: 'Precio promedio', f: 'currency' },
            { n: 'marketValue', l: 'Valor de mercado', f: 'currency' },
        ],
        calculate(inp) {
            const prices = FinanceMath.parseSeries(inp.prices);
            if (!prices.length) throw new Error('Debes introducir al menos un precio.');
            let units = 0;
            for (const p of prices) units += inp.monthly / p;
            const invested = inp.monthly * prices.length;
            const avgPrice = invested / units;
            const marketValue = units * prices[prices.length - 1];
            const points = prices.map((p, idx) => ({ x: `M${idx + 1}`, y: p }));
            return {
                values: { invested, units, avgPrice, marketValue },
                explanation: 'DCA reduce el riesgo de timing al repartir compras en el tiempo.',
            };
        },
    },
    {
        id: 'cagr',
        name: 'CAGR',
        category: 'investment',
        order: 5,
        desc: 'Mide crecimiento anual compuesto entre dos valores.',
        realtime: true,
        inputs: [
            { n: 'start', l: 'Valor inicial (EUR)', t: 'number', d: 10000, min: 1, step: 100 },
            { n: 'end', l: 'Valor final (EUR)', t: 'number', d: 17500, min: 1, step: 100 },
            { n: 'years', l: 'Años', t: 'number', d: 5, min: 1, step: 1 },
        ],
        outputs: [
            { n: 'cagr', l: 'CAGR', f: 'percentage' },
            { n: 'totalReturn', l: 'Retorno total', f: 'percentage' },
        ],
        calculate(inp) {
            const cagr = FinanceMath.cagr(inp.start, inp.end, inp.years);
            const totalReturn = (FinanceMath.safeDiv(inp.end - inp.start, inp.start, 0)) * 100;
            return {
                values: { cagr, totalReturn },
                explanation: 'CAGR suaviza la trayectoria y expresa una tasa anual equivalente.',
            };
        },
    },
    {
        id: 'inflation-adjusted-return',
        name: 'Retorno ajustado a inflación',
        category: 'investment',
        order: 6,
        desc: 'Convierte rentabilidad nominal en rentabilidad real.',
        realtime: true,
        inputs: [
            { n: 'nominal', l: 'Retorno nominal (%)', t: 'number', d: 8, min: -100, step: 0.1 },
            { n: 'inflation', l: 'Inflación (%)', t: 'number', d: 3, min: -50, step: 0.1 },
        ],
        outputs: [{ n: 'real', l: 'Retorno real', f: 'percentage' }],
        calculate(inp) {
            const real = FinanceMath.realReturn(inp.nominal, inp.inflation);
            return {
                values: { real },
                explanation: 'Formula de Fisher aproximada exacta: (1+r)/(1+i)-1.',
            };
        },
    },
    {
        id: 'goal-savings',
        name: 'Ahorro por objetivos',
        category: 'savings',
        order: 7,
        desc: 'Planifica aportaciones para alcanzar una meta concreta.',
        realtime: true,
        inputs: [
            { n: 'goal', l: 'Meta (EUR)', t: 'number', d: 30000, min: 1, step: 100 },
            { n: 'current', l: 'Ahorro actual (EUR)', t: 'number', d: 5000, min: 0, step: 100 },
            { n: 'months', l: 'Meses', t: 'number', d: 36, min: 1, step: 1 },
        ],
        outputs: [
            { n: 'monthly', l: 'Ahorro mensual sugerido', f: 'currency' },
            { n: 'gap', l: 'Brecha pendiente', f: 'currency' },
        ],
        calculate(inp) {
            const gap = Math.max(0, inp.goal - inp.current);
            const monthly = gap / inp.months;
            return {
                values: { monthly, gap },
                explanation: 'Se distribuye la brecha entre el número de meses objetivo.',
            };
        },
    },
    {
        id: 'emergency-fund',
        name: 'Fondo de emergencia',
        category: 'savings',
        order: 8,
        desc: 'Estima el colchon recomendado según tus gastos.',
        realtime: true,
        inputs: [
            { n: 'monthlyExpenses', l: 'Gastos mensuales (EUR)', t: 'number', d: 2300, min: 0, step: 50 },
            { n: 'coverageMonths', l: 'Meses de cobertura', t: 'select', d: '6', o: { '3': '3', '6': '6', '9': '9', '12': '12' } },
        ],
        outputs: [{ n: 'recommended', l: 'Fondo recomendado', f: 'currency' }],
        calculate(inp) {
            const recommended = inp.monthlyExpenses * Number(inp.coverageMonths);
            return {
                values: { recommended },
                explanation: 'Un rango razonable esta entre 3 y 12 meses de gastos esenciales.',
            };
        },
    },
    {
        id: 'savings-by-percentage',
        name: 'Ahorro por porcentaje',
        category: 'savings',
        order: 9,
        desc: 'Convierte un porcentaje de ingresos en un plan de ahorro mensual.',
        realtime: true,
        inputs: [
            { n: 'income', l: 'Ingresos mensuales (EUR)', t: 'number', d: 3200, min: 0, step: 50 },
            { n: 'pct', l: 'Porcentaje de ahorro (%)', t: 'number', d: 20, min: 0, max: 100, step: 1 },
        ],
        outputs: [
            { n: 'monthlySave', l: 'Ahorro mensual', f: 'currency' },
            { n: 'annualSave', l: 'Ahorro anual', f: 'currency' },
        ],
        calculate(inp) {
            const monthlySave = inp.income * (inp.pct / 100);
            return {
                values: { monthlySave, annualSave: monthlySave * 12 },
                explanation: 'Método simple y sostenible para automatizar tus finanzas personales.',
            };
        },
    },
    {
        id: 'incremental-savings',
        name: 'Ahorro incremental',
        category: 'savings',
        order: 10,
        desc: 'Ahorro creciente cada año para compensar subida de ingresos.',
        realtime: true,
        inputs: [
            { n: 'firstYearMonthly', l: 'Ahorro mensual inicial (EUR)', t: 'number', d: 300, min: 0, step: 10 },
            { n: 'annualIncrease', l: 'Incremento anual (%)', t: 'number', d: 7, min: 0, step: 0.1 },
            { n: 'years', l: 'Años', t: 'number', d: 8, min: 1, step: 1 },
        ],
        outputs: [
            { n: 'totalSaved', l: 'Total ahorrado', f: 'currency' },
            { n: 'lastYearMonthly', l: 'Ahorro mensual último año', f: 'currency' },
        ],
        calculate(inp) {
            let monthly = inp.firstYearMonthly;
            let totalSaved = 0;
            const points = [];
            for (let y = 1; y <= inp.years; y++) {
                totalSaved += monthly * 12;
                points.push({ x: `Año ${y}`, y: monthly * 12 });
                monthly *= 1 + inp.annualIncrease / 100;
            }
            return {
                values: { totalSaved, lastYearMonthly: monthly / (1 + inp.annualIncrease / 100) },
                explanation: 'Incrementar ahorro gradualmente permite mantener esfuerzo financiero realista.',
            };
        },
    },
    {
        id: 'amortization-french',
        name: 'Amortización sistema francés',
        category: 'loans',
        order: 11,
        desc: 'Cuota fija con composición de interés decreciente.',
        realtime: true,
        inputs: [
            { n: 'amount', l: 'Préstamo (EUR)', t: 'number', d: 180000, min: 1, step: 1000 },
            { n: 'rate', l: 'TIN anual (%)', t: 'number', d: 3.2, min: 0, step: 0.01 },
            { n: 'years', l: 'Plazo (años)', t: 'number', d: 25, min: 1, step: 1 },
        ],
        outputs: [
            { n: 'monthly', l: 'Cuota mensual', f: 'currency' },
            { n: 'total', l: 'Total pagado', f: 'currency' },
            { n: 'interest', l: 'Interés total', f: 'currency' },
        ],
        calculate(inp) {
            const months = inp.years * 12;
            const monthly = FinanceMath.monthlyPaymentFrench(inp.amount, inp.rate, months);
            const schedule = FinanceMath.amortizationFrench(inp.amount, inp.rate, months);
            const total = monthly * months;
            const interest = total - inp.amount;
            const table = {
                columns: ['Mes', 'Cuota', 'Interés', 'Capital', 'Pendiente'],
                rows: schedule.slice(0, 12).map((r) => [r.period, r.payment, r.interest, r.principal, r.balance]),
            };
            const points = schedule.filter((r) => r.period % 12 === 0).map((r) => ({ x: `A${r.period / 12}`, y: r.balance }));
            return {
                values: { monthly, total, interest },
                explanation: 'En sistema francés la cuota es constante, pero al inicio pagas más interés que capital.',
                table,
            };
        },
    },
    {
        id: 'amortization-german',
        name: 'Amortización sistema alemán',
        category: 'loans',
        order: 12,
        desc: 'Capital fijo cada período y cuota decreciente.',
        realtime: true,
        inputs: [
            { n: 'amount', l: 'Préstamo (EUR)', t: 'number', d: 180000, min: 1, step: 1000 },
            { n: 'rate', l: 'TIN anual (%)', t: 'number', d: 3.2, min: 0, step: 0.01 },
            { n: 'years', l: 'Plazo (años)', t: 'number', d: 25, min: 1, step: 1 },
        ],
        outputs: [
            { n: 'firstPayment', l: 'Primera cuota', f: 'currency' },
            { n: 'lastPayment', l: 'Última cuota', f: 'currency' },
            { n: 'totalInterest', l: 'Interés total', f: 'currency' },
        ],
        calculate(inp) {
            const months = inp.years * 12;
            const schedule = FinanceMath.amortizationGerman(inp.amount, inp.rate, months);
            const totalInterest = schedule.reduce((acc, row) => acc + row.interest, 0);
            const firstPayment = schedule[0].payment;
            const lastPayment = schedule[schedule.length - 1].payment;
            const table = {
                columns: ['Mes', 'Cuota', 'Interés', 'Capital', 'Pendiente'],
                rows: schedule.slice(0, 12).map((r) => [r.period, r.payment, r.interest, r.principal, r.balance]),
            };
            return {
                values: { firstPayment, lastPayment, totalInterest },
                explanation: 'En sistema alemán amortizas siempre el mismo capital, por eso la cuota cae con el tiempo.',
                table,
            };
        },
    },
    {
        id: 'loan-comparison',
        name: 'Comparador de préstamos',
        category: 'loans',
        order: 13,
        desc: 'Compara dos alternativas de financiación.',
        realtime: true,
        inputs: [
            { n: 'amount', l: 'Importe (EUR)', t: 'number', d: 120000, min: 1, step: 1000 },
            { n: 'rateA', l: 'TIN opción A (%)', t: 'number', d: 3.1, min: 0, step: 0.01 },
            { n: 'yearsA', l: 'Plazo A (años)', t: 'number', d: 20, min: 1, step: 1 },
            { n: 'rateB', l: 'TIN opción B (%)', t: 'number', d: 2.7, min: 0, step: 0.01 },
            { n: 'yearsB', l: 'Plazo B (años)', t: 'number', d: 18, min: 1, step: 1 },
        ],
        outputs: [
            { n: 'monthlyA', l: 'Cuota A', f: 'currency' },
            { n: 'totalA', l: 'Total A', f: 'currency' },
            { n: 'monthlyB', l: 'Cuota B', f: 'currency' },
            { n: 'totalB', l: 'Total B', f: 'currency' },
            { n: 'difference', l: 'Diferencia total', f: 'currency' },
        ],
        calculate(inp) {
            const monthsA = inp.yearsA * 12;
            const monthsB = inp.yearsB * 12;
            const monthlyA = FinanceMath.monthlyPaymentFrench(inp.amount, inp.rateA, monthsA);
            const monthlyB = FinanceMath.monthlyPaymentFrench(inp.amount, inp.rateB, monthsB);
            const totalA = monthlyA * monthsA;
            const totalB = monthlyB * monthsB;
            return {
                values: { monthlyA, totalA, monthlyB, totalB, difference: totalA - totalB },
                explanation: totalA < totalB ? 'La opción A implica menor coste total.' : 'La opción B implica menor coste total.',
            };
        },
    },
    {
        id: 'debt-capacity',
        name: 'Capacidad de endeudamiento',
        category: 'loans',
        order: 14,
        desc: 'Estima deuda máxima según ratio de esfuerzo financiero.',
        realtime: true,
        inputs: [
            { n: 'netIncome', l: 'Ingreso neto mensual (EUR)', t: 'number', d: 3500, min: 0, step: 50 },
            { n: 'existingDebt', l: 'Cuotas actuales (EUR)', t: 'number', d: 300, min: 0, step: 10 },
            { n: 'ratio', l: 'Ratio máximo (%)', t: 'number', d: 35, min: 1, max: 60, step: 1 },
            { n: 'rate', l: 'TIN estimado (%)', t: 'number', d: 3.5, min: 0, step: 0.01 },
            { n: 'years', l: 'Plazo (años)', t: 'number', d: 25, min: 1, step: 1 },
        ],
        outputs: [
            { n: 'maxInstallment', l: 'Cuota máxima nueva', f: 'currency' },
            { n: 'maxLoan', l: 'Préstamo máximo aproximado', f: 'currency' },
        ],
        calculate(inp) {
            const maxInstallment = Math.max(0, inp.netIncome * (inp.ratio / 100) - inp.existingDebt);
            const n = inp.years * 12;
            const i = inp.rate / 100 / 12;
            const maxLoan = i === 0 ? maxInstallment * n : maxInstallment * ((Math.pow(1 + i, n) - 1) / (i * Math.pow(1 + i, n)));
            return {
                values: { maxInstallment, maxLoan },
                explanation: 'Se usa un ratio de esfuerzo prudente para evitar sobreendeudamiento.',
            };
        },
    },
    {
        id: 'early-amortization',
        name: 'Amortización anticipada',
        category: 'loans',
        order: 15,
        desc: 'Mide el ahorro por adelantar pagos de deuda.',
        realtime: true,
        inputs: [
            { n: 'principal', l: 'Deuda pendiente (EUR)', t: 'number', d: 140000, min: 1, step: 1000 },
            { n: 'rate', l: 'TIN (%)', t: 'number', d: 3, min: 0, step: 0.01 },
            { n: 'months', l: 'Meses restantes', t: 'number', d: 220, min: 1, step: 1 },
            { n: 'extra', l: 'Amortización extra mensual (EUR)', t: 'number', d: 150, min: 0, step: 10 },
        ],
        outputs: [
            { n: 'baseTotalInterest', l: 'Interés sin anticipar', f: 'currency' },
            { n: 'newTotalInterest', l: 'Interés con anticipación', f: 'currency' },
            { n: 'interestSaved', l: 'Interés ahorrado', f: 'currency' },
            { n: 'monthsSaved', l: 'Meses ahorrados', f: 'number' },
        ],
        calculate(inp) {
            const basePayment = FinanceMath.monthlyPaymentFrench(inp.principal, inp.rate, inp.months);
            const i = inp.rate / 100 / 12;

            let balance = inp.principal;
            let newMonths = 0;
            let paid = 0;
            while (balance > 0.01 && newMonths < 1200) {
                const interest = balance * i;
                const principalPaid = Math.max(0, (basePayment + inp.extra) - interest);
                balance = Math.max(0, balance - principalPaid);
                paid += basePayment + inp.extra;
                newMonths++;
            }

            const baseTotal = basePayment * inp.months;
            const baseTotalInterest = baseTotal - inp.principal;
            const newTotalInterest = paid - inp.principal;
            return {
                values: {
                    baseTotalInterest,
                    newTotalInterest,
                    interestSaved: baseTotalInterest - newTotalInterest,
                    monthsSaved: Math.max(0, inp.months - newMonths),
                },
                explanation: 'Reducir principal antes de tiempo disminuye la base sobre la que se calculan intereses futuros.',
            };
        },
    },
    {
        id: 'tin-to-tae',
        name: 'Conversor TIN a TAE',
        category: 'loans',
        order: 16,
        desc: 'Convierte tasa nominal anual a tasa anual equivalente.',
        realtime: true,
        inputs: [
            { n: 'tin', l: 'TIN (%)', t: 'number', d: 3.5, min: 0, step: 0.01 },
            { n: 'periods', l: 'Frecuencia de liquidación', t: 'select', d: '12', o: { '1': 'Anual', '2': 'Semestral', '4': 'Trimestral', '12': 'Mensual' } },
        ],
        outputs: [{ n: 'tae', l: 'TAE', f: 'percentage' }],
        calculate(inp) {
            const tae = FinanceMath.tinToTae(inp.tin, Number(inp.periods));
            return {
                values: { tae },
                explanation: 'TAE incorpora el efecto de la capitalización intranual.',
            };
        },
    },
    {
        id: 'fixed-mortgage',
        name: 'Hipoteca fija',
        category: 'loans',
        order: 17,
        desc: 'Simula cuota constante para una hipoteca a tipo fijo.',
        realtime: true,
        inputs: [
            { n: 'homePrice', l: 'Precio vivienda (EUR)', t: 'number', d: 280000, min: 1, step: 1000 },
            { n: 'downPct', l: 'Entrada (%)', t: 'number', d: 20, min: 0, max: 90, step: 1 },
            { n: 'rate', l: 'TIN fijo (%)', t: 'number', d: 2.9, min: 0, step: 0.01 },
            { n: 'years', l: 'Plazo (años)', t: 'number', d: 30, min: 1, step: 1 },
        ],
        outputs: [
            { n: 'loan', l: 'Importe financiado', f: 'currency' },
            { n: 'monthly', l: 'Cuota mensual', f: 'currency' },
            { n: 'totalCost', l: 'Coste total', f: 'currency' },
        ],
        calculate(inp) {
            const loan = inp.homePrice * (1 - inp.downPct / 100);
            const months = inp.years * 12;
            const monthly = FinanceMath.monthlyPaymentFrench(loan, inp.rate, months);
            return {
                values: { loan, monthly, totalCost: monthly * months },
                explanation: 'La cuota fija fácilita planificacion y protege frente a subidas de tipos.',
            };
        },
    },
    {
        id: 'variable-mortgage',
        name: 'Hipoteca variable',
        category: 'loans',
        order: 18,
        desc: 'Proyecta coste con escenarios de variación de tipos.',
        realtime: true,
        inputs: [
            { n: 'loan', l: 'Importe (EUR)', t: 'number', d: 220000, min: 1, step: 1000 },
            { n: 'years', l: 'Plazo (años)', t: 'number', d: 30, min: 1, step: 1 },
            { n: 'initialRate', l: 'Tipo inicial (%)', t: 'number', d: 2.2, min: 0, step: 0.01 },
            { n: 'rateAfter', l: 'Tipo despues de revision (%)', t: 'number', d: 4.0, min: 0, step: 0.01 },
            { n: 'yearsInitial', l: 'Años a tipo inicial', t: 'number', d: 3, min: 1, step: 1 },
        ],
        outputs: [
            { n: 'monthlyInitial', l: 'Cuota inicial', f: 'currency' },
            { n: 'monthlyAfter', l: 'Cuota tras revision', f: 'currency' },
            { n: 'total', l: 'Coste total estimado', f: 'currency' },
        ],
        calculate(inp) {
            const totalMonths = inp.years * 12;
            const initialMonths = Math.min(totalMonths - 1, inp.yearsInitial * 12);
            const monthlyInitial = FinanceMath.monthlyPaymentFrench(inp.loan, inp.initialRate, totalMonths);
            const scheduleInitial = FinanceMath.amortizationFrench(inp.loan, inp.initialRate, initialMonths);
            const balanceAfter = scheduleInitial.length ? scheduleInitial[scheduleInitial.length - 1].balance : inp.loan;
            const remainingMonths = totalMonths - initialMonths;
            const monthlyAfter = FinanceMath.monthlyPaymentFrench(balanceAfter, inp.rateAfter, remainingMonths);
            const total = monthlyInitial * initialMonths + monthlyAfter * remainingMonths;
            return {
                values: { monthlyInitial, monthlyAfter, total },
                explanation: 'En variable, la cuota depende de futuras revisiones y puede subir o bajar.',
            };
        },
    },
    {
        id: 'fixed-vs-variable',
        name: 'Comparador fija vs variable',
        category: 'loans',
        order: 19,
        desc: 'Compara coste total de hipoteca fija y variable.',
        realtime: true,
        inputs: [
            { n: 'loan', l: 'Importe (EUR)', t: 'number', d: 220000, min: 1, step: 1000 },
            { n: 'years', l: 'Plazo (años)', t: 'number', d: 30, min: 1, step: 1 },
            { n: 'fixedRate', l: 'Tipo fijo (%)', t: 'number', d: 3.1, min: 0, step: 0.01 },
            { n: 'variableAvg', l: 'Tipo variable medio esperado (%)', t: 'number', d: 3.7, min: 0, step: 0.01 },
        ],
        outputs: [
            { n: 'fixedTotal', l: 'Coste fijo', f: 'currency' },
            { n: 'variableTotal', l: 'Coste variable', f: 'currency' },
            { n: 'diff', l: 'Diferencia', f: 'currency' },
        ],
        calculate(inp) {
            const n = inp.years * 12;
            const fixedMonthly = FinanceMath.monthlyPaymentFrench(inp.loan, inp.fixedRate, n);
            const variableMonthly = FinanceMath.monthlyPaymentFrench(inp.loan, inp.variableAvg, n);
            const fixedTotal = fixedMonthly * n;
            const variableTotal = variableMonthly * n;
            return {
                values: { fixedTotal, variableTotal, diff: fixedTotal - variableTotal },
                explanation: fixedTotal <= variableTotal ? 'Con este escenario, el fijo es más competitivo.' : 'Con este escenario, el variable es más competitivo.',
            };
        },
    },
    {
        id: 'reverse-mortgage',
        name: 'Hipoteca inversa',
        category: 'loans',
        order: 20,
        desc: 'Estima renta mensual a partir del valor de vivienda para mayores.',
        realtime: true,
        inputs: [
            { n: 'homeValue', l: 'Valor vivienda (EUR)', t: 'number', d: 300000, min: 1, step: 1000 },
            { n: 'ltv', l: 'Porcentaje financiable (%)', t: 'number', d: 35, min: 1, max: 80, step: 1 },
            { n: 'years', l: 'Duración estimada (años)', t: 'number', d: 20, min: 1, step: 1 },
            { n: 'rate', l: 'Interés anual aplicado (%)', t: 'number', d: 4, min: 0, step: 0.1 },
        ],
        outputs: [
            { n: 'availableCapital', l: 'Capital disponible', f: 'currency' },
            { n: 'monthlyIncome', l: 'Renta mensual aproximada', f: 'currency' },
            { n: 'debtAtEnd', l: 'Deuda estimada al final', f: 'currency' },
        ],
        calculate(inp) {
            const availableCapital = inp.homeValue * (inp.ltv / 100);
            const months = inp.years * 12;
            const monthlyIncome = availableCapital / months;
            const debtAtEnd = FinanceMath.futureValueCompound(0, inp.rate, inp.years, 12, monthlyIncome);
            return {
                values: { availableCapital, monthlyIncome, debtAtEnd },
                explanation: 'La deuda crece por los importes dispuestos y por acumulación de intereses.',
            };
        },
    },
    {
        id: 'inflation-impact',
        name: 'Inflación',
        category: 'investment',
        order: 21,
        desc: 'Calcula perdida de poder adquisitivo con inflación.',
        realtime: true,
        inputs: [
            { n: 'amount', l: 'Importe actual (EUR)', t: 'number', d: 10000, min: 0, step: 100 },
            { n: 'inflation', l: 'Inflación anual (%)', t: 'number', d: 3, min: -20, step: 0.1 },
            { n: 'years', l: 'Años', t: 'number', d: 10, min: 1, step: 1 },
        ],
        outputs: [
            { n: 'futureCost', l: 'Coste equivalente futuro', f: 'currency' },
            { n: 'purchasingPowerLoss', l: 'Perdida de poder adquisitivo', f: 'currency' },
        ],
        calculate(inp) {
            const futureCost = inp.amount * Math.pow(1 + inp.inflation / 100, inp.years);
            const purchasingPowerLoss = futureCost - inp.amount;
            return {
                values: { futureCost, purchasingPowerLoss },
                explanation: 'Si los precios suben, el mismo dinero compra menos bienes y servicios.',
            };
        },
    },
    {
        id: 'accumulated-inflation',
        name: 'Inflación acumulada',
        category: 'investment',
        order: 22,
        desc: 'Mide incremento acumulado de precios en varios años.',
        realtime: true,
        inputs: [
            { n: 'rate', l: 'Inflación media anual (%)', t: 'number', d: 2.8, min: -20, step: 0.1 },
            { n: 'years', l: 'Años', t: 'number', d: 12, min: 1, step: 1 },
        ],
        outputs: [{ n: 'accumulated', l: 'Inflación acumulada', f: 'percentage' }],
        calculate(inp) {
            const accumulated = (Math.pow(1 + inp.rate / 100, inp.years) - 1) * 100;
            return {
                values: { accumulated },
                explanation: 'La inflación se compone, por eso el efecto acumulado supera la suma simple.',
            };
        },
    },
    {
        id: 'future-inflation-estimate',
        name: 'Inflación futura estimada',
        category: 'investment',
        order: 23,
        desc: 'Proyecta precio futuro de un gasto actual.',
        realtime: true,
        inputs: [
            { n: 'currentPrice', l: 'Precio actual (EUR)', t: 'number', d: 1200, min: 0, step: 10 },
            { n: 'inflation', l: 'Inflación anual esperada (%)', t: 'number', d: 3, min: -20, step: 0.1 },
            { n: 'years', l: 'Años', t: 'number', d: 6, min: 1, step: 1 },
        ],
        outputs: [{ n: 'futurePrice', l: 'Precio futuro estimado', f: 'currency' }],
        calculate(inp) {
            const futurePrice = inp.currentPrice * Math.pow(1 + inp.inflation / 100, inp.years);
            return {
                values: { futurePrice },
                explanation: 'Esta proyección ayuda a dimensionar objetivos y presupuesto futuro.',
            };
        },
    },
    {
        id: 'public-pension',
        name: 'Pensión pública estimada',
        category: 'investment',
        order: 24,
        desc: 'Estimación simple de pensión a partir de salario y años cotizados.',
        realtime: true,
        inputs: [
            { n: 'avgSalary', l: 'Base reguladora estimada (EUR/mes)', t: 'number', d: 2400, min: 0, step: 50 },
            { n: 'contribYears', l: 'Años cotizados', t: 'number', d: 32, min: 1, step: 1 },
            { n: 'replacementCap', l: 'Tasa máxima de reemplazo (%)', t: 'number', d: 80, min: 10, max: 100, step: 1 },
        ],
        outputs: [
            { n: 'replacementPct', l: 'Tasa de reemplazo estimada', f: 'percentage' },
            { n: 'monthlyPension', l: 'Pension mensual estimada', f: 'currency' },
        ],
        calculate(inp) {
            const replacementPct = Math.min(inp.replacementCap, 50 + inp.contribYears * 0.9);
            const monthlyPension = inp.avgSalary * (replacementPct / 100);
            return {
                values: { replacementPct, monthlyPension },
                explanation: 'Modelo simplificado orientativo, no sustituye cálculo oficial.',
            };
        },
    },
    {
        id: 'private-pension-plan',
        name: 'Plan de pensiones privado',
        category: 'investment',
        order: 25,
        desc: 'Simula acumulación para jubilacion por aportaciones periódicas.',
        realtime: true,
        inputs: [
            { n: 'current', l: 'Capital actual (EUR)', t: 'number', d: 20000, min: 0, step: 100 },
            { n: 'monthly', l: 'Aportación mensual (EUR)', t: 'number', d: 350, min: 0, step: 10 },
            { n: 'returnRate', l: 'Rentabilidad anual (%)', t: 'number', d: 5, min: -100, step: 0.1 },
            { n: 'years', l: 'Años hasta jubilacion', t: 'number', d: 25, min: 1, step: 1 },
        ],
        outputs: [
            { n: 'finalCapital', l: 'Capital final estimado', f: 'currency' },
            { n: 'annuity4', l: 'Renta anual al 4%', f: 'currency' },
        ],
        calculate(inp) {
            const finalCapital = FinanceMath.futureValueCompound(inp.current, inp.returnRate, inp.years, 12, inp.monthly);
            return {
                values: { finalCapital, annuity4: finalCapital * 0.04 },
                explanation: 'Una regla habitual de retiro prudente usa alrededor del 4% anual del capital.',
            };
        },
    },
    {
        id: 'safe-withdrawal-rate',
        name: 'Tasa de retiro segura 4%',
        category: 'investment',
        order: 26,
        desc: 'Capital necesario para sostener gastos sin agotar patrimonio rápidamente.',
        realtime: true,
        inputs: [{ n: 'annualExpenses', l: 'Gastos anuales (EUR)', t: 'number', d: 32000, min: 1, step: 500 }],
        outputs: [
            { n: 'requiredCapital', l: 'Capital necesario', f: 'currency' },
            { n: 'monthlyEquivalent', l: 'Retiro mensual equivalente', f: 'currency' },
        ],
        calculate(inp) {
            const requiredCapital = inp.annualExpenses / 0.04;
            return {
                values: { requiredCapital, monthlyEquivalent: inp.annualExpenses / 12 },
                explanation: 'Regla orientativa FIRE: gastos anuales multiplicados por 25.',
            };
        },
    },
    {
        id: 'rental-gross-net',
        name: 'Rentabilidad bruta y neta de alquiler',
        category: 'real-estate',
        order: 27,
        desc: 'Calcula yields de una vivienda en alquiler.',
        realtime: true,
        inputs: [
            { n: 'price', l: 'Precio compra (EUR)', t: 'number', d: 250000, min: 1, step: 1000 },
            { n: 'rentMonthly', l: 'Alquiler mensual (EUR)', t: 'number', d: 1050, min: 0, step: 10 },
            { n: 'annualCosts', l: 'Costes anuales (EUR)', t: 'number', d: 2500, min: 0, step: 50 },
        ],
        outputs: [
            { n: 'grossYield', l: 'Rentabilidad bruta', f: 'percentage' },
            { n: 'netYield', l: 'Rentabilidad neta', f: 'percentage' },
            { n: 'netIncome', l: 'Ingreso neto anual', f: 'currency' },
        ],
        calculate(inp) {
            const grossIncome = inp.rentMonthly * 12;
            const netIncome = grossIncome - inp.annualCosts;
            const grossYield = FinanceMath.safeDiv(grossIncome, inp.price, 0) * 100;
            const netYield = FinanceMath.safeDiv(netIncome, inp.price, 0) * 100;
            return {
                values: { grossYield, netYield, netIncome },
                explanation: 'La rentabilidad neta descuenta gastos reales y es más util para comparar activos.',
            };
        },
    },
    {
        id: 'real-estate-cashflow',
        name: 'Cashflow inmobiliario',
        category: 'real-estate',
        order: 28,
        desc: 'Evalua flujo neto mensual de un inmueble.',
        realtime: true,
        inputs: [
            { n: 'rent', l: 'Ingreso alquiler mensual (EUR)', t: 'number', d: 1200, min: 0, step: 10 },
            { n: 'mortgage', l: 'Cuota hipoteca mensual (EUR)', t: 'number', d: 700, min: 0, step: 10 },
            { n: 'costs', l: 'Otros gastos mensuales (EUR)', t: 'number', d: 180, min: 0, step: 10 },
            { n: 'vacancyPct', l: 'Vacancia (%)', t: 'number', d: 5, min: 0, max: 100, step: 0.5 },
        ],
        outputs: [
            { n: 'effectiveRent', l: 'Renta efectiva', f: 'currency' },
            { n: 'cashflow', l: 'Cashflow mensual', f: 'currency' },
            { n: 'cashflowAnnual', l: 'Cashflow anual', f: 'currency' },
        ],
        calculate(inp) {
            const effectiveRent = inp.rent * (1 - inp.vacancyPct / 100);
            const cashflow = effectiveRent - inp.mortgage - inp.costs;
            return {
                values: { effectiveRent, cashflow, cashflowAnnual: cashflow * 12 },
                explanation: 'Cashflow positivo mejora resiliencia y reduce dependencia de revalorizacion.',
            };
        },
    },
    {
        id: 'cap-rate',
        name: 'Cap Rate',
        category: 'real-estate',
        order: 29,
        desc: 'Tasa de capitalización basada en ingreso operativo neto.',
        realtime: true,
        inputs: [
            { n: 'noi', l: 'Ingreso operativo neto anual (EUR)', t: 'number', d: 14500, min: 0, step: 100 },
            { n: 'value', l: 'Valor de mercado (EUR)', t: 'number', d: 260000, min: 1, step: 1000 },
        ],
        outputs: [{ n: 'capRate', l: 'Cap Rate', f: 'percentage' }],
        calculate(inp) {
            const capRate = FinanceMath.safeDiv(inp.noi, inp.value, 0) * 100;
            return {
                values: { capRate },
                explanation: 'Cap Rate sirve para comparar inmuebles sin considerar estructura de deuda.',
            };
        },
    },
    {
        id: 'real-estate-roi',
        name: 'ROI inmobiliario',
        category: 'real-estate',
        order: 30,
        desc: 'ROI total combinando flujo anual y revalorizacion.',
        realtime: true,
        inputs: [
            { n: 'invested', l: 'Capital invertido (EUR)', t: 'number', d: 70000, min: 1, step: 1000 },
            { n: 'annualCashflow', l: 'Cashflow anual (EUR)', t: 'number', d: 4200, min: -100000, step: 100 },
            { n: 'appreciation', l: 'Revalorizacion anual estimada (%)', t: 'number', d: 2.5, min: -100, step: 0.1 },
            { n: 'propertyValue', l: 'Valor inmueble (EUR)', t: 'number', d: 250000, min: 1, step: 1000 },
        ],
        outputs: [
            { n: 'annualGain', l: 'Ganancia anual total', f: 'currency' },
            { n: 'roi', l: 'ROI anual', f: 'percentage' },
        ],
        calculate(inp) {
            const annualGain = inp.annualCashflow + inp.propertyValue * (inp.appreciation / 100);
            const roi = FinanceMath.safeDiv(annualGain, inp.invested, 0) * 100;
            return {
                values: { annualGain, roi },
                explanation: 'Incluye rendimiento por caja y por potencial apreciacion del activo.',
            };
        },
    },
    {
        id: 'buy-vs-rent',
        name: 'Comprar vs alquilar',
        category: 'real-estate',
        order: 31,
        desc: 'Compara coste acumulado entre comprar y alquilar.',
        realtime: true,
        inputs: [
            { n: 'homePrice', l: 'Precio vivienda (EUR)', t: 'number', d: 280000, min: 1, step: 1000 },
            { n: 'downPct', l: 'Entrada (%)', t: 'number', d: 20, min: 0, max: 90, step: 1 },
            { n: 'mortgageRate', l: 'Tipo hipoteca (%)', t: 'number', d: 3.2, min: 0, step: 0.01 },
            { n: 'years', l: 'Horizonte (años)', t: 'number', d: 10, min: 1, step: 1 },
            { n: 'rentMonthly', l: 'Alquiler mensual (EUR)', t: 'number', d: 1050, min: 0, step: 10 },
            { n: 'maintenancePct', l: 'Mantenimiento anual (%)', t: 'number', d: 1, min: 0, step: 0.1 },
        ],
        outputs: [
            { n: 'buyCost', l: 'Coste comprar', f: 'currency' },
            { n: 'rentCost', l: 'Coste alquilar', f: 'currency' },
            { n: 'difference', l: 'Diferencia', f: 'currency' },
        ],
        calculate(inp) {
            const loan = inp.homePrice * (1 - inp.downPct / 100);
            const n = inp.years * 12;
            const mortgageMonthly = FinanceMath.monthlyPaymentFrench(loan, inp.mortgageRate, 30 * 12);
            const maintenance = inp.homePrice * (inp.maintenancePct / 100) * inp.years;
            const buyCost = inp.homePrice * (inp.downPct / 100) + mortgageMonthly * n + maintenance;
            const rentCost = inp.rentMonthly * n;
            return {
                values: { buyCost, rentCost, difference: buyCost - rentCost },
                explanation: buyCost <= rentCost ? 'En este horizonte, comprar resulta más economico.' : 'En este horizonte, alquilar resulta más economico.',
            };
        },
    },
    {
        id: 'stock-return',
        name: 'Rentabilidad de acciónes',
        category: 'investment',
        order: 32,
        desc: 'Combina apreciacion del precio y dividendos cobrados.',
        realtime: true,
        inputs: [
            { n: 'buyPrice', l: 'Precio compra', t: 'number', d: 45, min: 0.01, step: 0.01 },
            { n: 'sellPrice', l: 'Precio actual/venta', t: 'number', d: 58, min: 0.01, step: 0.01 },
            { n: 'shares', l: 'Numero de acciónes', t: 'number', d: 150, min: 1, step: 1 },
            { n: 'dividends', l: 'Dividendos totales (EUR)', t: 'number', d: 220, min: 0, step: 1 },
        ],
        outputs: [
            { n: 'invested', l: 'Capital invertido', f: 'currency' },
            { n: 'totalProfit', l: 'Ganancia total', f: 'currency' },
            { n: 'returnPct', l: 'Rentabilidad total', f: 'percentage' },
        ],
        calculate(inp) {
            const invested = inp.buyPrice * inp.shares;
            const finalValue = inp.sellPrice * inp.shares;
            const totalProfit = finalValue + inp.dividends - invested;
            const returnPct = FinanceMath.safeDiv(totalProfit, invested, 0) * 100;
            return {
                values: { invested, totalProfit, returnPct },
                explanation: 'La rentabilidad total contempla plusvalia y flujo de dividendos.',
            };
        },
    },
    {
        id: 'portfolio-rebalance',
        name: 'Rebalanceo de cartera',
        category: 'investment',
        order: 33,
        desc: 'Calcula cuánto comprar o vender para volver a pesos objetivo.',
        realtime: true,
        inputs: [
            { n: 'total', l: 'Valor total cartera (EUR)', t: 'number', d: 50000, min: 1, step: 100 },
            { n: 'equityCurrent', l: 'Peso actual RV (%)', t: 'number', d: 72, min: 0, max: 100, step: 1 },
            { n: 'equityTarget', l: 'Peso objetivo RV (%)', t: 'number', d: 60, min: 0, max: 100, step: 1 },
        ],
        outputs: [
            { n: 'equityAdjust', l: 'Ajuste en RV', f: 'currency' },
            { n: 'bondAdjust', l: 'Ajuste en RF', f: 'currency' },
        ],
        calculate(inp) {
            const equityCurrentValue = inp.total * (inp.equityCurrent / 100);
            const equityTargetValue = inp.total * (inp.equityTarget / 100);
            const equityAdjust = equityTargetValue - equityCurrentValue;
            const bondAdjust = -equityAdjust;
            return {
                values: { equityAdjust, bondAdjust },
                explanation: equityAdjust < 0 ? 'Debes reducir exposicion a renta variable.' : 'Debes aumentar exposicion a renta variable.',
            };
        },
    },
    {
        id: 'historical-volatility',
        name: 'Volatilidad historica',
        category: 'investment',
        order: 34,
        desc: 'Calcula volatilidad anualizada a partir de retornos periódicos.',
        realtime: true,
        inputs: [
            { n: 'returns', l: 'Retornos mensuales (%)', t: 'text', d: '1.2,-0.8,2.1,-1.5,0.9,1.7,-0.3,2.4,-1.1,0.6,1.9,-0.7' },
        ],
        outputs: [{ n: 'vol', l: 'Volatilidad anualizada', f: 'percentage' }],
        calculate(inp) {
            const series = FinanceMath.parseSeries(inp.returns);
            if (series.length < 2) throw new Error('Introduce al menos dos retornos para estimar volatilidad.');
            const vol = FinanceMath.annualizedVolatility(series, 12);
            const points = series.map((v, i) => ({ x: `M${i + 1}`, y: v }));
            return {
                values: { vol },
                explanation: 'La volatilidad mide dispersión de retornos y, por tanto, riesgo.',
            };
        },
    },
    {
        id: 'sharpe-ratio',
        name: 'Sharpe Ratio',
        category: 'investment',
        order: 35,
        desc: 'Relación entre exceso de rentabilidad y riesgo asumido.',
        realtime: true,
        inputs: [
            { n: 'returnPct', l: 'Rentabilidad anual cartera (%)', t: 'number', d: 10, min: -100, step: 0.1 },
            { n: 'riskFree', l: 'Tasa libre de riesgo (%)', t: 'number', d: 2, min: -100, step: 0.1 },
            { n: 'volatility', l: 'Volatilidad anual (%)', t: 'number', d: 14, min: 0.01, step: 0.1 },
        ],
        outputs: [{ n: 'sharpe', l: 'Sharpe ratio', f: 'number' }],
        calculate(inp) {
            const sharpe = FinanceMath.safeDiv(inp.returnPct - inp.riskFree, inp.volatility, 0);
            return {
                values: { sharpe },
                explanation: 'Valores más altos indican mejor rentabilidad ajustada por riesgo.',
            };
        },
    },
    {
        id: 'beta-stock',
        name: 'Beta de una acción',
        category: 'investment',
        order: 36,
        desc: 'Sensibilidad de una acción frente al mercado.',
        realtime: true,
        inputs: [
            { n: 'covariance', l: 'Covarianza acción-mercado', t: 'number', d: 0.018, step: 0.001 },
            { n: 'marketVariance', l: 'Varianza del mercado', t: 'number', d: 0.015, min: 0.000001, step: 0.001 },
        ],
        outputs: [{ n: 'beta', l: 'Beta', f: 'number' }],
        calculate(inp) {
            const beta = FinanceMath.safeDiv(inp.covariance, inp.marketVariance, 0);
            return {
                values: { beta },
                explanation: beta > 1 ? 'Beta superior a 1: activo más volatil que el mercado.' : 'Beta inferior a 1: activo menos sensible al mercado.',
            };
        },
    },
    {
        id: 'irpf-investments',
        name: 'IRPF sobre inversiones',
        category: 'taxes',
        order: 37,
        desc: 'Estimación de IRPF por ganancias del ahorro (tramos vigentes orientativos).',
        realtime: true,
        inputs: [{ n: 'gain', l: 'Ganancia imponible (EUR)', t: 'number', d: 12000, min: 0, step: 100 }],
        outputs: [
            { n: 'tax', l: 'Cuota estimada', f: 'currency' },
            { n: 'netGain', l: 'Ganancia neta', f: 'currency' },
            { n: 'effectiveRate', l: 'Tipo efectivo', f: 'percentage' },
        ],
        calculate(inp) {
            const tax = FinanceMath.irpfInvestmentTax(inp.gain);
            const netGain = inp.gain - tax;
            const effectiveRate = FinanceMath.safeDiv(tax, inp.gain || 1, 0) * 100;
            return {
                values: { tax, netGain, effectiveRate },
                explanation: 'El cálculo usa tramos progresivos de base del ahorro para orientación rápida.',
            };
        },
    },
    {
        id: 'capital-gain-real-estate',
        name: 'Plusvalia inmobiliaria',
        category: 'taxes',
        order: 38,
        desc: 'Ganancia y tributacion aproximada por venta de inmueble.',
        realtime: true,
        inputs: [
            { n: 'buyPrice', l: 'Precio compra (EUR)', t: 'number', d: 180000, min: 0, step: 1000 },
            { n: 'sellPrice', l: 'Precio venta (EUR)', t: 'number', d: 235000, min: 0, step: 1000 },
            { n: 'expenses', l: 'Gastos deducibles (EUR)', t: 'number', d: 8000, min: 0, step: 100 },
            { n: 'taxRate', l: 'Tipo aplicable (%)', t: 'number', d: 21, min: 0, step: 0.1 },
        ],
        outputs: [
            { n: 'taxableGain', l: 'Ganancia sujeta', f: 'currency' },
            { n: 'tax', l: 'Impuesto estimado', f: 'currency' },
            { n: 'net', l: 'Ganancia neta', f: 'currency' },
        ],
        calculate(inp) {
            const taxableGain = Math.max(0, inp.sellPrice - inp.buyPrice - inp.expenses);
            const tax = taxableGain * (inp.taxRate / 100);
            const net = taxableGain - tax;
            return {
                values: { taxableGain, tax, net },
                explanation: 'Modelo simplificado; revisa deducciones y exenciones concretas con asesor fiscal.',
            };
        },
    },
    {
        id: 'dividend-tax',
        name: 'Impuesto sobre dividendos',
        category: 'taxes',
        order: 39,
        desc: 'Calcula retención e importe neto de dividendos.',
        realtime: true,
        inputs: [
            { n: 'gross', l: 'Dividendo bruto (EUR)', t: 'number', d: 1500, min: 0, step: 10 },
            { n: 'withholding', l: 'Retención (%)', t: 'number', d: 19, min: 0, step: 0.1 },
        ],
        outputs: [
            { n: 'tax', l: 'Retención', f: 'currency' },
            { n: 'net', l: 'Dividendo neto', f: 'currency' },
        ],
        calculate(inp) {
            const tax = inp.gross * (inp.withholding / 100);
            return {
                values: { tax, net: inp.gross - tax },
                explanation: 'El neto recibido depende de la retención fiscal aplicada al dividendo bruto.',
            };
        },
    },
    {
        id: 'break-even',
        name: 'Punto de equilibrio',
        category: 'investment',
        order: 40,
        desc: 'Unidades minimás para cubrir costes fijos y variables.',
        realtime: true,
        inputs: [
            { n: 'fixed', l: 'Costes fijos (EUR)', t: 'number', d: 12000, min: 0, step: 100 },
            { n: 'price', l: 'Precio unitario (EUR)', t: 'number', d: 45, min: 0.01, step: 0.01 },
            { n: 'variable', l: 'Coste variable unitario (EUR)', t: 'number', d: 18, min: 0, step: 0.01 },
        ],
        outputs: [
            { n: 'units', l: 'Unidades de equilibrio', f: 'number' },
            { n: 'salesValue', l: 'Facturacion de equilibrio', f: 'currency' },
        ],
        calculate(inp) {
            const contribution = inp.price - inp.variable;
            if (contribution <= 0) throw new Error('El margen de contribucion debe ser positivo.');
            const units = inp.fixed / contribution;
            return {
                values: { units, salesValue: units * inp.price },
                explanation: 'El break-even se alcanza cuando beneficio operativo es cero.',
            };
        },
    },
    {
        id: 'gross-net-margin',
        name: 'Margen bruto y neto',
        category: 'investment',
        order: 41,
        desc: 'Analiza eficiencia operativa y rentabilidad final.',
        realtime: true,
        inputs: [
            { n: 'revenue', l: 'Ingresos (EUR)', t: 'number', d: 80000, min: 0, step: 100 },
            { n: 'cogs', l: 'Coste de ventas (EUR)', t: 'number', d: 30000, min: 0, step: 100 },
            { n: 'opex', l: 'Gastos operativos (EUR)', t: 'number', d: 22000, min: 0, step: 100 },
        ],
        outputs: [
            { n: 'grossMargin', l: 'Margen bruto', f: 'percentage' },
            { n: 'netMargin', l: 'Margen neto', f: 'percentage' },
            { n: 'netProfit', l: 'Beneficio neto', f: 'currency' },
        ],
        calculate(inp) {
            const grossProfit = inp.revenue - inp.cogs;
            const netProfit = grossProfit - inp.opex;
            const grossMargin = FinanceMath.safeDiv(grossProfit, inp.revenue, 0) * 100;
            const netMargin = FinanceMath.safeDiv(netProfit, inp.revenue, 0) * 100;
            return {
                values: { grossMargin, netMargin, netProfit },
                explanation: 'Margen bruto evalua producto; margen neto refleja rentabilidad final del negocio.',
            };
        },
    },
    {
        id: 'project-roi',
        name: 'ROI de un proyecto',
        category: 'investment',
        order: 42,
        desc: 'Mide retorno de una inversión empresarial puntual.',
        realtime: true,
        inputs: [
            { n: 'investment', l: 'Inversión inicial (EUR)', t: 'number', d: 25000, min: 1, step: 100 },
            { n: 'benefit', l: 'Beneficio esperado (EUR)', t: 'number', d: 36000, min: 0, step: 100 },
            { n: 'years', l: 'Duración del proyecto (años)', t: 'number', d: 2, min: 1, step: 1 },
        ],
        outputs: [
            { n: 'roi', l: 'ROI total', f: 'percentage' },
            { n: 'annualizedRoi', l: 'ROI anualizado', f: 'percentage' },
        ],
        calculate(inp) {
            const roi = FinanceMath.safeDiv(inp.benefit - inp.investment, inp.investment, 0) * 100;
            const annualizedRoi = FinanceMath.cagr(inp.investment, inp.benefit, inp.years);
            return {
                values: { roi, annualizedRoi },
                explanation: 'El ROI anualizado permite comparar proyectos de distinta duración.',
            };
        },
    },
    {
        id: 'cac-vs-ltv',
        name: 'CAC vs LTV',
        category: 'investment',
        order: 43,
        desc: 'Valida eficiencia de adquisicion frente al valor del cliente.',
        realtime: true,
        inputs: [
            { n: 'cac', l: 'CAC (EUR)', t: 'number', d: 120, min: 0, step: 1 },
            { n: 'arpu', l: 'Ingreso mensual por cliente (EUR)', t: 'number', d: 35, min: 0, step: 1 },
            { n: 'grossMargin', l: 'Margen bruto (%)', t: 'number', d: 75, min: 0, max: 100, step: 1 },
            { n: 'churn', l: 'Churn mensual (%)', t: 'number', d: 4, min: 0.1, step: 0.1 },
        ],
        outputs: [
            { n: 'ltv', l: 'LTV estimado', f: 'currency' },
            { n: 'ratio', l: 'Ratio LTV/CAC', f: 'number' },
            { n: 'payback', l: 'Payback (meses)', f: 'number' },
        ],
        calculate(inp) {
            const grossMonthly = inp.arpu * (inp.grossMargin / 100);
            const ltv = grossMonthly / (inp.churn / 100);
            const ratio = FinanceMath.safeDiv(ltv, inp.cac, 0);
            const payback = FinanceMath.safeDiv(inp.cac, grossMonthly, 0);
            return {
                values: { ltv, ratio, payback },
                explanation: ratio >= 3 ? 'LTV/CAC saludable (>=3) en este escenario.' : 'LTV/CAC ajustado; conviene optimizar CAC o retención.',
            };
        },
    },
];

const modal = document.getElementById('calculatorModal');
const calcBody = document.getElementById('calculatorBody');

function getCalculatorById(id) {
    return CALCULATORS_DB.find((c) => c.id === id);
}

function formatValue(value, format) {
    const num = FinanceMath.safeNumber(value, 0);
    if (format === 'currency') return CURRENCY.format(num);
    if (format === 'percentage') return `${PERCENT.format(num)}%`;
    if (format === 'number') return NUMBER.format(num);
    return String(value ?? '-');
}

function validateValue(input, rawValue) {
    if (input.t === 'text') {
        const text = String(rawValue ?? '').trim();
        if (!text) return { ok: false, message: `${input.l}: valor requerido` };
        return { ok: true, value: text };
    }

    if (input.t === 'select') {
        const v = rawValue;
        if (v === null || v === undefined || v === '') return { ok: false, message: `${input.l}: selección requerida` };
        return { ok: true, value: v };
    }

    const value = FinanceMath.safeNumber(rawValue, NaN);
    if (!Number.isFinite(value)) return { ok: false, message: `${input.l}: número inválido` };
    if (typeof input.min === 'number' && value < input.min) return { ok: false, message: `${input.l}: mínimo ${input.min}` };
    if (typeof input.max === 'number' && value > input.max) return { ok: false, message: `${input.l}: máximo ${input.max}` };
    return { ok: true, value };
}

function collectInputs(formEl, calc) {
    const data = new FormData(formEl);
    const parsed = {};
    const errors = [];

    for (const input of calc.inputs) {
        const rawValue = data.get(input.n);
        const result = validateValue(input, rawValue);
        if (!result.ok) errors.push(result.message);
        else parsed[input.n] = result.value;
    }

    return { parsed, errors };
}

function renderInput(input) {
    const common = `name="${input.n}" class="form-input calc-live-input" aria-label="${input.l}"`;

    if (input.t === 'select') {
        const options = Object.entries(input.o || {})
            .map(([value, label]) => `<option value="${value}" ${String(input.d) === String(value) ? 'selected' : ''}>${label}</option>`)
            .join('');

        return `<div class="form-group">
            <label class="form-label">${input.l}</label>
            <select name="${input.n}" class="form-select calc-live-input">${options}</select>
        </div>`;
    }

    if (input.t === 'text') {
        return `<div class="form-group">
            <label class="form-label">${input.l}</label>
            <input type="text" ${common} value="${String(input.d ?? '').replace(/"/g, '&quot;')}" />
        </div>`;
    }

    return `<div class="form-group">
        <label class="form-label">${input.l}</label>
        <input type="number" ${common}
            value="${input.d ?? ''}"
            ${typeof input.min === 'number' ? `min="${input.min}"` : ''}
            ${typeof input.max === 'number' ? `max="${input.max}"` : ''}
            ${input.step ? `step="${input.step}"` : ''}
        />
    </div>`;
}

function renderTable(table) {
    if (!table || !Array.isArray(table.columns) || !Array.isArray(table.rows)) return '';

    const head = table.columns.map((c) => `<th style="padding:8px;border-bottom:1px solid #3a3a3a;text-align:left;">${c}</th>`).join('');
    const body = table.rows
        .map((row) => {
            const cells = row
                .map((cell) => {
                    const rendered = typeof cell === 'number' ? NUMBER.format(cell) : String(cell);
                    return `<td style="padding:8px;border-bottom:1px solid #2a2a2a;">${rendered}</td>`;
                })
                .join('');
            return `<tr>${cells}</tr>`;
        })
        .join('');

    return `<div class="result-box" style="margin-top:1rem;overflow:auto; text-align:left;">
        <div class="result-label" style="margin-bottom:0.8rem;">Tabla de detalle</div>
        <table style="width:100%; border-collapse:collapse; color:#d8d8d8; font-size:0.9rem;">
            <thead><tr>${head}</tr></thead>
            <tbody>${body}</tbody>
        </table>
    </div>`;
}

function renderResult(calc, result) {
    const blocks = calc.outputs
        .map((output) => {
            const value = result.values?.[output.n];
            return `<div class="result-item" style="margin-bottom:0.75rem;">
                <div class="result-label">${output.l}</div>
                <div class="result-value" style="font-size:1.5rem;">${formatValue(value, output.f)}</div>
            </div>`;
        })
        .join('');

    const explanation = result.explanation
        ? `<div class="result-box" style="margin-top:1rem; text-align:left;">
            <div class="result-label">Interpretación</div>
            <div style="color:#d0d0d0; line-height:1.5;">${result.explanation}</div>
        </div>`
        : '';

    return `<div style="margin-top:1.5rem;">${blocks}${explanation}${renderTable(result.table)}</div>`;
}

function runCalculation(calcId, forceMessage = false) {
    const calc = getCalculatorById(calcId);
    if (!calc) return;
    const formEl = document.getElementById(`form-${calcId}`);
    const outputEl = document.getElementById('calc-result-area');
    if (!formEl || !outputEl) return;

    const { parsed, errors } = collectInputs(formEl, calc);
    if (errors.length) {
        if (forceMessage) {
            outputEl.innerHTML = `<div style="margin-top:1rem;color:#ff6b6b;">${errors[0]}</div>`;
        } else {
            outputEl.innerHTML = '';
        }
        return;
    }

    try {
        const result = calc.calculate(parsed);
        outputEl.innerHTML = renderResult(calc, result);
    } catch (error) {
        outputEl.innerHTML = `<div style="margin-top:1rem;color:#ff6b6b;">${error.message || 'Error de cálculo'}</div>`;
    }
}

function handleCalculateSubmit(event, calcId) {
    event.preventDefault();
    runCalculation(calcId, true);
}

function attachRealtime(calcId) {
    const formEl = document.getElementById(`form-${calcId}`);
    if (!formEl) return;
    const liveInputs = formEl.querySelectorAll('.calc-live-input');
    liveInputs.forEach((el) => {
        el.addEventListener('input', () => runCalculation(calcId, false));
        el.addEventListener('change', () => runCalculation(calcId, false));
    });
    runCalculation(calcId, false);
}

function openCalculator(id) {
    const calc = getCalculatorById(id);
    if (!calc) return;
    window.location.href = buildUrl(`calculator.html?calc=${encodeURIComponent(calc.id)}`);
}

function close_modal() {
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function closeCalculator() {
    close_modal();
}

function handleCardKeydown(event, id) {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openCalculator(id);
    }
}

function setupFilters() {
    document.querySelectorAll('.filter-btn').forEach((btn) => {
        btn.onclick = () => {
            document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');
            const category = btn.dataset.filter;
            document.querySelectorAll('[data-calc]').forEach((card) => {
                const calc = CALCULATORS_DB.find((c) => c.id === card.dataset.calc);
                const show = category === 'all' || calc.category === category;
                card.style.display = show ? 'block' : 'none';
            });
        };
    });
}

function renderCalculatorPage(calc, hostEl) {
    const inputsHtml = calc.inputs.map(renderInput).join('');
    hostEl.innerHTML = `
        <div class="calculator-page-shell">
            <div class="calculator-page-head">
                <h1 class="calculator-title">${calc.name}</h1>
                <p class="calculator-page-subtitle">${calc.desc}</p>
            </div>
            <form id="form-${calc.id}" onsubmit="handleCalculateSubmit(event, '${calc.id}')">
                ${inputsHtml}
                <div class="button-group">
                    <button type="submit" class="btn-primary">Calcular</button>
                    <a href="${buildUrl('calculadoras/index.html')}" class="btn-secondary calculator-back-link">Volver</a>
                </div>
            </form>
            <div id="calc-result-area"></div>
            <section class="calculator-seo-content" id="calculatorSeoContent" aria-label="Contenido explicativo de la calculadora"></section>
        </div>
    `;

    const seoHost = hostEl.querySelector('#calculatorSeoContent');
    if (seoHost) {
        seoHost.innerHTML = renderCalculatorSeoContent(calc);
    }

    attachRealtime(calc.id);
}

function calcInputSummary(calc) {
    return calc.inputs.map((input) => input.l).join(', ');
}

function calcFormulaText(calc) {
    const target = calc.outputs?.[0]?.l || 'Resultado principal';
    const vars = calc.inputs.map((input) => input.n).join(', ');
    return `${target} = f(${vars})`;
}

function calcExampleText(calc) {
    const defaultInput = {};
    calc.inputs.forEach((input) => {
        defaultInput[input.n] = input.d;
    });

    try {
        const result = calc.calculate(defaultInput);
        const firstOutput = calc.outputs?.[0];
        if (!firstOutput) return 'Introduce tus propios datos para obtener una simulación personalizada.';
        const value = result?.values?.[firstOutput.n];
        return `Ejemplo rápido: usando los valores por defecto de la calculadora, el resultado estimado en "${firstOutput.l}" es ${formatValue(value, firstOutput.f)}.`;
    } catch (error) {
        return 'Introduce tus propios datos para obtener una simulación personalizada.';
    }
}

function categoryUseText(category) {
    if (category === 'investment') return 'Sirve para proyectar escenarios de inversión y comparar rentabilidad esperada frente a riesgo y horizonte temporal.';
    if (category === 'savings') return 'Sirve para planificar metas de ahorro con aportaciones periódicas y horizontes definidos.';
    if (category === 'loans') return 'Sirve para evaluar cuotas, coste financiero total y decisiones de financiación con mayor precisión.';
    if (category === 'real-estate') return 'Sirve para analizar operaciones inmobiliarias, flujo de caja y rentabilidad del activo.';
    return 'Sirve para estimar el impacto fiscal y tomar decisiones con una visión neta de impuestos.';
}

function renderCalculatorSeoContent(calc) {
    const inputSummary = calcInputSummary(calc);
    const formula = calcFormulaText(calc);
    const example = calcExampleText(calc);
    const categoryLabel = CATEGORY_LABELS[calc.category] || 'Finanzas';
    const useText = categoryUseText(calc.category);

    return `
        <article class="result-box" style="text-align:left; margin-top:1.5rem;">
            <h2 class="calculator-title" style="margin-bottom:0.5rem; font-size:1.45rem;">Qué Calcula ${calc.name}</h2>
            <p>${calc.desc} Esta herramienta utiliza las variables: ${inputSummary}.</p>
        </article>

        <article class="result-box" style="text-align:left;">
            <h3 class="result-label" style="font-size:1rem; color:#f0d895;">Para Qué Sirve</h3>
            <p>${useText}</p>
            <p>Se recomienda para usuarios interesados en ${categoryLabel.toLowerCase()} que necesitan decisiones cuantificables y comparables.</p>
        </article>

        <article class="result-box" style="text-align:left;">
            <h3 class="result-label" style="font-size:1rem; color:#f0d895;">Fórmula Usada</h3>
            <p>${formula}</p>
            <p>La implementación aplica validaciones numéricas y límites de entrada para ofrecer resultados consistentes.</p>
        </article>

        <article class="result-box" style="text-align:left;">
            <h3 class="result-label" style="font-size:1rem; color:#f0d895;">Ejemplo Práctico</h3>
            <p>${example}</p>
        </article>

        <article class="result-box" style="text-align:left;">
            <h3 class="result-label" style="font-size:1rem; color:#f0d895;">Preguntas Frecuentes</h3>
            <details style="margin-bottom:0.6rem;">
                <summary>¿Qué datos debo introducir para ${calc.name}?</summary>
                <p style="margin-top:0.4rem;">Debes completar los campos visibles en el formulario. Los resultados se actualizan automáticamente al cambiar los valores.</p>
            </details>
            <details style="margin-bottom:0.6rem;">
                <summary>¿Los resultados son orientativos o definitivos?</summary>
                <p style="margin-top:0.4rem;">Los cálculos son precisos para simulación financiera, pero conviene contrastarlos con condiciones reales de mercado, comisiones o fiscalidad concreta.</p>
            </details>
            <details>
                <summary>¿Puedo comparar escenarios?</summary>
                <p style="margin-top:0.4rem;">Sí. Modifica uno o varios campos y revisa cómo cambia el resultado para tomar una mejor decisión.</p>
            </details>
        </article>
    `;
}

function renderCalculadorasListingPage() {
    const listingGrid = document.getElementById('calculadorasListingGrid');
    if (!listingGrid) return false;

    const sorted = [...CALCULATORS_DB].sort((a, b) => (a.order || 999) - (b.order || 999));
    listingGrid.innerHTML = sorted
        .map((calc) => `
            <article class="premium-card premium-card--${calc.category}" data-calc="${calc.id}">
                <div class="card-content">
                    <h2 class="card-title">${calc.name}</h2>
                    <p class="card-description">${calc.desc}</p>
                    <a class="btn-secondary calculator-back-link" href="${buildUrl(`calculator.html?calc=${encodeURIComponent(calc.id)}`)}">Abrir calculadora</a>
                </div>
            </article>
        `)
        .join('');

    return true;
}

function initCalculatorStandalonePage() {
    const pageBody = document.getElementById('calculatorPageBody');
    if (!pageBody) return false;

    const params = new URLSearchParams(window.location.search);
    const calcId = params.get('calc');
    const calc = calcId ? getCalculatorById(calcId) : null;

    if (!calc) {
        pageBody.innerHTML = `
            <div class="calculator-page-shell">
                <h1 class="calculator-title">Calculadora no encontrada</h1>
                <p class="calculator-page-subtitle">No se ha encontrado la calculadora solicitada.</p>
                <div class="button-group">
                    <a href="index.html#calculadoras" class="btn-primary calculator-back-link">Ir al listado</a>
                </div>
            </div>
        `;
        return true;
    }

    renderCalculatorPage(calc, pageBody);
    return true;
}

function renderCard(calc) {
    return `<article class="premium-card premium-card--${calc.category} ${calc.order <= 5 ? 'premium-card--highlighted' : ''}" data-calc="${calc.id}"
        tabindex="0" role="button" aria-label="Abrir calculadora ${calc.name}"
        onclick="openCalculator('${calc.id}')" onkeydown="handleCardKeydown(event, '${calc.id}')">
        <div class="card-content">
            <h3 class="card-title">${calc.name}</h3>
            <p class="card-description">${calc.desc}</p>
        </div>
    </article>`;
}

function init() {
    const grid = document.getElementById('calculatorsGrid');
    if (!grid) return;

    const sorted = [...CALCULATORS_DB].sort((a, b) => (a.order || 999) - (b.order || 999));
    grid.innerHTML = sorted.map(renderCard).join('');

    setupFilters();
}

if (modal) {
    modal.addEventListener('click', (event) => {
        if (event.target === modal) close_modal();
    });
}

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal && modal.classList.contains('active')) close_modal();
});

document.addEventListener('DOMContentLoaded', () => {
    registerPwaServiceWorker();
    const standaloneLoaded = initCalculatorStandalonePage();
    if (standaloneLoaded) {
        console.log(`Zyvola lista con ${CALCULATORS_DB.length} calculadoras inteligentes.`);
        return;
    }

    const listingLoaded = renderCalculadorasListingPage();
    if (!listingLoaded) init();
    console.log(`Zyvola lista con ${CALCULATORS_DB.length} calculadoras inteligentes.`);
});