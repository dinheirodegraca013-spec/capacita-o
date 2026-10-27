import type { Actor } from '@/modules/identity/model';
import { assertImportManager } from '@/modules/imports/service';

export function normalizePersonInput(actor: Actor, input: { name: string; email: string; cpf?: string }) {
  assertImportManager(actor);
  const name = input.name.trim(); const email = input.email.trim().toLowerCase();
  if (!name || !/^\S+@\S+\.\S+$/.test(email)) throw new Error('Invalid person');
  return { organization_id: actor.organizationId, display_name: name, email, cpf: input.cpf?.trim() || null };
}
