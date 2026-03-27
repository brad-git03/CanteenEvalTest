import React from 'react';
import { ShieldCheck, Utensils } from 'lucide-react';

export default function LandingPage({ navigate }) {
  return (
    <div className="landing-bg">
      {/* 1. The Small Top Badge */}
      <div style={{ border: '1px solid rgba(255,255,255,0.2)', padding: '6px 16px', borderRadius: '20px', fontSize: '12px', color: 'var(--accent-gold)', marginBottom: '30px', letterSpacing: '1px' }}>
        • EdDSA • Ed25519 • Group 1 • Mid Lab 2
      </div>
      
      {/* 2. THE NEW LOGO */}
      <img 
        src="/ua-logo.png" 
        alt="University of the Assumption Logo" 
        style={{ 
          width: '110px', 
          height: '110px', 
          marginBottom: '20px', 
          borderRadius: '50%', /* Makes it a perfect circle if the image is square */
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)' /* Soft dark glow */
        }} 
      />

      {/* 3. The Main Title */}
      <h1 className="serif" style={{ fontSize: '3.5rem', textAlign: 'center', marginBottom: '15px', color: '#f7f4ec' }}>
        University of the Assumption<br/>Canteen Evaluation
      </h1>
      
      <p style={{ color: '#a0aab2', textAlign: 'center', maxWidth: '400px', marginBottom: '60px' }}>
        Every feedback submission is digitally signed with a real Ed25519 private key to ensure authenticity.
      </p>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
        
        {/* Customer Portal Card */}
        <div 
          onClick={() => navigate('customer')}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '40px', width: '300px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.3s' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
        >
          <div style={{ background: 'rgba(255,255,255,0.1)', width: '60px', height: '60px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Utensils color="#f7f4ec" size={28} />
          </div>
          <h3 className="serif" style={{ color: '#f7f4ec', fontSize: '1.4rem', marginBottom: '10px' }}>Customer Portal</h3>
          <p style={{ color: '#8a99a8', fontSize: '13px' }}>Rate your experience — signed with real EdDSA</p>
        </div>

        {/* Admin Portal Card */}
        <div 
          onClick={() => navigate('admin-login')}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '40px', width: '300px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.3s' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
        >
          <div style={{ background: 'rgba(255,255,255,0.1)', width: '60px', height: '60px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <ShieldCheck color="#5192ff" size={28} />
          </div>
          <h3 className="serif" style={{ color: '#f7f4ec', fontSize: '1.4rem', marginBottom: '10px' }}>Admin Portal</h3>
          <p style={{ color: '#8a99a8', fontSize: '13px' }}>Dashboard, records, verification & audit log</p>
        </div>

      </div>
    </div>
  );
}