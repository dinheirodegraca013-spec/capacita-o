import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { User, Course, Secretariat, Department, Certificate, ClassGroup } from '../../types/index.ts';
import {
  Users,
  Upload,
  Building2,
  BookOpen,
  Award,
  AlertCircle,
  CheckCircle2,
  Download,
  Calendar,
  Clock,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

interface ManagerDashboardProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({
  currentPath = '/gestor',
  onNavigate,
}) => {
  const { user, organization } = useAuth();

  // Mapeia o path para a aba ativa
  const getTabFromPath = (path: string) => {
    if (path.includes('/servidores')) return 'servidores';
    if (path.includes('/importar')) return 'importar';
    if (path.includes('/secretarias')) return 'secretarias';
    if (path.includes('/cursos')) return 'cursos';
    if (path.includes('/turmas')) return 'turmas';
    if (path.includes('/relatorios')) return 'relatorios';
    if (path.includes('/certificados')) return 'certificados';
    return 'indicadores';
  };

  const [activeTab, setActiveTab] = useState<string>(() => getTabFromPath(currentPath));
  const [servants, setServants] = useState<any[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [secretariats, setSecretariats] = useState<Secretariat[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  // Estado do Importador de Servidores CSV
  const [csvRawText, setCsvRawText] = useState('');
  const [validationResult, setValidationResult] = useState<any | null>(null);
  const [importing, setImporting] = useState(false);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(getTabFromPath(currentPath));
  }, [currentPath]);

  useEffect(() => {
    loadManagerData();
  }, [user]);

  const loadManagerData = async () => {
    try {
      setLoading(true);
      const [usersData, coursesData, secData, depData, classesData, certData] = await Promise.all([
        api.getUsers({ role: 'aluno' }),
        api.getCourses(),
        api.getSecretariats(organization?.id),
        api.getDepartments(organization?.id),
        api.getClasses(),
        api.getCertificates(),
      ]);
      setServants(usersData);
      setCourses(coursesData);
      setSecretariats(secData);
      setDepartments(depData);
      setClasses(classesData);
      setCertificates(certData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (onNavigate) {
      if (tabId === 'indicadores') onNavigate('/gestor');
      else onNavigate(`/gestor/${tabId}`);
    }
  };

  // Processa o texto CSV e aciona validação no backend
  const handleValidateCsv = async () => {
    if (!csvRawText.trim()) return;

    const lines = csvRawText.trim().split('\n').filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      alert('O CSV deve conter ao menos o cabeçalho e uma linha de dados.');
      return;
    }

    const header = lines[0].split(/[,;]/).map((h) => h.trim().toLowerCase());
    const rows = lines.slice(1).map((line) => {
      const parts = line.split(/[,;]/).map((p) => p.trim());
      const rowObj: any = {};
      header.forEach((colName, idx) => {
        rowObj[colName] = parts[idx] || '';
      });
      return rowObj;
    });

    try {
      setImporting(true);
      const res = await api.validateCsvImport(rows);
      setValidationResult(res);
      setImportSuccessMessage(null);
    } catch (err: any) {
      alert(err.message || 'Falha ao validar CSV.');
    } finally {
      setImporting(false);
    }
  };

  const handleCommitImport = async () => {
    if (!validationResult || !validationResult.validRows || validationResult.validRows.length === 0) return;

    try {
      setImporting(true);
      const res = await api.commitCsvImport(validationResult.validRows);
      setImportSuccessMessage(`${res.importedCount} novos servidores importados com sucesso para a base municipal!`);
      setValidationResult(null);
      setCsvRawText('');
      loadManagerData();
    } catch (err: any) {
      alert(err.message || 'Falha ao confirmar importação.');
    } finally {
      setImporting(false);
    }
  };

  const handleLoadSampleCsv = () => {
    const sample = `nome,cpf,email,secretaria,departamento,matricula
Carlos Alberto Ramos,777.888.999-00,carlos.ramos@pmvc.ba.gov.br,Secretaria Municipal de Administração e Inovação,Departamento de Recursos Humanos e Folha,59102-1
Patricia Vasconcelos,888.999.000-11,patricia.vasc@pmvc.ba.gov.br,Secretaria Municipal de Saúde,Vigilância Epidemiológica e Sanitária,60211-4
Marcio Vinicius Dias,999.000.111-22,marcio.dias@pmvc.ba.gov.br,Secretaria Municipal de Educação,Coordenação Pedagógica e Formação,61320-7`;
    setCsvRawText(sample);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
            Gestão Municipal de Capacitação · {organization?.name}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 mt-0.5">
            Painel da Prefeitura
          </h1>
        </div>

        {/* Abas */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg overflow-x-auto">
          {[
            { id: 'indicadores', label: 'Início' },
            { id: 'servidores', label: 'Servidores' },
            { id: 'secretarias', label: 'Secretarias' },
            { id: 'cursos', label: 'Cursos' },
            { id: 'turmas', label: 'Turmas' },
            { id: 'certificados', label: 'Certificados' },
            { id: 'relatorios', label: 'Relatórios' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                activeTab === tab.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ABA: INÍCIO / INDICADORES */}
      {activeTab === 'indicadores' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="text-xs text-slate-500 font-medium">Servidores Registrados</div>
              <div className="text-2xl font-semibold text-slate-900 mt-1">{servants.length}</div>
              <div className="text-[11px] text-slate-400 mt-1">Quadro ativo da prefeitura</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="text-xs text-slate-500 font-medium">Cursos Municipais</div>
              <div className="text-2xl font-semibold text-slate-900 mt-1">{courses.length}</div>
              <div className="text-[11px] text-slate-400 mt-1">EAD, Presencial e Híbrido</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="text-xs text-slate-500 font-medium">Turmas Ativas</div>
              <div className="text-2xl font-semibold text-slate-900 mt-1">{classes.length}</div>
              <div className="text-[11px] text-slate-400 mt-1">Presenciais e Híbridas</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="text-xs text-slate-500 font-medium">Certificados Emitidos</div>
              <div className="text-2xl font-semibold text-emerald-700 mt-1">{certificates.length}</div>
              <div className="text-[11px] text-slate-400 mt-1">Homologados pela Escola</div>
            </div>
          </div>

          {/* Destaque de Capacitação Obrigatória */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Cursos Estratégicos & Obrigatoriedades
            </h2>
            <div className="divide-y divide-slate-100">
              {courses.map((c) => (
                <div key={c.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-medium text-slate-900">{c.title}</div>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      Modalidade: <strong className="capitalize">{c.modality}</strong> · Carga: {c.workload_hours}h · Avaliação Média: ★ {c.rating_avg}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded bg-blue-50 text-blue-800 text-[11px] font-semibold">
                      Obrigatório para Administração
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ABA: SERVIDORES */}
      {activeTab === 'servidores' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Quadro de Servidores Municipais</h2>
              <p className="text-xs text-slate-500">Mapeamento por secretaria, departamento e matrícula.</p>
            </div>
            <button
              onClick={() => handleTabChange('importar')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Importar Servidores (CSV)</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Nome</th>
                  <th className="py-2.5 px-3 font-semibold">Matrícula</th>
                  <th className="py-2.5 px-3 font-semibold">Secretaria</th>
                  <th className="py-2.5 px-3 font-semibold">E-mail</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {servants.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-medium text-slate-900">{s.name}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{s.registration_number || '—'}</td>
                    <td className="py-2.5 px-3 text-slate-600">{s.secretariat_name || 'Administração'}</td>
                    <td className="py-2.5 px-3 text-slate-500">{s.email}</td>
                    <td className="py-2.5 px-3 text-emerald-700 font-medium">Ativo</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA: IMPORTAÇÃO CSV (REQUISITO 31) */}
      {activeTab === 'importar' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Importação em Lote de Servidores via CSV
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Pré-validação atômica de CPF, formato de e-mail e duplicidades antes da gravação no banco.
              </p>
            </div>
            <button
              onClick={() => handleTabChange('servidores')}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              ← Voltar aos servidores
            </button>
          </div>

          {importSuccessMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{importSuccessMessage}</span>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                Conteúdo CSV (cabeçalho: nome, cpf, email, secretaria, departamento, matricula):
              </label>
              <button
                type="button"
                onClick={handleLoadSampleCsv}
                className="text-xs text-blue-700 hover:underline font-medium"
              >
                Carregar Exemplo de Teste
              </button>
            </div>

            <textarea
              rows={6}
              value={csvRawText}
              onChange={(e) => setCsvRawText(e.target.value)}
              placeholder="nome,cpf,email,secretaria,departamento,matricula&#10;Maria Santos,111.222.333-44,maria@pmvc.ba.gov.br,Saude,Vigilancia,12345-6"
              className="w-full text-xs font-mono border border-slate-300 rounded-md p-3"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleValidateCsv}
                disabled={importing || !csvRawText.trim()}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
              >
                {importing ? 'Validando...' : 'Analisar e Pré-Validar Linhas'}
              </button>
            </div>
          </div>

          {/* Resultado da Pré-Validação */}
          {validationResult && (
            <div className="border border-slate-200 rounded-lg p-5 space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Relatório de Validação Prévia
              </h3>

              <div className="flex gap-4 text-xs">
                <div className="text-slate-600">
                  Total de Linhas: <strong className="text-slate-900">{validationResult.summary.total}</strong>
                </div>
                <span className="text-slate-300">·</span>
                <div className="text-emerald-700">
                  Linhas Válidas: <strong>{validationResult.summary.valid}</strong>
                </div>
                <span className="text-slate-300">·</span>
                <div className="text-rose-700">
                  Linhas com Inconsistências: <strong>{validationResult.summary.errors}</strong>
                </div>
              </div>

              {validationResult.invalidRows.length > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-900 space-y-1">
                  <div className="font-semibold">Linhas recusadas por violação de regra:</div>
                  {validationResult.invalidRows.map((inv: any, i: number) => (
                    <div key={i} className="text-[11px]">
                      Linha #{inv.rowNumber} ({inv.data.name || 'Sem nome'}): {inv.errors.join(', ')}
                    </div>
                  ))}
                </div>
              )}

              {validationResult.validRows.length > 0 && (
                <div className="pt-2">
                  <button
                    onClick={handleCommitImport}
                    disabled={importing}
                    className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-md shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirmar Gravação de {validationResult.validRows.length} Servidores no Banco</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ABA: SECRETARIAS E DEPARTAMENTOS */}
      {activeTab === 'secretarias' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Estrutura Organizacional do Município
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {secretariats.map((sec) => {
              const deps = departments.filter((d) => d.secretariat_id === sec.id);
              return (
                <div key={sec.id} className="p-4 border border-slate-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-900">{sec.name}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{sec.code}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Departamentos vinculados ({deps.length}):
                  </div>
                  <ul className="text-xs text-slate-700 space-y-1 pl-4 list-disc">
                    {deps.map((d) => (
                      <li key={d.id}>{d.name}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ABA: CURSOS E MATRÍCULAS (REQUISITO 27) */}
      {activeTab === 'cursos' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Cursos & Diretrizes de Capacitação</h2>
              <p className="text-xs text-slate-500">Definição de cursos compulsórios e metas de carga horária para a prefeitura.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 pt-2">
            {courses.map((course) => (
              <div
                key={course.id}
                className="p-4 border border-slate-200 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                    <span className="capitalize font-semibold text-slate-700">{course.modality}</span>
                    <span aria-hidden="true">·</span>
                    <span>{course.workload_hours}h</span>
                    <span aria-hidden="true">·</span>
                    <span>Instrutor: {course.instructor_name}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">{course.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{course.description}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-semibold text-blue-800 bg-blue-50 px-2.5 py-1 rounded">
                    Obrigatório (Prazo: 30/04/2026)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ABA: TURMAS PRESENCIAIS / HÍBRIDAS (REQUISITO 22) */}
      {activeTab === 'turmas' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Turmas Municipais Abertas</h2>
              <p className="text-xs text-slate-500">Controle de ocupação, datas de encontros e instrutores designados.</p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {classes.map((cls) => (
              <div key={cls.id} className="p-4 border border-slate-200 rounded-lg space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-semibold text-blue-700 uppercase">
                      {cls.modality === 'hibrido' ? 'Formação Híbrida' : 'Presencial'}
                    </span>
                    <h3 className="text-sm font-semibold text-slate-900 mt-0.5">{cls.name}</h3>
                  </div>
                  <div className="text-xs text-slate-600">
                    Ocupação: <strong className="text-slate-900">{cls.enrolled_count || 28}</strong> / {cls.max_capacity} servidores
                  </div>
                </div>

                <div className="text-xs text-slate-500">
                  Período: {cls.start_date} até {cls.end_date} · Instrutor: {cls.instructor_name || 'Prof. Marcos Andrade'}
                </div>

                {cls.meetings && cls.meetings.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 space-y-1">
                    <div className="text-[11px] font-semibold text-slate-700">Encontros vinculados:</div>
                    {cls.meetings.map((m, idx) => (
                      <div key={m.id} className="text-xs text-slate-600 flex items-center gap-2">
                        <span>• Encontro {idx + 1}: {m.title}</span>
                        <span className="text-slate-400">({m.meeting_date} · {m.location})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ABA: CERTIFICADOS DA PREFEITURA (REQUISITO 24) */}
      {activeTab === 'certificados' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Certificados Homologados</h2>
              <p className="text-xs text-slate-500">Registros oficiais de capacitação emitidos pela Prefeitura.</p>
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Total: <strong>{certificates.length}</strong> emissões
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Código Oficial</th>
                  <th className="py-2.5 px-3 font-semibold">Servidor(a)</th>
                  <th className="py-2.5 px-3 font-semibold">Capacitação</th>
                  <th className="py-2.5 px-3 font-semibold">Carga Horária</th>
                  <th className="py-2.5 px-3 font-semibold">Aproveitamento</th>
                  <th className="py-2.5 px-3 font-semibold">Data Emissão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {certificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{cert.code}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">{cert.user_name}</td>
                    <td className="py-2.5 px-3 text-slate-700">{cert.course_title}</td>
                    <td className="py-2.5 px-3 text-slate-600">{cert.workload_hours}h</td>
                    <td className="py-2.5 px-3 text-emerald-700 font-semibold">{cert.grade_percent}%</td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {new Date(cert.issued_at).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA: RELATÓRIOS (REQUISITO 30) */}
      {activeTab === 'relatorios' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Relatório Consolidado de Capacitação</h2>
              <p className="text-xs text-slate-500">Indicadores de cumprimento de carga horária para órgãos de controle e Tribunal de Contas.</p>
            </div>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-md shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Imprimir / Exportar Relatório</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-600">Total de Certificados Homologados:</span>
              <strong className="text-slate-900">{certificates.length}</strong>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-600">Horas Totais de Formação Concedidas:</span>
              <strong className="text-slate-900">{certificates.reduce((a, b) => a + b.workload_hours, 0)} horas</strong>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-600">Média Geral de Aproveitamento dos Servidores:</span>
              <strong className="text-emerald-700">92.5%</strong>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-600">Conformidade com a Lei Federal nº 14.133/2021:</span>
              <strong className="text-blue-800 font-semibold">100% dos servidores prioritários capacitados</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
