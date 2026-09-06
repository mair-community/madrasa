import { el } from '../dom.js';
import { to, query } from '../router.js';
import { LINKS, REGION_ORDER } from '../config.js';
import { sendSubmission } from '../submissions.js';

export default function submitPage() {
  const controls = {};
  function field(name, label, { options, required = true, type = 'text', ...props } = {}) {
    const control = options
      ? el('select.select', { name, id: `submit-${name}`, required }, options.map(v => el('option', { value: Array.isArray(v) ? v[0] : v, text: Array.isArray(v) ? v[1] : v })))
      : el(type === 'textarea' ? 'textarea.input' : 'input.input', { name, id: `submit-${name}`, required, ...(type === 'textarea' ? { rows: 4 } : { type }), maxlength: type === 'textarea' ? 2000 : 300, ...props });
    controls[name] = control;
    return el('div.submission-field', null, el('label', { for: control.id, text: `${label}${required ? ' *' : ' (optional)'}` }), control);
  }
  const kind = field('kind', 'Entry category', { options: [['structure', 'Lab, center or research team'], ['program', 'Education program']] });
  const structure = el('fieldset.submission-group', null, el('legend.h3', { text: 'Research structure' }),
    field('type', 'Structure type', { options: ['Laboratory', 'Center', 'Research team', 'Research unit', 'Doctoral structure', 'Other'] }));
  const program = el('fieldset.submission-group', null, el('legend.h3', { text: 'Education program' }),
    field('level', 'Level', { options: ['Bachelor', 'Engineer', 'Master', 'PhD', 'Postdoctoral', 'Certificate', 'Executive', 'Other'] }),
    field('degree', 'Degree type'),
    field('mode', 'Study mode', { options: [['unknown','Unknown'], ['in_person','In person'], ['online','Online'], ['hybrid','Hybrid'], ['executive','Executive'], ['research','Research'], ['alternance','Work-study']] }),
    field('duration', 'Duration in years', { type: 'number', min: .1, step: .1, max: 20, required: false }),
    field('language', 'Teaching languages (comma-separated)'),
    field('tuition', 'Tuition', { options: [['unknown','Unknown'], ['public','Public'], ['private','Private'], ['funded','Funded'], ['fellowship','Fellowship'], ['paid','Paid']] }),
    field('admission', 'Admission requirements (comma-separated)'));
  function syncKind() {
    const isProgram = controls.kind.value === 'program';
    program.hidden = !isProgram; program.disabled = !isProgram;
    structure.hidden = isProgram; structure.disabled = isProgram;
  }
  controls.kind.value = query().get('kind') === 'program' ? 'program' : 'structure';
  controls.kind.addEventListener('change', syncKind);
  const message = el('p', { role: 'status', 'aria-live': 'polite', tabindex: -1 });
  const button = el('button.btn.btn--primary', { type: 'submit', text: 'Send to MAIR for review' });
  const success = el('section.submission-success', { hidden: true, tabindex: -1 },
    el('h2.h2', { text: 'Submission received' }),
    el('p', { text: 'Your proposal has been sent to the MAIR team for review. It will not appear in the catalog until approved.' }),
    el('a.btn', { href: to('explore'), text: 'Return to the catalog' }));
  let controller;
  const form = el('form.submission-form', null,
    el('p.small.muted', { text: 'Fields marked * are required. Use the institution’s official information.' }), kind,
    field('name', 'Lab, team or program name'),
    field('institution', 'Host institutions (comma-separated)'),
    field('unit', 'Affiliated college, school or department', { required: false }),
    field('city', 'City'),
    field('region', 'Region', { options: [['', 'Choose a region'], ...REGION_ORDER] }),
    field('url', 'Official source URL', { type: 'url', pattern: 'https?://.+', placeholder: 'https://', maxlength: 1500 }),
    field('domains', 'Research areas (comma-separated)'), structure, program,
    field('status', 'Operational status', { options: [['unknown','Unknown'],['active','Active'],['likely_active','Likely active'],['inactive','Inactive']] }),
    field('checked', 'Date you last verified the official source', { type: 'date', max: new Date().toLocaleDateString('en-CA') }),
    field('notes', 'Additional details', { type: 'textarea', required: false }),
    el('fieldset.submission-group', null, el('legend.h3', { text: 'Your contact details' }),
      field('contact', 'Your name', { autocomplete: 'name' }),
      field('email', 'Your email', { type: 'email', autocomplete: 'email' })),
    el('p.small.muted', { text: 'This form sends your details to MAIR through Web3Forms. Your contact details are for submission follow-up and are excluded from the proposed public catalog entry.' }),
    message, button);
  syncKind();
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (button.disabled || !form.reportValidity()) return;
    const values = Object.fromEntries(new FormData(form));
    // Whitespace alone should not satisfy a required field.
    for (const input of Object.values(controls)) {
      input.setCustomValidity('');
      if (input.required && !input.matches(':disabled') && !input.value.trim()) input.setCustomValidity('Please enter a value.');
      if (['institution', 'domains', 'language', 'admission'].includes(input.name) && !input.matches(':disabled') && !input.value.split(',').some(value => value.trim())) input.setCustomValidity('Please enter at least one item.');
    }
    if (!form.reportValidity()) return;
    button.disabled = true; button.textContent = 'Sending…'; message.textContent = '';
    form.setAttribute('aria-busy', 'true');
    controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      await sendSubmission(values, { signal: controller.signal });
      form.hidden = true; success.hidden = false; success.focus();
    } catch (error) {
      message.textContent = error.name === 'AbortError'
        ? 'The request timed out. Delivery is unconfirmed. Your entries are still here; please check before resending.'
        : 'Unable to confirm submission. Check your connection and try again, or use the GitHub option below. Your entries have been kept.';
      message.focus();
    } finally {
      clearTimeout(timeout); button.disabled = false; button.textContent = 'Send to MAIR for review'; form.removeAttribute('aria-busy');
    }
  });
  form.addEventListener('input', event => event.target.setCustomValidity?.(''));
  return {
    node: el('div.shell.shell--narrow.section.submit-page', null,
      el('header.stack', null, el('p.eyebrow', { text: 'Contribute to Madrasa' }), el('h1.h1', { text: 'Suggest a catalog entry' }),
        el('p.lede', { text: 'Share an AI program, laboratory, center or research team in Morocco. MAIR reviews every submission before publication.' })),
      form, success,
      el('aside.stack', null, el('h2.h3', { text: 'Prefer GitHub?' }), el('p', { text: 'You can still submit an issue or contribute directly to the catalog.' }),
        el('a', { href: LINKS.issues, target: '_blank', rel: 'noopener', text: 'Open the GitHub issue tracker' }))),
    title: 'Submit an entry · MADRASA',
    description: 'Suggest a Moroccan AI program or research structure for review by the MAIR team.',
    onLeave: () => controller?.abort(),
  };
}
