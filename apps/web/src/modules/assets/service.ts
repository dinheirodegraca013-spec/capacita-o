import { randomUUID } from 'node:crypto';
import type { Actor } from '@/modules/identity/model';

const MAX_BYTES = 100 * 1024 * 1024;
const MIME_KIND: Record<string, 'video' | 'pdf' | 'audio'> = { 'video/mp4': 'video', 'video/webm': 'video', 'application/pdf': 'pdf', 'audio/mpeg': 'audio', 'audio/mp4': 'audio', 'audio/wav': 'audio' };
export type AssetValidation = { ok: true; kind: 'video' | 'pdf' | 'audio' } | { ok: false; code: 'MIME_NOT_ALLOWED' | 'SIZE_LIMIT' | 'INVALID_SIZE' };
export function validateAssetUpload(input: { mimeType: string; sizeBytes: number }): AssetValidation {
  const kind = MIME_KIND[input.mimeType];
  if (!kind) return { ok: false, code: 'MIME_NOT_ALLOWED' };
  if (!Number.isInteger(input.sizeBytes) || input.sizeBytes <= 0) return { ok: false, code: 'INVALID_SIZE' };
  if (input.sizeBytes > MAX_BYTES) return { ok: false, code: 'SIZE_LIMIT' };
  return { ok: true, kind };
}

export type AssetClient = { from(table: 'assets'): { insert(values: Record<string, unknown>): { select(): { single(): Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }> } }; select(columns: string): { eq(column: string, value: string): { maybeSingle(): Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }> } } } };
export type StorageClient = { from(bucket: string): { createSignedUrl(path: string, expiresIn: number): Promise<{ data: { signedUrl: string } | null; error: { message: string } | null }> } };

export async function createAssetUpload(actor: Actor, input: { fileName: string; mimeType: string; sizeBytes: number }, client: AssetClient) {
  if (!actor.roles.includes('manager')) throw new Error('Only managers can upload assets');
  const validation = validateAssetUpload(input); if (!validation.ok) throw new Error(validation.code);
  const assetId = randomUUID(); const objectPath = `${actor.organizationId}/${assetId}/${input.fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const { data, error } = await client.from('assets').insert({ id: assetId, organization_id: actor.organizationId, object_path: objectPath, file_name: input.fileName, mime_type: input.mimeType, size_bytes: input.sizeBytes, kind: validation.kind, status: 'pending', created_by: actor.userId }).select().single();
  if (error || !data) throw new Error(error?.message ?? 'Asset was not created');
  return { assetId, objectPath, bucket: 'course-assets', kind: validation.kind };
}

export async function authorizeAsset(actor: Actor, assetId: string, client: AssetClient, storage: StorageClient) {
  const { data, error } = await client.from('assets').select('id, organization_id, object_path, status').eq('id', assetId).maybeSingle();
  if (error || !data || data.organization_id !== actor.organizationId || data.status !== 'ready') throw new Error('Asset unavailable');
  const signed = await storage.from('course-assets').createSignedUrl(String(data.object_path), 300);
  if (signed.error || !signed.data) throw new Error(signed.error?.message ?? 'Asset URL unavailable');
  return { assetId, signedUrl: signed.data.signedUrl, expiresIn: 300 };
}
