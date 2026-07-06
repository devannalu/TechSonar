export function getPagarmeAuthHeader(secretKey: string): string {
  const credentials = `${secretKey}:`;
  const base64Credentials = Buffer.from(credentials).toString('base64');
  return `Basic ${base64Credentials}`;
}
