export type CertificateSnapshot = { holderName: string; courseTitle: string; organizationName: string; workloadHours: number; issuedAt: string; publicCode: string };

function escapePdfText(value: string) { return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)'); }

export function renderCertificate(snapshot: CertificateSnapshot): Uint8Array {
  const lines = ['CERTIFICADO DE CONCLUSAO', `Titular: ${snapshot.holderName}`, `Curso: ${snapshot.courseTitle}`, `Instituicao: ${snapshot.organizationName}`, `Carga horaria: ${snapshot.workloadHours} horas`, `Codigo: ${snapshot.publicCode}`, `Emitido em: ${new Date(snapshot.issuedAt).toLocaleDateString('pt-BR')}`];
  const text = ['BT', '/F1 18 Tf', '72 700 Td', `(${escapePdfText(lines[0])}) Tj`, '/F1 12 Tf', ...lines.slice(1).map((line) => `0 -38 Td (${escapePdfText(line)}) Tj`), 'ET'].join('\n');
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>', `<< /Length ${text.length} >>\nstream\n${text}\nendstream`];
  let pdf = '%PDF-1.4\n'; const offsets = [0]; objects.forEach((object, index) => { offsets[index + 1] = pdf.length; pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; }); const xref = pdf.length; pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n `).join('\n')}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}
