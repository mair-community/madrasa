/**
 * Entry point for the React island bundle.
 *
 * The rest of MADRASA is framework-free. React lives behind this one module so
 * it is downloaded only when a page actually mounts a select control, and so a
 * clone without `npm install` still renders a fully working site.
 */
import { createRoot } from 'react-dom/client';
import SelectIsland from './SelectIsland.jsx';

/**
 * @param {HTMLElement} host    container the island renders into
 * @param {object} initialProps props for SelectIsland
 * @returns {{update: (patch: object) => void, destroy: () => void}}
 */
export function mountSelect(host, initialProps) {
  const root = createRoot(host);
  let props = initialProps;

  const render = () => root.render(<SelectIsland {...props} />);
  render();

  return {
    update(patch) {
      props = { ...props, ...patch };
      render();
    },
    destroy() {
      // Deferred: React 19 warns when a root is unmounted mid-render.
      queueMicrotask(() => root.unmount());
    },
  };
}
