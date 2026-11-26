// A new activity left unsaved, kept while the app stays open. Closing the
// popup by mistake, with the back button, loses nothing; Cancel discards it.
export type ActivityDraft = {
  title: string;
  description: string;
  startText: string;
  typedEndText: string | null;
  color: string;
  repeatDays: number[];
};

let draft: ActivityDraft | null = null;

export function loadActivityDraft(): ActivityDraft | null {
  return draft;
}

export function saveActivityDraft(next: ActivityDraft | null): void {
  draft = next;
}

export function clearActivityDraft(): void {
  draft = null;
}
