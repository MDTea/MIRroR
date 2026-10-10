export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={className} aria-label="Mirriam">
      <span aria-hidden="true" className="inline-flex items-baseline">
        <span>M</span>
        <span>I</span>
        <span>R</span>
        <span className="inline-block" style={{ transform: "scaleX(-1)" }}>
          R
        </span>
        <span>I</span>
        <span>A</span>
        <span>M</span>
      </span>
    </span>
  );
}
