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

  // 1. Rota Pública: Validação de Certificado
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

  // Helper para roteamento dinâmico
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
    if (currentPath === '/aluno' || (user.role === 'aluno' && currentPath === '/')) {
      return <StudentHome onNavigate={navigate} />;
    }

    // Rotas do Professor
    if (currentPath.startsWith('/professor') || (user.role === 'professor' && currentPath === '/')) {
      return <InstructorDashboard />;
    }

    // Rotas do Gestor Municipal
    if (currentPath.startsWith('/gestor') || (user.role === 'gestor' && currentPath === '/')) {
      return <ManagerDashboard />;
    }

    // Rotas do Administrador Geral
    if (currentPath.startsWith('/admin') || (user.role === 'superadmin' && currentPath === '/')) {
      return <AdminDashboard />;
    }

    // Fallback: Redireciona conforme papel do usuário
    if (user.role === 'aluno') return <StudentHome onNavigate={navigate} />;
    if (user.role === 'professor') return <InstructorDashboard />;
    if (user.role === 'gestor') return <ManagerDashboard />;
    return <AdminDashboard />;
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
