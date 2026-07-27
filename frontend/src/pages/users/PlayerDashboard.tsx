import { useState, useEffect } from 'react';
import axios from 'axios';

interface Player {
  id: string;
  name: string;
  vlr_player_id: string;
}

export default function PlayerDashboard() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const res = await axios.get('http://trickster.test/backend/public/api/v1/players');
        setPlayers(res.data);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchPlayers();
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-4xl font-['Archivo_Black'] uppercase mb-2">Global Leaderboard</h2>
        <p className="text-lg">Scraped players from VLR.gg</p>
      </div>

      <div className="neo-border bg-white neo-shadow overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[var(--color-primary)] border-b-[3px] border-[var(--color-secondary)]">
              <th className="p-4 font-bold uppercase">Rank</th>
              <th className="p-4 font-bold uppercase">Player</th>
              <th className="p-4 font-bold uppercase">VLR ID</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3} className="p-8 text-center font-bold">Loading...</td></tr>
            ) : players.length > 0 ? (
              players.map((p, index) => (
                <tr key={p.id} onClick={() => window.location.href = `/playerprofile/${p.id}`} className="border-b-[3px] border-[var(--color-secondary)] hover:bg-[var(--color-primary-subtle)] transition-colors cursor-pointer">
                  <td className="p-4 font-['JetBrains_Mono'] font-bold text-xl">#{index + 1}</td>
                  <td className="p-4 font-bold text-lg">{p.name}</td>
                  <td className="p-4 font-['JetBrains_Mono']">{p.vlr_player_id}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="p-8 text-center text-gray-500 italic font-bold">
                  No players found. The admin needs to run the scraper.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
