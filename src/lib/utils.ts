import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function evaluateThresholds(data: any, thresholds: any[]): boolean {
  if (!data || !thresholds || thresholds.length === 0) return false;
  
  for (const th of thresholds) {
    const val = data[th.sensor];
    if (val === undefined || val === null) continue;
    
    const v = parseFloat(val);
    const th_v1 = parseFloat(th.value1);
    
    if (th.operator === 'greater' && v > th_v1) return true;
    if (th.operator === 'smaller' && v < th_v1) return true;
    if (th.operator === 'equal' && v === th_v1) return true;
    if (th.operator === 'between') {
      const th_v2 = parseFloat(th.value2);
      if (v >= th_v1 && v <= th_v2) return true;
    }
  }
  return false;
}
