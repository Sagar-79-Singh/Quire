import { lazy } from 'react';
import type { ComponentType, LazyExoticComponent } from 'react';
import type { AppType } from './store';
import { en } from '../i18n/en';
export interface AppDefinition { id: AppType; name: string; icon: 'writer' | 'grid' | 'monitor'; available: boolean; component: LazyExoticComponent<ComponentType>; }
export const appRegistry: Record<AppType, AppDefinition> = {
  writer: { id: 'writer', name: en.apps.writer, icon: 'writer', available: true, component: lazy(() => import('../apps/writer/WriterApp')) },
  sheets: { id: 'sheets', name: en.apps.sheets, icon: 'grid', available: false, component: lazy(() => import('../components/ui/ComingSoon')) },
  slides: { id: 'slides', name: en.apps.slides, icon: 'monitor', available: false, component: lazy(() => import('../components/ui/ComingSoon')) },
};
export const availableApps = Object.values(appRegistry).filter((app) => app.available);
