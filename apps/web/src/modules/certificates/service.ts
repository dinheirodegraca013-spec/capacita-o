export type CertificateClient = { rpc(name: 'verify_certificate', args: { p_code: string }): Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }> };
export async function verifyCertificate(code: string, client: CertificateClient) {
  if (typeof code !== 'string' || !code.trim() || code.trim().length > 128) return null;
  const { data, error } = await client.rpc('verify_certificate', { p_code: code.trim() });
  if (error) throw new Error(error.message);
  return data;
}
