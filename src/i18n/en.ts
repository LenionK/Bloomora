// Every text of the app in English. Italian has the same keys, so a text
// missing from one of them stops the type check.

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

export const en = {
  decimalSeparator: '.',

  dates: {
    months: MONTHS,
    monthsInDate: MONTHS,
    monthsShort: MONTHS.map((month) => month.slice(0, 3)),
    weekdaysShort: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    weekdays: [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ],
  },

  colorNames: {
    Pink: 'Pink',
    Orange: 'Orange',
    Yellow: 'Yellow',
    Green: 'Green',
    Teal: 'Teal',
    Blue: 'Blue',
    Purple: 'Purple',
  } as Record<string, string>,

  common: {
    add: 'Add',
    cancel: 'Cancel',
    delete: 'Delete',
    save: 'Save',
    backToCalendar: 'Back to calendar',
    about: (title: string) => `About ${title.toLowerCase()}`,
  },

  activity: {
    untitled: 'Untitled activity',
    edit: (title: string) => `Edit ${title}`,
    done: (title: string) => `${title} done`,
    delete: (title: string) => `Delete ${title}`,
  },

  calendar: {
    hasActivities: 'Has activities',
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
  },

  shortcuts: {
    myDay: 'My day',
    water: 'Water',
    stats: 'Stats',
    settings: 'Settings',
  },

  nextActivity: {
    plan: 'Plan an activity',
    emptyTitle: 'No upcoming activities',
    emptyText: 'Tap to plan your next one',
    next: 'Next',
  },

  day: {
    previousDay: 'Previous day',
    nextDay: 'Next day',
    today: 'today',
    addActivity: 'Add activity',
    completedOf: (completed: number, total: number) =>
      `${completed} of ${total} completed`,
  },

  addActivity: {
    newTitle: 'New activity',
    editTitle: 'Edit activity',
    from: 'From ',
    invalidDate: 'Invalid date',
    dateError: (date: Date) =>
      `Enter a valid date from ${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`,
    titleLabel: 'Activity title',
    titlePlaceholder: 'Activity title (optional)',
    descriptionLabel: 'Activity description',
    descriptionPlaceholder: 'Description (optional)',
    start: 'Start',
    startLabel: 'Start time',
    end: 'End',
    endLabel: 'End time',
    timeError: 'Enter a start time and an end time later than it',
    repeat: 'Repeat:',
    once: 'Once',
    color: 'Color',
  },

  dateInput: {
    day: 'Day',
    month: 'Month',
    year: 'Year',
  },

  deleteActivity: {
    title: (title: string) => `Delete “${title}”?`,
    options: {
      day: 'Only this day',
      someDays: 'Some days',
      all: 'Delete all',
    },
  },

  water: {
    title: 'Water',
    of: (litres: string) => `of ${litres}`,
    goalReached: 'Goal reached 🎉',
    note: (millilitres: number) =>
      `Tap a glass to add or remove ${millilitres} ml. The count starts again every day.`,
    added: (millilitres: number) => `Added ${millilitres} ml`,
    removed: (millilitres: number) => `Removed ${millilitres} ml`,
    undo: 'Undo',
    addsGlass: 'Adds a glass',
    removesGlass: 'Removes a glass',
    glass: (number: number, total: number, isFull: boolean) =>
      `Glass ${number} of ${total}, ${isFull ? 'full' : 'empty'}`,
    bottle: (percent: number) => `Bottle ${percent}% full`,
  },

  charts: {
    doneOutOfPlanned: 'Done out of planned',
    doneOfPlanned: (done: number, planned: number) => `${done} of ${planned} done`,
    nothingPlanned: 'Nothing planned',
    nothingPlannedDay: 'nothing planned',
    goal: (litres: string) => `Goal ${litres}`,
    notTracked: 'Not tracked',
    notTrackedDay: 'not tracked',
  },

  stats: {
    title: 'Stats',
    info: [
      'The period at the top applies to the whole page: this week from Monday, this month from the 1st. The water streak is always the current one.',
      'Completion rate: activities done out of those due, done or missed. Cancelled days do not count.',
      'Activities done today count at once; the others count as missed once the day is over.',
      'Water counts a day once it is over, or as soon as 2 L are reached. Until then the card shows today.',
      'Deleted activities stay in the stats under All time. Their dates are not kept, so a week or a month counts only the activities still saved.',
    ],
    period: 'Period',
    thisWeek: 'This week',
    thisMonth: 'This month',
    allTime: 'All time',
    activitiesEyebrow: 'ACTIVITIES',
    nothingToRate: 'Nothing to rate yet',
    doneOf: (done: number, total: number) => `${done} of ${total}`,
    completed: 'completed',
    parts: {
      done: 'Done',
      missed: 'Missed',
      skipped: 'Cancelled',
    },
    waterChart: 'Water',
    activitiesChart: 'Activities',
    notTrackedYet: 'Not tracked yet',
    addWater: 'Add water',
    waterToday: (litres: string) => `${litres} of 2 L today`,
    daysAtGoal: (goalDays: number, countedDays: number) =>
      `${goalDays}/${countedDays} days at 2 L`,
    waterStreak: 'Water streak',
    days: (count: number) => plural(count, 'day', 'days'),
    lastDaysAtGoal: (count: number, days: number) =>
      `${count} of the last ${days} days at 2 L`,
    chart: 'Chart',
  },

  settings: {
    title: 'Settings',
    calendar: 'Calendar',

    language: 'Language',
    languageOptions: {
      system: 'Phone',
      en: 'English',
      it: 'Italiano',
    },
    languageNote:
      'Phone follows the language of your phone: Italian, or English for any other language.',

    notifications: 'Notifications',
    beforeActivities: 'Before activities',
    drinkReminders: 'Drink reminders',
    off: 'Off',
    atStart: 'At start',
    from: 'From',
    to: 'to',
    drinkFrom: 'Drink reminders from',
    drinkTo: 'Drink reminders to',
    notAllowed:
      'Notifications are not allowed. Allow them for this app in the phone settings.',
    plannedReminders: 'Planned reminders',
    sendTest: 'Send a test notification',
    testSent: (seconds: number) => `Test sent, it arrives in ${seconds} seconds`,
    remindersNote:
      'Reminders are planned a week ahead. Open the app at least once a week to keep them coming. Drink reminders stop for the day at 2 L.',

    import: 'Import',
    importButton: 'Import from an .ics file',
    importNote:
      'Events from today on are added. Repeats that end, skip weeks or go by month or year become single dates for the next 3 months. All-day events are placed at 9:00–9:30.',
    importUnreadable: 'The file could not be read',
    importNotCalendar: 'Not an .ics calendar file',
    importNothingNew: 'Nothing new to import.',
    importMessage: 'They are added to your calendar in pink.',
    // What the file holds that will not be added, after a space.
    importLeftOut: (past: number, duplicates: number, unsupported: number) => {
      const parts = [
        past > 0 && plural(past, 'past event', 'past events'),
        duplicates > 0 &&
          `${plural(duplicates, 'activity', 'activities')} already in the calendar`,
        unsupported > 0 &&
          `${plural(unsupported, 'event', 'events')} with a repeat Bloomora cannot read`,
      ].filter(Boolean);

      return parts.length > 0 ? ` Left out: ${parts.join(', ')}.` : '';
    },
    importTitle: (count: number) =>
      `Import ${plural(count, 'activity', 'activities')}?`,
    importConfirm: 'Import',
    imported: (count: number) =>
      `Imported ${plural(count, 'activity', 'activities')}`,

    storage: 'Storage',
    spaceUsed: 'Space used',
    activities: 'Activities',
    saved: (count: number) => `${count} saved`,

    deleteOld: 'Delete old activities',
    olderThan: {
      week: 'Older than a week',
      month: 'Older than a month',
      year: 'Older than a year',
    },
    deleteOldNote: 'Repeating activities are always kept. Delete them from their day.',
    deleteOldTitle: (count: number) =>
      `Delete ${count} old ${count === 1 ? 'activity' : 'activities'}?`,
    cannotBeUndone: 'This cannot be undone.',

    stats: 'Stats',
    resetStats: 'Reset stats',
    resetToday: 'Reset today',
    resetNote:
      'Stats start again from today and the water history is deleted. Your activities and the calendar stay as they are.',
    reset: 'Reset',
    resetTitle: 'Reset all stats?',
    resetMessage:
      'Water history and activity scores start again from today. This cannot be undone.',
  },

  notifications: {
    startsNow: (time: string) => `Starts now, at ${time}`,
    startsIn: (duration: string, time: string) => `In ${duration}, at ${time}`,
    waterTitle: 'Time for a glass of water',
    waterBody: 'Every glass brings you closer to 2 L today.',
    activitiesChannel: 'Activities',
    waterChannel: 'Water',
    testBody: 'Notifications are working.',
  },
};

export type Strings = typeof en;
