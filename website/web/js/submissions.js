// Dedicated MADRASA form configured in MAIR's Web3Forms workspace.
// This is a browser form key, not a private API credential.
export const SUBMISSION_KEY = 'a1e4c4e7-7d0e-4713-8bd3-5e5a9caffbb4';
const list = (value = '') => value.split(',').map(s => s.trim()).filter(Boolean);

export function submissionPayload(values) {
  const program = values.kind === 'program';
  const entry = {
    name: values.name.trim(), host_institution: list(values.institution),
    unit: list(values.unit), city: values.city.trim(), region: values.region,
    domains: list(values.domains), url: [values.url.trim()],
    status: values.status, last_checked: values.checked, notes: values.notes.trim() || null,
    ...(program ? {
      level: values.level, degree_type: values.degree.trim(),
      mode: values.mode, duration_years: values.duration ? Number(values.duration) : null,
      language: list(values.language), tuition: values.tuition, admission: list(values.admission),
    } : { type: values.type }),
  };
  return {
    access_key: SUBMISSION_KEY, subject: `MADRASA submission: ${entry.name}`,
    from_name: 'MADRASA Website', replyto: values.email.trim(),
    Contact_name: values.contact.trim(), Contact_email: values.email.trim(),
    Entry_kind: program ? 'Education program' : 'Research structure',
    message: 'Please review this proposed catalog entry and assign its unique catalog ID before publication.',
    madrasa_json_entry: JSON.stringify(entry, null, 2),
  };
}

export async function sendSubmission(values, { fetcher = fetch, signal } = {}) {
  const response = await fetcher('https://api.web3forms.com/submit', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(submissionPayload(values)), signal,
  });
  const result = await response.json();
  if (!response.ok || result.success !== true) throw new Error('Your submission could not be sent. Please try again or use the GitHub submission option.');
}
