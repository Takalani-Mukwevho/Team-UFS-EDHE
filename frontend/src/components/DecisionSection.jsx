import { useState, Fragment } from 'react'
import Section from './Section.jsx'
import { BANDS, POLICY } from '../engine/policy.js'
import { offerFor } from '../engine/scoring.js'
import { fmt, fmt2 } from '../engine/format.js'
import { sendEmailNotification } from '../services/api.js'

export default function DecisionSection({ c, risk, onDecide, buyers: buyersProp }) {
  const b = buyersProp && buyersProp[c.buyer];
  const enginePct = POLICY[risk.band];
  const engineApproves = enginePct > 0;
  const engineOffer = offerFor(c.fields.amount, enginePct);

  const [mode, setMode] = useState("accept");
  const [pct, setPct] = useState(engineApproves ? Math.round(enginePct * 100) : 40);
  const [reason, setReason] = useState("");
  const [sending, setSending] = useState(false);

  const overriding = mode !== "accept";
  const finalPct = mode === "accept" ? enginePct : mode === "decline" ? 0 : pct / 100;
  const finalOffer = offerFor(c.fields.amount, finalPct);
  const reasonOk = !overriding || reason.trim().length >= 25;

  const engineLine = engineApproves
    ? "Approve at " + Math.round(enginePct * 100) + "%"
    : "Decline (score " + risk.total.toFixed(1) + ")";
  const finalLine = finalPct > 0 ? "Approve at " + Math.round(finalPct * 100) + "%" : "Decline";

  async function handleDecide() {
    setSending(true);
    try {
      await sendEmailNotification({
        subject: `[SHIFA] Funding Decision — ${c.fields.invoiceNumber} — ${finalLine}`,
        message: [
          `SHIFA Invoice Funding — Analyst Decision`,
          ``,
          `Invoice: ${c.fields.invoiceNumber}`,
          `SME Supplier: ${c.sme}`,
          `Buyer: ${c.buyer}`,
          `Invoice Amount: ${fmt(c.fields.amount)}`,
          `Due Date: ${c.fields.dueDate}`,
          ``,
          `Engine Recommendation: ${engineLine}`,
          `Final Decision: ${finalLine}`,
          `Risk Score: ${risk.total.toFixed(1)} / 100 (${risk.band} band)`,
          ``,
          finalPct > 0 ? [
            `Advance Amount: ${fmt(finalOffer.advance)}`,
            `Fee (${(POLICY.feeRate * 100).toFixed(0)}%): ${fmt2(finalOffer.fee)}`,
            `Net to SME: ${fmt2(finalOffer.net)}`,
          ].join('\n') : `No advance is being made against this invoice.`,
          ``,
          overriding ? `Override Reason: ${reason.trim()}` : `Analyst accepted the engine recommendation.`,
          ``,
          `SHIFA — Invoice Finance Desk`,
        ].join('\n'),
        eventType: 'funding-decision',
      });
    } catch (err) {
      console.error('Email notification failed:', err);
    } finally {
      setSending(false);
    }

    onDecide({
      outcome: finalPct > 0 ? "approved" : "declined",
      pct: finalPct, offer: finalOffer, reason: reason.trim(),
      overridden: overriding, engineLine, finalLine,
    });
  }

  return (
    <Fragment>
      <Section title="Engine recommendation">
        <div className={"rec " + (engineApproves ? "approve" : "decline")}>
          <div>
            <div className="rec-k">{engineApproves ? "Advance recommended" : "Advance not recommended"}</div>
            <div className="rec-t">
              {b ? (
                engineApproves
                  ? c.buyer + " settles " + Math.round((b.onTimeRate || 0) * 100) + "% of invoices on time, averaging " +
                    (b.avgSettlementDays || 0) + " days. Score " + risk.total.toFixed(1) + " places this in the " +
                    risk.band + " band, which carries an " + Math.round(enginePct * 100) + "% advance rate."
                  : c.buyer + " settles only " + Math.round((b.onTimeRate || 0) * 100) + "% of invoices on time, averaging " +
                    (b.avgSettlementDays || 0) + " days against " + c.fields.termsDays +
                    "-day terms. Score " + risk.total.toFixed(1) + " falls below the " + BANDS.medium + " threshold."
              ) : (
                `Score ${risk.total.toFixed(1)} places this in the ${risk.band} band.` + (engineApproves ? ` Advance rate: ${Math.round(enginePct * 100)}%.` : " Advance not recommended.")
              )}
            </div>
          </div>
          {engineApproves && (
            <div className="rec-fig">
              <span className="v">{fmt2(engineOffer.net)}</span>
              <span className="l">net to SME after {(POLICY.feeRate * 100).toFixed(0)}% fee</span>
            </div>
          )}
        </div>
      </Section>

      <Section title="Analyst decision" right={<span className="conf">Invoice Finance Desk</span>}>
        <div className="choices">
          <label className={"choice" + (mode === "accept" ? " on" : "")} onClick={() => setMode("accept")}>
            <span className="radio" />
            <span>
              <span className="choice-t">Accept the recommendation &mdash; {engineLine.toLowerCase()}</span>
              <span className="choice-d">
                {engineApproves ? "Releases " + fmt2(engineOffer.net) + " to " + c.sme + " today." : "No advance is made against this invoice."}
              </span>
            </span>
          </label>

          <label className={"choice" + (mode === "adjust" ? " on" : "")} onClick={() => setMode("adjust")}>
            <span className="radio" />
            <span>
              <span className="choice-t">Override the advance rate</span>
              <span className="choice-d">Fund at a rate you set, up to {Math.round(POLICY.maxOverride * 100)}%. Requires a recorded reason.</span>
            </span>
          </label>

          <label className={"choice" + (mode === "decline" ? " on" : "")} onClick={() => setMode("decline")}>
            <span className="radio" />
            <span>
              <span className="choice-t">Decline</span>
              <span className="choice-d">
                {engineApproves ? "Overrides a positive recommendation. Requires a recorded reason." : "Confirms the engine's decline."}
              </span>
            </span>
          </label>
        </div>

        {mode === "adjust" && (
          <Fragment>
            <div className="slider-row">
              <input type="range" min="5" max={Math.round(POLICY.maxOverride * 100)} step="5"
                     value={pct} onChange={(e) => setPct(Number(e.target.value))}
                     aria-label="Advance rate percentage" />
              <span className="pctbox">{pct}%</span>
            </div>
            <div className="calc">
              <div><div className="bl">Advance</div><div className="cv">{fmt(finalOffer.advance)}</div></div>
              <div><div className="bl">Fee @ {(POLICY.feeRate * 100).toFixed(0)}%</div><div className="cv">{fmt2(finalOffer.fee)}</div></div>
              <div><div className="bl">Net to SME</div><div className="cv">{fmt2(finalOffer.net)}</div></div>
            </div>
          </Fragment>
        )}

        {overriding && (
          <div>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="Why are you departing from the engine's recommendation? Reference the evidence you relied on." />
            <div className="reqline">
              <span>Recorded against your name in the audit trail and visible to credit review.</span>
              <span className={reasonOk ? "" : "bad"}>{reason.trim().length} / 25 characters minimum</span>
            </div>
          </div>
        )}

        <div className="actions">
          <button className="btn" disabled={!reasonOk || sending}
            onClick={handleDecide}>
            {sending ? "Sending notification..." : `Confirm — ${finalLine.toLowerCase()}`}
          </button>
          {overriding && !reasonOk && <span className="hint">A reason is required before an override can be submitted.</span>}
        </div>
      </Section>
    </Fragment>
  );
}
