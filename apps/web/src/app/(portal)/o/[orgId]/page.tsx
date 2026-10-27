import { redirect } from 'next/navigation';

export default async function OrganizationHomePage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  redirect(`/o/${orgId}/aluno`);
}
