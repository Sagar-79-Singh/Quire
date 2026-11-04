import { en } from '../i18n/en';

export interface StarterTemplate {
  id: string;
  name: string;
  description: string;
  color: string;
  heading: string;
  lines: string[];
}
export const starterTemplates: StarterTemplate[] = [
  { id: 'business', name: en.templates.business, description: en.templates.businessDescription, color: '#2B579A', heading: en.templateContent.business, lines: [en.templateContent.opportunity, en.templateContent.approach, en.templateContent.details, en.templateContent.next] },
  { id: 'report', name: en.templates.report, description: en.templates.reportDescription, color: '#3B746B', heading: en.templateContent.report, lines: [en.templateContent.glance, en.templateContent.progress, en.templateContent.learned, en.templateContent.ahead] },
  { id: 'letter', name: en.templates.letter, description: en.templates.letterDescription, color: '#9B6A4B', heading: en.templateContent.letter, lines: [en.templateContent.dear, en.templateContent.while, en.templateContent.regards] },
  { id: 'notes', name: en.templates.notes, description: en.templates.notesDescription, color: '#6B5B95', heading: en.templateContent.notes, lines: [en.templateContent.agenda, en.templateContent.discussion, en.templateContent.decisions, en.templateContent.actions] },
  { id: 'project', name: en.templates.project, description: en.templates.projectDescription, color: '#31708E', heading: en.templateContent.project, lines: [en.templateContent.goal, en.templateContent.milestones, en.templateContent.involved, en.templateContent.timeline] },
  { id: 'resume', name: en.templates.resume, description: en.templates.resumeDescription, color: '#4B6652', heading: en.templateContent.name, lines: [en.templateContent.experience, en.templateContent.education, en.templateContent.skills, en.templateContent.about] },
];
export function filterTemplates(query: string): StarterTemplate[] {
  const normalized = query.trim().toLocaleLowerCase();
  return starterTemplates.filter((template) => `${template.name} ${template.description}`.toLocaleLowerCase().includes(normalized));
}
export function templateContent(template: StarterTemplate): string {
  return [template.heading, ...template.lines].join('\n\n');
}
