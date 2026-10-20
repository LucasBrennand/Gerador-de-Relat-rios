import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowDownToLine, BadgeCheck, Building2, CalendarDays, ChartNoAxesColumnIncreasing, FileText, ImagePlus, LockKeyhole, Menu, Plus, ReceiptText, Upload, X } from 'lucide-react';
import './style.css';

const sample = `01/08/2026; 1.287,00
02/08/2026; 1.008,00
03/08/2026; 819,00
04/08/2026; 249,00
05/08/2026; 1.855,00
06/08/2026; 566,00
07/08/2026; 1.203,40
08/08/2026; 2.201,00
09/08/2026; 968,00
10/08/2026; 387,00
11/08/2026; 1.459,75
12/08/2026; 1.232,00
13/08/2026; 841,00
14/08/2026; 1.252,60
15/08/2026; 2.588,95
16/08/2026; 1.090,85
17/08/2026; 592,85
18/08/2026; 784,40
19/08/2026; 1.497,05
20/08/2026; 296,00
21/08/2026; 286,00
22/08/2026; 990,65
23/08/2026; 1.916,00
24/08/2026; 251,00
25/08/2026; 165,00
26/08/2026; 852,10
27/08/2026; 512,00
28/08/2026; 1.744,00
29/08/2026; 2.289,35
30/08/2026; 846,00
31/08/2026; 1.061,40`;
const defaults = { company: 'Luisa Brennand Barbosa Chiaperini · Lure Aromas', cnpj: '13.762.914/0001-31', phone: '(81) 98873-8687', email: 'Lurecosmeticos@hotmail.com', address: 'Rua Cônego Barata, 275 · Quiosque 2 Tamarineira · Recife - PE · CEP 52.051-020' };
const monthLabel = (value) => value ? new Date(`${value}-15T12:00:00`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : '';
const currency = (n) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

function App() {
  const [month, setMonth] = useState('2026-08'); const [company, setCompany] = useState(defaults); const [sales, setSales] = useState(sample); const [graph, setGraph] = useState(null); const [graphUrl, setGraphUrl] = useState(''); const [companyLogo, setCompanyLogo] = useState(null); const [logoUrl, setLogoUrl] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [done, setDone] = useState(false);
  const rows = useMemo(() => sales.split(/\r?\n/).map(line => line.trim()).filter(Boolean).map(line => { let p = line.replace(/\t/g,';').split(';'); if (p.length < 2) p = line.split(/\s+/); const raw = (p[1] || '').replace(/R\$|\s/g,'').replace(/\./g,'').replace(',','.'); return { date: p[0] || '', value: Number(raw) || 0 }; }), [sales]);
  const total = rows.reduce((s, r) => s + r.value, 0);
  const setField = (key, value) => setCompany(c => ({...c, [key]: value}));
  const addLine = () => setSales(s => `${s}${s ? '\n' : ''}01/${month.slice(5)}/${month.slice(0,4)}; 0,00`);
  const chooseGraph = (file) => { if (!file) return; setGraph(file); setGraphUrl(URL.createObjectURL(file)); };
  const chooseLogo = (file) => { if (!file) return; setCompanyLogo(file); setLogoUrl(URL.createObjectURL(file)); };
  const generate = async () => {
    setError(''); setDone(false); setBusy(true);
    try { const form = new FormData(); Object.entries({month, ...company, sales_text: sales}).forEach(([k,v]) => form.append(k,v)); if (graph) form.append('graph', graph); if (companyLogo) form.append('company_logo', companyLogo);
      const response = await fetch(`${API_URL}/api/report`, { method: 'POST', body: form });
      if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.detail || 'Não foi possível gerar o PDF. Verifique se a API está iniciada.'); }
      const blob = await response.blob(); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `relatorio-vendas-${month}.pdf`; a.click(); URL.revokeObjectURL(url); setDone(true);
    } catch (e) { setError(e.message.includes('fetch') ? 'Não consegui conectar ao gerador. Inicie o backend Python conforme as instruções do README.' : e.message); } finally { setBusy(false); }
  };
  return <div className="app-shell">
    <aside className="sidebar"><a className="brand" href="#"><span className="brand-mark"><ReceiptText size={19}/></span><span>Lure<span className="brand-light"> · Relatórios</span></span></a><div className="side-label">ESPAÇO DE TRABALHO</div><button className="nav-item active"><FileText size={17}/>Relatório mensal</button><div className="side-bottom"><div className="secure"><LockKeyhole size={15}/><span>Seus dados ficam neste dispositivo.</span></div><div className="profile"><div className="avatar">L</div><div><strong>Lure Aromas</strong><span>Plano local</span></div><Menu size={16}/></div></div></aside>
    <main className="main"><header className="topbar"><div className="crumb">Relatórios <span>/</span> <b>Novo relatório</b></div><div className="top-right"><span className="saved"><BadgeCheck size={15}/>Salvo neste dispositivo</span><div className="avatar small">L</div></div></header>
      <div className="content"><div className="intro"><div><div className="eyebrow">CENTRAL DE RELATÓRIOS</div><h1>Relatório mensal de vendas</h1><p>Prepare o relatório do Bling com a identidade da sua empresa em poucos passos.</p></div><div className="month-select"><CalendarDays size={16}/><input aria-label="Mês do relatório" type="month" value={month} onChange={e=>setMonth(e.target.value)}/></div></div>
        <div className="progress"><div className="step current"><span>1</span><b>Dados do relatório</b></div><i/><div className="step"><span>2</span><b>Gerar PDF</b></div></div>
        <section className="card company-card"><div className="card-title"><div className="icon-box"><Building2 size={18}/></div><div><h2>Identificação da empresa</h2><p>Essas informações aparecem no cabeçalho do documento.</p></div><span className="badge">Cabeçalho</span></div><div className="fields"><label className="field wide"><span>Nome da empresa / responsável</span><input value={company.company} onChange={e=>setField('company',e.target.value)}/></label><label className="field"><span>CNPJ</span><input value={company.cnpj} onChange={e=>setField('cnpj',e.target.value)}/></label><label className="field"><span>Telefone</span><input value={company.phone} onChange={e=>setField('phone',e.target.value)}/></label><label className="field"><span>E-mail</span><input value={company.email} onChange={e=>setField('email',e.target.value)}/></label><label className="field wide"><span>Endereço</span><input value={company.address} onChange={e=>setField('address',e.target.value)}/></label></div></section>
        <section className="card logo-card"><div className="card-title"><div className="icon-box"><Building2 size={18}/></div><div><h2>Logo da empresa</h2><p>Ela aparece ao lado dos dados da empresa, como no relatório de exemplo.</p></div><span className="optional">OPCIONAL</span></div><label className={`logo-zone ${logoUrl ? 'has-logo' : ''}`}><input type="file" accept="image/png,image/jpeg" onChange={e=>chooseLogo(e.target.files?.[0])}/>{logoUrl ? <><img src={logoUrl} alt="Prévia da logo da empresa"/><span className="logo-replace"><Upload size={14}/> Trocar logo</span><button type="button" className="remove" onClick={e=>{e.preventDefault();setCompanyLogo(null);setLogoUrl('')}} aria-label="Remover logo"><X size={15}/></button></> : <><div className="upload-icon"><ImagePlus size={21}/></div><strong>Adicione a logo da sua empresa</strong><span>PNG ou JPG, até 8 MB · imagens transparentes são aceitas</span></>}</label></section>
        <section className="card sales-card"><div className="card-title"><div className="icon-box"><ReceiptText size={18}/></div><div><h2>Vendas diárias</h2><p>Uma venda por linha. Cole os dados copiados do Bling.</p></div><span className="count">{rows.length} dias</span></div><div className="sales-editor"><div className="editor-head"><span>DATA <small>DD/MM/AAAA</small></span><span>VALOR <small>R$</small></span></div><textarea value={sales} onChange={e=>setSales(e.target.value)} spellCheck="false" aria-label="Vendas diárias"/><button className="text-button" onClick={addLine}><Plus size={15}/> Adicionar linha</button><div className="total-row"><span>Total do período</span><strong>{currency(total)}</strong></div></div></section>
        <section className="card graph-card"><div className="card-title"><div className="icon-box"><ChartNoAxesColumnIncreasing size={18}/></div><div><h2>Gráfico de faturamento</h2><p>Adicione a imagem da evolução mensal exportada do Bling.</p></div><span className="optional">OPCIONAL</span></div><label className={`upload-zone ${graphUrl ? 'has-image' : ''}`}><input type="file" accept="image/png,image/jpeg" onChange={e=>chooseGraph(e.target.files?.[0])}/>{graphUrl ? <><img src={graphUrl}/><span className="replace"><Upload size={15}/> Trocar imagem</span><button type="button" className="remove" onClick={e=>{e.preventDefault();setGraph(null);setGraphUrl('')}} aria-label="Remover gráfico"><X size={15}/></button></> : <><div className="upload-icon"><ImagePlus size={21}/></div><strong>Arraste a imagem do gráfico até aqui</strong><span>ou <em>procure no computador</em> · PNG ou JPG, até 8 MB</span></>}</label></section>
        <div className="actions"><div className="action-note"><LockKeyhole size={15}/><span>Os dados são usados somente para montar seu PDF.</span></div><button className="generate" onClick={generate} disabled={busy || rows.length===0 || !month}>{busy ? <><span className="spinner"/> Gerando PDF…</> : <><ArrowDownToLine size={17}/> Gerar e baixar PDF</>}</button></div>{error && <div className="alert error">{error}</div>}{done && <div className="alert success"><BadgeCheck size={17}/> PDF gerado e baixado com sucesso.</div>}
        <footer>© 2026 · Lure Aromas <span>Feito para simplificar seu fechamento mensal.</span></footer>
      </div>
    </main>
  </div>
}

createRoot(document.getElementById('root')).render(<App/>);
