import { clearActivityDraft } from './src/components/activityDraft';

// Each test starts without the unsaved activity another test may have left.
afterEach(() => clearActivityDraft());
