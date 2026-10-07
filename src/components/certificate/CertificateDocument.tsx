import React from 'react';
import { Certificate } from '../../types/index.ts';
import { ShieldCheck, Printer, CheckCircle2 } from 'lucide-react';

interface CertificateDocumentProps {
  certificate: Certificate;
  onClose?: () => void;
}

export const CertificateDocument: React.FC<CertificateDocumentProps> = ({ certificate, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Barra de Ações (Oculta na Impressão) */}
      <div className="flex items-center justify-between no-print bg-white p-4 rounded-lg border border-slate-200">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Certificado Digital Autêntico com Registro Oficial Municipal</span>
        </div>
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
            >
              Fechar
            </button>
          )}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-md shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / Salvar PDF</span>
          </button>
        </div>
      </div>

      {/* DOCUMENTO DO CERTIFICADO INSTITUCIONAL */}
      <div className="bg-white border-8 border-double border-slate-300 p-8 sm:p-12 rounded-xl text-center shadow-lg relative print:shadow-none print:border-4">
        {/* Brasão Municipal */}
        <div className="flex justify-center mb-4">
          {certificate.coat_of_arms_url ? (
            <img
              src={certificate.coat_of_arms_url}
              alt="Brasão Municipal"
              className="w-20 h-20 object-contain"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-lg">
              MUN
            </div>
          )}
        </div>

        {/* Cabeçalho */}
        <div className="space-y-1">
          <h2 className="text-sm font-semibold tracking-wider uppercase text-slate-700">
            {certificate.organization_name}
          </h2>
          <div className="text-xs text-slate-500 font-medium tracking-wide">
            ESCOLA DE GOVERNO E CAPACITAÇÃO DE SERVIDORES PÚBLICOS
          </div>
        </div>

        {/* Título Principal */}
        <div className="my-8">
          <h1 className="text-3xl font-serif tracking-widest text-slate-900 uppercase">
            Certificado de Conclusão
          </h1>
          <div className="w-24 h-0.5 bg-amber-600 mx-auto mt-2" />
        </div>

        {/* Texto Institucional de Concessão */}
        <div className="max-w-2xl mx-auto text-sm text-slate-700 leading-relaxed space-y-4">
          <p>
            Certificamos que o(a) servidor(a) público(a){' '}
            <strong className="text-slate-900 font-semibold text-base">{certificate.user_name}</strong>,
            portador(a) do CPF nº <strong className="font-mono">{certificate.user_cpf}</strong>
            {certificate.user_registration && (
              <> (Matrícula Funcional nº <strong className="font-mono">{certificate.user_registration}</strong>)</>
            )}, concluiu com aproveitamento satisfatório a capacitação profissional:
          </p>

          <p className="text-lg font-serif font-bold text-slate-900 py-2 border-y border-slate-200">
            "{certificate.course_title}"
          </p>

          <p className="text-xs text-slate-600">
            Promovido na modalidade oficial com carga horária de{' '}
            <strong>{certificate.workload_hours} horas</strong>, alcançando aproveitamento de{' '}
            <strong>{certificate.grade_percent}%</strong> e 100% de frequência requerida.
          </p>
        </div>

        {/* Data e Assinaturas */}
        <div className="mt-12 pt-8 grid grid-cols-2 gap-8 text-center border-t border-slate-200 max-w-lg mx-auto">
          <div>
            <div className="border-b border-slate-400 w-36 mx-auto mb-1" />
            <div className="text-[11px] font-semibold text-slate-800">Coordenação Pedagógica</div>
            <div className="text-[10px] text-slate-500">Escola de Gestão Municipal</div>
          </div>
          <div>
            <div className="border-b border-slate-400 w-36 mx-auto mb-1" />
            <div className="text-[11px] font-semibold text-slate-800">Secretaria Municipal</div>
            <div className="text-[10px] text-slate-500">Administração e Recursos Humanos</div>
          </div>
        </div>

        {/* Rodapé com QR Code e Hash de Validação Pública */}
        <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-left text-[11px] text-slate-500 gap-4">
          <div>
            <div>Código Único de Autenticidade:</div>
            <div className="font-mono font-bold text-xs text-slate-800">
              {certificate.code}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Emitido em {new Date(certificate.issued_at).toLocaleDateString('pt-BR')} · Rota de consulta pública: /validar-certificado/{certificate.code}
            </div>
          </div>

          {certificate.qr_code_data_url && (
            <div className="text-center shrink-0">
              <img
                src={certificate.qr_code_data_url}
                alt="QR Code de Verificação"
                className="w-16 h-16 mx-auto border border-slate-200 p-0.5 rounded"
              />
              <div className="text-[9px] text-slate-400 mt-1">Verificação Digital</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
