import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { UserCheck, Building, Mail, CreditCard, Shield, FileText } from 'lucide-react';

export const StudentProfile: React.FC = () => {
  const { user, organization } = useAuth();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Dados do Servidor Público
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Informações cadastrais e funcionais vinculadas à matrícula municipal.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
          <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-lg">
            {user?.name?.substring(0, 2).toUpperCase() || 'SV'}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{user?.name}</h2>
            <p className="text-xs text-slate-500">{user?.job_title}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500 flex items-center gap-1.5 mb-1">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              E-mail Institucional
            </span>
            <span className="font-semibold text-slate-900">{user?.email}</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500 flex items-center gap-1.5 mb-1">
              <CreditCard className="w-3.5 h-3.5 text-slate-400" />
              CPF (Cadastrado)
            </span>
            <span className="font-semibold text-slate-900 font-mono">{user?.cpf}</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500 flex items-center gap-1.5 mb-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Matrícula Funcional
            </span>
            <span className="font-semibold text-slate-900 font-mono">
              {user?.registration_number || '54201-9'}
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500 flex items-center gap-1.5 mb-1">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              Órgão / Prefeitura
            </span>
            <span className="font-semibold text-slate-900">
              {organization?.name || 'Prefeitura Municipal'}
            </span>
          </div>
        </div>

        <div className="p-4 bg-blue-50/60 border border-blue-200/80 rounded-lg text-xs text-blue-900 space-y-1">
          <div className="font-semibold flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-blue-700" />
            Conformidade com a LGPD (Lei 13.709/2018)
          </div>
          <p className="text-[11px] text-blue-800/80 leading-relaxed">
            Seus dados cadastrais são tratados exclusivamente para fins de registro funcional, capacitação de servidores e expedição de certificados oficiais do Município.
          </p>
        </div>
      </div>
    </div>
  );
};
