import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function ValidateCertificatePage({ params }: { params: Promise<{ code: string }> }) { const { code } = await params; const supabase = await createSupabaseServerClient(); const { data } = await supabase.rpc('verify_certificate', { p_code: code }); return <main><h1>Validação de certificado</h1>{data ? <article className="course-card"><p><strong>{(data as { status?: string }).status === 'valid' ? 'Certificado válido' : 'Certificado revogado'}</strong></p><p>Titular: {(data as { holderName?: string }).holderName}</p><p>Curso: {(data as { courseTitle?: string }).courseTitle}</p><p>Instituição: {(data as { organizationName?: string }).organizationName}</p><p>Código: {code}</p></article> : <p className="empty-state">Certificado não encontrado.</p>}</main>; }
