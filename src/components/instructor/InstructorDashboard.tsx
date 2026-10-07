import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { ClassGroup, Course, AttendanceRecord, Question } from '../../types/index.ts';
import {
  Users,
  Calendar,
  QrCode,
  CheckCircle2,
  XCircle,
  FileCheck2,
  Clock,
  MapPin,
  BookOpen,
  Plus,
} from 'lucide-react';

interface InstructorDashboardProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

export const InstructorDashboard: React.FC<InstructorDashboardProps> = ({
  currentPath = '/professor',
  onNavigate,
}) => {
  const { user } = useAuth();

  const getTabFromPath = (path: string) => {
    if (path.includes('/cursos')) return 'cursos';
    if (path.includes('/turmas')) return 'turmas';
    if (path.includes('/presencas')) return 'presencas';
    if (path.includes('/avaliacoes')) return 'avaliacoes';
    return 'turmas';
  };

  const [activeTab, setActiveTab] = useState<string>(() => getTabFromPath(currentPath));
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeeting, setSelectedMeeting] = useState<any | null>(null);
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [qrModalData, setQrModalData] = useState<any | null>(null);

  useEffect(() => {
    setActiveTab(getTabFromPath(currentPath));
  }, [currentPath]);

  useEffect(() => {
    loadInstructorData();
  }, [user]);

  const loadInstructorData = async () => {
    try {
      setLoading(true);
      const [classesData, coursesData, studentsData] = await Promise.all([
        api.getClasses(),
        api.getCourses(),
        api.getUsers({ role: 'aluno' }),
      ]);
      setClasses(classesData);
      setCourses(coursesData);
      setStudents(studentsData);

      // Pré-seleciona primeiro encontro se existir para facilitar a chamada
      if (classesData.length > 0 && classesData[0].meetings && classesData[0].meetings.length > 0) {
        const firstMtg = classesData[0].meetings[0];
        setSelectedMeeting(firstMtg);
        const records = await api.getMeetingAttendances(firstMtg.id);
        setAttendances(records);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (onNavigate) {
      if (tabId === 'turmas') onNavigate('/professor/turmas');
      else onNavigate(`/professor/${tabId}`);
    }
  };

  const handleOpenAttendance = async (meeting: any) => {
    setSelectedMeeting(meeting);
    try {
      const records = await api.getMeetingAttendances(meeting.id);
      setAttendances(records);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAttendance = async (userId: string, status: string) => {
    if (!selectedMeeting) return;
    try {
      const updated = await api.markAttendance(selectedMeeting.id, {
        user_id: userId,
        status,
      });
      setAttendances((prev) => {
        const index = prev.findIndex((a) => a.user_id === userId);
        if (index >= 0) {
          const clone = [...prev];
          clone[index] = updated;
          return clone;
        }
        return [...prev, updated];
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateQr = async (meetingId: string) => {
    try {
      const data = await api.getMeetingQr(meetingId);
      setQrModalData(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Painel do Professor / Instrutor
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestão pedagógica de turmas municipais, frequência presencial e avaliações.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          {[
            { id: 'turmas', label: 'Minhas Turmas' },
            { id: 'cursos', label: 'Meus Cursos' },
            { id: 'presencas', label: 'Presenças & QR Code' },
            { id: 'avaliacoes', label: 'Banco de Questões' },
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

      {/* ABA: MINHAS TURMAS OU PRESENÇAS */}
      {(activeTab === 'turmas' || activeTab === 'presencas') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna 1 & 2: Lista de Turmas e Encontros */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Minhas Turmas Ativas ({classes.length})
            </h2>

            {classes.map((cls) => (
              <div
                key={cls.id}
                className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[11px] font-semibold text-blue-700 uppercase">
                      {cls.modality === 'hibrido' ? 'Turma Híbrida' : 'Turma Presencial'}
                    </span>
                    <h3 className="text-base font-semibold text-slate-900 mt-0.5">
                      {cls.name}
                    </h3>
                  </div>
                  <div className="text-xs text-slate-500">
                    Capacidade: <strong className="text-slate-900">{cls.enrolled_count || 28}</strong> / {cls.max_capacity} servidores
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-xs font-semibold text-slate-700">Encontros Agendados:</div>
                  {cls.meetings?.map((meeting, idx) => (
                    <div
                      key={meeting.id}
                      className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="text-xs font-semibold text-slate-800">
                          {idx + 1}º Encontro: {meeting.title}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>{meeting.meeting_date}</span>
                          <span aria-hidden="true">·</span>
                          <span>{meeting.start_time} - {meeting.end_time}</span>
                          <span aria-hidden="true">·</span>
                          <span>{meeting.location}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleGenerateQr(meeting.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-md shadow-xs transition-colors"
                        >
                          <QrCode className="w-3.5 h-3.5 text-blue-600" />
                          <span>QR Code</span>
                        </button>

                        <button
                          onClick={() => handleOpenAttendance(meeting)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-700 hover:bg-blue-800 text-white rounded-md shadow-xs transition-colors"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Fazer Chamada</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Coluna 3: Registro de Chamada em Tempo Real */}
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Lista de Chamada do Encontro
              </h3>

              {selectedMeeting ? (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50/60 rounded-md border border-blue-200 text-xs text-blue-900">
                    <div className="font-semibold">{selectedMeeting.title}</div>
                    <div className="text-[11px] text-blue-800/80 mt-0.5">
                      Data: {selectedMeeting.meeting_date} · Sala: {selectedMeeting.room || 'Auditório Carmen Miranda'}
                    </div>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {students.map((student) => {
                      const att = attendances.find((a) => a.user_id === student.id);
                      const isPresent = att?.status === 'presente';

                      return (
                        <div
                          key={student.id}
                          className="p-2.5 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-medium text-slate-800">{student.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              Matrícula: {student.registration_number || '54201-9'}
                            </div>
                            {att?.method === 'qr_code' && (
                              <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                                ✓ Validado via QR Code
                              </div>
                            )}
                          </div>

                          <div className="flex gap-1">
                            <button
                              onClick={() => handleMarkAttendance(student.id, 'presente')}
                              className={`p-1.5 rounded transition-colors ${
                                isPresent
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                              title="Marcar Presente"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleMarkAttendance(student.id, 'ausente')}
                              className={`p-1.5 rounded transition-colors ${
                                att?.status === 'ausente'
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                              title="Marcar Ausente"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 py-8 text-center">
                  Selecione um encontro para abrir a chamada.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ABA: MEUS CURSOS */}
      {activeTab === 'cursos' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">Cursos Sob Minha Instrução</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((c) => (
              <div key={c.id} className="p-4 border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="capitalize font-semibold text-slate-700">{c.modality}</span>
                  <span aria-hidden="true">·</span>
                  <span>{c.workload_hours}h</span>
                  <span aria-hidden="true">·</span>
                  <span>★ {c.rating_avg}</span>
                </div>
                <h3 className="text-sm font-semibold text-slate-900">{c.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-2">{c.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ABA: BANCO DE QUESTÕES E AVALIAÇÕES */}
      {activeTab === 'avaliacoes' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Banco de Questões e Parâmetros de Avaliação</h2>
            <p className="text-xs text-slate-500">
              Questões formativas e de certificação com fundamentação legal explícita.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            {[
              {
                id: '1',
                prompt: 'Conforme o art. 18 da Lei Federal nº 14.133/2021, qual documento é o instrumento preparatório obrigatório que demonstra a viabilidade técnica e econômica da contratação pública?',
                diff: 'Fácil',
                cat: 'Fase Preparatória',
                correct: 'Estudo Técnico Preliminar (ETP)',
                explanation: 'Previsto no art. 18 como basilar para orientar a elaboração do Termo de Referência.',
              },
              {
                id: '2',
                prompt: 'Na nova sistemática de compras públicas, qual modalidade licitatória é voltada especificamente para contratação de obras, serviços e compras em que a Administração Pública busca desenvolver soluções inovadoras?',
                diff: 'Médio',
                cat: 'Modalidades Licitatórias',
                correct: 'Diálogo Competitivo',
                explanation: 'Introduzido para contratações de alta complexidade que exigem soluções sob medida.',
              },
              {
                id: '3',
                prompt: 'O princípio da segregação de funções, consagrado no art. 5º da Lei 14.133/2021, veda expressamente:',
                diff: 'Médio',
                cat: 'Princípios e Governança',
                correct: 'Que o mesmo servidor atue simultaneamente na fase de planejamento, fiscalização e pagamento sem independência',
                explanation: 'A vedação mitiga riscos de favorecimento e erros materiais no processo.',
              },
            ].map((q) => (
              <div key={q.id} className="p-4 rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-slate-800">Questão #{q.id}</span>
                  <span aria-hidden="true">·</span>
                  <span>Dificuldade: {q.diff}</span>
                  <span aria-hidden="true">·</span>
                  <span>{q.cat}</span>
                </div>
                <div className="text-xs text-slate-900 font-medium">{q.prompt}</div>
                <div className="text-xs text-emerald-800 bg-emerald-50 p-2 rounded">
                  <strong>Resposta Correta: </strong>{q.correct}
                </div>
                <div className="text-[11px] text-slate-500 italic">
                  Fundamento: {q.explanation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Exibição do QR Code de Presença */}
      {qrModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 text-center space-y-4">
            <div>
              <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                Presença Presencial via QR Code
              </div>
              <h3 className="text-sm font-semibold text-slate-900 mt-0.5">
                {qrModalData.meeting_title}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">
                {qrModalData.location} · {qrModalData.room}
              </p>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-lg inline-block shadow-xs">
              <img
                src={qrModalData.qr_data_url}
                alt="QR Code do Encontro"
                className="w-56 h-56 mx-auto"
              />
            </div>

            <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-xs font-mono text-slate-800 font-semibold select-all">
              Token: {qrModalData.token}
            </div>

            <p className="text-[11px] text-slate-400">
              Projete esta tela no projetor da sala para que os servidores confirmem sua presença diretamente pelo celular.
            </p>

            <button
              onClick={() => setQrModalData(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-md transition-colors"
            >
              Fechar Projeção
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
