import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { ShieldCheck, Search, XCircle, ArrowLeft, Building2, CheckCircle2 } from 'lucide-react';

interface PublicCertificateValidatorProps {
  initialCode?: string;
  onNavigate: (path: string) => void;
}

export const PublicCertificateValidator: React.FC<PublicCertificateValidatorProps> = ({
  initialCode = '',
  onNavigate,
}) => {
  const [code, setCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (initialCode) {
      handleVerify(initialCode);
    }
  }, [initialCode]);

  const handleVerify = async (targetCode: string) => {
    const clean = targetCode.trim();
    if (!clean) return;

    try {
      setLoading(true);
      setSearched(true);
      const data = await api.verifyPublicCertificate(clean);
      setResult(data);
    } catch (err: any) {
      setResult({ valid: false, message: err.message || 'Código de certificado não localizado.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerify(code);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      {/* Voltar */}
      <button
        onClick={() => onNavigate('/')}
        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Voltar ao portal</span>
      </button>

      {/* Caixa de Pesquisa */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs text-center space-y-4">
        <div className="w-12 h-12 bg-blue-50 text-blue-700 rounded-full flex items-center justify-center mx-auto">
          <ShieldCheck className="w-6 h-6" />
        </div>

        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
            Validação Pública de Certificados Oficiais
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Consulte a autenticidade de certificados emitidos pela Escola de Governo Municipal e órgãos conveniados.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="max-w-md mx-auto flex gap-2 pt-2">
          <input
            type="text"
            placeholder="Ex: PMVC-2026-LIC-882194"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="flex-1 text-xs font-mono border border-slate-300 rounded-md px-3 py-2 uppercase focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-400 text-white text-xs font-semibold rounded-md shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            <span>{loading ? 'Verificando...' : 'Consultar'}</span>
          </button>
        </form>

        <div className="text-[11px] text-slate-400">
          Dica para teste rápido: utilize o código oficial pré-emitido <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-700">PMVC-2026-LIC-882194</code>
        </div>
      </div>

      {/* Resultado da Validação */}
      {searched && (
        <div className="animate-in fade-in duration-300">
          {result?.valid && result?.certificate ? (
            <div className="bg-white border border-emerald-200 rounded-xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center gap-3 border-b border-emerald-100 pb-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-emerald-700" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                    Certificado Válido e Autêntico
                  </div>
                  <div className="text-xs text-slate-500">
                    Registrado na base de dados da {result.certificate.organization_name}
                  </div>
                </div>
              </div>

              {/* Dados do Certificado e Servidor (Com proteção LGPD) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-500 block">Servidor(a) Titular:</span>
                  <span className="font-semibold text-slate-900 text-sm mt-0.5 block">
                    {result.certificate.student_name}
                  </span>
                  <span className="text-slate-500 text-[11px] block mt-0.5">
                    CPF (Protegido por LGPD): {result.certificate.masked_cpf}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-500 block">Capacitação / Curso:</span>
                  <span className="font-semibold text-slate-900 text-sm mt-0.5 block">
                    {result.certificate.course_title}
                  </span>
                  <span className="text-slate-500 text-[11px] block mt-0.5">
                    Carga Horária: {result.certificate.workload_hours}h · Categoria: {result.certificate.course_category}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-500 block">Código Único Oficial:</span>
                  <span className="font-mono font-bold text-slate-800 text-sm mt-0.5 block">
                    {result.certificate.code}
                  </span>
                  <span className="text-slate-500 text-[11px] block mt-0.5">
                    Data de Emissão: {new Date(result.certificate.issued_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-500 block">Órgão Emissor:</span>
                  <span className="font-semibold text-slate-900 text-sm mt-0.5 block">
                    {result.certificate.organization_name}
                  </span>
                  <span className="text-emerald-700 text-[11px] block mt-0.5 font-medium">
                    Homologado com {result.certificate.grade_percent}% de aproveitamento
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-rose-200 rounded-xl p-8 text-center space-y-3">
              <div className="w-12 h-12 bg-rose-50 text-rose-700 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">
                Certificado Não Localizado
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {result?.message || 'O código informado não corresponde a nenhum registro oficial emitido pelas prefeituras cadastradas.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
