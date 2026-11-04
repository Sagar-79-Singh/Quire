import { app, dialog } from 'electron';
import { bootstrap } from './main';
import { en } from '../src/i18n/en';

void bootstrap().catch(() => {
  dialog.showErrorBox(en.app.name, en.toast.error);
  app.quit();
});
