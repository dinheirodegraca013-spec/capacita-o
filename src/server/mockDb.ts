import {
  Organization,
  Secretariat,
  Department,
  User,
  Course,
  Module,
  Lesson,
  ClassGroup,
  Meeting,
  AttendanceRecord,
  Question,
  Assessment,
  AssessmentAttempt,
  Enrollment,
  Certificate,
  CourseEvaluation,
  AuditLog,
} from '../types/index.ts';

// Brasão SVG institucional formatado como Data URI para renderização garantida offline e online
export const DEFAULT_COAT_OF_ARMS = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="46" fill="%230f3a63" stroke="%23d4af37" stroke-width="4"/><path d="M50 20 L75 35 L75 65 L50 80 L25 65 L25 35 Z" fill="%23ffffff" stroke="%23d4af37" stroke-width="2"/><circle cx="50" cy="46" r="10" fill="%230f3a63"/><path d="M42 62 L58 62 L50 52 Z" fill="%23d4af37"/><path d="M30 28 L50 15 L70 28" fill="none" stroke="%23d4af37" stroke-width="3"/></svg>`;

export const BLUMENAU_COAT_OF_ARMS = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="46" fill="%23064e3b" stroke="%2310b981" stroke-width="4"/><path d="M50 22 L72 38 L72 65 L50 78 L28 65 L28 38 Z" fill="%23f0fdf4" stroke="%23059669" stroke-width="2"/><circle cx="50" cy="48" r="9" fill="%23064e3b"/><path d="M43 62 L57 62 L50 52 Z" fill="%2310b981"/></svg>`;

// ==========================================
// SEED DATA INICIAL
// ==========================================

export const initialOrganizations: Organization[] = [
  {
    id: 'org-vitoria',
    name: 'Prefeitura Municipal de Vitória da Conquista',
    slug: 'pmvc',
    cnpj: '14.239.578/0001-00',
    primary_color: '#0f3a63',
    secondary_color: '#2563eb',
    coat_of_arms_url: DEFAULT_COAT_OF_ARMS,
    status: 'active',
    created_at: '2026-01-10T10:00:00Z',
  },
  {
    id: 'org-blumenau',
    name: 'Prefeitura Municipal de Blumenau',
    slug: 'blumenau',
    cnpj: '83.102.508/0001-58',
    primary_color: '#064e3b',
    secondary_color: '#059669',
    coat_of_arms_url: BLUMENAU_COAT_OF_ARMS,
    status: 'active',
    created_at: '2026-02-15T14:30:00Z',
  },
];

export const initialSecretariats: Secretariat[] = [
  { id: 'sec-adm', organization_id: 'org-vitoria', name: 'Secretaria Municipal de Administração e Inovação', code: 'SMAI' },
  { id: 'sec-sau', organization_id: 'org-vitoria', name: 'Secretaria Municipal de Saúde', code: 'SMS' },
  { id: 'sec-edu', organization_id: 'org-vitoria', name: 'Secretaria Municipal de Educação', code: 'SMED' },
  { id: 'sec-faz', organization_id: 'org-vitoria', name: 'Secretaria de Finanças e Planejamento', code: 'SEFIN' },
  { id: 'sec-blu-adm', organization_id: 'org-blumenau', name: 'Secretaria de Gestão Governamental', code: 'SEGG' },
];

export const initialDepartments: Department[] = [
  { id: 'dep-rh', organization_id: 'org-vitoria', secretariat_id: 'sec-adm', name: 'Departamento de Recursos Humanos e Folha' },
  { id: 'dep-ti', organization_id: 'org-vitoria', secretariat_id: 'sec-adm', name: 'Gerência de Tecnologia e Governo Digital' },
  { id: 'dep-vig', organization_id: 'org-vitoria', secretariat_id: 'sec-sau', name: 'Vigilância Epidemiológica e Sanitária' },
  { id: 'dep-ped', organization_id: 'org-vitoria', secretariat_id: 'sec-edu', name: 'Coordenação Pedagógica e Formação' },
  { id: 'dep-blu-rh', organization_id: 'org-blumenau', secretariat_id: 'sec-blu-adm', name: 'Diretoria de Gestão de Pessoas' },
];

export const initialUsers: User[] = [
  {
    id: 'usr-admin-global',
    name: 'Dr. Roberto Guimarães',
    email: 'admin@capacitagov.gov.br',
    cpf: '001.234.567-89',
    role: 'superadmin',
    job_title: 'Auditor e Administrador Geral da Plataforma',
    active: true,
    created_at: '2026-01-01T08:00:00Z',
  },
  {
    id: 'usr-gestor-vitoria',
    organization_id: 'org-vitoria',
    name: 'Helena Castro',
    email: 'helena.rh@pmvc.ba.gov.br',
    cpf: '333.444.555-66',
    registration_number: '10944-1',
    role: 'gestor',
    secretariat_id: 'sec-adm',
    department_id: 'dep-rh',
    job_title: 'Diretora de Desenvolvimento Humano e Capacitação',
    active: true,
    created_at: '2026-01-12T09:00:00Z',
  },
  {
    id: 'usr-gestor-blumenau',
    organization_id: 'org-blumenau',
    name: 'Carlos Eduardo Schmitt',
    email: 'carlos.gestao@blumenau.sc.gov.br',
    cpf: '444.555.666-77',
    registration_number: '20812-3',
    role: 'gestor',
    secretariat_id: 'sec-blu-adm',
    department_id: 'dep-blu-rh',
    job_title: 'Coordenador da Escola de Governo de Blumenau',
    active: true,
    created_at: '2026-02-18T10:00:00Z',
  },
  {
    id: 'usr-prof-juliana',
    organization_id: 'org-vitoria',
    name: 'Profa. Dra. Juliana Silveira',
    email: 'juliana.silveira@capacitagov.gov.br',
    cpf: '555.666.777-88',
    role: 'professor',
    job_title: 'Especialista em Direito Público e Contratações Administrativas',
    active: true,
    created_at: '2026-01-15T11:00:00Z',
  },
  {
    id: 'usr-prof-marcos',
    organization_id: 'org-vitoria',
    name: 'Prof. Marcos Andrade',
    email: 'marcos.andrade@capacitagov.gov.br',
    cpf: '666.777.888-99',
    role: 'professor',
    job_title: 'Mestre em Políticas Públicas e Gestão de Pessoas',
    active: true,
    created_at: '2026-01-20T14:00:00Z',
  },
  {
    id: 'usr-aluno-ana',
    organization_id: 'org-vitoria',
    name: 'Ana Paula Souza',
    email: 'ana.souza@pmvc.ba.gov.br',
    cpf: '123.456.789-01',
    registration_number: '54201-9',
    role: 'aluno',
    secretariat_id: 'sec-adm',
    department_id: 'dep-rh',
    job_title: 'Assistente Administrativa II',
    active: true,
    created_at: '2026-02-01T08:30:00Z',
  },
  {
    id: 'usr-aluno-lucas',
    organization_id: 'org-vitoria',
    name: 'Lucas Mendes',
    email: 'lucas.ti@pmvc.ba.gov.br',
    cpf: '234.567.890-12',
    registration_number: '58910-4',
    role: 'aluno',
    secretariat_id: 'sec-adm',
    department_id: 'dep-ti',
    job_title: 'Técnico de Suporte e Infraestrutura',
    active: true,
    created_at: '2026-02-05T09:15:00Z',
  },
  {
    id: 'usr-aluno-mariana',
    organization_id: 'org-vitoria',
    name: 'Mariana Ramos',
    email: 'mariana.saude@pmvc.ba.gov.br',
    cpf: '345.678.901-23',
    registration_number: '62014-8',
    role: 'aluno',
    secretariat_id: 'sec-sau',
    department_id: 'dep-vig',
    job_title: 'Enfermeira da Saúde da Família',
    active: true,
    created_at: '2026-02-10T13:40:00Z',
  },
];

export const initialCourses: Course[] = [
  {
    id: 'crs-licitacoes-ead',
    organization_id: 'org-vitoria',
    title: 'Nova Lei de Licitações e Contratos Administrativos (Lei 14.133/21)',
    description: 'Capacitação prática e aprofundada sobre a Lei 14.133/2021, abrangendo fase preparatória, planejamento, dispensa eletrônica, inexigibilidade e gestão fiscal de contratos nos municípios.',
    workload_hours: 40,
    category: 'Administração e Direito Público',
    modality: 'ead',
    instructor_id: 'usr-prof-juliana',
    instructor_name: 'Profa. Dra. Juliana Silveira',
    status: 'published',
    created_at: '2026-01-25T10:00:00Z',
    rating_avg: 4.9,
    rating_count: 84,
  },
  {
    id: 'crs-atendimento-presencial',
    organization_id: 'org-vitoria',
    title: 'Atendimento Humanizado ao Cidadão e Comunicação Pública Eficaz',
    description: 'Curso presencial voltado ao acolhimento qualificado na administração direta, gestão de conflitos no balcão e transparência ativa da Prefeitura.',
    workload_hours: 20,
    category: 'Gestão e Cidadania',
    modality: 'presencial',
    instructor_id: 'usr-prof-marcos',
    instructor_name: 'Prof. Marcos Andrade',
    status: 'published',
    created_at: '2026-02-01T14:00:00Z',
    rating_avg: 4.8,
    rating_count: 52,
  },
  {
    id: 'crs-hibrido-governanca',
    organization_id: 'org-vitoria',
    title: 'Governança Digital, Gestão de Documentos e Segurança da Informação',
    description: 'Formação em formato híbrido: módulos teóricos online combinados com oficinas práticas presenciais nos laboratórios de informática municipais.',
    workload_hours: 30,
    category: 'Tecnologia e Inovação',
    modality: 'hibrido',
    instructor_id: 'usr-prof-marcos',
    instructor_name: 'Prof. Marcos Andrade',
    status: 'published',
    created_at: '2026-02-10T09:00:00Z',
    rating_avg: 4.7,
    rating_count: 39,
  },
  {
    id: 'crs-etica-blumenau',
    organization_id: 'org-blumenau',
    title: 'Ética Pública e Integridade no Serviço Municipal de Blumenau',
    description: 'Capacitação institucional obrigatória sobre o Código de Conduta Ética dos Servidores Municipais e prevenção à corrupção.',
    workload_hours: 15,
    category: 'Legislação e Ética',
    modality: 'ead',
    instructor_id: 'usr-prof-juliana',
    instructor_name: 'Profa. Dra. Juliana Silveira',
    status: 'published',
    created_at: '2026-02-20T10:00:00Z',
    rating_avg: 5.0,
    rating_count: 14,
  },
];

export const initialModules: Module[] = [
  {
    id: 'mod-lic-1',
    course_id: 'crs-licitacoes-ead',
    title: 'Módulo 1: Fundamentos e Fase Preparatória da Lei 14.133/21',
    description: 'Princípios constitucionais, estudos técnicos preliminares (ETP) e termo de referência municipal.',
    order_index: 1,
    lessons: [
      {
        id: 'lsn-lic-101',
        module_id: 'mod-lic-1',
        title: 'Aula 1: Panorama e Transição para a Lei 14.133/21',
        description: 'Apresentação dos princípios orientadores: planejamento, transparência, segregação de funções e eficiência no gasto público.',
        content_type: 'video',
        // Vídeo institucional público para reprodução real
        content_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        duration_minutes: 18,
        order_index: 1,
      },
      {
        id: 'lsn-lic-102',
        module_id: 'mod-lic-1',
        title: 'Aula 2: Estudo Técnico Preliminar (ETP) e Matriz de Riscos',
        description: 'Construção prática do ETP conforme a regulamentação do Município de Vitória da Conquista.',
        content_type: 'pdf',
        pdf_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        duration_minutes: 25,
        order_index: 2,
      },
      {
        id: 'lsn-lic-103',
        module_id: 'mod-lic-1',
        title: 'Aula 3: Podcast Explicativo — Inovações da Dispensa Eletrônica',
        description: 'Áudio formativo sobre limites de valor da dispensa e operacionalização no portal de compras governamental.',
        content_type: 'audio',
        audio_url: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg',
        duration_minutes: 12,
        order_index: 3,
      },
      {
        id: 'lsn-lic-104',
        module_id: 'mod-lic-1',
        title: 'Aula 4: Guia Prático de Termo de Referência Municipal',
        description: 'Texto consolidado e diretrizes para elaboração da descrição do objeto sem direcionamento.',
        content_type: 'text',
        text_content: `## Guia Prático de Termo de Referência Municipal (TR)\n\nO Termo de Referência é o documento basilar da fase preparatória, elaborado a partir dos Estudos Técnicos Preliminares.\n\n### Elementos Obrigatórios:\n1. **Definição Clara do Objeto**: Especificação detalhada e impessoal dos bens ou serviços a serem contratados.\n2. **Fundamentação da Contratação**: Justificativa da necessidade pública e vinculação ao Plano de Contratações Anual (PCA).\n3. **Requisitos de Sustentabilidade**: Critérios ambientais e sociais exigidos pela Lei 14.133/21.\n4. **Modelo de Execução e Fiscalização**: Designação prévia do fiscal técnico e fiscal administrativo do contrato.`,
        duration_minutes: 15,
        order_index: 4,
      },
    ],
  },
  {
    id: 'mod-lic-2',
    course_id: 'crs-licitacoes-ead',
    title: 'Módulo 2: Procedimento Licitatório, Habilitação e Fiscalização',
    description: 'Critérios de julgamento, impugnações e atuação dos fiscais e gestores de contratos.',
    order_index: 2,
    lessons: [
      {
        id: 'lsn-lic-201',
        module_id: 'mod-lic-2',
        title: 'Aula 5: Atuação do Agente de Contratação e Comissão de Licitação',
        description: 'Perfil legal, responsabilidades civis e administrativas conforme o art. 8º da nova lei.',
        content_type: 'video',
        content_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        duration_minutes: 20,
        order_index: 1,
      },
      {
        id: 'lsn-lic-202',
        module_id: 'mod-lic-2',
        title: 'Aula 6: Manual de Fiscalização Contratual do Servidor',
        description: 'Procedimentos para recebimento provisório e definitivo, retenções e aplicação de penalidades.',
        content_type: 'pdf',
        pdf_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        duration_minutes: 30,
        order_index: 2,
      },
    ],
  },
  // Módulo para curso Híbrido (Parte Online)
  {
    id: 'mod-hib-1',
    course_id: 'crs-hibrido-governanca',
    title: 'Parte Online: Marco Legal da LGPD e Processo Eletrônico Municipal',
    description: 'Aulas conceituais online que devem ser assistidas antes das oficinas práticas em laboratório.',
    order_index: 1,
    lessons: [
      {
        id: 'lsn-hib-101',
        module_id: 'mod-hib-1',
        title: 'Aula 1 Online: Fundamentos da LGPD nos Órgãos Municipais',
        description: 'Bases legais para tratamento de dados pessoais de cidadãos e servidores.',
        content_type: 'video',
        content_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        duration_minutes: 22,
        order_index: 1,
      },
      {
        id: 'lsn-hib-102',
        module_id: 'mod-hib-1',
        title: 'Aula 2 Online: Cartilha de Segurança da Informação e Senhas',
        description: 'Boas práticas contra phishing e vazamento de dados em computadores da prefeitura.',
        content_type: 'pdf',
        pdf_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        duration_minutes: 15,
        order_index: 2,
      },
    ],
  },
];

export const initialClasses: ClassGroup[] = [
  {
    id: 'cls-atend-2026-1',
    organization_id: 'org-vitoria',
    course_id: 'crs-atendimento-presencial',
    course_title: 'Atendimento Humanizado ao Cidadão e Comunicação Pública Eficaz',
    name: 'Turma A — Secretaria de Administração e Saúde (Presencial)',
    instructor_id: 'usr-prof-marcos',
    instructor_name: 'Prof. Marcos Andrade',
    start_date: '2026-03-01',
    end_date: '2026-03-15',
    modality: 'presencial',
    max_capacity: 40,
    enrolled_count: 28,
    status: 'em_andamento',
    meetings: [
      {
        id: 'mtg-atend-1',
        class_id: 'cls-atend-2026-1',
        title: '1º Encontro: Postura Profissional e Escuta Ativa no Serviço Público',
        meeting_date: '2026-03-02',
        start_time: '08:30',
        end_time: '12:00',
        location: 'Auditório Central da Prefeitura',
        room: 'Auditório Carmen Miranda - Térreo',
        qr_secret: 'QR-ATEND-ENCONTRO-1-2026',
        materials_pdf_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      },
      {
        id: 'mtg-atend-2',
        class_id: 'cls-atend-2026-1',
        title: '2º Encontro: Gestão de Situações Delicadas e Vulnerabilidade Social',
        meeting_date: '2026-03-09',
        start_time: '08:30',
        end_time: '12:00',
        location: 'Auditório Central da Prefeitura',
        room: 'Auditório Carmen Miranda - Térreo',
        qr_secret: 'QR-ATEND-ENCONTRO-2-2026',
        materials_pdf_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      },
      {
        id: 'mtg-atend-3',
        class_id: 'cls-atend-2026-1',
        title: '3º Encontro: Oficina de Casos Reais e Simulação Prática',
        meeting_date: '2026-03-16',
        start_time: '08:30',
        end_time: '12:00',
        location: 'Auditório Central da Prefeitura',
        room: 'Auditório Carmen Miranda - Térreo',
        qr_secret: 'QR-ATEND-ENCONTRO-3-2026',
        materials_pdf_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      },
    ],
  },
  {
    id: 'cls-hib-2026-1',
    organization_id: 'org-vitoria',
    course_id: 'crs-hibrido-governanca',
    course_title: 'Governança Digital, Gestão de Documentos e Segurança da Informação',
    name: 'Turma Híbrida 01 — Servidores de Gestão e TI',
    instructor_id: 'usr-prof-marcos',
    instructor_name: 'Prof. Marcos Andrade',
    start_date: '2026-03-05',
    end_date: '2026-03-25',
    modality: 'hibrido',
    max_capacity: 30,
    enrolled_count: 22,
    status: 'em_andamento',
    meetings: [
      {
        id: 'mtg-hib-1',
        class_id: 'cls-hib-2026-1',
        title: 'Oficina Presencial 1: Parametrização do Sistema de Processo Eletrônico',
        meeting_date: '2026-03-10',
        start_time: '14:00',
        end_time: '17:30',
        location: 'Laboratório de Inovação Digital da Prefeitura',
        room: 'Lab 02 - Anexo Administrativo',
        qr_secret: 'QR-HIB-LAB-1-2026',
      },
      {
        id: 'mtg-hib-2',
        class_id: 'cls-hib-2026-1',
        title: 'Oficina Presencial 2: Prática de Assinatura Digital ICP-Brasil e Tramitação',
        meeting_date: '2026-03-17',
        start_time: '14:00',
        end_time: '17:30',
        location: 'Laboratório de Inovação Digital da Prefeitura',
        room: 'Lab 02 - Anexo Administrativo',
        qr_secret: 'QR-HIB-LAB-2-2026',
      },
    ],
  },
];

export const initialAttendances: AttendanceRecord[] = [
  {
    id: 'att-1',
    meeting_id: 'mtg-atend-1',
    user_id: 'usr-aluno-ana',
    user_name: 'Ana Paula Souza',
    user_cpf: '123.456.789-01',
    user_secretariat: 'Administração',
    status: 'presente',
    method: 'qr_code',
    registered_at: '2026-03-02T08:34:10Z',
  },
  {
    id: 'att-2',
    meeting_id: 'mtg-atend-1',
    user_id: 'usr-aluno-lucas',
    user_name: 'Lucas Mendes',
    user_cpf: '234.567.890-12',
    user_secretariat: 'Administração',
    status: 'presente',
    method: 'manual',
    registered_at: '2026-03-02T08:40:00Z',
  },
  {
    id: 'att-3',
    meeting_id: 'mtg-atend-1',
    user_id: 'usr-aluno-mariana',
    user_name: 'Mariana Ramos',
    user_cpf: '345.678.901-23',
    user_secretariat: 'Saúde',
    status: 'presente',
    method: 'manual',
    registered_at: '2026-03-02T08:42:00Z',
  },
];

export const initialQuestions: Question[] = [
  {
    id: 'qst-1',
    organization_id: 'org-vitoria',
    course_id: 'crs-licitacoes-ead',
    prompt: 'Conforme a Lei Federal nº 14.133/2021, qual documento é o instrumento preparatório obrigatório que demonstra a viabilidade técnica e econômica da contratação pública?',
    difficulty: 'facil',
    category: 'Fase Preparatória',
    explanation: 'O Estudo Técnico Preliminar (ETP) é expressamente previsto no art. 18 da Lei 14.133/21 como documento que consubstancia a primeira etapa do planejamento de uma contratação.',
    options: [
      { id: 'opt-1-a', question_id: 'qst-1', text: 'Estudo Técnico Preliminar (ETP)', is_correct: true, order_index: 1 },
      { id: 'opt-1-b', question_id: 'qst-1', text: 'Nota de Empenho Global', is_correct: false, order_index: 2 },
      { id: 'opt-1-c', question_id: 'qst-1', text: 'Ata de Registro de Preços', is_correct: false, order_index: 3 },
      { id: 'opt-1-d', question_id: 'qst-1', text: 'Recibo Provisório de Materiais', is_correct: false, order_index: 4 },
    ],
  },
  {
    id: 'qst-2',
    organization_id: 'org-vitoria',
    course_id: 'crs-licitacoes-ead',
    prompt: 'Na nova sistemática de compras públicas, qual modalidade licitatória é voltada especificamente para contratação de obras, serviços e compras em que a Administração Pública busca desenvolver soluções inovadoras?',
    difficulty: 'medio',
    category: 'Modalidades Licitatórias',
    explanation: 'O Diálogo Competitivo é uma modalidade introduzida no ordenamento brasileiro pela Lei 14.133/21 para objetos complexos que exigem diálogo com os concorrentes para definir a solução.',
    options: [
      { id: 'opt-2-a', question_id: 'qst-2', text: 'Tomada de Preços', is_correct: false, order_index: 1 },
      { id: 'opt-2-b', question_id: 'qst-2', text: 'Diálogo Competitivo', is_correct: true, order_index: 2 },
      { id: 'opt-2-c', question_id: 'qst-2', text: 'Convite Eletrônico', is_correct: false, order_index: 3 },
      { id: 'opt-2-d', question_id: 'qst-2', text: 'Concurso Fechado', is_correct: false, order_index: 4 },
    ],
  },
  {
    id: 'qst-3',
    organization_id: 'org-vitoria',
    course_id: 'crs-licitacoes-ead',
    prompt: 'O princípio da segregação de funções, consagrado no art. 5º da Lei 14.133/2021, veda expressamente:',
    difficulty: 'medio',
    category: 'Princípios e Governança',
    explanation: 'A segregação de funções veda a atribuição de funções distintas e incompatíveis ao mesmo agente público, minimizando o risco de erros e fraudes.',
    options: [
      { id: 'opt-3-a', question_id: 'qst-3', text: 'Que o mesmo servidor atue simultaneamente na fase de planejamento, fiscalização e pagamento sem independência', is_correct: true, order_index: 1 },
      { id: 'opt-3-b', question_id: 'qst-3', text: 'A participação de mais de um servidor na comissão de licitação', is_correct: false, order_index: 2 },
      { id: 'opt-3-c', question_id: 'qst-3', text: 'A designação de servidores efetivos para a fiscalização contratual', is_correct: false, order_index: 3 },
      { id: 'opt-3-d', question_id: 'qst-3', text: 'O uso de sistemas eletrônicos compartilhados entre secretarias', is_correct: false, order_index: 4 },
    ],
  },
  {
    id: 'qst-4',
    organization_id: 'org-vitoria',
    course_id: 'crs-licitacoes-ead',
    prompt: 'Em relação à gestão e fiscalização de contratos administrativos, qual é o papel do Fiscal Técnico?',
    difficulty: 'medio',
    category: 'Fiscalização de Contratos',
    explanation: 'O Fiscal Técnico acompanha a perfeita execução do objeto, verificando quantidade, qualidade e conformidade das especificações contratadas.',
    options: [
      { id: 'opt-4-a', question_id: 'qst-4', text: 'Acompanhar a execução do objeto para aferir cumprimento de prazos, quantidades e padrões de qualidade pactuados', is_correct: true, order_index: 1 },
      { id: 'opt-4-b', question_id: 'qst-4', text: 'Emitir autorização bancária e assinar cheques da tesouraria', is_correct: false, order_index: 2 },
      { id: 'opt-4-c', question_id: 'qst-4', text: 'Redigir a ata final da sessão pública de pregão', is_correct: false, order_index: 3 },
      { id: 'opt-4-d', question_id: 'qst-4', text: 'Revogar o edital de licitação em caso de conveniência', is_correct: false, order_index: 4 },
    ],
  },
  {
    id: 'qst-5',
    organization_id: 'org-vitoria',
    course_id: 'crs-licitacoes-ead',
    prompt: 'Qual é o portal público oficial e obrigatório centralizado na internet para divulgação de todos os atos exigidos pela Lei 14.133/2021?',
    difficulty: 'facil',
    category: 'Transparência e Publicidade',
    explanation: 'O Portal Nacional de Contratações Públicas (PNCP) é o sítio eletrônico oficial determinado pelo art. 174 da Lei 14.133/21.',
    options: [
      { id: 'opt-5-a', question_id: 'qst-5', text: 'Portal Nacional de Contratações Públicas (PNCP)', is_correct: true, order_index: 1 },
      { id: 'opt-5-b', question_id: 'qst-5', text: 'Diário Oficial Privado', is_correct: false, order_index: 2 },
      { id: 'opt-5-c', question_id: 'qst-5', text: 'Cadastro Nacional de Imóveis Rurais', is_correct: false, order_index: 3 },
      { id: 'opt-5-d', question_id: 'qst-5', text: 'Bolsa Municipal de Mercadorias', is_correct: false, order_index: 4 },
    ],
  },
];

export const initialAssessments: Assessment[] = [
  {
    id: 'asmt-lic-final',
    course_id: 'crs-licitacoes-ead',
    course_title: 'Nova Lei de Licitações e Contratos Administrativos (Lei 14.133/21)',
    title: 'Avaliação Final de Certificação — Lei 14.133/2021',
    description: 'Avaliação oficial para concessão de certificado de capacitação. Prova com monitoramento ético ativo, temporizador de servidor e salvamento contínuo.',
    time_limit_minutes: 30,
    min_score_percent: 70,
    max_attempts: 2,
    max_exit_tolerated: 3,
    shuffle_questions: true,
    num_questions: 5,
  },
];

export const initialEnrollments: Enrollment[] = [
  {
    id: 'enr-ana-licitacoes',
    organization_id: 'org-vitoria',
    user_id: 'usr-aluno-ana',
    course_id: 'crs-licitacoes-ead',
    is_mandatory: true,
    due_date: '2026-04-30',
    status: 'concluido',
    progress_percent: 100,
    enrolled_at: '2026-02-01T10:00:00Z',
    completed_at: '2026-02-18T16:45:00Z',
    last_lesson_id: 'lsn-lic-202',
  },
  {
    id: 'enr-ana-atendimento',
    organization_id: 'org-vitoria',
    user_id: 'usr-aluno-ana',
    course_id: 'crs-atendimento-presencial',
    class_id: 'cls-atend-2026-1',
    is_mandatory: false,
    status: 'ativo',
    progress_percent: 33, // 1 de 3 encontros
    enrolled_at: '2026-02-15T09:00:00Z',
  },
  {
    id: 'enr-ana-hibrido',
    organization_id: 'org-vitoria',
    user_id: 'usr-aluno-ana',
    course_id: 'crs-hibrido-governanca',
    class_id: 'cls-hib-2026-1',
    is_mandatory: true,
    due_date: '2026-04-15',
    status: 'ativo',
    progress_percent: 60,
    ead_progress_percent: 100,
    presencial_progress_percent: 50,
    enrolled_at: '2026-02-20T11:00:00Z',
    last_lesson_id: 'lsn-hib-102',
  },
  {
    id: 'enr-lucas-licitacoes',
    organization_id: 'org-vitoria',
    user_id: 'usr-aluno-lucas',
    course_id: 'crs-licitacoes-ead',
    is_mandatory: false,
    status: 'ativo',
    progress_percent: 25,
    enrolled_at: '2026-02-05T14:00:00Z',
    last_lesson_id: 'lsn-lic-101',
  },
  {
    id: 'enr-mariana-atendimento',
    organization_id: 'org-vitoria',
    user_id: 'usr-aluno-mariana',
    course_id: 'crs-atendimento-presencial',
    class_id: 'cls-atend-2026-1',
    is_mandatory: true,
    due_date: '2026-03-31',
    status: 'ativo',
    progress_percent: 33,
    enrolled_at: '2026-02-10T15:00:00Z',
  },
];

export const initialCertificates: Certificate[] = [
  {
    id: 'cert-ana-lic-001',
    code: 'PMVC-2026-LIC-882194',
    enrollment_id: 'enr-ana-licitacoes',
    user_id: 'usr-aluno-ana',
    user_name: 'Ana Paula Souza',
    user_cpf: '123.456.789-01',
    user_registration: '54201-9',
    course_id: 'crs-licitacoes-ead',
    course_title: 'Nova Lei de Licitações e Contratos Administrativos (Lei 14.133/21)',
    course_category: 'Administração e Direito Público',
    organization_id: 'org-vitoria',
    organization_name: 'Prefeitura Municipal de Vitória da Conquista',
    coat_of_arms_url: DEFAULT_COAT_OF_ARMS,
    workload_hours: 40,
    grade_percent: 92.5,
    attendance_percent: 100,
    issued_at: '2026-02-18T16:50:00Z',
  },
];

export const initialEvaluations: CourseEvaluation[] = [
  {
    id: 'eval-1',
    course_id: 'crs-licitacoes-ead',
    user_id: 'usr-aluno-ana',
    user_name: 'Ana Paula Souza',
    rating: 5,
    usefulness_score: 5,
    comment: 'Excelente didática da Profa. Juliana. Esclareceu com precisão os desafios práticos do Estudo Técnico Preliminar e das dispensas eletrônicas para nossa secretaria.',
    created_at: '2026-02-18T17:00:00Z',
  },
];

export const initialAuditLogs: AuditLog[] = [
  {
    id: 'log-1',
    organization_id: 'org-vitoria',
    organization_name: 'Prefeitura Municipal de Vitória da Conquista',
    user_id: 'usr-gestor-vitoria',
    user_name: 'Helena Castro (Gestora RH)',
    action: 'MATRICULA_LOTE',
    entity_name: 'Enrollment',
    entity_id: 'batch-2026-02',
    details: 'Matrícula compulsória de 15 servidores da SMAI no curso Lei 14.133/21 com prazo até 30/04/2026.',
    ip_address: '187.52.190.14',
    created_at: '2026-02-01T10:05:00Z',
  },
  {
    id: 'log-2',
    organization_id: 'org-vitoria',
    organization_name: 'Prefeitura Municipal de Vitória da Conquista',
    user_id: 'usr-aluno-ana',
    user_name: 'Ana Paula Souza (Servidora)',
    action: 'EMISSAO_CERTIFICADO',
    entity_name: 'Certificate',
    entity_id: 'PMVC-2026-LIC-882194',
    details: 'Emissão automática de certificado após aprovação na prova com aproveitamento de 92.5%.',
    ip_address: '189.102.44.82',
    created_at: '2026-02-18T16:50:00Z',
  },
];

// ==========================================
// STORE EM MEMÓRIA DO SERVIDOR COM ESTADO ATIVO
// ==========================================

class DataStore {
  organizations: Organization[] = [...initialOrganizations];
  secretariats: Secretariat[] = [...initialSecretariats];
  departments: Department[] = [...initialDepartments];
  users: User[] = [...initialUsers];
  courses: Course[] = [...initialCourses];
  modules: Module[] = [...initialModules];
  classes: ClassGroup[] = [...initialClasses];
  attendances: AttendanceRecord[] = [...initialAttendances];
  questions: Question[] = [...initialQuestions];
  assessments: Assessment[] = [...initialAssessments];
  assessmentAttempts: AssessmentAttempt[] = [];
  enrollments: Enrollment[] = [...initialEnrollments];
  certificates: Certificate[] = [...initialCertificates];
  evaluations: CourseEvaluation[] = [...initialEvaluations];
  auditLogs: AuditLog[] = [...initialAuditLogs];
  // Registro de progresso de aulas: chave: `${userId}_${lessonId}`
  lessonProgress: Map<string, { completed: boolean; watch_time_seconds: number; last_position_seconds: number; last_accessed_at: string }> = new Map([
    ['usr-aluno-ana_lsn-lic-101', { completed: true, watch_time_seconds: 1080, last_position_seconds: 1080, last_accessed_at: '2026-02-02T10:00:00Z' }],
    ['usr-aluno-ana_lsn-lic-102', { completed: true, watch_time_seconds: 1500, last_position_seconds: 1500, last_accessed_at: '2026-02-05T14:00:00Z' }],
    ['usr-aluno-ana_lsn-lic-103', { completed: true, watch_time_seconds: 720, last_position_seconds: 720, last_accessed_at: '2026-02-08T11:00:00Z' }],
    ['usr-aluno-ana_lsn-lic-104', { completed: true, watch_time_seconds: 900, last_position_seconds: 900, last_accessed_at: '2026-02-10T16:00:00Z' }],
    ['usr-aluno-ana_lsn-lic-201', { completed: true, watch_time_seconds: 1200, last_position_seconds: 1200, last_accessed_at: '2026-02-14T09:00:00Z' }],
    ['usr-aluno-ana_lsn-lic-202', { completed: true, watch_time_seconds: 1800, last_position_seconds: 1800, last_accessed_at: '2026-02-18T15:00:00Z' }],
    ['usr-aluno-ana_lsn-hib-101', { completed: true, watch_time_seconds: 1320, last_position_seconds: 1320, last_accessed_at: '2026-02-22T10:00:00Z' }],
    ['usr-aluno-ana_lsn-hib-102', { completed: true, watch_time_seconds: 900, last_position_seconds: 900, last_accessed_at: '2026-02-23T14:00:00Z' }],
  ]);

  addAuditLog(entry: Omit<AuditLog, 'id' | 'created_at'>) {
    const log: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
      ...entry,
    };
    this.auditLogs.unshift(log);
    return log;
  }
}

export const db = new DataStore();
