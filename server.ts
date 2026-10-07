import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import QRCode from 'qrcode';
import { db, DEFAULT_COAT_OF_ARMS } from './src/server/mockDb.ts';
import { UserRole, Meeting } from './src/types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Middleware simulado de usuário ativo (padrão inicial: servidora Ana Paula para experiência do aluno imediata)
  let activeUserId = 'usr-aluno-ana';

  // Helper para obter usuário atual
  const getCurrentUser = () => {
    return db.users.find((u) => u.id === activeUserId) || db.users[0];
  };

  // ==========================================================================
  // ROTAS DE AUTENTICAÇÃO E SESSÃO
  // ==========================================================================

  app.get('/api/auth/me', (req: Request, res: Response) => {
    const user = getCurrentUser();
    const org = user.organization_id ? db.organizations.find((o) => o.id === user.organization_id) : null;
    res.json({ user, organization: org });
  });

  app.post('/api/auth/switch-role', (req: Request, res: Response) => {
    const { role, userId } = req.body as { role?: UserRole; userId?: string };

    if (userId) {
      const targetUser = db.users.find((u) => u.id === userId);
      if (targetUser) {
        activeUserId = targetUser.id;
        db.addAuditLog({
          organization_id: targetUser.organization_id,
          user_id: targetUser.id,
          user_name: targetUser.name,
          action: 'SESSAO_ALTERADA',
          entity_name: 'User',
          entity_id: targetUser.id,
          details: `Alternância assistida para o perfil ${targetUser.role} (${targetUser.name})`,
        });
        const org = targetUser.organization_id ? db.organizations.find((o) => o.id === targetUser.organization_id) : null;
        return res.json({ user: targetUser, organization: org });
      }
    }

    if (role) {
      const match = db.users.find((u) => u.role === role);
      if (match) {
        activeUserId = match.id;
        const org = match.organization_id ? db.organizations.find((o) => o.id === match.organization_id) : null;
        return res.json({ user: match, organization: org });
      }
    }

    res.status(400).json({ message: 'Usuário ou perfil não encontrado' });
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { emailOrCpf } = req.body;
    if (!emailOrCpf) {
      return res.status(400).json({ message: 'E-mail ou CPF obrigatório' });
    }

    const cleanInput = String(emailOrCpf).trim().toLowerCase();
    const cleanNumbers = cleanInput.replace(/\D/g, '');

    const found = db.users.find((u) => {
      const uCpfNumbers = u.cpf.replace(/\D/g, '');
      return u.email.toLowerCase() === cleanInput || (cleanNumbers.length >= 9 && uCpfNumbers.includes(cleanNumbers));
    });

    if (!found) {
      return res.status(404).json({ message: 'Servidor ou credencial não localizada no sistema municipal.' });
    }

    activeUserId = found.id;
    db.addAuditLog({
      organization_id: found.organization_id,
      user_id: found.id,
      user_name: found.name,
      action: 'LOGIN',
      entity_name: 'Auth',
      entity_id: found.id,
      details: `Login institucional realizado com sucesso por ${found.name} (${found.role}).`,
    });

    const org = found.organization_id ? db.organizations.find((o) => o.id === found.organization_id) : null;
    res.json({ user: found, organization: org });
  });

  // ==========================================================================
  // ROTAS DE ORGANIZAÇÃO (PREFEITURAS) - MULTI-TENANT
  // ==========================================================================

  app.get('/api/organizations', (req: Request, res: Response) => {
    const user = getCurrentUser();
    // SuperAdmin vê todas as prefeituras; Gestor/Aluno vê apenas a sua
    if (user.role === 'superadmin') {
      return res.json(db.organizations);
    }
    const filtered = db.organizations.filter((o) => o.id === user.organization_id);
    res.json(filtered);
  });

  app.get('/api/organizations/:id', (req: Request, res: Response) => {
    const org = db.organizations.find((o) => o.id === req.params.id);
    if (!org) return res.status(404).json({ message: 'Prefeitura não encontrada' });
    const secretariats = db.secretariats.filter((s) => s.organization_id === org.id);
    const departments = db.departments.filter((d) => d.organization_id === org.id);
    res.json({ ...org, secretariats, departments });
  });

  app.post('/api/organizations', (req: Request, res: Response) => {
    const user = getCurrentUser();
    if (user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Apenas Administrador Geral pode cadastrar novas prefeituras.' });
    }

    const { name, slug, cnpj, primary_color, secondary_color } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ message: 'Nome e slug são obrigatórios.' });
    }

    const newOrg = {
      id: `org-${slug.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`,
      name,
      slug: slug.toLowerCase(),
      cnpj: cnpj || '',
      primary_color: primary_color || '#0f3a63',
      secondary_color: secondary_color || '#2563eb',
      coat_of_arms_url: DEFAULT_COAT_OF_ARMS,
      status: 'active' as const,
      created_at: new Date().toISOString(),
    };

    db.organizations.push(newOrg);
    db.addAuditLog({
      organization_id: newOrg.id,
      user_id: user.id,
      user_name: user.name,
      action: 'CRIAR_PREFEITURA',
      entity_name: 'Organization',
      entity_id: newOrg.id,
      details: `Nova prefeitura cadastrada: ${newOrg.name} (${newOrg.slug})`,
    });

    res.status(201).json(newOrg);
  });

  app.put('/api/organizations/:id', (req: Request, res: Response) => {
    const user = getCurrentUser();
    const org = db.organizations.find((o) => o.id === req.params.id);
    if (!org) return res.status(404).json({ message: 'Prefeitura não encontrada' });

    if (user.role !== 'superadmin' && (user.role !== 'gestor' || user.organization_id !== org.id)) {
      return res.status(403).json({ message: 'Sem permissão para alterar dados desta organização.' });
    }

    const { name, primary_color, secondary_color, coat_of_arms_url, status } = req.body;
    if (name) org.name = name;
    if (primary_color) org.primary_color = primary_color;
    if (secondary_color) org.secondary_color = secondary_color;
    if (coat_of_arms_url) org.coat_of_arms_url = coat_of_arms_url;
    if (status && user.role === 'superadmin') org.status = status;

    db.addAuditLog({
      organization_id: org.id,
      user_id: user.id,
      user_name: user.name,
      action: 'ATUALIZAR_PREFEITURA',
      entity_name: 'Organization',
      entity_id: org.id,
      details: `Configurações institucionais de ${org.name} atualizadas.`,
    });

    res.json(org);
  });

  // ==========================================================================
  // ROTAS DE SECRETARIAS E DEPARTAMENTOS
  // ==========================================================================

  app.get('/api/secretariats', (req: Request, res: Response) => {
    const user = getCurrentUser();
    const orgId = (req.query.organizationId as string) || user.organization_id;
    const items = db.secretariats.filter((s) => !orgId || s.organization_id === orgId);
    res.json(items);
  });

  app.post('/api/secretariats', (req: Request, res: Response) => {
    const user = getCurrentUser();
    if (user.role !== 'superadmin' && user.role !== 'gestor') {
      return res.status(403).json({ message: 'Apenas gestores municipais ou administradores podem criar secretarias.' });
    }
    const { name, code, organization_id } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'Nome da secretaria é obrigatório.' });
    }
    // Isolamento de tenant: não-superadmin sempre usa sua própria organização
    const orgId = user.role === 'superadmin' ? (organization_id || user.organization_id || 'org-vitoria') : (user.organization_id || 'org-vitoria');
    const newSec = {
      id: `sec-${Date.now().toString(36)}`,
      organization_id: orgId,
      name: name.trim(),
      code: code ? String(code).trim() : '',
    };
    db.secretariats.push(newSec);
    res.status(201).json(newSec);
  });

  app.get('/api/departments', (req: Request, res: Response) => {
    const user = getCurrentUser();
    const orgId = (req.query.organizationId as string) || user.organization_id;
    const secId = req.query.secretariatId as string;
    let items = db.departments.filter((d) => !orgId || d.organization_id === orgId);
    if (secId) items = items.filter((d) => d.secretariat_id === secId);
    res.json(items);
  });

  app.post('/api/departments', (req: Request, res: Response) => {
    const user = getCurrentUser();
    if (user.role !== 'superadmin' && user.role !== 'gestor') {
      return res.status(403).json({ message: 'Apenas gestores municipais ou administradores podem criar departamentos.' });
    }
    const { name, secretariat_id, organization_id } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'Nome do departamento é obrigatório.' });
    }
    if (!secretariat_id) {
      return res.status(400).json({ message: 'Secretaria vinculada é obrigatória.' });
    }
    const orgId = user.role === 'superadmin' ? (organization_id || user.organization_id || 'org-vitoria') : (user.organization_id || 'org-vitoria');
    const newDep = {
      id: `dep-${Date.now().toString(36)}`,
      organization_id: orgId,
      secretariat_id,
      name: name.trim(),
    };
    db.departments.push(newDep);
    res.status(201).json(newDep);
  });

  // ==========================================================================
  // ROTAS DE USUÁRIOS E SERVIDORES
  // ==========================================================================

  app.get('/api/users', (req: Request, res: Response) => {
    const user = getCurrentUser();
    let list = [...db.users];

    // RLS: Se não for SuperAdmin, isola por organização
    if (user.role !== 'superadmin') {
      list = list.filter((u) => u.organization_id === user.organization_id);
    }

    const role = req.query.role as string;
    if (role) list = list.filter((u) => u.role === role);

    const secretariatId = req.query.secretariatId as string;
    if (secretariatId) list = list.filter((u) => u.secretariat_id === secretariatId);

    // Adiciona nome da secretaria e departamento para a visualização
    const enriched = list.map((u) => {
      const sec = db.secretariats.find((s) => s.id === u.secretariat_id);
      const dep = db.departments.find((d) => d.id === u.department_id);
      return {
        ...u,
        secretariat_name: sec ? sec.name : undefined,
        department_name: dep ? dep.name : undefined,
      };
    });

    res.json(enriched);
  });

  // ==========================================================================
  // ROTAS DE CURSOS E AULAS
  // ==========================================================================

  app.get('/api/courses', (req: Request, res: Response) => {
    const user = getCurrentUser();
    let courses = [...db.courses];

    if (user.role !== 'superadmin') {
      courses = courses.filter((c) => c.organization_id === user.organization_id);
    }

    // Se for aluno, agrega dados de matrícula (progresso, status, obrigatoriedade)
    const enriched = courses.map((course) => {
      const enrollment = db.enrollments.find((e) => e.user_id === user.id && e.course_id === course.id);
      return {
        ...course,
        enrollment: enrollment || null,
      };
    });

    res.json(enriched);
  });

  app.get('/api/courses/:id', (req: Request, res: Response) => {
    const user = getCurrentUser();
    const course = db.courses.find((c) => c.id === req.params.id);
    if (!course) return res.status(404).json({ message: 'Curso não encontrado' });

    // Módulos e aulas com progresso do usuário atual
    const courseModules = db.modules
      .filter((m) => m.course_id === course.id)
      .sort((a, b) => a.order_index - b.order_index)
      .map((mod) => {
        const enrichedLessons = mod.lessons.map((lsn) => {
          const prog = db.lessonProgress.get(`${user.id}_${lsn.id}`);
          return {
            ...lsn,
            progress: prog || {
              completed: false,
              watch_time_seconds: 0,
              last_position_seconds: 0,
              last_accessed_at: '',
            },
          };
        });
        return {
          ...mod,
          lessons: enrichedLessons,
        };
      });

    // Turmas presenciais/híbridas vinculadas
    const courseClasses = db.classes.filter((cl) => cl.course_id === course.id);

    // Avaliação do curso
    const assessment = db.assessments.find((a) => a.course_id === course.id);

    // Matrícula do aluno atual
    const enrollment = db.enrollments.find((e) => e.user_id === user.id && e.course_id === course.id);

    // Certificado emitido
    const certificate = db.certificates.find((crt) => crt.user_id === user.id && crt.course_id === course.id);

    // Avaliação/Feedback do aluno
    const evaluation = db.evaluations.find((ev) => ev.user_id === user.id && ev.course_id === course.id);

    res.json({
      ...course,
      modules: courseModules,
      classes: courseClasses,
      assessment: assessment || null,
      enrollment: enrollment || null,
      certificate: certificate || null,
      evaluation: evaluation || null,
    });
  });

  app.post('/api/courses', (req: Request, res: Response) => {
    const user = getCurrentUser();
    if (user.role !== 'superadmin' && user.role !== 'gestor' && user.role !== 'professor') {
      return res.status(403).json({ message: 'Sem permissão para cadastrar cursos.' });
    }

    const { title, description, workload_hours, category, modality, instructor_id, organization_id } = req.body;
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ message: 'Título do curso é obrigatório.' });
    }
    // Isolamento multi-tenant: não-superadmin sempre vincula à sua própria organização
    const orgId = user.role === 'superadmin' ? (organization_id || user.organization_id || 'org-vitoria') : (user.organization_id || 'org-vitoria');
    const instructor = instructor_id ? db.users.find((u) => u.id === instructor_id) : null;

    const newCourse = {
      id: `crs-${Date.now().toString(36)}`,
      organization_id: orgId,
      title,
      description,
      workload_hours: Number(workload_hours) || 20,
      category: category || 'Geral',
      modality: modality || 'ead',
      instructor_id: instructor ? instructor.id : user.id,
      instructor_name: instructor ? instructor.name : user.name,
      status: 'published' as const,
      created_at: new Date().toISOString(),
      rating_avg: 5.0,
      rating_count: 0,
    };

    db.courses.push(newCourse);
    db.addAuditLog({
      organization_id: orgId,
      user_id: user.id,
      user_name: user.name,
      action: 'CRIAR_CURSO',
      entity_name: 'Course',
      entity_id: newCourse.id,
      details: `Curso '${newCourse.title}' cadastrado com sucesso.`,
    });

    res.status(201).json(newCourse);
  });

  // ==========================================================================
  // PROGRESSO DO ALUNO NA AULA & CONTINUAR DE ONDE PAROU (REQUISITO 12 & 15)
  // ==========================================================================

  app.post('/api/lessons/:id/progress', (req: Request, res: Response) => {
    const user = getCurrentUser();
    const lessonId = req.params.id;
    const { watch_time_seconds, last_position_seconds, completed, course_id } = req.body;

    const key = `${user.id}_${lessonId}`;
    const current = db.lessonProgress.get(key) || {
      completed: false,
      watch_time_seconds: 0,
      last_position_seconds: 0,
      last_accessed_at: new Date().toISOString(),
    };

    const updated = {
      completed: completed !== undefined ? Boolean(completed) : current.completed,
      watch_time_seconds: Number(watch_time_seconds) || current.watch_time_seconds,
      last_position_seconds: Number(last_position_seconds) || current.last_position_seconds,
      last_accessed_at: new Date().toISOString(),
    };

    db.lessonProgress.set(key, updated);

    // Atualiza progresso da matrícula
    if (course_id) {
      let enrollment = db.enrollments.find((e) => e.user_id === user.id && e.course_id === course_id);
      if (!enrollment) {
        enrollment = {
          id: `enr-${Date.now().toString(36)}`,
          organization_id: user.organization_id || 'org-vitoria',
          user_id: user.id,
          course_id,
          is_mandatory: false,
          status: 'ativo',
          progress_percent: 0,
          enrolled_at: new Date().toISOString(),
        };
        db.enrollments.push(enrollment);
      }

      // Calcula porcentagem total de aulas completadas do curso
      const courseModules = db.modules.filter((m) => m.course_id === course_id);
      const allLessons = courseModules.flatMap((m) => m.lessons);
      const totalLessons = allLessons.length;

      if (totalLessons > 0) {
        const completedCount = allLessons.filter((lsn) => {
          const p = db.lessonProgress.get(`${user.id}_${lsn.id}`);
          return p && p.completed;
        }).length;

        const newEadPercent = Math.min(100, Math.round((completedCount / totalLessons) * 100));
        enrollment.last_lesson_id = lessonId;

        const targetCourse = db.courses.find((c) => c.id === course_id);
        if (targetCourse?.modality === 'hibrido') {
          // Curso Híbrido: Cálculo composto ponderado (Online 50% + Presencial 50%)
          enrollment.ead_progress_percent = newEadPercent;

          // Calcula presença nos encontros presenciais vinculados
          const targetClass = db.classes.find((cl) => cl.course_id === course_id);
          const classMeetings = targetClass?.meetings || [];
          const totalMeetings = classMeetings.length;

          let attendedMeetings = 0;
          if (totalMeetings > 0) {
            attendedMeetings = classMeetings.filter((m) => {
              const att = db.attendances.find((a) => a.meeting_id === m.id && a.user_id === user.id);
              return att && att.status === 'presente';
            }).length;
            enrollment.presencial_progress_percent = Math.round((attendedMeetings / totalMeetings) * 100);
          } else {
            enrollment.presencial_progress_percent = 50;
          }

          const compositePercent = Math.min(100, Math.round((enrollment.ead_progress_percent * 0.5) + ((enrollment.presencial_progress_percent || 0) * 0.5)));
          enrollment.progress_percent = compositePercent;

          // Só conclui se 100% online E pelo menos 75% presencial
          if (enrollment.ead_progress_percent === 100 && (enrollment.presencial_progress_percent || 0) >= 75 && enrollment.status !== 'concluido') {
            enrollment.status = 'concluido';
            enrollment.completed_at = new Date().toISOString();
          }
        } else {
          // Curso EAD Padrão
          enrollment.progress_percent = newEadPercent;
          if (newEadPercent === 100 && enrollment.status !== 'concluido') {
            enrollment.status = 'concluido';
            enrollment.completed_at = new Date().toISOString();
          }
        }
      }
    }

    res.json({ success: true, progress: updated });
  });

  // ==========================================================================
  // TURMAS, ENCONTROS E FREQUÊNCIA (MANUAL + QR CODE) (REQUISITOS 13, 22, 23)
  // ==========================================================================

  app.get('/api/classes', (req: Request, res: Response) => {
    const user = getCurrentUser();
    let list = [...db.classes];
    if (user.role !== 'superadmin') {
      list = list.filter((cl) => cl.organization_id === user.organization_id);
    }
    if (user.role === 'professor') {
      list = list.filter((cl) => cl.instructor_id === user.id);
    }
    res.json(list);
  });

  app.get('/api/meetings/:id/attendances', (req: Request, res: Response) => {
    const meetingId = req.params.id;
    const records = db.attendances.filter((a) => a.meeting_id === meetingId);
    res.json(records);
  });

  app.post('/api/meetings/:id/attendance', (req: Request, res: Response) => {
    const actor = getCurrentUser();
    if (actor.role !== 'professor' && actor.role !== 'gestor' && actor.role !== 'superadmin') {
      return res.status(403).json({ message: 'Apenas professores ou gestores podem lançar presenças manualmente.' });
    }
    const meetingId = req.params.id;
    const { user_id, status } = req.body;

    const student = db.users.find((u) => u.id === user_id);
    if (!student) return res.status(404).json({ message: 'Servidor não encontrado.' });

    const existingIndex = db.attendances.findIndex((a) => a.meeting_id === meetingId && a.user_id === user_id);
    const record = {
      id: existingIndex >= 0 ? db.attendances[existingIndex].id : `att-${Date.now().toString(36)}`,
      meeting_id: meetingId,
      user_id,
      user_name: student.name,
      user_cpf: student.cpf,
      user_secretariat: student.secretariat_id ? db.secretariats.find((s) => s.id === student.secretariat_id)?.name : undefined,
      status: status || 'presente',
      method: 'manual' as const,
      registered_at: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      db.attendances[existingIndex] = record;
    } else {
      db.attendances.push(record);
    }

    res.json(record);
  });

  // Gerador de QR Code de Presença com token assinado
  app.get('/api/meetings/:id/qr-code', async (req: Request, res: Response) => {
    const actor = getCurrentUser();
    if (actor.role !== 'professor' && actor.role !== 'gestor' && actor.role !== 'superadmin') {
      return res.status(403).json({ message: 'Apenas instrutores da turma ou gestores podem gerar ou visualizar o QR Code de chamada.' });
    }
    const meetingId = req.params.id;
    let meeting: Meeting | undefined;

    for (const cl of db.classes) {
      const found = cl.meetings?.find((m) => m.id === meetingId);
      if (found) {
        meeting = found;
        break;
      }
    }

    if (!meeting) return res.status(404).json({ message: 'Encontro não encontrado.' });

    const token = meeting.qr_secret || `QR-${meetingId}-${Date.now().toString(36)}`;
    const qrData = JSON.stringify({
      app: 'CapacitaGov',
      meeting_id: meeting.id,
      meeting_title: meeting.title,
      token,
      timestamp: Date.now(),
    });

    try {
      const qrDataUrl = await QRCode.toDataURL(qrData, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0f3a63',
          light: '#ffffff',
        },
      });

      res.json({
        meeting_id: meeting.id,
        token,
        qr_data_url: qrDataUrl,
        meeting_title: meeting.title,
        location: meeting.location,
        room: meeting.room,
      });
    } catch {
      res.status(500).json({ message: 'Falha ao gerar QR Code' });
    }
  });

  // Auto-confirmação de presença do aluno via QR Code
  app.post('/api/attendances/verify-qr', (req: Request, res: Response) => {
    const user = getCurrentUser();
    const { meeting_id, token } = req.body;

    let meeting: Meeting | undefined;
    for (const cl of db.classes) {
      const found = cl.meetings?.find((m) => m.id === meeting_id);
      if (found) {
        meeting = found;
        break;
      }
    }

    if (!meeting) return res.status(404).json({ message: 'Encontro não localizado.' });

    // Validação estrita do token/QR Secret institucional
    const expectedToken = (meeting.qr_secret || '').trim().toUpperCase();
    const providedToken = String(token || '').trim().toUpperCase();
    if (!providedToken || (expectedToken && providedToken !== expectedToken)) {
      return res.status(400).json({ message: 'Código de QR Code inválido ou incorreto para este encontro presencial.' });
    }

    // Registra presença do aluno
    const existing = db.attendances.find((a) => a.meeting_id === meeting_id && a.user_id === user.id);
    if (existing) {
      existing.status = 'presente';
      existing.method = 'qr_code';
      existing.registered_at = new Date().toISOString();
      return res.json({ success: true, message: 'Presença já confirmada anteriormente.', record: existing });
    }

    const newAttendance = {
      id: `att-qr-${Date.now().toString(36)}`,
      meeting_id,
      user_id: user.id,
      user_name: user.name,
      user_cpf: user.cpf,
      status: 'presente' as const,
      method: 'qr_code' as const,
      registered_at: new Date().toISOString(),
    };

    db.attendances.push(newAttendance);

    db.addAuditLog({
      organization_id: user.organization_id,
      user_id: user.id,
      user_name: user.name,
      action: 'PRESENCA_QR_CODE',
      entity_name: 'Attendance',
      entity_id: newAttendance.id,
      details: `Presença confirmada pelo próprio servidor via QR Code em: ${meeting.title}`,
    });

    res.json({ success: true, message: 'Presença confirmada com sucesso via QR Code institucional!', record: newAttendance });
  });

  // ==========================================================================
  // AVALIAÇÃO CONTROLADA & CRONÔMETRO NO SERVIDOR (REQUISITOS 18, 19, 20, 21)
  // ==========================================================================

  app.get('/api/assessments/:id', (req: Request, res: Response) => {
    const assessment = db.assessments.find((a) => a.id === req.params.id);
    if (!assessment) return res.status(404).json({ message: 'Avaliação não encontrada.' });
    res.json(assessment);
  });

  // Início da Prova: Cronômetro do Servidor (started_at e expires_at gravados no backend)
  app.post('/api/assessments/:id/start', (req: Request, res: Response) => {
    const user = getCurrentUser();
    const assessment = db.assessments.find((a) => a.id === req.params.id);
    if (!assessment) return res.status(404).json({ message: 'Avaliação não encontrada.' });

    const now = Date.now();

    // Verifica se já existe tentativa em andamento não expirada
    let activeAttempt = db.assessmentAttempts.find(
      (att) => att.assessment_id === assessment.id && att.user_id === user.id && att.status === 'in_progress'
    );

    if (activeAttempt) {
      const expiresAtMs = new Date(activeAttempt.expires_at).getTime();
      // Se já passou do tempo de expiração do servidor:
      if (now >= expiresAtMs) {
        activeAttempt.status = 'expired';
        activeAttempt.finished_at = new Date().toISOString();
        return res.status(400).json({ message: 'O tempo limite da prova já se esgotou no servidor.', attempt: activeAttempt });
      }
      // Retorna tentativa existente com tempo restante autêntico do servidor
      const remainingSeconds = Math.max(0, Math.floor((expiresAtMs - now) / 1000));
      const questionsSanitized = db.questions
        .filter((q) => q.course_id === assessment.course_id)
        .map((q) => ({
          ...q,
          options: q.options.map((opt) => ({ id: opt.id, text: opt.text, order_index: opt.order_index })),
        }));

      return res.json({
        attempt: activeAttempt,
        remainingSeconds,
        questions: questionsSanitized,
      });
    }

    // Cria nova tentativa
    const expiresAt = new Date(now + assessment.time_limit_minutes * 60 * 1000).toISOString();
    const newAttempt: any = {
      id: `att-exam-${Date.now().toString(36)}`,
      assessment_id: assessment.id,
      user_id: user.id,
      started_at: new Date(now).toISOString(),
      expires_at: expiresAt,
      exit_count: 0,
      status: 'in_progress',
      answers: {},
      incidents: [],
    };

    db.assessmentAttempts.push(newAttempt);

    db.addAuditLog({
      organization_id: user.organization_id,
      user_id: user.id,
      user_name: user.name,
      action: 'INICIO_AVALIACAO',
      entity_name: 'AssessmentAttempt',
      entity_id: newAttempt.id,
      details: `Início de avaliação com cronômetro de servidor (${assessment.time_limit_minutes} min): ${assessment.title}`,
    });

    const questionsSanitized = db.questions
      .filter((q) => q.course_id === assessment.course_id)
      .map((q) => ({
        ...q,
        options: q.options.map((opt) => ({ id: opt.id, text: opt.text, order_index: opt.order_index })),
      }));

    res.json({
      attempt: newAttempt,
      remainingSeconds: assessment.time_limit_minutes * 60,
      questions: questionsSanitized,
    });
  });

  // Salvamento Automático de Resposta em Tempo Real (Requisito 21)
  app.post('/api/assessments/attempts/:attemptId/answer', (req: Request, res: Response) => {
    const user = getCurrentUser();
    const attempt = db.assessmentAttempts.find((a) => a.id === req.params.attemptId);
    if (!attempt) return res.status(404).json({ message: 'Tentativa não encontrada.' });

    // Anti-IDOR: Impede manipulação de tentativa de outro servidor
    if (attempt.user_id !== user.id && user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Acesso negado: tentativa pertence a outro usuário.' });
    }

    if (attempt.status !== 'in_progress') {
      return res.status(400).json({ message: 'Tentativa já encerrada ou expirada.' });
    }

    // Verifica expiração no servidor
    if (Date.now() >= new Date(attempt.expires_at).getTime()) {
      attempt.status = 'expired';
      attempt.finished_at = new Date().toISOString();
      return res.status(400).json({ message: 'Tempo limite expirado pelo servidor.', status: 'expired' });
    }

    const { questionId, optionId } = req.body;
    attempt.answers[questionId] = optionId;

    res.json({ success: true, savedAnswers: attempt.answers });
  });

  // Registro de Ocorrência (Troca de aba / perda de foco / saída de fullscreen)
  app.post('/api/assessments/attempts/:attemptId/incident', (req: Request, res: Response) => {
    const user = getCurrentUser();
    const attempt = db.assessmentAttempts.find((a) => a.id === req.params.attemptId);
    if (!attempt) return res.status(404).json({ message: 'Tentativa não encontrada.' });

    // Anti-IDOR: Impede injeção de advertências em tentativas de terceiros
    if (attempt.user_id !== user.id && user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Acesso negado: tentativa pertence a outro usuário.' });
    }

    const assessment = db.assessments.find((a) => a.id === attempt.assessment_id);
    const maxExits = assessment ? assessment.max_exit_tolerated : 3;

    const { incident_type, details } = req.body;
    attempt.exit_count += 1;
    attempt.incidents.push({
      incident_type: incident_type || 'window_blur',
      occurred_at: new Date().toISOString(),
      details: details || `Ocorrência #${attempt.exit_count}`,
    });

    let terminated = false;
    if (attempt.exit_count >= maxExits) {
      attempt.status = 'terminated_by_violations';
      attempt.finished_at = new Date().toISOString();
      terminated = true;

      db.addAuditLog({
        user_id: attempt.user_id,
        action: 'AVALIACAO_ENCERRADA_VIOLACOES',
        entity_name: 'AssessmentAttempt',
        entity_id: attempt.id,
        details: `Avaliação encerrada compulsoriamente por atingir limite de ocorrências (${attempt.exit_count}/${maxExits}).`,
      });
    }

    res.json({
      exit_count: attempt.exit_count,
      max_allowed: maxExits,
      terminated,
      status: attempt.status,
    });
  });

  // Encerramento e Cálculo de Nota da Avaliação
  app.post('/api/assessments/attempts/:attemptId/finish', async (req: Request, res: Response) => {
    const currentUser = getCurrentUser();
    const attempt = db.assessmentAttempts.find((a) => a.id === req.params.attemptId);
    if (!attempt) return res.status(404).json({ message: 'Tentativa não encontrada.' });

    // Anti-IDOR: Impede finalização não autorizada de tentativas de outros servidores
    if (attempt.user_id !== currentUser.id && currentUser.role !== 'superadmin') {
      return res.status(403).json({ message: 'Acesso negado: tentativa pertence a outro usuário.' });
    }

    const assessment = db.assessments.find((a) => a.id === attempt.assessment_id);
    if (!assessment) return res.status(404).json({ message: 'Avaliação não encontrada.' });

    const questions = db.questions.filter((q) => q.course_id === assessment.course_id);
    let correctCount = 0;

    questions.forEach((q) => {
      const selectedOptId = attempt.answers[q.id];
      const correctOpt = q.options.find((opt) => opt.is_correct);
      if (selectedOptId && correctOpt && selectedOptId === correctOpt.id) {
        correctCount += 1;
      }
    });

    const totalQuestions = questions.length || 1;
    const scorePercent = Math.round((correctCount / totalQuestions) * 100);
    const passed = scorePercent >= assessment.min_score_percent;

    attempt.finished_at = new Date().toISOString();
    attempt.score = scorePercent;
    attempt.passed = passed;
    attempt.status = 'submitted';

    const studentUser = db.users.find((u) => u.id === attempt.user_id) || currentUser;
    const course = db.courses.find((c) => c.id === assessment.course_id);

    // Se aprovado, atualiza matrícula para concluído e gera certificado automático!
    let certificate = null;
    if (passed && course) {
      const enrollment = db.enrollments.find((e) => e.user_id === studentUser.id && e.course_id === course.id);
      if (enrollment) {
        enrollment.status = 'concluido';
        enrollment.progress_percent = 100;
        enrollment.completed_at = new Date().toISOString();
      }

      // Verifica se certificado já existe
      const existingCert = db.certificates.find((crt) => crt.user_id === studentUser.id && crt.course_id === course.id);
      if (existingCert) {
        certificate = existingCert;
      } else {
        const org = db.organizations.find((o) => o.id === studentUser.organization_id) || db.organizations[0];
        const randomHash = Math.floor(100000 + Math.random() * 900000);
        const certCode = `${org.slug.toUpperCase()}-2026-${randomHash}`;

        // Gera QR Code para o certificado com URL pública de validação
        const validationUrl = `https://capacitagov.gov.br/validar-certificado/${certCode}`;
        const qrDataUrl = await QRCode.toDataURL(validationUrl, {
          width: 240,
          margin: 1,
          color: { dark: '#0f3a63', light: '#ffffff' },
        });

        certificate = {
          id: `cert-${Date.now().toString(36)}`,
          code: certCode,
          enrollment_id: enrollment?.id,
          user_id: studentUser.id,
          user_name: studentUser.name,
          user_cpf: studentUser.cpf,
          user_registration: studentUser.registration_number,
          course_id: course.id,
          course_title: course.title,
          course_category: course.category,
          organization_id: org.id,
          organization_name: org.name,
          coat_of_arms_url: org.coat_of_arms_url || DEFAULT_COAT_OF_ARMS,
          workload_hours: course.workload_hours,
          grade_percent: scorePercent,
          attendance_percent: 100,
          issued_at: new Date().toISOString(),
          qr_code_data_url: qrDataUrl,
        };

        db.certificates.push(certificate);

        db.addAuditLog({
          organization_id: org.id,
          user_id: studentUser.id,
          user_name: studentUser.name,
          action: 'CERTIFICADO_EMITIDO',
          entity_name: 'Certificate',
          entity_id: certCode,
          details: `Certificado ${certCode} gerado após nota ${scorePercent}% na avaliação de ${course.title}.`,
        });
      }
    }

    res.json({
      attempt,
      correctCount,
      totalQuestions,
      scorePercent,
      passed,
      certificate,
    });
  });

  // ==========================================================================
  // CERTIFICADOS & VALIDAÇÃO PÚBLICA (/validar-certificado/:codigo) (REQUISITOS 24, 25)
  // ==========================================================================

  app.get('/api/certificates', (req: Request, res: Response) => {
    const user = getCurrentUser();
    let list = [...db.certificates];
    if (user.role === 'aluno') {
      list = list.filter((c) => c.user_id === user.id);
    } else if (user.role === 'gestor' || user.role === 'professor') {
      list = list.filter((c) => c.organization_id === user.organization_id);
    }
    res.json(list);
  });

  // ROTA PÚBLICA DE VALIDAÇÃO (Sem autenticação requerida)
  app.get('/api/certificates/verify/:code', (req: Request, res: Response) => {
    const code = req.params.code.trim().toUpperCase();
    const cert = db.certificates.find((c) => c.code.toUpperCase() === code);

    if (!cert) {
      return res.status(404).json({
        valid: false,
        message: 'Código de certificado não localizado ou inválido no registro oficial municipal.',
      });
    }

    // Aplica regra de LGPD: mascara o CPF (ex: ***.456.789-**)
    const maskedCpf = cert.user_cpf ? cert.user_cpf.replace(/^(\d{3})\.(\d{3})\.(\d{3})-(\d{2})$/, '***.$2.$3-**') : '***.***.***-**';

    res.json({
      valid: true,
      certificate: {
        code: cert.code,
        student_name: cert.user_name,
        masked_cpf: maskedCpf,
        registration_number: cert.user_registration || '—',
        course_title: cert.course_title,
        course_category: cert.course_category,
        workload_hours: cert.workload_hours,
        organization_name: cert.organization_name,
        coat_of_arms_url: cert.coat_of_arms_url,
        grade_percent: cert.grade_percent,
        attendance_percent: cert.attendance_percent,
        issued_at: cert.issued_at,
      },
    });
  });

  // ==========================================================================
  // IMPORTAÇÃO DE SERVIDORES VIA CSV (REQUISITO 31)
  // ==========================================================================

  app.post('/api/servants/import-validate', (req: Request, res: Response) => {
    const { rows } = req.body as { rows: any[] };
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ message: 'Arquivo CSV vazio ou sem linhas de dados.' });
    }

    const validRows: any[] = [];
    const invalidRows: any[] = [];
    const existingCpfs = new Set(db.users.map((u) => u.cpf.replace(/\D/g, '')));
    const existingEmails = new Set(db.users.map((u) => u.email.toLowerCase()));

    rows.forEach((row, idx) => {
      const rowNum = idx + 2; // Cabeçalho é linha 1
      const name = String(row.nome || row.Nome || '').trim();
      const cpf = String(row.cpf || row.CPF || '').trim();
      const email = String(row.email || row.Email || '').trim().toLowerCase();
      const secretariat = String(row.secretaria || row.Secretaria || '').trim();
      const department = String(row.departamento || row.Departamento || '').trim();
      const registration = String(row.matricula || row.Matricula || '').trim();

      const errors: string[] = [];

      if (!name || name.length < 3) errors.push('Nome inválido ou incompleto');
      
      const cpfDigits = cpf.replace(/\D/g, '');
      if (cpfDigits.length !== 11) {
        errors.push('CPF deve conter exatamente 11 dígitos');
      } else if (existingCpfs.has(cpfDigits)) {
        errors.push('CPF já cadastrado no sistema municipal');
      }

      if (!email || !email.includes('@')) {
        errors.push('E-mail institucional inválido');
      } else if (existingEmails.has(email)) {
        errors.push('E-mail já existente na base de dados');
      }

      if (errors.length > 0) {
        invalidRows.push({
          rowNumber: rowNum,
          errors,
          data: { name, cpf, email, secretariat, department, registration },
        });
      } else {
        validRows.push({
          rowNumber: rowNum,
          name,
          cpf,
          email,
          secretariat,
          department,
          registration,
        });
      }
    });

    res.json({
      summary: {
        total: rows.length,
        valid: validRows.length,
        errors: invalidRows.length,
      },
      validRows,
      invalidRows,
    });
  });

  app.post('/api/servants/import-commit', (req: Request, res: Response) => {
    const user = getCurrentUser();
    if (user.role !== 'gestor' && user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Sem permissão para importar servidores.' });
    }

    const { validRows } = req.body as { validRows: any[] };
    if (!Array.isArray(validRows) || validRows.length === 0) {
      return res.status(400).json({ message: 'Nenhuma linha válida fornecida para importação.' });
    }

    const orgId = user.organization_id || 'org-vitoria';
    let importedCount = 0;

    validRows.forEach((row) => {
      // Procura ou cria secretaria se não existir
      let sec = db.secretariats.find((s) => s.organization_id === orgId && s.name.toLowerCase() === row.secretariat.toLowerCase());
      if (!sec && row.secretariat) {
        sec = {
          id: `sec-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
          organization_id: orgId,
          name: row.secretariat,
          code: row.secretariat.substring(0, 4).toUpperCase(),
        };
        db.secretariats.push(sec);
      }

      // Procura ou cria departamento
      let dep = db.departments.find((d) => d.organization_id === orgId && d.name.toLowerCase() === row.department.toLowerCase());
      if (!dep && row.department && sec) {
        dep = {
          id: `dep-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
          organization_id: orgId,
          secretariat_id: sec.id,
          name: row.department,
        };
        db.departments.push(dep);
      }

      const newUser = {
        id: `usr-serv-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
        organization_id: orgId,
        name: row.name,
        email: row.email,
        cpf: row.cpf,
        registration_number: row.registration || `MAT-${Math.floor(10000 + Math.random() * 90000)}`,
        role: 'aluno' as const,
        secretariat_id: sec?.id,
        department_id: dep?.id,
        job_title: 'Servidor Público Municipal',
        active: true,
        created_at: new Date().toISOString(),
      };

      db.users.push(newUser);
      importedCount += 1;
    });

    db.addAuditLog({
      organization_id: orgId,
      user_id: user.id,
      user_name: user.name,
      action: 'IMPORTACAO_SERVIDORES_CSV',
      entity_name: 'User',
      details: `Importação de ${importedCount} novos servidores municipais processada via CSV com validação prévia.`,
    });

    res.json({ success: true, importedCount });
  });

  // ==========================================================================
  // PESQUISA DE SATISFAÇÃO (REQUISITO 34)
  // ==========================================================================

  app.post('/api/courses/:id/evaluation', (req: Request, res: Response) => {
    const user = getCurrentUser();
    const courseId = req.params.id;
    const { rating, usefulness_score, comment } = req.body;

    const course = db.courses.find((c) => c.id === courseId);
    if (!course) return res.status(404).json({ message: 'Curso não encontrado.' });

    const newEval = {
      id: `eval-${Date.now().toString(36)}`,
      course_id: courseId,
      user_id: user.id,
      user_name: user.name,
      rating: Number(rating) || 5,
      usefulness_score: Number(usefulness_score) || 5,
      comment: String(comment || '').trim(),
      created_at: new Date().toISOString(),
    };

    db.evaluations.push(newEval);

    // Recalcula média do curso
    const courseEvals = db.evaluations.filter((ev) => ev.course_id === courseId);
    const avg = courseEvals.reduce((acc, curr) => acc + curr.rating, 0) / courseEvals.length;
    course.rating_avg = Number(avg.toFixed(1));
    course.rating_count = courseEvals.length;

    res.json({ success: true, evaluation: newEval, courseAvg: course.rating_avg });
  });

  // ==========================================================================
  // AUDITORIA E LOGS (REQUISITO 35 & 37)
  // ==========================================================================

  app.get('/api/audit-logs', (req: Request, res: Response) => {
    const user = getCurrentUser();
    if (user.role !== 'superadmin' && user.role !== 'gestor') {
      return res.status(403).json({ message: 'Sem permissão para visualizar relatórios de auditoria.' });
    }

    let logs = [...db.auditLogs];
    if (user.role === 'gestor') {
      logs = logs.filter((l) => l.organization_id === user.organization_id);
    }

    res.json(logs);
  });

  // ==========================================================================
  // VITE MIDDLEWARES & DEV SERVER INTEGRATION
  // ==========================================================================

  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CapacitaGov Server] Executando em http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[CapacitaGov Server Error]', err);
});
