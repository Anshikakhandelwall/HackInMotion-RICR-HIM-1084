// Temporary frontend mock data. Replace with backend/API data later.
import { mockMedicines } from './mockMedicines';

export { mockMedicines };

export const mockSafetySummary = {
  title: 'Safety Overview',
  mainValue: '2 Active Warnings',
  supportingText: 'Potential medication interactions need your attention.',
  lastChecked: 'Today, 10:30 AM',
  hasWarnings: true,
};

export const mockRecentChecks = [
  {
    id: 'check-1',
    date: 'Today',
    medicineCount: 3,
    status: '1 warning',
    variant: 'warning',
  },
  {
    id: 'check-2',
    date: '10 Aug',
    medicineCount: 2,
    status: 'No interactions identified',
    variant: 'safe',
  },
  {
    id: 'check-3',
    date: '08 Aug',
    medicineCount: 4,
    status: '1 moderate warning',
    variant: 'moderate',
  },
];
