const DEV_BACKEND_ORIGIN = 'https://healthx-api.kindrock-9a3ea2bc.southeastasia.azurecontainerapps.io';

export function telemedApiOrigin(kind: 'catalog' | 'workflow' = 'workflow') {
  const configured = kind === 'catalog' ? process.env.TELEMED_API_ORIGIN : process.env.TELEMED_WORKFLOW_ORIGIN;
  if (configured?.trim()) return configured.trim();
  // A production container must not silently connect to the shared Dev backend.
  if (process.env.TELEMED_DEPLOY_ENV === 'prod') return '';
  return DEV_BACKEND_ORIGIN;
}
