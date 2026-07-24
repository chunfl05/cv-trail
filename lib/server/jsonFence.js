// Claude occasionally wraps JSON output in a ```json ... ``` fence despite
// instructions not to — strip it before JSON.parse so callers don't crash.
export function stripJsonFence(text) {
  const trimmed = (text || '').trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}
