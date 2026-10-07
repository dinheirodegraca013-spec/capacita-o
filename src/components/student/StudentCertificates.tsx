import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { Certificate } from '../../types/index.ts';
import { CertificateDocument } from '../certificate/CertificateDocument.tsx';
import { Award, Download, CheckCircle2, Calendar, Clock } from 'lucide-react';

export const StudentCertificates: React.FC = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    try {
      setLoading(true);
      const data = await api.getCertificates();
      setCertificates(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (selectedCert) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <CertificateDocument
          certificate={selectedCert}
          onClose={() => setSelectedCert(null)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Meus Certificados Oficiais
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Documentos de capacitação homologados pela Prefeitura Municipal com código verificador e validade jurídica.
        </p>
      </div>

      {loading ? (
        <div className="text-xs text-slate-500 py-12 text-center">Carregando certificados...</div>
      ) : certificates.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-2">
          <Award className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="text-sm font-medium text-slate-800">Nenhum certificado emitido ainda</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Ao concluir 100% das aulas e atingir a nota mínima na avaliação final, seu certificado será gerado automaticamente.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="bg-white border border-slate-200 rounded-xl p-6 hover:border-slate-300 transition-colors flex flex-col justify-between space-y-4 shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span className="font-mono text-slate-700 font-semibold">{cert.code}</span>
                  <span>{new Date(cert.issued_at).toLocaleDateString('pt-BR')}</span>
                </div>

                <h3 className="text-base font-semibold text-slate-900 leading-snug">
                  {cert.course_title}
                </h3>

                <div className="flex items-center gap-3 text-xs text-slate-500 mt-3">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {cert.workload_hours}h
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="text-emerald-700 font-medium">
                    Aproveitamento: {cert.grade_percent}%
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Escola de Governo</span>
                <button
                  onClick={() => setSelectedCert(cert)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Visualizar Documento</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
