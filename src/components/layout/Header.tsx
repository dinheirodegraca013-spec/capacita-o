import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { UserRole } from '../../types/index.ts';
import { ShieldCheck, ChevronDown, Check, LogOut, Building2, UserCircle2 } from 'lucide-react';

interface HeaderProps {
  onNavigate: (path: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate }) => {
  const { user, organization, switchRole, logout } = useAuth();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const roles: { role: UserRole; label: string; desc: string; userName: string }[] = [
    { role: 'aluno', label: 'Servidora Aluna', desc: 'Interface simplificada: "Continue de onde parou"', userName: 'Ana Paula Souza' },
    { role: 'professor', label: 'Professor / Instrutor', desc: 'Chamada QR Code, conteúdos e turmas', userName: 'Profa. Dra. Juliana Silveira' },
    { role: 'gestor', label: 'Gestor Municipal', desc: 'Importação CSV, secretarias, relatórios da prefeitura', userName: 'Helena Castro' },
    { role: 'superadmin', label: 'Administrador Geral', desc: 'Multi-tenant global, auditoria e prefeituras', userName: 'Dr. Roberto Guimarães' },
  ];

  const handleSelectRole = async (targetRole: UserRole) => {
    await switchRole(targetRole);
    setRoleMenuOpen(false);

    // Redireciona para a respectiva tela inicial do perfil
    if (targetRole === 'aluno') onNavigate('/aluno');
    else if (targetRole === 'professor') onNavigate('/professor');
    else if (targetRole === 'gestor') onNavigate('/gestor');
    else if (targetRole === 'superadmin') onNavigate('/admin');
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Institucional e Nome da Prefeitura */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (!user) onNavigate('/login');
                else if (user.role === 'aluno') onNavigate('/aluno');
                else if (user.role === 'professor') onNavigate('/professor');
                else if (user.role === 'gestor') onNavigate('/gestor');
                else onNavigate('/admin');
              }}
              className="flex items-center gap-3 text-left focus-visible:outline-2 focus-visible:outline-blue-600 rounded"
            >
              {organization?.coat_of_arms_url ? (
                <img
                  src={organization.coat_of_arms_url}
                  alt={organization.name}
                  className="w-10 h-10 object-contain rounded-md shadow-xs"
                />
              ) : (
                <div className="w-10 h-10 rounded-md bg-slate-800 text-white flex items-center justify-center font-bold text-base">
                  CG
                </div>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 tracking-tight text-sm sm:text-base leading-tight">
                    CapacitaGov
                  </span>
                  <span className="text-xs text-slate-400 font-normal hidden sm:inline">
                    · Portal Municipal
                  </span>
                </div>
                <div className="text-xs text-slate-500 truncate max-w-[240px] sm:max-w-xs font-medium">
                  {organization?.name || 'Sistema de Capacitação Pública'}
                </div>
              </div>
            </button>
          </div>

          {/* Links Centrais / Validador Público */}
          <div className="hidden md:flex items-center gap-6 text-xs text-slate-600">
            <button
              onClick={() => onNavigate('/validar-certificado')}
              className="hover:text-slate-900 transition-colors flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Validar Certificado Oficial</span>
            </button>
          </div>

          {/* Seletor de Perfil & Dados do Usuário */}
          <div className="flex items-center gap-3">
            {/* Seletor Rápido de Perfil para Avaliação Técnica */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors"
                title="Alternar entre os 4 perfis do sistema"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="capitalize font-semibold text-slate-900">
                  {user ? user.role : 'Visitante'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {roleMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setRoleMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-slate-200 py-1.5 z-40">
                    <div className="px-3 py-2 border-b border-slate-100 text-xs text-slate-500 font-medium">
                      Simulação dos 4 Perfis do Sistema:
                    </div>
                    {roles.map((item) => (
                      <button
                        key={item.role}
                        onClick={() => handleSelectRole(item.role)}
                        className={`w-full text-left px-3 py-2 text-xs flex items-start gap-2.5 hover:bg-slate-50 transition-colors ${
                          user?.role === item.role ? 'bg-blue-50/50' : ''
                        }`}
                      >
                        <div className="mt-0.5">
                          {user?.role === item.role ? (
                            <Check className="w-4 h-4 text-blue-600" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-slate-300" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-slate-900 flex items-center justify-between">
                            {item.label}
                          </div>
                          <div className="text-slate-500 text-[11px] mt-0.5">{item.desc}</div>
                          <div className="text-[10px] text-blue-700 font-medium mt-1">
                            Usuário: {item.userName}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Nome do Usuário */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="text-right hidden lg:block">
                  <div className="text-xs font-semibold text-slate-800 leading-tight">
                    {user.name}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {user.job_title || user.email}
                  </div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    onNavigate('/login');
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md transition-colors"
                  title="Sair"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onNavigate('/login')}
                className="text-xs font-medium text-blue-600 hover:text-blue-800 px-2 py-1"
              >
                Entrar
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
