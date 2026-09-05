import { useState, useEffect } from 'react'
import config from '../services/config.js'

/**
 * AiInsightPanel — Compact AI-generated risk narrative for the admin dashboard.
 * Calls the Bedrock-backed /api/ai/narrative endpoint in real-time.
 */
export default function AiInsightPanel({ selected, risk, buyers }) {
  const [narrative, setNarrative] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!selected || !risk) return

    let cancelled = false
    setLoading(true)
    setError(null)
    setNarrative(null)

    const b = buyers?.[selected.buyer]
    const body = {
      invoiceNumber: selected.fields?.invoiceNumber || 'N/A',
      amount: selected.fields?.amount || 0,
      supplierName: selected.sme || 'Unknown',
      supplierIndustry: b?.sector || 'Unknown',
      supplierYears: 5,
      supplierRevenue: 4500000,
      buyerName: selected.buyer || 'Unknown',
      buyerSector: b?.sector || 'Corporate',
      buyerOnTimeRate: b?.onTimeRate || 0.85,
      buyerAvgSettlementDays: b?.avgSettlementDays || 40,
      termsDays: selected.fields?.termsDays || 60,
      riskScore: risk.total || 0,
      riskBand: risk.band || 'Medium',
      verificationStatus: selected.checksPass !== false ? 'Passed all checks' : 'Issues detected',
    }

    fetch(`${config.apiBaseUrl}/api/ai/narrative`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setNarrative(data)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message)
          setLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [selected?.id, risk?.total, buyers])

  if (!selected || selected.status === 'blocked') return null

  const bandColor = risk?.band === 'Low' ? 'var(--good)' : risk?.band === 'Medium' ? 'var(--warn)' : 'var(--crit)'

  return (
    <details className="sec" open>
      <summary className="sec-head" style={{ cursor: 'pointer', listStyle: 'none' }}>
        <span className="sec-head-l" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '1.5rem', height: '1.5rem', borderRadius: '0.375rem',
            background: 'var(--accent)', color: 'var(--on-accent)', fontSize: '0.75rem',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>auto_stories</span>
          </span>
          <span className="eyebrow">AI Analyst Insight</span>
          {narrative?.source === 'bedrock' && (
            <span style={{
              fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
              color: 'var(--accent)', background: 'var(--accent-soft)', padding: '0.125rem 0.375rem',
              borderRadius: '9999px',
            }}>
              Bedrock AI
            </span>
          )}
          {narrative?.source === 'fallback' && (
            <span style={{
              fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
              color: 'var(--ink-3)', background: 'var(--surface-3)', padding: '0.125rem 0.375rem',
              borderRadius: '9999px',
            }}>
              Generated
            </span>
          )}
        </span>
      </summary>

      <div style={{ padding: '0.75rem 1rem' }}>
        {/* Loading state */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <div style={{
                width: '1rem', height: '1rem', borderRadius: '50%',
                border: '2px solid var(--accent)', borderTopColor: 'transparent',
                animation: 'spin 1s linear infinite', flexShrink: 0,
              }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--ink-2)' }}>Claude is analysing...</span>
            </div>
            <div style={{ height: '0.625rem', borderRadius: '0.25rem', background: 'var(--line)', width: '85%', animation: 'pulse 1.5s ease-in-out infinite' }}></div>
            <div style={{ height: '0.625rem', borderRadius: '0.25rem', background: 'var(--line)', width: '65%', animation: 'pulse 1.5s ease-in-out infinite 0.2s' }}></div>
            <div style={{ height: '0.625rem', borderRadius: '0.25rem', background: 'var(--line)', width: '50%', animation: 'pulse 1.5s ease-in-out infinite 0.4s' }}></div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div style={{
            padding: '0.5rem 0.75rem', borderRadius: '0.375rem',
            background: 'var(--crit-soft)', color: 'var(--crit)',
            fontSize: '0.75rem',
          }}>
            AI analysis unavailable — using standard risk assessment.
          </div>
        )}

        {/* Narrative content — compact card */}
        {narrative && !loading && (
          <div style={{
            borderLeft: `3px solid ${bandColor}`,
            borderRadius: '0.375rem',
            background: 'var(--surface-2)',
            padding: '0.625rem 0.75rem',
          }}>
            {/* Narrative text */}
            <p style={{
              fontSize: '0.8125rem', lineHeight: '1.55', color: 'var(--ink)',
              marginBottom: '0.5rem', maxWidth: '70ch',
            }}>
              {narrative.narrative}
            </p>

            {/* Key factors */}
            {narrative.keyFactors?.length > 0 && (
              <div style={{ marginBottom: '0.5rem' }}>
                {narrative.keyFactors.map((factor, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '0.375rem',
                    fontSize: '0.75rem', color: 'var(--ink-2)', marginBottom: '0.1875rem',
                  }}>
                    <span className="material-symbols-outlined" style={{
                      fontSize: '0.6875rem', color: bandColor, marginTop: '0.125rem', flexShrink: 0,
                    }}>
                      check_circle
                    </span>
                    <span>{factor}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Recommendation — inline */}
            {narrative.recommendation && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.375rem',
                fontSize: '0.75rem', marginTop: '0.25rem',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '0.6875rem', color: bandColor }}>
                  lightbulb
                </span>
                <span style={{ color: 'var(--ink-2)' }}>Recommendation:</span>
                <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{narrative.recommendation}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </details>
  )
}
