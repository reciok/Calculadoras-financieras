import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import CalculadorasIndexPage from "./pages/calculadoras/CalculadorasIndexPage";
import CalculatorPage from "./pages/calculadoras/CalculatorPage";
import GuiaPage from "./pages/guias/GuiaPage";
import GuiasIndexPage from "./pages/guias/GuiasIndexPage";
import GlosarioIndexPage from "./pages/glosario/GlosarioIndexPage";
import GlosarioTermPage from "./pages/glosario/GlosarioTermPage";
import EconomiaIndexPage from "./pages/economia/EconomiaIndexPage";
import EconomiaPage from "./pages/economia/EconomiaPage";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/calculadoras" element={<CalculadorasIndexPage />} />
        <Route path="/calculadoras/:slug" element={<CalculatorPage />} />
        <Route path="/guias" element={<GuiasIndexPage />} />
        <Route path="/guias/:slug" element={<GuiaPage />} />
        <Route path="/glosario" element={<GlosarioIndexPage />} />
        <Route path="/glosario/:slug" element={<GlosarioTermPage />} />
        <Route path="/economia" element={<EconomiaIndexPage />} />
        <Route path="/economia/:slug" element={<EconomiaPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
