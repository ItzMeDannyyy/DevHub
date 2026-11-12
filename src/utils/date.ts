/**
 * Utility functions for formatting dates and deadlines.
 */

export const formatDeadlineDisplay = (deadline?: string): string => {
  if (!deadline) return '';

  try {
    const normalized = deadline.replace('T', ' ');
    const hasTime = normalized.includes(':');
    const date = new Date(normalized);

    if (isNaN(date.getTime())) {
      return deadline;
    }

    if (hasTime) {
      const monthDay = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${monthDay} • ${hours}:${minutes}`;
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return deadline;
  }
};
