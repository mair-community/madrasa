/**
 * Bridge between the framework-free site and the React island bundle.
 *
 * Every select is rendered as a real `<select>` first, then upgraded in place.
 * If `web/dist/islands.js` has not been built, the upgrade is skipped and the
 * native control remains fully functional, so the site never depends on a
 * build step having been run.
 */
let bundle = null;

/**
 * The bundle URL comes from a meta tag written at serve/build time, so a tree
 * without `npm run build` never issues a request that would 404.
 * Resolved against `<base>`, which keeps subpath deploys working.
 */
function bundleUrl() {
  const source = document.querySelector('meta[name="madrasa-islands"]')?.content?.trim();
  return source ? new URL(source, document.baseURI).href : null;
}

function loadBundle() {
  if (!bundle) {
    const url = bundleUrl();
    if (!url) return null;
    bundle = import(url).catch((error) => {
      bundle = null;
      throw error;
    });
  }
  return bundle;
}

/**
 * Upgrades a native `<select>` to a react-select control.
 *
 * @param {HTMLSelectElement} native
 * @param {{ariaLabel: string, onChange: (value: string) => void, isSearchable?: boolean}} config
 * @returns {Promise<{setValue: Function, destroy: Function} | null>} null when the bundle is absent
 */
export async function enhanceSelect(native, { ariaLabel, onChange, isSearchable = false }) {
  const pending = loadBundle();
  if (!pending) return null;

  let mod;
  try {
    mod = await pending;
  } catch {
    return null;
  }

  // The select may have been torn down while the bundle was in flight.
  if (!native.isConnected) return null;

  const host = document.createElement('div');
  host.className = 'select-island';
  native.after(host);
  native.hidden = true;

  // SelectIsland is fully controlled, so every change, whether from the user or
  // from page state, has to be pushed back into it. `current` is the single source
  // of truth here; `native.value` mirrors it so the fallback stays coherent.
  let current = native.value;
  let island;

  const apply = (value) => {
    current = value;
    native.value = value;
    island.update({ value });
  };

  island = mod.mountSelect(host, {
    ariaLabel,
    isSearchable,
    options: [...native.options].map((option) => ({ value: option.value, label: option.textContent })),
    value: current,
    onChange: (value) => {
      apply(value);
      onChange(value);
    },
  });

  return {
    setValue(value) {
      if (current === value) return;
      apply(value);
    },
    destroy() {
      island.destroy();
      host.remove();
      native.hidden = false;
    },
  };
}
