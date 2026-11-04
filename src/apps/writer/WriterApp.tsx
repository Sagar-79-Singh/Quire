import { useState } from 'react';
import { en } from '../../i18n/en';
import { Icon } from '../../components/ui/Icon';
import { RibbonButton } from '../../components/ribbon/RibbonButton';
import { RibbonGroup } from '../../components/ribbon/RibbonGroup';
import { RibbonTabs } from '../../components/ribbon/RibbonTabs';
import { RibbonSurface } from '../../components/ribbon/RibbonSurface';
import type { RibbonSection } from '../../components/ribbon/RibbonSurface';
import { getActiveDocument, useShellStore } from '../../shell/store';
import { RightPanel } from '../../shell/RightPanel';
import { useTheme } from '../../theme/ThemeProvider';

export default function WriterApp() {
  const document = useShellStore(getActiveDocument);
  const mode = useShellStore((state) => state.ribbonMode);
  const setMode = useShellStore((state) => state.setRibbonMode);
  const panelOpen = useShellStore((state) => state.panelOpen);
  const setPanelOpen = useShellStore((state) => state.setPanelOpen);
  const view = useShellStore((state) => state.viewMode);
  const zoom = useShellStore((state) => state.zoom);
  const setView = useShellStore((state) => state.setViewMode);
  const { preference, setTheme } = useTheme();
  const [tab, setTab] = useState('home');
  const groups: RibbonSection[] = [
    { id: 'font', node: <RibbonGroup title={en.ribbon.font}><div className="ribbon-row"><RibbonButton icon="bold" label={en.editor.bold} hideLabel disabled disabledReason={en.title.toolsPending} /><RibbonButton icon="italic" label={en.editor.italic} hideLabel disabled disabledReason={en.title.toolsPending} /><RibbonButton icon="underline" label={en.editor.underline} hideLabel disabled disabledReason={en.title.toolsPending} /></div><div className="ribbon-row"><RibbonButton icon="styles" label={en.editor.normal} disabled disabledReason={en.title.toolsPending} /><RibbonButton icon="paint" label={en.editor.painter} hideLabel disabled disabledReason={en.title.toolsPending} /></div></RibbonGroup> },
    { id: 'paragraph', node: <RibbonGroup title={en.ribbon.paragraph}><div className="ribbon-row"><RibbonButton icon="list" label={en.editor.bullets} hideLabel disabled disabledReason={en.title.toolsPending} /><RibbonButton icon="align" label={en.editor.align} hideLabel disabled disabledReason={en.title.toolsPending} /></div><div className="ribbon-row"><RibbonButton icon="grid" label={en.editor.borders} hideLabel disabled disabledReason={en.title.toolsPending} /></div></RibbonGroup> },
    { id: 'workspace', node: <RibbonGroup title={en.ribbon.workspace}><div className="ribbon-row"><RibbonButton icon="print" label={en.ribbon.print} active={view === 'print'} onClick={() => { setView('print'); }} /><RibbonButton icon="read" label={en.ribbon.read} active={view === 'read'} onClick={() => { setView('read'); }} /></div><div className="ribbon-row"><RibbonButton icon="panel" label={en.ribbon.panel} active={panelOpen} onClick={() => { setPanelOpen(!panelOpen); }} /><RibbonButton icon="expand" label={mode === 'compact' ? en.ribbon.expanded : en.ribbon.compact} onClick={() => { setMode(mode === 'compact' ? 'expanded' : 'compact'); }} /></div></RibbonGroup> },
    { id: 'appearance', node: <RibbonGroup title={en.ribbon.appearance}><div className="ribbon-row"><RibbonButton icon="sun" label={en.ribbon.light} active={preference === 'light'} onClick={() => { setTheme('light'); }} /><RibbonButton icon="moon" label={en.ribbon.dark} active={preference === 'dark'} onClick={() => { setTheme('dark'); }} /></div><div className="ribbon-row"><RibbonButton icon="monitor" label={en.ribbon.system} active={preference === 'system'} onClick={() => { setTheme('system'); }} /></div></RibbonGroup> },
  ];
  if (!document) return null;
  return <section className="writer-app" aria-label={en.apps.writer}>
    <div className="writer-ribbon"><div className="ribbon-tabline"><RibbonTabs label={en.ribbon.label} value={tab} onChange={setTab} items={[{ id: 'home', label: en.ribbon.home }, { id: 'view', label: en.ribbon.view }, { id: 'insert', label: en.ribbon.insert, disabled: true }, { id: 'design', label: en.ribbon.design, disabled: true }, { id: 'layout', label: en.ribbon.layout, disabled: true }]} /><button className="ribbon-mode-button" aria-label={mode === 'compact' ? en.ribbon.expanded : en.ribbon.compact} title={mode === 'compact' ? en.ribbon.expanded : en.ribbon.compact} onClick={() => { setMode(mode === 'compact' ? 'expanded' : 'compact'); }}><span>{mode === 'compact' ? en.ribbon.compact : en.ribbon.expanded}</span><Icon name="chevronDown" /></button></div>
      <div id={`panel-${tab}`} role="tabpanel" aria-label={tab === 'home' ? en.ribbon.home : en.ribbon.view}><RibbonSurface groups={groups} expanded={mode === 'expanded'} /></div>
    </div>
    <div className="writer-workspace"><div className={`writer-canvas view-${view}`}><div className="page-scale" style={{ width: 816 * zoom / 100, height: 1056 * zoom / 100 }}><div className="preview-page" style={{ transform: `scale(${zoom / 100})` }} role="document" aria-label={en.ribbon.pagePreview} aria-readonly="true"><div className="preview-content">{document.content ? document.content.split(/\n\n+/).map((paragraph, index) => index === 0 ? <h1 key={index}>{paragraph}</h1> : <p key={index}>{paragraph}</p>) : <span className="sr-only">{en.ribbon.pagePreviewDescription}</span>}</div><span className="preview-page-number">1</span></div></div></div><RightPanel /></div>
  </section>;
}
