const DEV_BACKEND_ORIGIN = 'https://healthx-api.kindrock-9a3ea2bc.southeastasia.azurecontainerapps.io';

export function telemedApiOrigin(kind: 'catalog' | 'workflow' = 'workflow') {
  const configured = kind === 'catalog' ? process.env.TELEMED_API_ORIGIN : process.env.TELEMED_WORKFLOW_ORIGIN;
  return configured?.trim() || DEV_BACKEND_ORIGIN;
}
