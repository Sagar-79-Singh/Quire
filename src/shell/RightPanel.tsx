import { en } from '../i18n/en';
import { Icon } from '../components/ui/Icon';
import { StylesGallery } from '../apps/writer/StylesGallery';
import { RibbonTabs } from '../components/ribbon/RibbonTabs';
import { useShellStore } from './store';
import type { PanelTab } from './store';
export const panelTabs = [{ id: 'styles', label: en.panel.styles }, { id: 'shape', label: en.panel.shape }, { id: 'comments', label: en.panel.comments }];
export function RightPanel({ onStyle }: { onStyle?: (tag: string, className?: string) => void }) {
  const open = useShellStore((state) => state.panelOpen);
  const tab = useShellStore((state) => state.panelTab);
  const setTab = useShellStore((state) => state.setPanelTab);
  const setOpen = useShellStore((state) => state.setPanelOpen);
  return <aside className={`right-panel ${open ? 'is-open' : ''}`} aria-label={en.panel.label} aria-hidden={!open}>
    {open && <div className="right-panel-inner"><div className="panel-heading"><RibbonTabs items={panelTabs} value={tab} onChange={(id) => { setTab(id as PanelTab); }} label={en.panel.label} /><button className="icon-button" aria-label={en.panel.close} title={en.panel.close} onClick={() => { setOpen(false); }}><Icon name="close" /></button></div>
      <div className="panel-content" id={`panel-${tab}`} role="tabpanel" aria-label={panelTabs.find((item) => item.id === tab)?.label}>
        {tab === 'styles' ? <><div className="panel-intro"><Icon name="styles" size={32} /><p>{en.panel.stylesDescription}</p></div>{onStyle ? <StylesGallery onApply={onStyle} /> : <p>{en.panel.stylesPending}</p>}</> : <div className="panel-empty"><Icon name={tab === 'comments' ? 'comment' : 'shape'} size={32} /><h3>{tab === 'comments' ? en.panel.noComments : en.panel.noShape}</h3><p>{tab === 'comments' ? en.panel.noCommentsDescription : en.panel.shapeDescription}</p></div>}
      </div>
    </div>}
  </aside>;
}
