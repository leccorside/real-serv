import { parseISO } from 'date-fns';
import { TimeRecord } from '@/types';

/**
 * Calculates total worked time from a set of records.
 * Supports multiple periods (Entrada -> Saída Almoço, Retorno Almoço -> Saída)
 */
export const calculateWorkingTime = (records: TimeRecord[], referenceTime: Date = new Date()) => {
  const dayGroups = records.reduce((acc, rec) => {
    const day = rec.timestamp.split('T')[0];
    if (!acc[day]) acc[day] = {};
    acc[day][rec.type] = parseISO(rec.timestamp);
    return acc;
  }, {} as Record<string, Record<string, any>>);

  let totalMinutes = 0;

  Object.values(dayGroups).forEach(day => {
    let dayMinutes = 0;
    
    if (day.ENTRADA) {
      // Period 1: Entrance to Lunch (if exists) or to Final Exit/Current Time
      const end1 = day.SAIDA_ALMOCO || day.SAIDA || referenceTime;
      dayMinutes += Math.max(0, (end1.getTime() - day.ENTRADA.getTime()) / 60000);
      
      // Period 2: Only if returned from lunch
      if (day.RETORNO_ALMOCO) {
        const end2 = day.SAIDA || referenceTime;
        dayMinutes += Math.max(0, (end2.getTime() - day.RETORNO_ALMOCO.getTime()) / 60000);
      }
    }
    
    totalMinutes += dayMinutes;
  });

  const hours = Math.floor(totalMinutes / 60);
  const mins = Math.round(totalMinutes % 60);
  
  return { hours, mins, totalMinutes };
};
