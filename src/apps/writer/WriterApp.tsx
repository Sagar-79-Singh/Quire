import { useEffect, useRef, useState } from 'react';
import { en } from '../../i18n/en';
import { RibbonButton } from '../../components/ribbon/RibbonButton';
import { RibbonGroup } from '../../components/ribbon/RibbonGroup';
import { RibbonTabs } from '../../components/ribbon/RibbonTabs';
import { RibbonSurface } from '../../components/ribbon/RibbonSurface';
import { getActiveDocument, useShellStore } from '../../shell/store';
import { RightPanel } from '../../shell/RightPanel';
import { useToast } from '../../components/ui/Toast';
import { Editor } from './Editor';
import type { EditorHandle } from './Editor';
import { Pages } from './Pages';
import { Ruler } from './Ruler';
import { StylesGallery } from './StylesGallery';
import { useWriterStore } from './store';
import { defaultSettings } from './model';

export default function WriterApp() {
  const document = useShellStore(getActiveDocument);
  const view = useShellStore((state) => state.viewMode);
  const zoom = useShellStore((state) => state.zoom);
  const mode = useShellStore((state) => state.ribbonMode);
  const ensure = useWriterStore((state) => state.ensure);
  const writer = useWriterStore((state) => document ? state.documents[document.id] : undefined);
  const editor = useRef<EditorHandle>(null);
  const [tab, setTab] = useState('home');
  const [ruler, setRuler] = useState(true);
  const [gridlines, setGridlines] = useState(false);
  const notify = useToast();
  useEffect(() => { if (document) ensure(document.id, document.content); }, [document?.id, ensure]);
  const applyStyle = (tag: string, className?: string): void => { editor.current?.execute('formatBlock', tag); if (className) editor.current?.execute('blockClass', className); };
  if (!document || !writer) return null;
  const command = (name: string, value?: string): void => { editor.current?.execute(name, value); };
  const groups = [
    { id: 'font', node: <RibbonGroup title={en.ribbon.font}><div className="ribbon-row"><RibbonButton icon="bold" label={en.editor.bold} hideLabel active={writer.activeFormats.includes('bold')} onClick={() => { command('bold'); }} /><RibbonButton icon="italic" label={en.editor.italic} hideLabel active={writer.activeFormats.includes('italic')} onClick={() => { command('italic'); }} /><RibbonButton icon="underline" label={en.editor.underline} hideLabel active={writer.activeFormats.includes('underline')} onClick={() => { command('underline'); }} /></div><div className="ribbon-row"><RibbonButton icon="list" label={en.editor.bullets} hideLabel onClick={() => { command('insertUnorderedList'); }} /><RibbonButton icon="align" label={en.editor.left} hideLabel onClick={() => { command('justifyLeft'); }} /></div></RibbonGroup> },
    { id: 'styles', node: <RibbonGroup title={en.ribbon.styles}><StylesGallery compact onApply={applyStyle} /></RibbonGroup> },
    { id: 'view', node: <RibbonGroup title={en.ribbon.view}><RibbonButton icon="expand" label="Ruler" onClick={() => { setRuler(!ruler); }} /><RibbonButton icon="grid" label="Gridlines" active={gridlines} onClick={() => { setGridlines(!gridlines); }} /></RibbonGroup> },
  ];
  return <section className="writer-app" aria-label={en.apps.writer}>
    <div className="writer-ribbon"><div className="ribbon-tabline"><RibbonTabs label={en.ribbon.label} value={tab} onChange={setTab} items={[{ id: 'home', label: en.ribbon.home }, { id: 'view', label: en.ribbon.view }]} /><button className="ribbon-mode-button" aria-label={mode === 'compact' ? en.ribbon.expanded : en.ribbon.compact} onClick={() => { useShellStore.getState().setRibbonMode(mode === 'compact' ? 'expanded' : 'compact'); }}>{mode === 'compact' ? en.ribbon.compact : en.ribbon.expanded}</button></div><div id={`panel-${tab}`} role="tabpanel" aria-label={tab}><RibbonSurface groups={groups} expanded={mode === 'expanded'} /></div></div>
    <div className="writer-workspace"><div className="writer-canvas-wrap">{ruler && <Ruler settings={writer.settings ?? defaultSettings} zoom={zoom} />}<div className="writer-pages-row">{ruler && <Ruler settings={writer.settings} orientation="vertical" zoom={zoom} />}<Pages settings={writer.settings} pageCount={writer.pageCount} zoom={zoom} ruler={false} gridlines={gridlines} view={view}><Editor ref={editor} documentId={document.id} onError={notify} /></Pages></div></div><RightPanel onStyle={applyStyle} /></div>
  </section>;
}
