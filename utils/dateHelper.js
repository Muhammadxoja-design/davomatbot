export function formatDate(date) {
  return date.toISOString().split('T')[0];
}

export function getToday() {
  return formatDate(new Date());
}

export function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as start of week
  return new Date(d.setDate(diff));
}

export function getWeekEnd(date = new Date()) {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end;
}

export function getMonthStart(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function getMonthEnd(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function getYearStart(date = new Date()) {
  return new Date(date.getFullYear(), 0, 1);
}

export function getYearEnd(date = new Date()) {
  return new Date(date.getFullYear(), 11, 31);
}

export function getDateRange(period, date = new Date()) {
  switch (period) {
    case 'week':
      return {
        start: formatDate(getWeekStart(date)),
        end: formatDate(getWeekEnd(date))
      };
    case 'month':
      return {
        start: formatDate(getMonthStart(date)),
        end: formatDate(getMonthEnd(date))
      };
    case 'year':
      return {
        start: formatDate(getYearStart(date)),
        end: formatDate(getYearEnd(date))
      };
    case 'today':
    default:
      return {
        start: formatDate(date),
        end: formatDate(date)
      };
  }
}

export function formatDateUzbek(dateString) {
  const date = new Date(dateString);
  const months = [
    'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
    'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'
  ];
  
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

export function getWeekDays() {
  return ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba'];
}
