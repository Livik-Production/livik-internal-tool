/**
 * Formats duration in hours to a human-readable string.
 * @param {number|string} durationHours - Duration in hours (e.g., 0.33, 1.5)
 * @returns {string} - Formatted string (e.g., "20m", "1h 30m")
 */
export const formatDuration = (durationHours) => {
  if (durationHours === undefined || durationHours === null || durationHours === '') {
    return 'N/A';
  }
  
  const hoursFloat = parseFloat(durationHours);
  if (isNaN(hoursFloat)) return 'N/A';
  
  const totalMinutes = Math.round(hoursFloat * 60);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};
