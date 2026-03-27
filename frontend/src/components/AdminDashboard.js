import React, { useEffect, useState } from "react";
import { getAllFeedbacks, verifyFeedback } from "../api";
import {
  PieChart, Pie, Cell, Tooltip as PieTooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as BarTooltip
} from 'recharts';
import { LayoutDashboard, FileText, CheckCircle, LogOut, ShieldCheck, X, Star, Key, Hash, ShieldAlert, Search, Download, AlertTriangle, Clock, Terminal } from 'lucide-react';

export default function AdminDashboard({ navigate }) {
  const [feedbacks, setFeedbacks] = useState([]);
  const [verifyState, setVerifyState] = useState({});
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // NEW: State for the Cyber Terminal Modal
  const [traceModal, setTraceModal] = useState(null);
  const [traceStatus, setTraceStatus] = useState('loading');

  useEffect(() => {
    getAllFeedbacks().then(data => {
      setFeedbacks(data);
      data.forEach(async (f) => {
        try {
          const { valid } = await verifyFeedback(f);
          setVerifyState(prev => ({ ...prev, [f.id]: valid ? "valid" : "invalid" }));
        } catch (e) {
          setVerifyState(prev => ({ ...prev, [f.id]: "invalid" }));
        }
      });
    }).catch(console.error);
  }, []);

  const hasBreach = Object.values(verifyState).includes('invalid');
  const filteredFeedbacks = feedbacks.filter(f =>
    (f.customer_name || 'Anonymous').toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.id.toString().includes(searchTerm)
  );

  const total = feedbacks.length;
  const avg = total > 0 ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / total).toFixed(2) : "0.00";

  const pieData = [5, 4, 3, 2, 1].map(star => ({
    name: `${star} Stars`,
    value: feedbacks.filter(f => f.rating === star).length
  })).filter(d => d.value > 0);

  const COLORS = ['#0a1b3f', '#4169e1', '#d4a017', '#e6c25a', '#c93b3b'];

  const categoryTotals = { Food: 0, Service: 0, Staff: 0, Clean: 0, Value: 0 };
  let count = 0;

  feedbacks.forEach(f => {
    const match = f?.comment?.match(/\[Scores -> Food: (\d)\/5 \| Service: (\d)\/5 \| Staff: (\d)\/5 \| Clean: (\d)\/5 \| Value: (\d)\/5\]/);
    if (match) {
      categoryTotals.Food += parseInt(match[1]); categoryTotals.Service += parseInt(match[2]);
      categoryTotals.Staff += parseInt(match[3]); categoryTotals.Clean += parseInt(match[4]);
      categoryTotals.Value += parseInt(match[5]); count++;
    }
  });

  const barData = [
    { name: 'Food', score: count ? Number((categoryTotals.Food / count).toFixed(1)) : 0 },
    { name: 'Service', score: count ? Number((categoryTotals.Service / count).toFixed(1)) : 0 },
    { name: 'Staff', score: count ? Number((categoryTotals.Staff / count).toFixed(1)) : 0 },
    { name: 'Clean', score: count ? Number((categoryTotals.Clean / count).toFixed(1)) : 0 },
    { name: 'Value', score: count ? Number((categoryTotals.Value / count).toFixed(1)) : 0 },
  ];

  const topCategory = count > 0 ? [...barData].sort((a, b) => b.score - a.score)[0] : { name: "N/A", score: 0 };

  const handleVerify = async (feedback) => {
    setVerifyState(prev => ({ ...prev, [feedback.id]: "checking" }));
    try {
      const { valid } = await verifyFeedback(feedback);
      setVerifyState(prev => ({ ...prev, [feedback.id]: valid ? "valid" : "invalid" }));
    } catch (e) {
      setVerifyState(prev => ({ ...prev, [feedback.id]: "invalid" }));
    }
  };

  const runSystemAudit = async () => {
    setIsAuditing(true);
    for (let f of filteredFeedbacks) {
      await handleVerify(f);
      await new Promise(res => setTimeout(res, 150));
    }
    setIsAuditing(false);
  };

  // NEW: Triggers the dramatic Terminal Modal
  const runDetailedTrace = async (f) => {
    setTraceModal(f);
    setTraceStatus('loading');
    setVerifyState(prev => ({ ...prev, [f.id]: "checking" }));

    // Simulate a complex calculation delay for presentation effect
    setTimeout(async () => {
      try {
        const { valid } = await verifyFeedback(f);
        setVerifyState(prev => ({ ...prev, [f.id]: valid ? "valid" : "invalid" }));
        setTraceStatus(valid ? 'pass' : 'fail');
      } catch (e) {
        setVerifyState(prev => ({ ...prev, [f.id]: "invalid" }));
        setTraceStatus('fail');
      }
    }, 1500);
  };

  const exportToCSV = () => {
    const headers = ["ID,Date,Time,Customer Name,Rating,Ed25519 Signature,Public Key,Integrity Check"];
    const rows = filteredFeedbacks.map(f => {
      const status = verifyState[f.id] === 'valid' ? 'Authentic' : (verifyState[f.id] === 'invalid' ? 'TAMPERED' : 'Pending');
      const dateStr = f.created_at ? new Date(f.created_at).toLocaleString() : 'N/A';
      return `${f.id},${dateStr},"${f.customer_name || 'Anonymous'}",${f.rating},${f.signature},${f.public_key},${status}`;
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "ua_crypto_audit_log.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const parseFeedbackData = (text) => {
    if (!text) return { metrics: null, text: "No comment provided." };
    const match = text.match(/\[Scores -> Food: (\d)\/5 \| Service: (\d)\/5 \| Staff: (\d)\/5 \| Clean: (\d)\/5 \| Value: (\d)\/5\]/);
    if (match) {
      const parts = text.split('\n\n');
      return {
        metrics: { Food: match[1], Service: match[2], Staff: match[3], Cleanliness: match[4], Value: match[5] },
        text: parts.slice(1).join('\n\n').trim() || "No written comment provided."
      };
    }
    return { metrics: null, text: text };
  };

  // NEW: Precision Date Formatter
  const formatPrecisionDate = (dateString) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    return {
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
  };

  const MenuItem = ({ id, icon: Icon, label }) => {
    const isActive = activeMenu === id;
    return (
      <div onClick={() => setActiveMenu(id)} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 18px', background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent', borderRadius: '10px', color: isActive ? 'var(--accent-gold)' : '#a0aab2', marginBottom: '10px', cursor: 'pointer', transition: 'all 0.2s', fontSize: '16px' }}>
        <Icon size={22} /> <span style={{ fontWeight: isActive ? 500 : 400 }}>{label}</span>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f9f7f1', position: 'relative' }}>

      {/* SIDEBAR */}
      <div style={{ width: '280px', background: 'linear-gradient(180deg, var(--bg-dark-green) 0%, #050d21 100%)', color: 'white', padding: '40px 25px', display: 'flex', flexDirection: 'column' }}>

        {/* --- PERFECTLY ALIGNED BRANDING --- */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '45px' }}>
          <img
            src="/ua-logo.png" 
            alt="University Logo"
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              border: '2px solid rgba(255,255,255,0.1)' /* Optional: gives the logo a sleek edge */
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h2 className="serif" style={{ color: 'white', fontSize: '1.7rem', margin: 0, lineHeight: '1.1' }}>
              UA <span style={{ color: 'var(--accent-gold)' }}>Canteen</span>
            </h2>
            <p style={{ fontSize: '11px', color: '#a0aab2', margin: 0, marginTop: '4px', letterSpacing: '0.3px' }}>
              EdDSA Secured • Admin
            </p>
          </div>
        </div>
        {/* --------------------------------- */}

        <MenuItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
        <MenuItem id="records" icon={FileText} label="All Records" />
        <MenuItem id="verify" icon={ShieldCheck} label="Crypto Logs" />

        <div style={{ marginTop: 'auto', background: 'rgba(255,255,255,0.05)', padding: '18px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--accent-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white', fontSize: '16px' }}>A</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: 600 }}>UA Admin</div>
            <div style={{ fontSize: '13px', color: '#a0aab2' }}>admin@ua.edu.ph</div>
          </div>
          <LogOut size={20} color="#a0aab2" style={{ cursor: 'pointer' }} onClick={() => navigate('landing')} title="Logout" />
        </div>
      </div>

      <div style={{ flex: 1, padding: '50px 60px', overflowY: 'auto' }}>

        {/* ---------------- VIEW 1: DASHBOARD ---------------- */}
        {activeMenu === "dashboard" && (
          <div className="animate-in">
            {hasBreach && (
              <div style={{ backgroundColor: 'var(--danger)', color: 'white', padding: '15px 25px', borderRadius: '12px', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 8px 24px rgba(201, 59, 59, 0.3)' }}>
                <AlertTriangle size={28} />
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>SECURITY BREACH DETECTED</h3>
                  <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>Cryptographic verification failed for one or more records. Database integrity has been compromised.</p>
                </div>
              </div>
            )}

            <h1 className="serif" style={{ fontSize: '2.5rem', marginBottom: '10px' }}>Dashboard <span style={{ color: 'var(--accent-gold)' }}>Overview</span></h1>
            <p style={{ color: '#666', marginBottom: '40px', fontSize: '16px' }}>Real-time verified insights from PostgreSQL.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' }}>
              <div className="card" style={{ borderTop: '5px solid var(--bg-dark-green)', padding: '30px' }}>
                <div style={{ fontSize: '14px', color: '#666', fontWeight: 600, textTransform: 'uppercase' }}>Total Records</div>
                <div className="serif" style={{ fontSize: '2.8rem', color: 'var(--bg-dark-green)' }}>{total}</div>
                <div style={{ fontSize: '14px', color: '#999' }}>All submissions</div>
              </div>
              <div className="card" style={{ borderTop: `5px solid ${hasBreach ? 'var(--danger)' : 'var(--success)'}`, padding: '30px', backgroundColor: hasBreach ? 'var(--danger-bg)' : 'white' }}>
                <div style={{ fontSize: '14px', color: hasBreach ? 'var(--danger)' : '#666', fontWeight: 600, textTransform: 'uppercase' }}>System Integrity</div>
                <div className="serif" style={{ fontSize: '2.2rem', color: hasBreach ? 'var(--danger)' : 'var(--success)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {hasBreach ? <><ShieldAlert size={28} /> COMPROMISED</> : <><ShieldCheck size={28} /> Active</>}
                </div>
                <div style={{ fontSize: '14px', color: hasBreach ? 'var(--danger)' : '#999', fontWeight: hasBreach ? 600 : 400 }}>
                  {hasBreach ? "TAMPERING DETECTED" : "Ed25519 Secured"}
                </div>
              </div>
              <div className="card" style={{ borderTop: '5px solid var(--accent-gold)', padding: '30px' }}>
                <div style={{ fontSize: '14px', color: '#666', fontWeight: 600, textTransform: 'uppercase' }}>Overall Avg</div>
                <div className="serif" style={{ fontSize: '2.8rem', color: 'var(--bg-dark-green)' }}>{avg} <span style={{ fontSize: '1.2rem', color: '#999' }}>/ 5</span></div>
                <div style={{ fontSize: '14px', color: '#999' }}>Out of 5.0</div>
              </div>
              <div className="card" style={{ borderTop: '5px solid #c93b3b', padding: '30px' }}>
                <div style={{ fontSize: '14px', color: '#666', fontWeight: 600, textTransform: 'uppercase' }}>Top Category</div>
                <div className="serif" style={{ fontSize: '2rem', color: 'var(--bg-dark-green)', marginTop: '12px' }}>{topCategory.name}</div>
                <div style={{ fontSize: '14px', color: '#999', marginTop: '6px' }}>Highest rated ({topCategory.score})</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '60% 40%', gap: '24px', marginBottom: '30px' }}>
              <div className="card" style={{ padding: '35px' }}>
                <h3 style={{ fontSize: '16px', textTransform: 'uppercase', color: '#666', marginBottom: '30px', letterSpacing: '0.5px' }}>Category Averages</h3>
                {count === 0 ? (
                  <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '16px' }}>Submit a new multi-category feedback to populate chart.</div>
                ) : (
                  <div style={{ height: '350px', width: '100%' }}>
                    <ResponsiveContainer>
                      <BarChart data={barData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 14 }} dy={10} />
                        <YAxis domain={[0, 5]} axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 14 }} />
                        <BarTooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '14px' }} />
                        <Bar dataKey="score" fill="var(--bg-dark-green)" radius={[6, 6, 0, 0]} barSize={50} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="card" style={{ padding: '35px' }}>
                <h3 style={{ fontSize: '16px', textTransform: 'uppercase', color: '#666', marginBottom: '30px', letterSpacing: '0.5px' }}>Score Distribution</h3>
                <div style={{ height: '350px', width: '100%' }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={pieData} innerRadius={100} outerRadius={150} paddingAngle={4} dataKey="value" stroke="none">
                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <PieTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '14px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ---------------- VIEW 2: CANTEEN MANAGER RECORDS ---------------- */}
        {activeMenu === "records" && (
          <div className="card animate-in" style={{ minHeight: '80vh', padding: '40px' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
              <div>
                <h1 className="serif" style={{ fontSize: '2.2rem', marginBottom: '10px' }}>Customer Feedback</h1>
                <p style={{ color: '#666', fontSize: '16px' }}>Review operational feedback from canteen patrons.</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--input-bg)', borderRadius: '10px', padding: '10px 16px', width: '300px', border: '1px solid var(--border-color)' }}>
                <Search size={18} color="#999" style={{ marginRight: '10px' }} />
                <input type="text" placeholder="Search by Name or ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '14px', margin: 0, padding: 0 }} />
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', tableLayout: 'fixed' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee' }}>
                  <th style={{ padding: '16px 12px', fontSize: '14px', color: '#888', width: '8%' }}>ID</th>
                  <th style={{ padding: '16px 12px', fontSize: '14px', color: '#888', width: '18%' }}><Clock size={14} style={{ position: 'relative', top: '2px', marginRight: '4px' }} /> TIMESTAMP</th>
                  <th style={{ padding: '16px 12px', fontSize: '14px', color: '#888', width: '18%' }}>CUSTOMER</th>
                  <th style={{ padding: '16px 12px', fontSize: '14px', color: '#888', width: '34%' }}>FEEDBACK SUMMARY</th>
                  <th style={{ padding: '16px 12px', fontSize: '14px', color: '#888', width: '10%' }}>RATING</th>
                  <th style={{ padding: '16px 12px', fontSize: '14px', color: '#888', width: '12%', textAlign: 'right' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredFeedbacks.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>No records found matching "{searchTerm}"</td></tr>
                ) : filteredFeedbacks.map((f, index) => {
                  const parsed = parseFeedbackData(f.comment);
                  const precisionDate = formatPrecisionDate(f.created_at);
                  return (
                    <tr key={f.id} className="animate-in" style={{ borderBottom: '1px solid #eee', animationDelay: `${index * 0.05}s` }}>
                      <td style={{ padding: '24px 12px', color: '#999', fontSize: '14px' }}>#{f.id}</td>
                      <td style={{ padding: '24px 12px', color: '#666', fontSize: '13px' }}>
                        <div style={{ fontWeight: 500 }}>{precisionDate.date}</div>
                        <div style={{ color: '#aaa', fontSize: '12px' }}>{precisionDate.time}</div>
                      </td>
                      <td style={{ padding: '24px 12px', fontWeight: 500, fontSize: '15px' }}>{f.customer_name || 'Anonymous'}</td>
                      <td style={{ padding: '24px 12px', fontSize: '15px', color: '#444' }}>
                        {parsed.metrics ? <span style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>[Multi-Category Entry]</span> : `"${parsed.text.substring(0, 45)}..."`}
                      </td>
                      <td style={{ padding: '24px 12px', fontWeight: 600, color: 'var(--accent-gold)', fontSize: '15px' }}>{f.rating} / 5</td>
                      <td style={{ padding: '24px 12px', textAlign: 'right' }}>
                        <button className="btn-secondary" onClick={() => setSelectedFeedback(f)} style={{ fontSize: '14px', padding: '8px 16px' }}>View Full</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ---------------- VIEW 3: SECURITY AUDITOR LOGS ---------------- */}
        {activeMenu === "verify" && (
          <div className="card animate-in" style={{ minHeight: '80vh', padding: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
              <div>
                <h1 className="serif" style={{ fontSize: '2.2rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <ShieldCheck size={32} color="var(--bg-dark-green)" /> Cryptographic Audit Logs
                </h1>
                <p style={{ color: '#666', fontSize: '16px' }}>Raw Ed25519 signatures and payloads for database integrity verification.</p>
              </div>

              <div style={{ display: 'flex', gap: '15px' }}>
                <button onClick={exportToCSV} className="btn-secondary" style={{ padding: '14px 20px', borderRadius: '10px', fontSize: '15px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'white' }}>
                  <Download size={20} /> Export CSV
                </button>
                <button onClick={runSystemAudit} disabled={isAuditing} style={{ backgroundColor: 'var(--bg-dark-green)', color: 'white', border: 'none', padding: '14px 28px', borderRadius: '10px', fontSize: '15px', fontWeight: 500, cursor: isAuditing ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '10px', transition: '0.2s' }}>
                  {isAuditing ? <ShieldAlert size={20} /> : <ShieldCheck size={20} />}
                  {isAuditing ? "Auditing System..." : "Run Global Audit"}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--input-bg)', borderRadius: '10px', padding: '10px 16px', width: '300px', border: '1px solid var(--border-color)' }}>
                <Search size={18} color="#999" style={{ marginRight: '10px' }} />
                <input type="text" placeholder="Search logs..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '14px', margin: 0, padding: 0 }} />
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', tableLayout: 'fixed' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee' }}>
                  <th style={{ padding: '16px 12px', fontSize: '14px', color: '#888', width: '7%' }}>ID</th>
                  <th style={{ padding: '16px 12px', fontSize: '14px', color: '#888', width: '14%' }}><Clock size={14} style={{ position: 'relative', top: '2px', marginRight: '4px' }} /> TIMESTAMP</th>
                  <th style={{ padding: '16px 12px', fontSize: '14px', color: '#888', width: '25%' }}><Hash size={14} style={{ position: 'relative', top: '2px', marginRight: '4px' }} /> SIGNATURE (HEX)</th>
                  <th style={{ padding: '16px 12px', fontSize: '14px', color: '#888', width: '22%' }}><Key size={14} style={{ position: 'relative', top: '2px', marginRight: '4px' }} /> PUBLIC KEY</th>
                  <th style={{ padding: '16px 12px', fontSize: '14px', color: '#888', width: '18%', textAlign: 'center' }}>INTEGRITY STATUS</th>
                  <th style={{ padding: '16px 12px', fontSize: '14px', color: '#888', width: '14%', textAlign: 'right' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredFeedbacks.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>No logs found.</td></tr>
                ) : filteredFeedbacks.map((f, index) => {
                  const precisionDate = formatPrecisionDate(f.created_at);
                  return (
                    <tr key={f.id} className="animate-in" style={{ borderBottom: '1px solid #eee', animationDelay: `${index * 0.05}s`, backgroundColor: verifyState[f.id] === 'invalid' ? 'var(--danger-bg)' : 'transparent' }}>
                      <td style={{ padding: '24px 12px', color: '#999', fontSize: '15px' }}>#{f.id}</td>
                      <td style={{ padding: '24px 12px', color: '#666', fontSize: '13px' }}>
                        <div style={{ fontWeight: 500 }}>{precisionDate.date}</div>
                        <div style={{ color: '#aaa', fontSize: '12px' }}>{precisionDate.time}</div>
                      </td>

                      <td style={{ padding: '24px 12px', fontFamily: 'monospace', fontSize: '14px', color: '#444' }} title={f.signature}>
                        {f.signature ? `${f.signature.substring(0, 20)}...` : 'N/A'}
                      </td>
                      <td style={{ padding: '24px 12px', fontFamily: 'monospace', fontSize: '14px', color: '#444' }} title={f.public_key}>
                        {f.public_key ? `${f.public_key.substring(0, 16)}...` : 'N/A'}
                      </td>

                      <td style={{ padding: '24px 12px', textAlign: 'center' }}>
                        {!verifyState[f.id] && <span style={{ fontSize: '14px', color: '#999' }}>Pending check</span>}
                        {verifyState[f.id] === 'checking' && <span className="badge badge-checking" style={{ fontSize: '13px', padding: '8px 14px' }}>Verifying...</span>}
                        {verifyState[f.id] === 'valid' && <span className="badge badge-valid" style={{ fontSize: '13px', padding: '8px 14px' }}>✓ Valid Signature</span>}
                        {verifyState[f.id] === 'invalid' && <span className="badge badge-invalid" style={{ fontSize: '13px', padding: '8px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}><AlertTriangle size={14} /> TAMPERED</span>}
                      </td>

                      <td style={{ padding: '24px 12px', textAlign: 'right' }}>
                        {/* THE NEW TRIGGER FOR THE HACKER TERMINAL */}
                        <button className="btn-secondary" onClick={() => runDetailedTrace(f)} style={{ fontSize: '13px', padding: '8px 14px', backgroundColor: 'var(--bg-dark-green)', color: 'white', border: 'none' }}>
                          <Terminal size={14} style={{ display: 'inline', position: 'relative', top: '2px', marginRight: '4px' }} /> Audit
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ---------------- 1. VIEW FEEDBACK MODAL (For Manager) ---------------- */}
      {selectedFeedback && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(10, 27, 63, 0.5)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="card animate-in" style={{ width: '90%', maxWidth: '550px', position: 'relative', padding: '45px' }}>
            <button onClick={() => setSelectedFeedback(null)} style={{ position: 'absolute', top: '25px', right: '25px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#999' }}><X size={28} /></button>
            <h2 className="serif" style={{ fontSize: '2rem', color: 'var(--bg-dark-green)', marginBottom: '8px' }}>Feedback Report</h2>
            <p style={{ fontSize: '14px', color: '#888', marginBottom: '35px' }}>ID #{selectedFeedback.id} • Submitted via EdDSA Portal</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '18px', marginBottom: '18px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>CUSTOMER NAME</span>
              <span style={{ fontWeight: 600, color: 'var(--text-dark)', fontSize: '16px' }}>{selectedFeedback.customer_name || 'Anonymous'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '18px', marginBottom: '25px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>OVERALL RATING</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 700, color: 'var(--accent-gold)', fontSize: '20px' }}>{selectedFeedback.rating} / 5</span>
                <Star size={18} fill="var(--accent-gold)" color="var(--accent-gold)" />
              </div>
            </div>
            <div style={{ marginBottom: '25px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '12px' }}>CATEGORY BREAKDOWN</span>
              {parseFeedbackData(selectedFeedback.comment).metrics ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {Object.entries(parseFeedbackData(selectedFeedback.comment).metrics).map(([cat, val]) => (
                    <div key={cat} style={{ fontSize: '14px', backgroundColor: 'var(--input-bg)', padding: '8px 16px', borderRadius: '25px', border: '1px solid var(--border-color)' }}>{cat}: <strong style={{ color: 'var(--accent-gold)' }}>{val}/5</strong></div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '14px', color: '#999', fontStyle: 'italic', padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee' }}>Legacy feedback. No multi-category data available for this submission.</div>
              )}
            </div>
            <div>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '12px' }}>WRITTEN COMMENT</span>
              <div style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '12px', fontSize: '16px', color: '#333', fontStyle: 'italic', border: '1px solid #eee', lineHeight: '1.5' }}>"{parseFeedbackData(selectedFeedback.comment).text}"</div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 2. NEW: CYBER TERMINAL MODAL (For Auditor) ---------------- */}
      {traceModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(5, 13, 33, 0.85)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="animate-in" style={{ width: '90%', maxWidth: '700px', backgroundColor: '#0a0a0a', border: '1px solid #333', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', fontFamily: 'monospace' }}>

            {/* Terminal Header */}
            <div style={{ backgroundColor: '#1a1a1a', padding: '12px 20px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: '#888', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Terminal size={16} /> Ed25519 VERIFICATION TRACE // TASK_ID: {traceModal.id}
              </div>
              <button onClick={() => setTraceModal(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#666' }}><X size={20} /></button>
            </div>

            {/* Terminal Body */}
            <div style={{ padding: '30px', color: '#00ff00', fontSize: '14px', lineHeight: '1.6' }}>

              <div style={{ color: '#aaa', marginBottom: '20px' }}>&gt; Initializing audit protocol...</div>

              <div style={{ marginBottom: '15px' }}>
                <span style={{ color: '#fff' }}>[1] Target Payload Extracted:</span><br />
                <span style={{ color: '#888' }}>&#123; customer_name: "{traceModal.customer_name}", rating: {traceModal.rating}, comment: "{traceModal.comment.substring(0, 30)}..." &#125;</span>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <span style={{ color: '#fff' }}>[2] Retrieving EdDSA Public Key:</span><br />
                <span style={{ color: '#888' }}>{traceModal.public_key}</span>
              </div>

              <div style={{ marginBottom: '25px' }}>
                <span style={{ color: '#fff' }}>[3] Comparing computed hash against provided signature...</span><br />
                <span style={{ color: '#888' }}>Expected: {traceModal.signature ? `${traceModal.signature.substring(0, 64)}...` : 'NULL'}</span>
              </div>

              {/* The dramatic reveal */}
              {traceStatus === 'loading' && (
                <div style={{ color: '#00ff00', animation: 'pulse 1s infinite' }}>&gt; Validating elliptic curve constraints...</div>
              )}

              {traceStatus === 'pass' && (
                <div className="animate-in" style={{ backgroundColor: 'rgba(0, 255, 0, 0.1)', borderLeft: '4px solid #00ff00', padding: '15px', marginTop: '20px', color: '#00ff00' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '5px' }}>[OK] SIGNATURE VERIFIED</div>
                  Data integrity mathematically proven. No tampering detected.
                </div>
              )}

              {traceStatus === 'fail' && (
                <div className="animate-in" style={{ backgroundColor: 'rgba(255, 0, 0, 0.1)', borderLeft: '4px solid #ff0000', padding: '15px', marginTop: '20px', color: '#ff0000' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '10px' }}><AlertTriangle size={20} /> [FATAL ERROR] HASH MISMATCH</div>
                  Computed payload hash does not match the Ed25519 signature. Data has been altered post-submission.
                </div>
              )}

              {traceStatus !== 'loading' && (
                <button onClick={() => setTraceModal(null)} style={{ marginTop: '30px', backgroundColor: 'transparent', color: '#888', border: '1px solid #555', padding: '8px 16px', cursor: 'pointer', fontFamily: 'monospace' }}>
                  &gt; EXIT_TRACE
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}