interface AssetStatsProps {
  data: { high24h: number; low24h: number; volume: string; marketCap: string; supply: string; maxSupply: string };
  symbol: string;
}

export function AssetStats({ data, symbol }: AssetStatsProps) {
  const stats = [
    { label: '24h High', value: `$${data.high24h.toLocaleString()}` },
    { label: '24h Low', value: `$${data.low24h.toLocaleString()}` },
    { label: '24h Volume', value: `$${data.volume}` },
    { label: 'Market Cap', value: `$${data.marketCap}` },
    { label: 'Circulating Supply', value: data.supply },
    { label: 'Max Supply', value: data.maxSupply },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 animate-slide-up">
      {stats.map(s => (
        <div key={s.label} className="glass-card p-3 text-center">
          <p className="text-xs text-muted-foreground">{s.label}</p>
          <p className="text-sm font-semibold text-foreground mt-0.5">{s.value}</p>
        </div>
      ))}
    </div>
  );
}
