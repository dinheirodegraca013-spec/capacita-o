import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { verifyCertificate } from '@/modules/certificates/service';

export async function GET(_request: Request, { params }: { params: Promise<{ certificateId: string }> }) { const { certificateId } = await params; const supabase = await createSupabaseServerClient(); try { const certificate = await verifyCertificate(certificateId, supabase as never); return certificate ? NextResponse.json(certificate) : NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 }); } catch { return NextResponse.json({ error: 'VERIFICATION_UNAVAILABLE' }, { status: 503 }); } }
