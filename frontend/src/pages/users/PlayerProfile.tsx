import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Highcharts from 'highcharts';
import HC_more from 'highcharts/highcharts-more';
import HighchartsReact from 'highcharts-react-official';

// @ts-ignore
if (typeof HC_more === 'function') {
  // @ts-ignore
  HC_more(Highcharts);
} else if (HC_more && typeof (HC_more as any).default === 'function') {
  (HC_more as any).default(Highcharts);
}

export default function PlayerProfile() {
  const { id } = useParams();
  const [player, setPlayer] = useState<any>(null);

  useEffect(() => {
    axios.get(`http://trickster.test/backend/public/api/v1/players/${id}`)
      .then(res => setPlayer(res.data))
      .catch(console.error);
  }, [id]);

  if (!player) return <div className="p-8 font-bold">Loading...</div>;

  const scores = player.criteria_scores || [];
  const categories = scores.map((s: any) => s.criteria.name);
  const data = scores.map((s: any) => s.raw_value);

  const chartOptions = {
    chart: { polar: true, type: 'line', backgroundColor: 'transparent' },
    title: { text: 'Performance Radar', style: { fontFamily: 'Archivo Black' } },
    pane: { size: '80%' },
    xAxis: { categories, tickmarkPlacement: 'on', lineWidth: 0 },
    yAxis: { gridLineInterpolation: 'polygon', lineWidth: 0, min: 0 },
    series: [{ name: player.name, data, pointPlacement: 'on', color: '#f5d90a' }],
    credits: { enabled: false }
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-4xl font-['Archivo_Black'] uppercase">{player.name}</h2>
        <p className="font-['JetBrains_Mono']">IGN: {player.ign} | Role: {player.current_role}</p>
      </div>

      <div className="neo-border bg-white neo-shadow p-8 max-w-2xl">
        <HighchartsReact highcharts={Highcharts} options={chartOptions} />
      </div>
    </div>
  );
}
