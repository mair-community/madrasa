/**
 * Live search typeahead.
 *
 * Attaches an ARIA combobox to a plain search input: results appear as you type,
 * arrow keys move through them, Enter opens the highlighted one. With nothing
 * highlighted, Enter falls through to `onSubmit` so the input still behaves like
 * an ordinary search field.
 */
import { el, debounce, clear } from './dom.js';
import { brandMark } from './components.js';

/** Shared across every search box on the site so they all feel the same. */
export const SEARCH_DEBOUNCE = 120;

/** Show suggestions from the first non-whitespace character. */
const MIN_QUERY = 1;

let sequence = 0;

/**
 * Splits `text` on `query` and wraps the matches in <mark>. Built from text
 * nodes, so catalog content is never parsed as markup.
 */
function highlight(text, query) {
  const haystack = text.toLowerCase();
  const needle = query.toLowerCase();
  const out = document.createDocumentFragment();
  let from = 0;

  for (;;) {
    const at = haystack.indexOf(needle, from);
    if (at === -1 || !needle) break;
    if (at > from) out.appendChild(document.createTextNode(text.slice(from, at)));
    out.appendChild(el('mark', { text: text.slice(at, at + needle.length) }));
    from = at + needle.length;
  }

  if (from < text.length) out.appendChild(document.createTextNode(text.slice(from)));
  return out;
}

/**
 * @param {HTMLInputElement} input
 * @param {object} config
 * @param {(query: string) => {items: Array, total: number}} config.suggest
 * @param {(query: string) => void} config.onSubmit  Enter with no active option
 * @param {(query: string, total: number) => {label: string, href: string}|null} [config.footer]
 * @param {HTMLElement} [config.host]  positioned ancestor the panel is appended to
 * @returns {{destroy: () => void}}
 */
export function liveSearch(input, { suggest, onSubmit, footer = null, host = null }) {
  const id = `livesearch-${(sequence += 1)}`;
  const panel = el('div.typeahead', { id, role: 'listbox', hidden: true, 'aria-label': 'Search suggestions' });
  const status = el('span.sr-only', { role: 'status', 'aria-live': 'polite' });

  (host || input.parentElement).append(panel, status);

  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-expanded', 'false');
  input.setAttribute('aria-controls', id);
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('autocomplete', 'off');

  let rows = [];        // the activatable <a> elements, in visual order
  let active = -1;      // index into `rows`
  let open = false;

  function setOpen(next) {
    if (open === next) return;
    open = next;
    panel.hidden = !next;
    input.setAttribute('aria-expanded', String(next));
    if (!next) setActive(-1);
  }

  function setActive(index) {
    if (rows[active]) rows[active].removeAttribute('aria-selected');
    active = index;
    const row = rows[active];
    if (!row) {
      input.removeAttribute('aria-activedescendant');
      return;
    }
    row.setAttribute('aria-selected', 'true');
    input.setAttribute('aria-activedescendant', row.id);
    row.scrollIntoView({ block: 'nearest' });
  }

  function row(item, index, query) {
    const node = el('a.typeahead__row', {
      id: `${id}-opt-${index}`,
      role: 'option',
      href: item.href,
      tabindex: '-1',
    },
      item.institution ? brandMark(item.institution) : item.mono
        ? el('span', {
            // Short glyphs (a "#" for a domain) need more weight than an acronym.
            class: `typeahead__mono${item.mono.length <= 2 ? ' typeahead__mono--glyph' : ''}`,
            'aria-hidden': 'true',
            text: item.mono,
          })
        : null,
      el('span.typeahead__text', null,
        el('span.typeahead__name', null, highlight(item.label, query)),
        item.meta && el('span.typeahead__meta', { text: item.meta }),
      ),
    );
    // Keep focus in the input so the panel does not close before the click lands.
    node.addEventListener('mousedown', (event) => event.preventDefault());
    node.addEventListener('mouseenter', () => setActive(index));
    node.addEventListener('click', () => setOpen(false));
    return node;
  }

  function render(query) {
    clear(panel);
    rows = [];
    active = -1;
    input.removeAttribute('aria-activedescendant');

    if (query.length < MIN_QUERY) {
      setOpen(false);
      status.textContent = '';
      return;
    }

    const { items, total } = suggest(query);
    let lastGroup = null;

    for (const item of items) {
      if (item.group && item.group !== lastGroup) {
        lastGroup = item.group;
        panel.appendChild(el('p.typeahead__group', { id: `${id}-g-${rows.length}`, text: item.group }));
      }
      const node = row(item, rows.length, query);
      panel.appendChild(node);
      rows.push(node);
    }

    const tail = footer?.(query, total);
    if (tail) {
      const index = rows.length;
      const node = el('a.typeahead__all', {
        id: `${id}-opt-${index}`,
        role: 'option',
        href: tail.href,
        tabindex: '-1',
        text: tail.label,
      });
      node.addEventListener('mousedown', (event) => event.preventDefault());
      node.addEventListener('mouseenter', () => setActive(index));
      node.addEventListener('click', () => setOpen(false));
      panel.appendChild(node);
      rows.push(node);
    }

    if (!rows.length) {
      panel.appendChild(el('p.typeahead__empty', { text: `No matches for “${query}”.` }));
    }

    status.textContent = total
      ? `${total} ${total === 1 ? 'result' : 'results'} for ${query}`
      : `No results for ${query}`;
    setOpen(true);
  }

  const onInput = debounce(() => render(input.value.trim()), SEARCH_DEBOUNCE);
  input.addEventListener('input', onInput);

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (open) { event.stopPropagation(); setOpen(false); }
      return;
    }

    if (event.key === 'Enter') {
      if (open && rows[active]) {
        event.preventDefault();
        rows[active].click();
      }
      return;
    }

    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    if (!open) {
      if (event.key === 'ArrowDown') render(input.value.trim());
      return;
    }
    if (!rows.length) return;

    event.preventDefault();
    if (event.key === 'Home') setActive(0);
    else if (event.key === 'End') setActive(rows.length - 1);
    else if (event.key === 'ArrowDown') setActive(active + 1 >= rows.length ? 0 : active + 1);
    else setActive(active - 1 < 0 ? rows.length - 1 : active - 1);
  });

  input.addEventListener('focus', () => {
    if (input.value.trim().length >= MIN_QUERY && rows.length) setOpen(true);
  });

  const onDocumentPointer = (event) => {
    if (!panel.contains(event.target) && event.target !== input) setOpen(false);
  };
  document.addEventListener('pointerdown', onDocumentPointer);

  const onFocusOut = (event) => {
    if (!panel.contains(event.relatedTarget) && event.relatedTarget !== input) setOpen(false);
  };
  input.addEventListener('focusout', onFocusOut);

  return {
    destroy() {
      document.removeEventListener('pointerdown', onDocumentPointer);
      panel.remove();
      status.remove();
    },
    submitCurrent() {
      onSubmit(input.value.trim());
    },
  };
}
