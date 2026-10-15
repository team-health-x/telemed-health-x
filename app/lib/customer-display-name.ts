export function customerFirstName(name: string): string {
  const normalized = name.trim().replace(/\s+/g, ' ');
  const withoutTitle = normalized.replace(/^(?:นางสาว|นาง|นาย|เด็กชาย|เด็กหญิง|น\.ส\.|ด\.ช\.|ด\.ญ\.|Mr\.?|Mrs\.?|Ms\.?|Miss|Dr\.?)\s+/i, '');
  return withoutTitle.split(' ')[0] || 'สมาชิก';
}
