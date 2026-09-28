/** Animated three-dot "typing" indicator shown next to the progress_label
 * text while the estimate/wallbounce agent is working. Styling (keyframes,
 * .mta-typing-dots) lives in src/app/globals.css. */
export function TypingDots() {
  return (
    <span className="mta-typing-dots" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}
