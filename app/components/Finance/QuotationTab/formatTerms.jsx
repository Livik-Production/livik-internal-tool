// Shared formatter for the free-form Terms & Conditions text, used by both
// the editable Step 3 screen (live preview while typing) and the final
// QuotationPreviewForm (Preview modal + downloaded PDF), so both always
// render the text identically.
//
// Rules: "Label: value" lines get the label bolded; "NN% – description"
// lines render as a bullet point with the percentage bolded; blank lines
// become spacing.
export function renderFormattedTerms(text) {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return <div key={i} className="h-2" />;
    }

    const bulletMatch = trimmed.match(/^(\d+%)\s*[-–]\s*(.+)$/);
    if (bulletMatch) {
      return (
        <div key={i} className="flex gap-1.5 pl-1">
          <span>•</span>
          <span>
            <span className="font-semibold">{bulletMatch[1]}</span>
            {' – '}
            {bulletMatch[2]}
          </span>
        </div>
      );
    }

    const labelMatch = trimmed.match(/^([A-Za-z][A-Za-z /]*?):\s*(.*)$/);
    if (labelMatch) {
      return (
        <div key={i}>
          <span className="font-semibold">{labelMatch[1]}:</span>
          {labelMatch[2] ? ` ${labelMatch[2]}` : ''}
        </div>
      );
    }

    return <div key={i}>{trimmed}</div>;
  });
}
