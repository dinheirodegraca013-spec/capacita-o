import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ShieldCheck, ArrowRight, UserCircle2 } from 'lucide-react';

interface LoginPageProps {
  onNavigate: (path: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login, switchRole } = useAuth();
  const [emailOrCpf, setEmailOrCpf] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrCpf.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    const success = await login(emailOrCpf.trim());
    setLoading(false);

    if (success) {
      onNavigate('/aluno');
    } else {
      setErrorMsg('Servidor ou credencial não localizada. Verifique o CPF ou e-mail digitado.');
    }
  };

  const handleQuickLogin = async (role: any, path: string) => {
    await switchRole(role);
    onNavigate(path);
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 py-12">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 shadow-xs space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-blue-50 text-blue-700 rounded-xl flex items-center justify-center mx-auto font-bold text-lg">
            CG
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Acesso à Escola de Governo
          </h1>
          <p className="text-xs text-slate-500">
            Plataforma Municipal de Capacitação Continuada dos Servidores Públicos.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              CPF ou E-mail Institucional:
            </label>
            <input
              type="text"
              placeholder="Ex: 123.456.789-01 ou seu.nome@pmvc.ba.gov.br"
              value={emailOrCpf}
              onChange={(e) => setEmailOrCpf(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Identificando Servidor...' : 'Entrar no Sistema'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Atalhos para Demonstração dos 4 Perfis */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <div className="text-[11px] font-semibold text-slate-400 text-center uppercase tracking-wide">
            Acesso Rápido para Avaliação dos 4 Perfis:
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickLogin('aluno', '/aluno')}
              className="p-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs text-left"
            >
              <div className="font-semibold text-slate-900">1. Servidor Aluno</div>
              <div className="text-[10px] text-slate-400">Ana Paula Souza</div>
            </button>
            <button
              onClick={() => handleQuickLogin('professor', '/professor')}
              className="p-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs text-left"
            >
              <div className="font-semibold text-slate-900">2. Professor</div>
              <div className="text-[10px] text-slate-400">Profa. Juliana Silveira</div>
            </button>
            <button
              onClick={() => handleQuickLogin('gestor', '/gestor')}
              className="p-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs text-left"
            >
              <div className="font-semibold text-slate-900">3. Gestor Municipal</div>
              <div className="text-[10px] text-slate-400">Helena Castro (RH)</div>
            </button>
            <button
              onClick={() => handleQuickLogin('superadmin', '/admin')}
              className="p-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs text-left"
            >
              <div className="font-semibold text-slate-900">4. Admin Geral</div>
              <div className="text-[10px] text-slate-400">Dr. Roberto Guimarães</div>
            </button>
          </div>
        </div>

        <div className="text-center pt-2">
          <button
            onClick={() => onNavigate('/validar-certificado')}
            className="text-xs text-slate-500 hover:text-slate-800 underline inline-flex items-center gap-1"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Consultar autenticidade de certificado sem login</span>
          </button>
        </div>
      </div>
    </div>
  );
};
