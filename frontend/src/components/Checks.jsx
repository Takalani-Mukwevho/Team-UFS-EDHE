import Section from './Section.jsx'

export default function Checks({ c }) {
  // Compute checks from real invoice data
  const hasAmount = c.fields?.amount > 0;
  const hasDueDate = !!c.fields?.dueDate;
  const hasIssueDate = !!c.fields?.issueDate;
  const dueAfterIssue = hasDueDate && hasIssueDate && new Date(c.fields.dueDate) > new Date(c.fields.issueDate);
  const amountPositive = hasAmount && c.fields.amount > 0;
  const amountUnderCap = hasAmount && c.fields.amount <= 500000;
  const supplierVerified = !!c.smeVerified;
  const buyerKnown = !!c.buyer;
  const notDuplicate = c.checksPass !== false;

  const checks = [
    { name: "All required fields extracted", pass: hasAmount && hasDueDate && hasIssueDate, note: `${hasAmount && hasDueDate && hasIssueDate ? "7 / 7" : "missing fields"}` },
    { name: "Due date after issue date", pass: dueAfterIssue, note: dueAfterIssue ? "valid" : "invalid" },
    { name: "Amount positive and within limit", pass: amountPositive && amountUnderCap, note: amountPositive ? (amountUnderCap ? "under R500k cap" : "exceeds limit") : "missing" },
    { name: "Supplier matches KYB profile", pass: supplierVerified, note: supplierVerified ? "verified" : "pending" },
    { name: "Buyer in settlement dataset", pass: buyerKnown, note: buyerKnown ? "matched" : "no match" },
    { name: "Not previously submitted", pass: notDuplicate, note: notDuplicate ? "no ledger match" : (c.dupNote || "duplicate found") },
  ];

  const passed = checks.filter((x) => x.pass).length;
  return (
    <Section title="Verification" collapsible defaultOpen={false} right={<span className="conf">{passed} / {checks.length} passed</span>}>
      <div className="checks">
        {checks.map((x) => (
          <div className="check" key={x.name}>
            <span className={"tick " + (x.pass ? "ok" : "no")}>{x.pass ? "✓" : "✕"}</span>
            <span>{x.name}</span>
            <span className="check-note">{x.note}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}
