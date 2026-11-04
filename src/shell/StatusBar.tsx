import { en } from '../i18n/en';
import { Icon } from '../components/ui/Icon';
import { Slider } from '../components/ui/Slider';
import { countWords, getActiveDocument, MAX_ZOOM, MIN_ZOOM, useShellStore } from './store';
import type { ViewMode } from './store';
export const statusViews = [{ id: 'print', icon: 'print', label: en.ribbon.print }, { id: 'web', icon: 'web', label: en.ribbon.web }, { id: 'read', icon: 'read', label: en.ribbon.read }] as const;
export function StatusBar() {
  const document = useShellStore(getActiveDocument);
  const view = useShellStore((state) => state.viewMode);
  const zoom = useShellStore((state) => state.zoom);
  const setZoom = useShellStore((state) => state.setZoom);
  const setView = useShellStore((state) => state.setViewMode);
  const setPanel = useShellStore((state) => state.setPanelOpen);
  const panelOpen = useShellStore((state) => state.panelOpen);
  const words = document ? countWords(document.content) : 0;
  const changeView = (mode: ViewMode): void => { setView(mode); };
  return <footer className="status-bar">
    <div className="status-left"><span>{document ? `${en.status.page} 1 ${en.status.of} 1` : en.app.ready}</span>{document && <><span className="status-divider" /><span>{words} {words === 1 ? en.status.word : en.status.words}</span><span className="status-divider" /><span className="status-language" title={en.status.language}>{en.status.languageName}</span></>}</div>
    <div className="status-right">{document && <><div className="view-switcher" role="group" aria-label={en.status.view}>{statusViews.map((item) => <button key={item.id} className={`icon-button ${view === item.id ? 'is-active' : ''}`} aria-label={item.label} title={item.label} aria-pressed={view === item.id} onClick={() => { changeView(item.id); }}><Icon name={item.icon} /></button>)}</div><span className="status-divider" /><button className="icon-button zoom-step" aria-label={en.ribbon.zoomOut} title={en.ribbon.zoomOut} disabled={zoom <= MIN_ZOOM} onClick={() => { setZoom(zoom - 10); }}><Icon name="minus" /></button><Slider label={en.status.zoom} min={MIN_ZOOM} max={MAX_ZOOM} step={5} value={zoom} onChange={setZoom} className="zoom-slider" /><button className="icon-button zoom-step" aria-label={en.ribbon.zoomIn} title={en.ribbon.zoomIn} disabled={zoom >= MAX_ZOOM} onClick={() => { setZoom(zoom + 10); }}><Icon name="plus" /></button><button className="zoom-value" aria-label={en.ribbon.resetZoom} title={en.ribbon.resetZoom} onClick={() => { setZoom(100); }}>{zoom}%</button></>}
      <button className={`icon-button status-panel ${panelOpen ? 'is-active' : ''}`} aria-label={panelOpen ? en.ribbon.hidePanel : en.ribbon.showPanel} aria-pressed={panelOpen} disabled={!document} title={document ? undefined : en.common.noDocument} onClick={() => { setPanel(!panelOpen); }}><Icon name="panel" /></button>
    </div>
  </footer>;
}
