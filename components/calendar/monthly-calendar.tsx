import { MonthCard } from './month-card';

import type { MonthData } from '../../lib/calendar/types';

type MonthlyCalendarProps = {
  months: MonthData[];
};

export const MonthlyCalendar = ({ months }: MonthlyCalendarProps) => (
  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
    {months.map((monthData) => (
      <MonthCard
        key={monthData.month}
        month={monthData.month}
        entries={monthData.entries}
        total={monthData.total}
      />
    ))}
  </div>
);
