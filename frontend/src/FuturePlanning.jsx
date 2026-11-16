import { useEffect, useState } from 'react';
import { CalendarDays, Pencil, Plus, Target, Trash2 } from 'lucide-react';

const API = 'http://localhost:8081/api/planejamentos';
const categories = ['Reserva de emergência', 'Moradia', 'Educação', 'Compra importante', 'Viagem', 'Veículo', 'Saúde', 'Outros'];
const money = n => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(n || 0));
const emptyForm = { titulo: '', descricao: '', categoria: 'Reserva de emergência', valorEstimado: '', dataMeta: '' };

function monthlyGoal(value, dueDate) {
  if (!dueDate) return 'Defina um prazo';
  const due = new Date(`${dueDate}T00:00:00`);
  const now = new Date();
  const months = Math.max(1, (due.getFullYear() - now.getFullYear()) * 12 + due.getMonth() - now.getMonth());
  return due < new Date(now.getFullYear(), now.getMonth(), 1) ? 'Prazo vencido' : `${money(Number(value) / months)}/mês`;
}

export default function FuturePlanning({ credentials }) {
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function loadPlans() {
    setLoading(true); setError('');
    try {
      const response = await fetch(API, { headers: { Authorization: `Basic ${credentials}` } });
      if (!response.ok) throw new Error('Não foi possível carregar os planos.');
      setPlans(await response.json());
    } catch { setError('Falha ao conectar à API. Confira se o back-end está ativo.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { loadPlans(); }, [credentials]);

  async function savePlan(event) {
    event.preventDefault(); setBusy(true); setError('');
    const payload = { ...form, valorEstimado: Number(form.valorEstimado), dataMeta: form.dataMeta || null };
    try {
      const response = await fetch(editingId ? `${API}/${editingId}` : API, {
        method: editingId ? 'PUT' : 'POST',
        headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('Não foi possível salvar a meta. Confira os dados.');
      setForm(emptyForm); setEditingId(null); await loadPlans();
    } catch (cause) { setError(cause.message || 'Erro ao salvar planejamento.'); }
    finally { setBusy(false); }
  }
  function editPlan(plan) {
    setForm({ titulo: plan.titulo, descricao: plan.descricao || '', categoria: plan.categoria, valorEstimado: String(plan.valorEstimado), dataMeta: plan.dataMeta || '' });
    setEditingId(plan.id);
    document.querySelector('.future-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  async function deletePlan(id) {
    setError('');
    try {
      const response = await fetch(`${API}/${id}`, { method: 'DELETE', headers: { Authorization: `Basic ${credentials}` } });
      if (!response.ok) throw new Error('Não foi possível remover esta meta.');
      setPlans(current => current.filter(plan => plan.id !== id));
      if (editingId === id) { setEditingId(null); setForm(emptyForm); }
    } catch (cause) { setError(cause.message); }
  }
  const total = plans.reduce((sum, plan) => sum + Number(plan.valorEstimado || 0), 0);

  return <div className="future-layout">
    <section className="future-intro panel"><div className="future-intro-icon"><Target size={20}/></div><div><h2>Transforme planos em metas</h2><p>Escolha o que quer realizar, estime o custo e defina quando pretende alcançar. O valor mensal é uma referência simples dividindo o custo pelo tempo disponível.</p></div></section>
    <section className="future-summary"><article className="metric"><div className="metric-head"><span>Metas planejadas</span><span className="metric-icon"><Target size={18}/></span></div><strong>{plans.length}</strong><small>objetivos cadastrados</small></article><article className="metric"><div className="metric-head"><span>Total estimado</span><span className="metric-icon"><CalendarDays size={18}/></span></div><strong>{money(total)}</strong><small>soma dos valores das metas</small></article></section>
    <section className="panel future-form"><div className="panel-heading"><div><h2>{editingId ? 'Editar meta' : 'Adicionar uma meta'}</h2><p>Informe o objetivo, o custo aproximado e o prazo</p></div></div>
      <form onSubmit={savePlan}>
        <div className="future-fields"><label>O que você pretende fazer?<input required maxLength="100" value={form.titulo} onChange={e=>setForm(v=>({...v,titulo:e.target.value}))} placeholder="Ex.: Fazer uma viagem"/></label><label>Categoria<select value={form.categoria} onChange={e=>setForm(v=>({...v,categoria:e.target.value}))}>{categories.map(category=><option key={category}>{category}</option>)}</select></label><label>Preço estimado<input required type="number" min="0.01" step="0.01" value={form.valorEstimado} onChange={e=>setForm(v=>({...v,valorEstimado:e.target.value}))} placeholder="R$"/></label><label>Data da meta<input type="date" value={form.dataMeta} onChange={e=>setForm(v=>({...v,dataMeta:e.target.value}))}/></label><label className="future-description">Detalhes (opcional)<textarea maxLength="1000" rows="3" value={form.descricao} onChange={e=>setForm(v=>({...v,descricao:e.target.value}))} placeholder="Anote detalhes que ajudam no planejamento"/></label></div>
        {error&&<p className="error future-error" role="alert">{error}</p>}<div className="future-form-actions">{editingId&&<button type="button" className="secondary" onClick={()=>{setEditingId(null);setForm(emptyForm);}}>Cancelar edição</button>}<button className="primary" type="submit" disabled={busy}>{editingId?'Salvar alterações':<><Plus size={16}/> Adicionar meta</>}</button></div>
      </form>
    </section>
    <section className="panel future-table-panel"><div className="panel-heading"><div><h2>Seus planos</h2><p>Estimativa mensal considera o custo e a data que você informou</p></div></div>
      {loading ? <p className="empty">Carregando seus planos…</p> : plans.length ? <div className="future-table-wrap"><table className="future-table"><thead><tr><th>Meta</th><th>Categoria</th><th>Preço estimado</th><th>Prazo</th><th>Referência mensal</th><th><span className="sr-only">Ações</span></th></tr></thead><tbody>{plans.map(plan=><tr key={plan.id}><td><strong>{plan.titulo}</strong>{plan.descricao&&<small>{plan.descricao}</small>}</td><td><span className="category-pill">{plan.categoria}</span></td><td>{money(plan.valorEstimado)}</td><td>{plan.dataMeta?new Date(`${plan.dataMeta}T00:00:00`).toLocaleDateString('pt-BR'):'Sem prazo'}</td><td className="monthly-value">{monthlyGoal(plan.valorEstimado,plan.dataMeta)}</td><td className="row-actions"><button className="icon-button" aria-label={`Editar ${plan.titulo}`} onClick={()=>editPlan(plan)}><Pencil size={15}/></button><button className="icon-button delete-action" aria-label={`Excluir ${plan.titulo}`} onClick={()=>deletePlan(plan.id)}><Trash2 size={15}/></button></td></tr>)}</tbody></table></div> : <p className="empty">{error ? 'Não foi possível exibir os planos.' : 'Ainda não há metas cadastradas. Adicione sua primeira meta acima.'}</p>}
      <p className="planning-source">Referência de planejamento: defina uma meta, seu valor e um prazo realista. <a href="https://www.consumerfinance.gov/documents/7276/cfpb_my-new-money-goal_worksheet.pdf" target="_blank" rel="noreferrer">Worksheet de metas do CFPB</a>.</p>
    </section>
  </div>;
}
