import { en } from '../../i18n/en';
import { Icon } from './Icon';
export default function ComingSoon({ name = en.app.name }: { name?: string }) {
  return <section className="coming-soon" aria-label={name}>
    <div className="coming-soon-mark"><Icon name="spark" size={32} /></div>
    <span className="eyebrow">{name}</span><h1>{en.comingSoon.title}</h1><p>{en.comingSoon.description}</p>
    <button className="primary-button" disabled title={en.comingSoon.unavailable}>{en.comingSoon.badge}</button>
  </section>;
}
