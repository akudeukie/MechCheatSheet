import { loc } from "./locale.js";
export function timeFormat(time) {
  let formatted;
  if (time < 0) {
    formatted = loc("time_never");
  } else {
    time = +time.toFixed(0);
    const secs_per_min = 60;
    if (time < secs_per_min) {
      formatted = `${time}s`;
    } else {
      const mins_per_hour = 60;
      const secs_per_hour = secs_per_min * mins_per_hour;
      const secs = time % secs_per_min;
      const mins = Math.floor(time / secs_per_min) % mins_per_hour;
      if (time < secs_per_hour) {
        if (secs > 0) {
          formatted = `${mins}m ${secs}s`;
        } else {
          formatted = `${mins}m`;
        }
      } else {
        const hours_per_day = 24;
        const secs_per_day = secs_per_hour * hours_per_day;
        const hours = Math.floor(time / secs_per_hour) % hours_per_day;
        if (time < secs_per_day) {
          if (mins > 0) {
            formatted = `${hours}h ${mins}m`;
          } else if (secs > 0) {
            formatted = `${hours}h ${secs}s`;
          } else {
            formatted = `${hours}h`;
          }
        } else {
          const days = Math.floor(time / secs_per_day);
          if (hours > 0) {
            formatted = `${days}d ${hours}h`;
          } else if (mins > 0) {
            formatted = `${days}d ${mins}m`;
          } else if (secs > 0) {
            formatted = `${days}d ${secs}s`;
          } else {
            formatted = `${days}d`;
          }
        }
      }
    }
  }
  return formatted;
}
