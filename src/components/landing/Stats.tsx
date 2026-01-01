const stats = [
  { value: '2M+', label: 'Active Users' },
  { value: '$5B+', label: 'Transactions' },
  { value: '200+', label: 'Countries' },
  { value: '99.9%', label: 'Uptime' },
];

export function Stats() {
  return (
    <section className="py-16 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-card p-8 sm:p-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={stat.label} className={`animate-slide-up delay-${(index + 1) * 100}`}>
                <p className="text-4xl sm:text-5xl font-bold gradient-text mb-2">{stat.value}</p>
                <p className="text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
