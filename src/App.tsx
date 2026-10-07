import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { useRouter } from './hooks/useRouter.ts';
import { Header } from './components/layout/Header.tsx';
import { NavigationTabs } from './components/layout/NavigationTabs.tsx';
import { LoginPage } from './components/auth/LoginPage.tsx';
import { StudentHome } from './components/student/StudentHome.tsx';
import { StudentCoursesList } from './components/student/StudentCoursesList.tsx';
import { StudentCourseViewer } from './components/course/StudentCourseViewer.tsx';
import { ControlledExamRoom } from './components/exam/ControlledExamRoom.tsx';
import { StudentCertificates } from './components/student/StudentCertificates.tsx';
import { StudentProfile } from './components/student/StudentProfile.tsx';
import { InstructorDashboard } from './components/instructor/InstructorDashboard.tsx';
import { ManagerDashboard } from './components/manager/ManagerDashboard.tsx';
import { AdminDashboard } from './components/admin/AdminDashboard.tsx';
import { PublicCertificateValidator } from './components/certificate/PublicCertificateValidator.tsx';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

function UnauthorizedGuard({
  requiredRole,
  userRole,
  onNavigate,
}: {
  requiredRole: string;
  userRole?: string;
  onNavigate: (path: string) => void;
}) {
  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
      <div className="w-12 h-12 bg-rose-50 text-rose-700 rounded-full flex items-center justify-center mx-auto">
        <ShieldAlert className="w-6 h-6" />
      </div>
      <h2 className="text-lg font-semibold text-slate-900">
        Acesso Restrito ao Módulo
      </h2>
      <p className="text-xs text-slate-500 leading-relaxed">
        Esta área requer permissões de <strong>{requiredRole}</strong>. Seu perfil atual é{' '}
        <span className="capitalize font-semibold text-slate-700">{userRole || 'visitante'}</span>.
      </p>
      <div className="pt-2">
        <button
          onClick={() => {
            if (userRole === 'aluno') onNavigate('/aluno');
            else if (userRole === 'professor') onNavigate('/professor');
            else if (userRole === 'gestor') onNavigate('/gestor');
            else onNavigate('/admin');
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Retornar ao Meu Painel</span>
        </button>
      </div>
    </div>
  );
}

function MainRouter() {
  const { currentPath, navigate } = useRouter();
  const { user, organization, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-500">
        Iniciando ambiente institucional...
      </div>
    );
  }

  // 1. Rota Pública: Validação de Certificado Oficial
  if (currentPath.startsWith('/validar-certificado')) {
    const parts = currentPath.split('/');
    const codeParam = parts[2] || '';
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <Header onNavigate={navigate} />
        <main className="flex-1">
          <PublicCertificateValidator initialCode={codeParam} onNavigate={navigate} />
        </main>
        <Footer />
      </div>
    );
  }

  // 2. Tela de Login se não houver usuário ou rota /login
  if (!user || currentPath === '/login') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <Header onNavigate={navigate} />
        <main className="flex-1">
          <LoginPage onNavigate={navigate} />
        </main>
        <Footer />
      </div>
    );
  }

  // Helper para roteamento dinâmico com Proteção RBAC
  const renderContent = () => {
    // Avaliação em ambiente controlado (Tela limpa e focada)
    if (currentPath.startsWith('/aluno/avaliacao/')) {
      const assessmentId = currentPath.split('/')[3] || 'asmt-lic-final';
      return <ControlledExamRoom assessmentId={assessmentId} onNavigate={navigate} />;
    }

    // Visualizador de curso (Player de Aula)
    if (currentPath.startsWith('/aluno/curso/')) {
      const courseId = currentPath.split('/')[3] || 'crs-licitacoes-ead';
      return <StudentCourseViewer courseId={courseId} onNavigate={navigate} />;
    }

    // Rotas do Administrador Geral (Proteção RBAC)
    if (currentPath.startsWith('/admin')) {
      if (user.role !== 'superadmin') {
        return <UnauthorizedGuard requiredRole="Administrador Geral" userRole={user.role} onNavigate={navigate} />;
      }
      return <AdminDashboard currentPath={currentPath} onNavigate={navigate} />;
    }

    // Rotas do Gestor Municipal (Proteção RBAC)
    if (currentPath.startsWith('/gestor')) {
      if (user.role !== 'gestor' && user.role !== 'superadmin') {
        return <UnauthorizedGuard requiredRole="Gestor Municipal" userRole={user.role} onNavigate={navigate} />;
      }
      return <ManagerDashboard currentPath={currentPath} onNavigate={navigate} />;
    }

    // Rotas do Professor / Instrutor (Proteção RBAC)
    if (currentPath.startsWith('/professor')) {
      if (user.role !== 'professor' && user.role !== 'superadmin') {
        return <UnauthorizedGuard requiredRole="Professor / Instrutor" userRole={user.role} onNavigate={navigate} />;
      }
      return <InstructorDashboard currentPath={currentPath} onNavigate={navigate} />;
    }

    // Rotas do Aluno
    if (currentPath === '/aluno/cursos') {
      return <StudentCoursesList onNavigate={navigate} />;
    }
    if (currentPath === '/aluno/certificados') {
      return <StudentCertificates />;
    }
    if (currentPath === '/aluno/perfil') {
      return <StudentProfile />;
    }
    if (currentPath === '/aluno') {
      return <StudentHome onNavigate={navigate} />;
    }

    // Fallback inteligente para raiz '/' baseado no papel ativo
    if (currentPath === '/') {
      if (user.role === 'aluno') return <StudentHome onNavigate={navigate} />;
      if (user.role === 'professor') return <InstructorDashboard currentPath="/professor" onNavigate={navigate} />;
      if (user.role === 'gestor') return <ManagerDashboard currentPath="/gestor" onNavigate={navigate} />;
      return <AdminDashboard currentPath="/admin" onNavigate={navigate} />;
    }

    // Fallback padrão
    if (user.role === 'aluno') return <StudentHome onNavigate={navigate} />;
    if (user.role === 'professor') return <InstructorDashboard currentPath="/professor" onNavigate={navigate} />;
    if (user.role === 'gestor') return <ManagerDashboard currentPath="/gestor" onNavigate={navigate} />;
    return <AdminDashboard currentPath="/admin" onNavigate={navigate} />;
  };

  const isExamView = currentPath.startsWith('/aluno/avaliacao/');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {!isExamView && <Header onNavigate={navigate} />}
      {!isExamView && <NavigationTabs currentPath={currentPath} onNavigate={navigate} />}

      <main className="flex-1">
        {renderContent()}
      </main>

      {!isExamView && <Footer />}
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-6 mt-12 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800">CapacitaGov</span>
          <span aria-hidden="true">·</span>
          <span>Plataforma Municipal de Capacitação e Formação Continuada</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-400">
          <span>Ambiente Seguro LGPD</span>
          <span aria-hidden="true">·</span>
          <span>Isolamento Multi-Tenant</span>
          <span aria-hidden="true">·</span>
          <span>Validação Oficial de Certificados</span>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainRouter />
    </AuthProvider>
  );
}
