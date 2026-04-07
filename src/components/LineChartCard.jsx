import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
} from "chart.js";
import { Line } from "react-chartjs-2";
import PremiumCard from "./PremiumCard";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

export default function LineChartCard({ title, labels, seriesLabel, dataPoints }) {
  const chartData = {
    labels,
    datasets: [
      {
        label: seriesLabel,
        data: dataPoints,
        borderColor: "#D4AF37",
        backgroundColor: "rgba(242, 201, 76, 0.18)",
        fill: true,
        tension: 0.3
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: "#7b6211"
        }
      }
    }
  };

  return (
    <PremiumCard title={title}>
      <Line data={chartData} options={options} />
    </PremiumCard>
  );
}
