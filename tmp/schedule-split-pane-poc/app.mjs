import { createSampleItems } from './lib/sample-data.mjs';
import { SplitPaneSchedule } from './lib/split-pane.mjs';

const mount = document.getElementById('app');
let state = createSampleItems();

const themeParam = new URLSearchParams(location.search).get('theme');
if (themeParam === 'dark' || themeParam === 'light') {
  state = {
    ...state,
    ui: { ...(state.ui || {}), theme: themeParam },
  };
}

const view = new SplitPaneSchedule(mount, state, (next) => {
  state = next;
});

// Expose for console debugging
window.__schedulePoC = { getState: () => state, view };
