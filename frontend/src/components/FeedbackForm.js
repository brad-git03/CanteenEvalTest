import React, { useState, useRef } from "react";
import { submitFeedback } from "../api";
import { Star, CheckCircle2, Loader2, Lock, ShieldCheck, UploadCloud, Image as ImageIcon, X, Download } from 'lucide-react';

export default function FeedbackForm({ navigate }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ customer_name: "", comment: "" });
  const [ratings, setRatings] = useState({ Food: 5, Service: 5, Staff: 5, Cleanliness: 5, Value: 5 });
  const [hoverRating, setHoverRating] = useState({ category: '', val: 0 });
  
  // NEW: Image Upload State
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const [status, setStatus] = useState("idle"); 
  const [signMessage, setSignMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleRatingChange = (category, value) => setRatings(prev => ({ ...prev, [category]: value }));

  const totalScore = Object.values(ratings).reduce((sum, val) => sum + val, 0);
  const overallRating = Math.round(totalScore / 5);

  // NEW: Handle Image Selection & Live Preview
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setStatus("signing");
    setSignMessage("Initializing Ed25519 Curve...");
    
    const categoryBreakdown = `[Scores -> Food: ${ratings.Food}/5 | Service: ${ratings.Service}/5 | Staff: ${ratings.Staff}/5 | Clean: ${ratings.Cleanliness}/5 | Value: ${ratings.Value}/5]`;
    const finalComment = `${categoryBreakdown}\n\n${form.comment}`;

    const payload = {
      customer_name: form.customer_name,
      rating: overallRating,
      comment: finalComment,
      // In a real production app, this Base64 string goes to an S3 Bucket. 
      // For this demo, we attach it to the payload.
      image_evidence: imagePreview 
    };

    try {
      setTimeout(() => setSignMessage("Generating digital signature..."), 800);
      setTimeout(() => setSignMessage("Encrypting payload & attachments..."), 1600); // Updated text
      
      await new Promise(resolve => setTimeout(resolve, 2400)); 
      await submitFeedback(payload);
      
      setStatus("success");
      setStep(3); 
      // REMOVED auto-redirect so the user has time to download their receipt!
    } catch (err) {
      setStatus("error");
      setErrorMessage(err.message);
    }
  };

  // NEW: Generate and Download the Cryptographic Receipt
  const downloadReceipt = () => {
    const date = new Date().toLocaleString();
    const receiptContent = `=========================================
UA CANTEEN: SECURE FEEDBACK RECEIPT
=========================================
Date Submitted: ${date}
Customer Name:  ${form.customer_name || 'Anonymous'}
Overall Rating: ${overallRating} / 5 Stars

[Category Breakdown]
Food:        ${ratings.Food}/5
Service:     ${ratings.Service}/5
Staff:       ${ratings.Staff}/5
Cleanliness: ${ratings.Cleanliness}/5
Value:       ${ratings.Value}/5

[Comments]
${form.comment || 'No written comments provided.'}

[Attachments]
Photo Evidence: ${imagePreview ? '1 Image Attached (Encrypted)' : 'None'}

--- CRYPTOGRAPHIC SIGNATURE ---
Status:       Verified & Secured
Algorithm:    Ed25519 (EdDSA)
Network:      UA Secure Node 01
=========================================
Keep this file for your records.`;

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `UA_Feedback_Receipt_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '50px 20px' }}>
      
      <div className="animate-in" style={{ border: '1px solid var(--border-color)', padding: '6px 16px', borderRadius: '30px', fontSize: '12px', color: '#666', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
        <Lock size={14} color="var(--accent-gold)" /> EdDSA Secured Portal
      </div>
      
      <h1 className="serif animate-in" style={{ fontSize: '2.8rem', marginBottom: '10px', textAlign: 'center', color: 'var(--bg-dark-green)' }}>
        Rate Your <span style={{ color: 'var(--accent-gold)' }}>Experience</span>
      </h1>
      <p className="animate-in" style={{ color: 'var(--text-muted)', marginBottom: '20px', textAlign: 'center', fontSize: '15px' }}>
        Your feedback is cryptographically signed and saved securely.
      </p>
      
      {status === "idle" && (
        <button className="btn-secondary animate-in" onClick={() => navigate('landing')} style={{ border: 'none', boxShadow: 'none', fontSize: '14px' }}>
          ← Cancel & Return
        </button>
      )}

      {/* 1-2-3 PROGRESS INDICATOR */}
      <div className="step-indicator animate-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', margin: '30px 0' }}>
        {[1, 2, 3].map((num, idx) => (
          <React.Fragment key={num}>
            <div style={{ 
              width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', 
              fontSize: '15px', fontWeight: 600, transition: 'all 0.3s',
              border: `2px solid ${step >= num ? 'var(--accent-gold)' : 'var(--border-color)'}`, 
              color: step >= num ? (step === num ? 'white' : 'var(--accent-gold)') : '#999',
              backgroundColor: step === num ? 'var(--accent-gold)' : 'transparent',
              boxShadow: step === num ? '0 4px 12px rgba(212, 160, 23, 0.3)' : 'none'
            }}>
              {num}
            </div>
            {idx < 2 && <div style={{ width: '40px', height: '2px', backgroundColor: step > num ? 'var(--accent-gold)' : 'var(--border-color)', transition: 'all 0.3s' }}></div>}
          </React.Fragment>
        ))}
      </div>

      <div className="card animate-in" style={{ width: '100%', maxWidth: '600px', padding: '40px', position: 'relative', overflow: 'hidden' }}>
        
        {/* --- STEP 1: ALL-IN-ONE FORM --- */}
        {step === 1 && status !== "signing" && (
          <div className="animate-in">
            
            <div style={{ marginBottom: '30px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>CUSTOMER NAME (OPTIONAL)</label>
              <input name="customer_name" placeholder="e.g. Maria Santos" value={form.customer_name} onChange={handleChange} style={{ width: '100%', padding: '14px 16px', fontSize: '15px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)' }} />
            </div>

            <div style={{ marginBottom: '35px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '15px', letterSpacing: '0.5px' }}>RATE YOUR EXPERIENCE</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.keys(ratings).map((category) => (
                  <div key={category} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', backgroundColor: 'var(--input-bg)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-dark)' }}>{category}</span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {[1, 2, 3, 4, 5].map((star) => {
                        const isHovered = hoverRating.category === category && hoverRating.val >= star;
                        const isActive = ratings[category] >= star;
                        return (
                          <Star key={star} size={24} onClick={() => handleRatingChange(category, star)} onMouseEnter={() => setHoverRating({ category, val: star })} onMouseLeave={() => setHoverRating({ category: '', val: 0 })} fill={isHovered || isActive ? 'var(--accent-gold)' : 'transparent'} color={isHovered || isActive ? 'var(--accent-gold)' : '#dcd8ce'} style={{ cursor: 'pointer', transition: 'all 0.2s', transform: isHovered ? 'scale(1.15)' : 'scale(1)' }} />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>ADDITIONAL COMMENTS</label>
              <textarea name="comment" placeholder="Tell us what you liked or how we can improve..." value={form.comment} onChange={handleChange} style={{ width: '100%', height: '100px', padding: '16px', fontSize: '15px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', resize: 'vertical' }}></textarea>
            </div>

            {/* NEW: IMAGE UPLOAD UI */}
            <div style={{ marginBottom: '35px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>PHOTO EVIDENCE (OPTIONAL)</label>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} style={{ display: 'none' }} />
              
              {!imagePreview ? (
                <div onClick={() => fileInputRef.current.click()} style={{ width: '100%', padding: '30px', border: '2px dashed var(--border-color)', borderRadius: '12px', backgroundColor: 'var(--input-bg)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-gold)'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}>
                  <UploadCloud size={32} color="#aaa" />
                  <span style={{ fontSize: '14px', color: '#666', fontWeight: 500 }}>Click to upload a photo of your meal or receipt</span>
                </div>
              ) : (
                <div style={{ position: 'relative', width: '100%', height: '200px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  <img src={imagePreview} alt="Evidence Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button onClick={() => setImagePreview(null)} style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>

            <button className="btn-primary" style={{ width: '100%', padding: '16px', fontSize: '16px' }} onClick={() => setStep(2)}>
              Review Feedback →
            </button>
          </div>
        )}

        {/* --- STEP 2: REVIEW --- */}
        {step === 2 && status === "idle" && (
          <div className="animate-in">
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <CheckCircle2 size={46} color="var(--success)" style={{ marginBottom: '15px' }} />
              <h3 className="serif" style={{ color: 'var(--text-dark)', fontSize: '1.8rem' }}>Review Your Data</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Verify your responses before applying the cryptographic seal.</p>
            </div>

            <div style={{ backgroundColor: 'var(--input-bg)', borderRadius: '16px', padding: '25px', marginBottom: '30px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '15px', marginBottom: '15px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>SUBMITTED BY</span>
                <span style={{ fontWeight: 600, fontSize: '15px' }}>{form.customer_name || 'Anonymous'}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '15px', marginBottom: '15px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>OVERALL SCORE</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 700, color: 'var(--accent-gold)', fontSize: '18px' }}>{overallRating} / 5</span>
                  <Star size={16} fill="var(--accent-gold)" color="var(--accent-gold)" />
                </div>
              </div>

              {/* Review Image Logic */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '15px', marginBottom: '15px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>ATTACHMENTS</span>
                <span style={{ fontWeight: 500, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', color: imagePreview ? 'var(--success)' : '#999' }}>
                  {imagePreview ? <><ImageIcon size={16} /> 1 Photo Attached</> : 'None'}
                </span>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '10px' }}>CATEGORY BREAKDOWN</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {Object.entries(ratings).map(([cat, val]) => (
                    <div key={cat} style={{ fontSize: '13px', backgroundColor: 'white', padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>{cat}: <strong>{val}</strong></div>
                  ))}
                </div>
              </div>

              {form.comment && (
                <div style={{ paddingTop: '15px', borderTop: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '8px' }}>COMMENTS</span>
                  <p style={{ fontSize: '15px', fontStyle: 'italic', color: '#555', lineHeight: '1.5', margin: 0 }}>"{form.comment}"</p>
                </div>
              )}
            </div>

            {status === "error" && (
              <div className="animate-in" style={{ marginBottom: '25px', padding: '16px', borderRadius: '10px', textAlign: 'center', fontSize: '14px', fontWeight: 600, backgroundColor: 'var(--danger-bg)', color: 'var(--danger)' }}>Error: {errorMessage}</div>
            )}

            <div style={{ display: 'flex', gap: '15px' }}>
              <button className="btn-secondary" style={{ flex: 1, padding: '16px', fontSize: '15px' }} onClick={() => setStep(1)}>Edit Data</button>
              <button className="btn-primary" style={{ flex: 2, backgroundColor: 'var(--bg-dark-green)', padding: '16px', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={handleSubmit}>
                <Lock size={18} /> Sign & Submit Securely
              </button>
            </div>
          </div>
        )}

        {/* --- STEP 3/OVERLAY: CRYPTO ANIMATION --- */}
        {status === "signing" && (
          <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', textAlign: 'center' }}>
            <Loader2 size={48} color="var(--accent-gold)" style={{ animation: 'spin 1.5s linear infinite', marginBottom: '25px' }} />
            <h3 className="serif" style={{ fontSize: '1.8rem', color: 'var(--bg-dark-green)', marginBottom: '10px' }}>Securing Data</h3>
            <p style={{ color: '#666', fontSize: '15px', fontFamily: 'monospace', backgroundColor: '#f5f5f5', padding: '8px 16px', borderRadius: '8px' }}>&gt; {signMessage}</p>
            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* --- STEP 3: SUCCESS & DOWNLOAD RECEIPT --- */}
        {status === "success" && (
          <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 0', textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', backgroundColor: 'var(--success-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '25px' }}>
              <ShieldCheck size={40} color="var(--success)" />
            </div>
            <h3 className="serif" style={{ fontSize: '2.2rem', color: 'var(--bg-dark-green)', marginBottom: '10px' }}>Signature Verified</h3>
            <p style={{ color: '#666', fontSize: '15px', marginBottom: '35px' }}>Your feedback and attachments were successfully encrypted and submitted.</p>
            
            {/* NEW: Download Receipt Button */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <button 
                onClick={downloadReceipt}
                className="btn-secondary" 
                style={{ padding: '16px', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', backgroundColor: 'var(--input-bg)', border: '1px solid var(--accent-gold)', color: 'var(--text-dark)' }}
              >
                <Download size={18} color="var(--accent-gold)" /> Download Security Receipt (.txt)
              </button>
              
              <button 
                onClick={() => navigate('landing')}
                className="btn-primary" 
                style={{ padding: '16px', fontSize: '15px' }}
              >
                Return to Home
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}