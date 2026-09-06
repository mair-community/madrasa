import Select from 'react-select';

/**
 * A react-select control wearing the MADRASA design system.
 *
 * `unstyled` strips react-select's own emotion styles so the appearance comes
 * entirely from `web/css/styles.css` (the `.rs__*` block). That keeps one source
 * of truth for colour, radius and spacing tokens, and means the control follows
 * the light/dark theme without any JS.
 */
export default function SelectIsland({
  options,
  value,
  onChange,
  ariaLabel,
  isSearchable = false,
  placeholder = 'Select…',
}) {
  const selected = options.find((option) => option.value === value) ?? null;

  return (
    <Select
      unstyled
      className="rs"
      classNamePrefix="rs"
      options={options}
      value={selected}
      onChange={(option) => onChange(option ? option.value : null)}
      aria-label={ariaLabel}
      isSearchable={isSearchable}
      isClearable={false}
      placeholder={placeholder}
      menuPlacement="auto"
      noOptionsMessage={() => 'No matches'}
    />
  );
}
