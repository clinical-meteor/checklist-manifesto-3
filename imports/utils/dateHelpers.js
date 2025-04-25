// imports/utils/dateHelpers.js
import moment from 'moment';
import { get } from 'lodash';

/**
 * Format a date using moment.js
 * @param {Date|String} date - The date to format
 * @param {String} format - The format string (optional)
 * @returns {String} Formatted date string
 */
export function formatDate(date, format = 'MMM D, YYYY') {
  if (!date) return '';
  return moment(date).format(format);
}

/**
 * Format a date and time using moment.js
 * @param {Date|String} date - The date to format
 * @param {String} format - The format string (optional)
 * @returns {String} Formatted date and time string
 */
export function formatDateTime(date, format = 'MMM D, YYYY h:mm A') {
  if (!date) return '';
  return moment(date).format(format);
}

/**
 * Get relative time (e.g., "2 hours ago", "in 3 days")
 * @param {Date|String} date - The date to format
 * @returns {String} Relative time string
 */
export function getRelativeTime(date) {
  if (!date) return '';
  return moment(date).fromNow();
}

/**
 * Check if a date is in the past
 * @param {Date|String} date - The date to check
 * @returns {Boolean} True if date is in the past
 */
export function isDatePast(date) {
  if (!date) return false;
  return moment(date).isBefore(moment());
}

/**
 * Check if a date is in the future
 * @param {Date|String} date - The date to check
 * @returns {Boolean} True if date is in the future
 */
export function isDateFuture(date) {
  if (!date) return false;
  return moment(date).isAfter(moment());
}

/**
 * Check if a task is overdue
 * @param {Object} task - The task object
 * @returns {Boolean} True if task is overdue
 */
export function isTaskOverdue(task) {
  const dueDate = get(task, 'executionPeriod.end');
  if (!dueDate) return false;
  
  // Task is overdue if due date is in the past and task is not completed
  return moment(dueDate).isBefore(moment()) && 
    get(task, 'status') !== 'completed' &&
    get(task, 'status') !== 'cancelled';
}

/**
 * Calculate days remaining until a date
 * @param {Date|String} date - The target date
 * @returns {Number} Number of days remaining (negative if date is in the past)
 */
export function getDaysRemaining(date) {
  if (!date) return 0;
  const now = moment();
  const targetDate = moment(date);
  return targetDate.diff(now, 'days');
}

/**
 * Add days to a date
 * @param {Date|String} date - The starting date
 * @param {Number} days - Number of days to add
 * @returns {Date} New date with days added
 */
export function addDays(date, days) {
  if (!date) return null;
  return moment(date).add(days, 'days').toDate();
}

/**
 * Get the start of a day (midnight)
 * @param {Date|String} date - The date
 * @returns {Date} Date set to start of day
 */
export function startOfDay(date) {
  if (!date) return null;
  return moment(date).startOf('day').toDate();
}

/**
 * Get the end of a day (23:59:59.999)
 * @param {Date|String} date - The date
 * @returns {Date} Date set to end of day
 */
export function endOfDay(date) {
  if (!date) return null;
  return moment(date).endOf('day').toDate();
}

/**
 * Format a duration in milliseconds to human-readable format
 * @param {Number} milliseconds - Duration in milliseconds
 * @returns {String} Formatted duration string
 */
export function formatDuration(milliseconds) {
  if (!milliseconds) return '';
  return moment.duration(milliseconds).humanize();
}