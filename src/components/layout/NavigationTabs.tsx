import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  BookOpen,
  Award,
  User,
  Users,
  Building,
  GraduationCap,
  Calendar,
  FileCheck2,
  FileText,
  Shield,
  QrCode,
  LayoutDashboard,
  Building2,
} from 'lucide-react';

interface NavigationTabsProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({ currentPath, onNavigate }) => {
  const { user } = useAuth();
  if (!user) return null;

  // Itens de menu específicos para cada perfil conforme especificação
  const getMenuItems = () => {
    switch (user.role) {
      case 'aluno':
        return [
          { label: 'Início', path: '/aluno', icon: LayoutDashboard },
          { label: 'Meus Cursos', path: '/aluno/cursos', icon: BookOpen },
          { label: 'Certificados', path: '/aluno/certificados', icon: Award },
          { label: 'Perfil', path: '/aluno/perfil', icon: User },
        ];
      case 'professor':
        return [
          { label: 'Início', path: '/professor', icon: LayoutDashboard },
          { label: 'Meus Cursos', path: '/professor/cursos', icon: BookOpen },
          { label: 'Minhas Turmas', path: '/professor/turmas', icon: Users },
          { label: 'Presenças & QR Code', path: '/professor/presencas', icon: QrCode },
          { label: 'Avaliações', path: '/professor/avaliacoes', icon: FileCheck2 },
        ];
      case 'gestor':
        return [
          { label: 'Início', path: '/gestor', icon: LayoutDashboard },
          { label: 'Servidores & Importação', path: '/gestor/servidores', icon: Users },
          { label: 'Secretarias', path: '/gestor/secretarias', icon: Building2 },
          { label: 'Cursos & Matrículas', path: '/gestor/cursos', icon: BookOpen },
          { label: 'Turmas', path: '/gestor/turmas', icon: Calendar },
          { label: 'Relatórios', path: '/gestor/relatorios', icon: FileText },
          { label: 'Certificados', path: '/gestor/certificados', icon: Award },
        ];
      case 'superadmin':
        return [
          { label: 'Dashboard Global', path: '/admin', icon: LayoutDashboard },
          { label: 'Prefeituras', path: '/admin/prefeituras', icon: Building },
          { label: 'Usuários Globais', path: '/admin/usuarios', icon: Users },
          { label: 'Cursos', path: '/admin/cursos', icon: GraduationCap },
          { label: 'Auditoria LGPD', path: '/admin/auditoria', icon: Shield },
        ];
      default:
        return [];
    }
  };

  const items = getMenuItems();

  return (
    <div className="bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path || (item.path !== '/aluno' && item.path !== '/professor' && item.path !== '/gestor' && item.path !== '/admin' && currentPath.startsWith(item.path));

            return (
              <button
                key={item.path}
                onClick={() => onNavigate(item.path)}
                className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-700' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
