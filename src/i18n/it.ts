import { Strings } from './en';

// Every text of the app in Italian, with the same keys as English.

const MONTHS_IN_DATE = [
  'gennaio',
  'febbraio',
  'marzo',
  'aprile',
  'maggio',
  'giugno',
  'luglio',
  'agosto',
  'settembre',
  'ottobre',
  'novembre',
  'dicembre',
];

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

export const it: Strings = {
  decimalSeparator: ',',

  dates: {
    // Capitals for a month on its own, as in a calendar title.
    months: MONTHS_IN_DATE.map(capitalize),
    monthsInDate: MONTHS_IN_DATE,
    monthsShort: MONTHS_IN_DATE.map((month) => month.slice(0, 3)),
    weekdaysShort: ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'],
    weekdays: [
      'Lunedì',
      'Martedì',
      'Mercoledì',
      'Giovedì',
      'Venerdì',
      'Sabato',
      'Domenica',
    ],
  },

  colorNames: {
    Pink: 'Rosa',
    Orange: 'Arancione',
    Yellow: 'Giallo',
    Green: 'Verde',
    Teal: 'Verde acqua',
    Blue: 'Blu',
    Purple: 'Viola',
  },

  common: {
    add: 'Aggiungi',
    cancel: 'Annulla',
    delete: 'Elimina',
    save: 'Salva',
    backToCalendar: 'Torna al calendario',
    about: (title: string) => `Informazioni su ${title.toLowerCase()}`,
  },

  activity: {
    untitled: 'Attività senza titolo',
    edit: (title: string) => `Modifica ${title}`,
    done: (title: string) => `${title} fatta`,
    delete: (title: string) => `Elimina ${title}`,
  },

  calendar: {
    hasActivities: 'Ha attività',
    previousMonth: 'Mese precedente',
    nextMonth: 'Mese successivo',
  },

  shortcuts: {
    myDay: 'La mia giornata',
    water: 'Acqua',
    stats: 'Statistiche',
    settings: 'Impostazioni',
  },

  nextActivity: {
    plan: "Pianifica un'attività",
    emptyTitle: 'Nessuna attività in arrivo',
    emptyText: 'Tocca per pianificare la prossima',
    next: 'Prossima',
  },

  day: {
    previousDay: 'Giorno precedente',
    nextDay: 'Giorno successivo',
    today: 'oggi',
    addActivity: 'Aggiungi attività',
    completedOf: (completed: number, total: number) =>
      `${completed} su ${total} completate`,
  },

  addActivity: {
    newTitle: 'Nuova attività',
    editTitle: 'Modifica attività',
    from: 'Dal ',
    invalidDate: 'Data non valida',
    dateError: (date: Date) =>
      `Inserisci una data valida dal ${date.getDate()} ${MONTHS_IN_DATE[date.getMonth()]} ${date.getFullYear()}`,
    titleLabel: 'Titolo attività',
    titlePlaceholder: 'Titolo (facoltativo)',
    descriptionLabel: 'Descrizione attività',
    descriptionPlaceholder: 'Descrizione (facoltativa)',
    start: 'Inizio',
    startLabel: 'Ora di inizio',
    end: 'Fine',
    endLabel: 'Ora di fine',
    timeError: "Inserisci un'ora di inizio e un'ora di fine successiva",
    repeat: 'Ripeti:',
    once: 'Una volta',
    color: 'Colore',
  },

  dateInput: {
    day: 'Giorno',
    month: 'Mese',
    year: 'Anno',
  },

  deleteActivity: {
    title: (title: string) => `Eliminare “${title}”?`,
    options: {
      day: 'Solo questo giorno',
      someDays: 'Alcuni giorni',
      all: 'Elimina tutte',
    },
  },

  water: {
    title: 'Acqua',
    of: (litres: string) => `su ${litres}`,
    goalReached: 'Obiettivo raggiunto 🎉',
    note: (millilitres: number) =>
      `Tocca un bicchiere per aggiungere o togliere ${millilitres} ml. Il conteggio riparte ogni giorno.`,
    added: (millilitres: number) => `Aggiunti ${millilitres} ml`,
    removed: (millilitres: number) => `Tolti ${millilitres} ml`,
    undo: 'Annulla',
    addsGlass: 'Aggiunge un bicchiere',
    removesGlass: 'Toglie un bicchiere',
    glass: (number: number, total: number, isFull: boolean) =>
      `Bicchiere ${number} di ${total}, ${isFull ? 'pieno' : 'vuoto'}`,
    bottle: (percent: number) => `Bottiglia piena al ${percent}%`,
  },

  charts: {
    doneOutOfPlanned: 'Fatte su previste',
    doneOfPlanned: (done: number, planned: number) => `${done} su ${planned} fatte`,
    nothingPlanned: 'Niente in programma',
    nothingPlannedDay: 'niente in programma',
    goal: (litres: string) => `Obiettivo ${litres}`,
    notTracked: 'Non registrato',
    notTrackedDay: 'non registrato',
  },

  stats: {
    title: 'Statistiche',
    info: [
      "Il periodo in alto vale per tutta la pagina: la settimana da lunedì, il mese dal giorno 1. La serie dell'acqua è sempre quella in corso.",
      'Percentuale di completamento: attività fatte su quelle previste, fatte o mancate. I giorni annullati non contano.',
      'Le attività fatte oggi contano subito; le altre contano come mancate quando il giorno finisce.',
      "L'acqua conta un giorno quando è finito, o appena arrivi a 2 L. Fino ad allora la scheda mostra oggi.",
      'Le attività eliminate restano nelle statistiche in Sempre. Le loro date non vengono salvate, quindi una settimana o un mese contano solo le attività ancora salvate.',
    ],
    period: 'Periodo',
    thisWeek: 'Settimana',
    thisMonth: 'Mese',
    allTime: 'Sempre',
    activitiesEyebrow: 'ATTIVITÀ',
    nothingToRate: 'Ancora niente da valutare',
    doneOf: (done: number, total: number) => `${done} su ${total}`,
    completed: 'completate',
    parts: {
      done: 'Fatte',
      missed: 'Mancate',
      skipped: 'Annullate',
    },
    waterChart: 'Acqua',
    activitiesChart: 'Attività',
    notTrackedYet: 'Non ancora registrata',
    addWater: 'Aggiungi acqua',
    waterToday: (litres: string) => `${litres} su 2 L oggi`,
    daysAtGoal: (goalDays: number, countedDays: number) =>
      `${goalDays}/${countedDays} giorni a 2 L`,
    waterStreak: 'Serie acqua',
    days: (count: number) => plural(count, 'giorno', 'giorni'),
    lastDaysAtGoal: (count: number, days: number) =>
      `${count} degli ultimi ${days} giorni a 2 L`,
    chart: 'Grafico',
  },

  settings: {
    title: 'Impostazioni',
    calendar: 'Calendario',

    language: 'Lingua',
    languageOptions: {
      system: 'Telefono',
      en: 'English',
      it: 'Italiano',
    },
    languageNote:
      'Telefono segue la lingua del telefono: italiano, o inglese per ogni altra lingua.',

    notifications: 'Notifiche',
    beforeActivities: 'Prima delle attività',
    drinkReminders: 'Promemoria per bere',
    off: 'No',
    atStart: "All'inizio",
    from: 'Dalle',
    to: 'alle',
    drinkFrom: 'Promemoria per bere dalle',
    drinkTo: 'Promemoria per bere fino alle',
    notAllowed:
      'Le notifiche non sono consentite. Consentile per questa app nelle impostazioni del telefono.',
    plannedReminders: 'Promemoria programmati',
    sendTest: 'Invia una notifica di prova',
    testSent: (seconds: number) => `Prova inviata, arriva tra ${seconds} secondi`,
    remindersNote:
      "I promemoria sono programmati con una settimana di anticipo. Apri l'app almeno una volta a settimana per continuare a riceverli. I promemoria per bere si fermano per la giornata a 2 L.",

    import: 'Importa',
    importButton: 'Importa da un file .ics',
    importNote:
      'Vengono aggiunti gli eventi da oggi in poi. Le ripetizioni che finiscono, saltano delle settimane o vanno per mese o anno diventano date singole per i prossimi 3 mesi. Gli eventi di tutto il giorno vanno alle 9:00–9:30.',
    importUnreadable: 'Non è stato possibile leggere il file',
    importNotCalendar: 'Non è un file di calendario .ics',
    importNothingNew: 'Niente di nuovo da importare.',
    importMessage: 'Vengono aggiunte al calendario in rosa.',
    importLeftOut: (past: number, duplicates: number, unsupported: number) => {
      const parts = [
        past > 0 && plural(past, 'evento passato', 'eventi passati'),
        duplicates > 0 && `${duplicates} attività già nel calendario`,
        unsupported > 0 &&
          `${plural(unsupported, 'evento', 'eventi')} con una ripetizione che Bloomora non sa leggere`,
      ].filter(Boolean);

      return parts.length > 0 ? ` Esclusi: ${parts.join(', ')}.` : '';
    },
    importTitle: (count: number) => `Importare ${count} attività?`,
    importConfirm: 'Importa',
    imported: (count: number) =>
      count === 1 ? 'Importata 1 attività' : `Importate ${count} attività`,

    storage: 'Memoria',
    spaceUsed: 'Spazio usato',
    activities: 'Attività',
    saved: (count: number) => `${count} ${count === 1 ? 'salvata' : 'salvate'}`,

    deleteOld: 'Elimina le attività vecchie',
    olderThan: {
      week: 'Più vecchie di una settimana',
      month: 'Più vecchie di un mese',
      year: 'Più vecchie di un anno',
    },
    deleteOldNote: 'Le attività ripetute restano sempre. Eliminale dal loro giorno.',
    deleteOldTitle: (count: number) =>
      `Eliminare ${count} ${count === 1 ? 'attività vecchia' : 'attività vecchie'}?`,
    cannotBeUndone: 'Non si può annullare.',

    stats: 'Statistiche',
    resetStats: 'Azzera le statistiche',
    resetToday: 'Azzerate oggi',
    resetNote:
      "Le statistiche ripartono da oggi e la cronologia dell'acqua viene eliminata. Le attività e il calendario restano come sono.",
    reset: 'Azzera',
    resetTitle: 'Azzerare tutte le statistiche?',
    resetMessage:
      "La cronologia dell'acqua e i punteggi delle attività ripartono da oggi. Non si può annullare.",
  },

  notifications: {
    startsNow: (time: string) => `Inizia ora, alle ${time}`,
    startsIn: (duration: string, time: string) => `Tra ${duration}, alle ${time}`,
    waterTitle: "È ora di un bicchiere d'acqua",
    waterBody: 'Ogni bicchiere ti avvicina ai 2 L di oggi.',
    activitiesChannel: 'Attività',
    waterChannel: 'Acqua',
    testBody: 'Le notifiche funzionano.',
  },
};
