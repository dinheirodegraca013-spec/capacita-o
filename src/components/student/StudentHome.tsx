import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { Course, AttendanceRecord } from '../../types/index.ts';
import { Play, Award, Clock, Calendar, CheckCircle2, AlertCircle, QrCode } from 'lucide-react';

interface StudentHomeProps {
  onNavigate: (path: string) => void;
}

export const StudentHome: React.FC<StudentHomeProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<(Course & { enrollment?: any })[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrToken, setQrToken] = useState('');
  const [qrMeetingId, setQrMeetingId] = useState('mtg-atend-1');
  const [qrFeedback, setQrFeedback] = useState<{ success?: boolean; message?: string } | null>(null);

  useEffect(() => {
    loadCourses();
  }, [user]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const data = await api.getCourses();
      setCourses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyQr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrToken.trim()) return;

    try {
      const res = await api.verifyMeetingQr({
        meeting_id: qrMeetingId,
        token: qrToken.trim(),
      });
      setQrFeedback({ success: true, message: res.message });
      setTimeout(() => {
        setQrModalOpen(false);
        setQrFeedback(null);
        setQrToken('');
        loadCourses();
      }, 2000);
    } catch (err: any) {
      setQrFeedback({ success: false, message: err.message || 'Falha ao validar presença.' });
    }
  };

  // Identifica o curso em andamento para "Continue de onde parou"
  const activeCourse = courses.find((c) => c.enrollment && c.enrollment.status === 'ativo');
  const completedCourses = courses.filter((c) => c.enrollment && c.enrollment.status === 'concluido');
  const mandatoryAlert = courses.find((c) => c.enrollment && c.enrollment.is_mandatory && c.enrollment.due_date && c.enrollment.status === 'ativo');

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 space-y-8">
      {/* Cabeçalho Limpo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Olá, {user?.name?.split(' ')[0] || 'Servidor(a)'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {user?.job_title} · {user?.department_id ? 'Recursos Humanos' : 'Administração Municipal'}
          </p>
        </div>

        {/* Botão sutil de check-in de presença por QR Code */}
        <div>
          <button
            onClick={() => setQrModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md shadow-xs transition-colors"
          >
            <QrCode className="w-4 h-4 text-blue-600" />
            <span>Confirmar Presença (QR Code)</span>
          </button>
        </div>
      </div>

      {/* Alerta Discreto de Curso Obrigatório */}
      {mandatoryAlert && (
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 flex-1">
            <span className="font-semibold">Capacitação Obrigatória: </span>
            O curso <strong>"{mandatoryAlert.title}"</strong> possui prazo fixado pela Secretaria até{' '}
            <strong>{mandatoryAlert.enrollment.due_date}</strong>.
          </div>
          <button
            onClick={() => onNavigate(`/aluno/curso/${mandatoryAlert.id}`)}
            className="text-xs font-semibold text-amber-900 hover:underline shrink-0"
          >
            Acessar curso →
          </button>
        </div>
      )}

      {/* REQUISITO: Continue de onde parou */}
      {activeCourse ? (
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-blue-700 mb-2">
            Continue de onde parou
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <h2 className="text-xl font-medium text-slate-900 tracking-tight">
                {activeCourse.title}
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="capitalize">{activeCourse.modality}</span>
                <span aria-hidden="true">·</span>
                <span>{activeCourse.workload_hours}h de carga horária</span>
                <span aria-hidden="true">·</span>
                <span>{activeCourse.instructor_name}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <button
                onClick={() => onNavigate(`/aluno/curso/${activeCourse.id}`)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs sm:text-sm font-medium rounded-md shadow-xs transition-colors"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Continuar Aula</span>
              </button>
            </div>
          </div>

          {/* Barra de Progresso Simples */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
              <span>Progresso geral</span>
              <span className="font-medium text-slate-900">
                {activeCourse.enrollment?.progress_percent || 0}% concluído
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-700 h-2 rounded-full transition-all duration-300"
                style={{ width: `${activeCourse.enrollment?.progress_percent || 0}%` }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
          <CheckCircle2 className="w-8 h-8 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-medium text-slate-800">Você está em dia!</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Nenhum curso em andamento pendente no momento. Explore as formações disponíveis para a sua secretaria.
          </p>
          <button
            onClick={() => onNavigate('/aluno/cursos')}
            className="mt-4 px-4 py-2 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
          >
            Ver catálogo de cursos
          </button>
        </div>
      )}

      {/* Cursos Matriculados e Concluídos */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
            Minhas Formações
          </h2>
          <button
            onClick={() => onNavigate('/aluno/cursos')}
            className="text-xs text-blue-700 hover:text-blue-900 font-medium"
          >
            Ver todos ({courses.length}) →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map((course) => {
            const isCompleted = course.enrollment?.status === 'concluido';
            return (
              <div
                key={course.id}
                className="bg-white border border-slate-200 rounded-lg p-5 hover:border-slate-300 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                    <span className="capitalize font-medium text-slate-700">
                      {course.modality === 'hibrido' ? 'Híbrido (Online + Presencial)' : course.modality.toUpperCase()}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{course.workload_hours}h</span>
                  </div>
                  <h3 className="text-sm font-medium text-slate-900 leading-snug line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                    {course.description}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    {isCompleted ? (
                      <span className="text-emerald-700 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Concluído
                      </span>
                    ) : (
                      <span>Progresso: {course.enrollment?.progress_percent || 0}%</span>
                    )}
                  </div>
                  <button
                    onClick={() => onNavigate(`/aluno/curso/${course.id}`)}
                    className="text-xs font-semibold text-blue-700 hover:text-blue-900"
                  >
                    {isCompleted ? 'Revisar curso' : 'Acessar'} →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de Confirmação de Presença por QR Code */}
      {qrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6">
            <h3 className="text-base font-semibold text-slate-900">
              Confirmar Presença em Encontro Presencial
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Insira o código do QR Code exibido pelo professor em sala de aula para registrar sua frequência oficial.
            </p>

            <form onSubmit={handleVerifyQr} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Encontro Agendado:
                </label>
                <select
                  value={qrMeetingId}
                  onChange={(e) => setQrMeetingId(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-md px-3 py-2 bg-white"
                >
                  <option value="mtg-atend-1">1º Encontro: Postura Profissional e Escuta Ativa (Auditório Carmen Miranda)</option>
                  <option value="mtg-hib-1">Oficina Presencial 1: Processo Eletrônico (Lab 02)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Código do QR Code / Token:
                </label>
                <input
                  type="text"
                  placeholder="Ex: QR-ATEND-ENCONTRO-1-2026"
                  value={qrToken}
                  onChange={(e) => setQrToken(e.target.value)}
                  className="w-full text-xs font-mono border border-slate-300 rounded-md px-3 py-2 uppercase"
                  required
                />
              </div>

              {qrFeedback && (
                <div
                  className={`p-3 rounded-md text-xs ${
                    qrFeedback.success ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                  }`}
                >
                  {qrFeedback.message}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setQrModalOpen(false)}
                  className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-md"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium bg-blue-700 hover:bg-blue-800 text-white rounded-md shadow-xs"
                >
                  Confirmar Frequência
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
