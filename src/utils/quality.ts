/** Pick a default quality tier from the device. Users can override on the intro screen. */
import type { QualityTier } from '@/game/types';
export function detectQuality(): QualityTier {
  if (typeof window === 'undefined') return 'high';
  const q = new URLSearchParams(location.search).get('quality') as QualityTier | null; if (q && ['low', 'medium', 'high', 'ultra'].includes(q)) return q;
  const mobile = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent); const cores = navigator.hardwareConcurrency || 4; const mem = (navigator as { deviceMemory?: number }).deviceMemory || 4;
  if (mobile) return cores >= 8 && mem >= 6 ? 'medium' : 'low';
  if (cores >= 8 && mem >= 8) return 'ultra';
  return 'high';
}
