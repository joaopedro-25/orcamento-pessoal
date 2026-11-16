import { useEffect, useMemo, useRef, useState } from 'react';
import { Wallet, Plus, LogOut, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, PiggyBank, LockKeyhole, Moon, Sun, CalendarClock, LayoutDashboard } from 'lucide-react';
import SpendingRing from './SpendingRing.jsx';
import FuturePlanning from './FuturePlanning.jsx';

const API = 'http://localhost:8081/api/meses';
const money = n => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(n || 0));
const monthLabel = date => new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date);
const monthKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
const expenseCategories = ['Moradia', 'Alimentação', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Assinaturas', 'Outros'];

export default function App() {
  const [credentials, setCredentials] = useState(() => sessionStorage.getItem('gastos-auth-v2') || '');
  const [dark, setDark] = useState(() => localStorage.getItem('gastos-theme') === 'dark');
  const [draft, setDraft] = useState({ email: '', password: '' });
  const [month, setMonth] = useState(() => new Date());
  const [page, setPage] = useState('overview');
  const [data, setData] = useState({ salario: 0, gastos: [] });
  const [saved, setSaved] = useState(false);
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState('');
  const [salaryStatus, setSalaryStatus] = useState('');
  const persistedSalary = useRef(0);
  const salaryTimer = useRef(null);
  const [newExpense, setNewExpense] = useState({ nome: '', valor: '', fixo: true, categoria: 'Outros' });
  const key = monthKey(month);
  const userEmail = useMemo(() => { try { return atob(credentials).split(':')[0]; } catch { return ''; } }, [credentials]);
  const total = useMemo(() => data.gastos.reduce((sum, item) => sum + Number(item.valor || 0), 0), [data.gastos]);
  const balance = Number(data.salario || 0) - total;
  const fixedTotal = data.gastos.filter(g => g.fixo).reduce((sum, item) => sum + Number(item.valor || 0), 0);
  const share = data.salario ? total / data.salario * 100 : 0;

  useEffect(() => {
    if (!credentials) return;
    let active = true;
    setData({ salario: 0, gastos: [] });
    setSaved(false);
    setError('');
    setSalaryStatus('');
    fetch(`${API}/${key}`, { headers: { Authorization: `Basic ${credentials}` } })
      .then(async response => { if (response.status === 404) return null; if (!response.ok) throw new Error('Não foi possível carregar o mês.'); return response.json(); })
      .then(json => { if (!active) return; if (json) { persistedSalary.current = Number(json.salario); setData({ salario: Number(json.salario), gastos: json.gastos || [] }); setOffline(false); setSaved(true); setSalaryStatus('Salário salvo no banco'); } else { persistedSalary.current = 0; setData({ salario: 0, gastos: [] }); setSaved(false); setOffline(false); } })
      .catch(() => { if (active) { setOffline(true); setError('Não foi possível carregar os dados do mês. Confira se o back-end está ativo.'); } });
    return () => { active = false; };
  }, [credentials, key]);

  async function login(event) {
    event.preventDefault(); setError('');
    const auth = btoa(`${draft.email}:${draft.password}`);
    try {
      const response = await fetch(API, { headers: { Authorization: `Basic ${auth}` } });
      if (response.status === 401) throw new Error('E-mail ou senha incorretos.');
      if (!response.ok) throw new Error('API indisponível.');
      sessionStorage.setItem('gastos-auth-v2', auth); setCredentials(auth);
    } catch (cause) {
      setError(cause.message || 'Não foi possível conectar à API em localhost:8081. Inicie o back-end e tente novamente.');
    }
  }
  function logout() { sessionStorage.removeItem('gastos-auth-v2'); sessionStorage.removeItem('gastos-auth'); setCredentials(''); }
  async function saveBudget() {
    try {
      const response = await fetch(`${API}/${key}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Basic ${credentials}` }, body: JSON.stringify({ salario: Number(data.salario), gastos: data.gastos }) });
      if (!response.ok) throw new Error('Falha ao salvar orçamento.');
      setSaved(true); setOffline(false); setError('');
    } catch { setOffline(true); setError('Não consegui salvar. Verifique o back-end e tente novamente.'); }
  }
  async function persistSalary(value) {
    clearTimeout(salaryTimer.current);
    salaryTimer.current = null;
    const salario = Number(value);
    if (!Number.isFinite(salario) || salario < 0 || salario === persistedSalary.current) return;
    setSalaryStatus('Salvando…');
    try {
      const response = await fetch(`${API}/${key}/salario`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Basic ${credentials}` }, body: JSON.stringify(salario) });
      if (!response.ok) throw new Error();
      persistedSalary.current = salario;
      setSalaryStatus('Salário salvo no banco');
      setOffline(false);
      setError('');
    } catch {
      setSalaryStatus('Falha ao salvar. Tente novamente.');
      setError('O salário não foi salvo. Verifique a conexão e saia do campo para tentar novamente.');
    }
  }
  function changeSalary(event) {
    const value = event.currentTarget.value;
    setData(current => ({ ...current, salario: value }));
    setSaved(false);
    if (salaryTimer.current) clearTimeout(salaryTimer.current);
    setSalaryStatus('Salvando automaticamente…');
    if (value !== '') salaryTimer.current = setTimeout(() => persistSalary(value), 500);
  }
  function flushSalary(event) {
    clearTimeout(salaryTimer.current);
    persistSalary(event.currentTarget.value);
  }
  function addExpense(event) {
    event.preventDefault();
    if (!newExpense.nome.trim() || Number(newExpense.valor) <= 0) return;
    setData(v => ({ ...v, gastos: [...v.gastos, { ...newExpense, valor: Number(newExpense.valor) }] }));
    setNewExpense({ nome: '', valor: '', fixo: true, categoria: 'Outros' });
    setSaved(false);
  }
  function removeExpense(index) { setData(v => ({ ...v, gastos: v.gastos.filter((_, i) => i !== index) })); setSaved(false); }
  function shiftMonth(amount) { setMonth(v => new Date(v.getFullYear(), v.getMonth() + amount, 1)); }
  function toggleTheme() { setDark(current => { const next = !current; localStorage.setItem('gastos-theme', next ? 'dark' : 'light'); return next; }); }

  if (!credentials) return <main className="login-wrap"><form className="login-card" onSubmit={login}><div className="brand-icon"><Wallet size={23}/></div><p className="eyebrow">FINANÇAS PESSOAIS</p><h1>Seu dinheiro,<br/>com mais clareza.</h1><p className="muted">Entre para acessar seu planejamento mensal.</p><label>E-mail<input type="email" required value={draft.email} onChange={e => setDraft(v => ({...v, email:e.target.value}))} placeholder="voce@email.com" autoComplete="username"/></label><label>Senha<input type="password" required value={draft.password} onChange={e => setDraft(v => ({...v, password:e.target.value}))} placeholder="Sua senha" autoComplete="current-password"/></label>{error && <p className="error">{error}</p>}<button className="primary full" type="submit"><LockKeyhole size={16}/> Entrar</button><small>Conexão protegida com seu orçamento pessoal</small></form></main>;

  return <div className={`app-shell${dark ? ' dark' : ''}`}>
    <aside className="sidebar">
      <div className="brand"><div className="brand-icon"><Wallet size={20}/></div><span>meu<span className="brand-light">orçamento</span></span></div>
      <p className="side-label">ESPAÇO PESSOAL</p>
      <nav className="side-nav" aria-label="Navegação principal">
        <button className={`nav-item ${page === 'overview' ? 'active' : ''}`} onClick={() => setPage('overview')}><LayoutDashboard size={15}/> Visão geral</button>
        <button className={`nav-item ${page === 'future' ? 'active' : ''}`} onClick={() => setPage('future')}><CalendarClock size={15}/> Planejamento Futuro</button>
      </nav>
      <div className="side-bottom"><div className="avatar">{userEmail.slice(0,2).toUpperCase()}</div><div className="user-meta"><strong title={userEmail}>{userEmail}</strong><small>Meu planejamento</small></div><button className="icon-button theme-toggle" onClick={toggleTheme} aria-label={dark ? 'Ativar tema claro' : 'Ativar tema escuro'} title={dark ? 'Ativar tema claro' : 'Ativar tema escuro'}>{dark ? <Sun size={17}/> : <Moon size={17}/>}</button><button className="icon-button" onClick={logout} aria-label="Sair"><LogOut size={17}/></button></div>
    </aside>
    <main className="main">
      {page === 'future' ? <><header className="topbar"><div><p className="eyebrow">SEUS PRÓXIMOS PASSOS</p><h1>Planejamento Futuro</h1></div></header>{offline && <div className="notice">A API está indisponível. Confira se o back-end está ativo.</div>}<FuturePlanning credentials={credentials}/></> :
      <>
        <header className="topbar"><div><p className="eyebrow">PAINEL FINANCEIRO</p><h1>Visão geral</h1></div><div className="month-select"><button className="icon-button" aria-label="Mês anterior" onClick={() => shiftMonth(-1)}><ChevronLeft size={19}/></button><strong>{monthLabel(month)}</strong><button className="icon-button" aria-label="Próximo mês" onClick={() => shiftMonth(1)}><ChevronRight size={19}/></button></div></header>
        {offline && <div className="notice">API indisponível. Nenhuma alteração será salva até restabelecer a conexão.</div>}{error && <div className="notice error">{error}</div>}
        <section className="summary-grid"><article className="metric income"><div className="metric-head"><span>Salário do mês</span><span className="metric-icon"><TrendingUp size={18}/></span></div><strong>{money(data.salario)}</strong><label className="inline-edit">Coloque seu salário/ganho mensal <input type="number" min="0" step="0.01" placeholder="Digite o valor mensal" value={data.salario || ''} onChange={changeSalary} onBlur={flushSalary} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur();}} aria-label="Salário mensal"/><small className="salary-status" role="status">{salaryStatus || 'Salve ao sair deste campo'}</small></label></article><article className="metric expense"><div className="metric-head"><span>Gastos planejados</span><span className="metric-icon"><TrendingDown size={18}/></span></div><strong>{money(total)}</strong><small>{data.gastos.length} itens · {share.toFixed(0)}% da renda</small></article><article className="metric balance"><div className="metric-head"><span>Disponível no mês</span><span className="metric-icon"><PiggyBank size={18}/></span></div><strong>{money(balance)}</strong><small>{balance >= 0 ? 'Livre após os gastos previstos' : 'Seus gastos passaram da renda'}</small></article></section>
        <section className="content-grid"><article className="panel chart-panel"><SpendingRing expenses={data.gastos} total={total} month={month}/></article><article className="panel bars-panel"><div className="panel-heading"><div><h2>Renda comprometida</h2><p>Salário comparado aos gastos</p></div></div><div className="bar-group"><div className="bar-label"><span>Gastos totais</span><strong>{money(total)}</strong></div><div className="track"><div className="bar red" style={{width:`${Math.min(100,share)}%`}}/></div></div><div className="bar-group"><div className="bar-label"><span>Gastos fixos</span><strong>{money(fixedTotal)}</strong></div><div className="track"><div className="bar purple" style={{width:`${data.salario?Math.min(100,fixedTotal/data.salario*100):0}%`}}/></div></div><div className="bar-group"><div className="bar-label"><span>Saldo disponível</span><strong>{money(Math.max(0,balance))}</strong></div><div className="track"><div className="bar green" style={{width:`${data.salario?Math.min(100,Math.max(0,balance)/data.salario*100):0}%`}}/></div></div><div className="bar-foot"><span>Renda mensal</span><strong>{money(data.salario)}</strong></div></article></section>
        <section className="panel expenses-panel"><div className="panel-heading"><div><h2>Planejamento do mês</h2><p>Inclua despesas fixas e planos variáveis</p></div><button className="primary" onClick={saveBudget} disabled={!credentials || offline}><span>{saved?'Salvo':'Salvar mês'}</span></button></div><form className="add-row" onSubmit={addExpense}><input aria-label="Nome do gasto" placeholder="Ex.: Conta de luz" value={newExpense.nome} onChange={e=>setNewExpense(v=>({...v,nome:e.target.value}))}/><input aria-label="Valor do gasto" type="number" min="0.01" step="0.01" placeholder="Valor (R$)" value={newExpense.valor} onChange={e=>setNewExpense(v=>({...v,valor:e.target.value}))}/><select aria-label="Categoria do gasto" value={newExpense.categoria} onChange={e=>setNewExpense(v=>({...v,categoria:e.target.value}))}>{expenseCategories.map(category=><option key={category}>{category}</option>)}</select><label className="check"><input type="checkbox" checked={newExpense.fixo} onChange={e=>setNewExpense(v=>({...v,fixo:e.target.checked}))}/> Fixo</label><button className="add-button" aria-label="Adicionar gasto"><Plus size={19}/></button></form><div className="expense-list">{data.gastos.map((item,i)=><div className="expense-row" key={`${item.nome}-${i}`}><span className="expense-symbol">{item.fixo?'↻':'◇'}</span><div className="expense-name"><strong>{item.nome}</strong><small>{item.categoria || 'Outros'} · {item.fixo?'Fixo':'Planejado'}</small></div><span className="expense-value">{money(item.valor)}</span><button className="remove" aria-label={`Remover ${item.nome}`} onClick={()=>removeExpense(i)}>×</button></div>)}{!data.gastos.length&&<p className="empty">Nenhum gasto cadastrado para este mês.</p>}</div><footer className="panel-total"><span>Total de gastos <small>({data.gastos.length} itens · {data.gastos.filter(g=>g.fixo).length} fixos)</small></span><strong>{money(total)}</strong></footer></section><p className="page-note">Seus dados são organizados por mês e salvos no seu banco de dados.</p>
      </>}
    </main>
  </div>;
}
