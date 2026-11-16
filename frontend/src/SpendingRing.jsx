import { useState } from 'react';

const colors = ['#8064ad', '#a58ac7', '#c2b2d5', '#789b84', '#d2b66f', '#c87670', '#6688a5', '#b38b72'];
const money = n => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

export default function SpendingRing({ expenses = [], total, month = new Date() }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const entries = expenses
    .map((expense, index) => ({
      name: expense.nome || expense.name || 'Gasto sem nome',
      value: Number(expense.valor ?? expense.value ?? 0),
      index,
      color: colors[index % colors.length]
    }))
    .filter(expense => expense.value > 0);
  const chartTotal = entries.reduce((sum, entry) => sum + entry.value, 0);
  const active = entries.find(entry => entry.index === activeIndex);
  let cursor = 0;
  const stops = entries.map(entry => {
    const start = cursor;
    cursor += chartTotal ? entry.value / chartTotal * 100 : 0;
    return `${entry.color} ${start}% ${cursor}%`;
  });
  const chartStyle = { background: stops.length ? `conic-gradient(from -90deg, ${stops.join(', ')})` : '#514b54' };

  return <>
    <div className="panel-heading">
      <div><h2>Distribuição dos gastos</h2><p>Como sua renda está planejada</p></div>
      <span className="subtle-badge">{new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(month).replace('.', '')}</span>
    </div>
    <div className="chart-area">
      <div className="ring-wrap">
        <div className="ring-graphic" style={chartStyle} role="img" aria-label={`Distribuição de ${entries.length} gastos, total ${money(chartTotal)}`} />
        <div className="ring-center"><strong>{money(active?.value ?? total ?? chartTotal)}</strong><span>{active?.name || 'gastos no mês'}</span></div>
      </div>
      <div className="legend">
        {entries.map(entry => <button
          className={`legend-row ${activeIndex === entry.index ? 'chosen' : ''}`}
          key={`${entry.name}-${entry.index}`}
          onMouseEnter={() => setActiveIndex(entry.index)}
          onMouseLeave={() => setActiveIndex(null)}
          onFocus={() => setActiveIndex(entry.index)}
          onBlur={() => setActiveIndex(null)}
          onClick={() => setActiveIndex(activeIndex === entry.index ? null : entry.index)}
        ><i className="swatch" style={{ backgroundColor: entry.color }} /><span>{entry.name}</span><strong>{money(entry.value)}</strong></button>)}
        {!entries.length && <p className="muted">Adicione gastos para ver a distribuição.</p>}
      </div>
    </div>
  </>;
}
