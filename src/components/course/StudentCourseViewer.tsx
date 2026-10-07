import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api.ts';
import { Course, Module, Lesson, ClassGroup, Meeting, Certificate } from '../../types/index.ts';
import {
  ArrowLeft,
  CheckCircle2,
  Play,
  FileText,
  Volume2,
  FileCheck2,
  Calendar,
  MapPin,
  Clock,
  Download,
  Award,
  Star,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

interface StudentCourseViewerProps {
  courseId: string;
  onNavigate: (path: string) => void;
}

export const StudentCourseViewer: React.FC<StudentCourseViewerProps> = ({ courseId, onNavigate }) => {
  const [course, setCourse] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [hybridTab, setHybridTab] = useState<'online' | 'presencial'>('online');
  const [showSurvey, setShowSurvey] = useState(false);
  const [rating, setRating] = useState(5);
  const [usefulness, setUsefulness] = useState(5);
  const [comment, setComment] = useState('');
  const [surveySubmitted, setSurveySubmitted] = useState(false);

  // Referência do player de vídeo para capturar tempo assistido e posição
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadCourseDetails();
  }, [courseId]);

  const loadCourseDetails = async () => {
    try {
      setLoading(true);
      const data = await api.getCourse(courseId);
      setCourse(data);

      // Define a aula inicial: se tiver módulos, pega a primeira não completada ou a primeira da lista
      if (data.modules && data.modules.length > 0) {
        const allLessons = data.modules.flatMap((m: any) => m.lessons);
        const nextUncompleted = allLessons.find((l: any) => !l.progress?.completed);
        setSelectedLesson(nextUncompleted || allLessons[0] || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLessonComplete = async (lesson: Lesson) => {
    try {
      await api.updateLessonProgress(lesson.id, {
        completed: true,
        watch_time_seconds: lesson.duration_minutes * 60,
        last_position_seconds: lesson.duration_minutes * 60,
        course_id: course.id,
      });
      // Recarrega detalhes atualizados
      loadCourseDetails();
    } catch (err) {
      console.error(err);
    }
  };

  const handleVideoTimeUpdate = () => {
    if (videoRef.current && selectedLesson) {
      const currentTime = Math.floor(videoRef.current.currentTime);
      const duration = Math.floor(videoRef.current.duration || 1);
      // Se assistiu mais de 90%, marca como completado automaticamente
      if (currentTime >= duration * 0.9 && !selectedLesson.progress?.completed) {
        handleLessonComplete(selectedLesson);
      }
    }
  };

  const handleSurveySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.submitEvaluation(course.id, {
        rating,
        usefulness_score: usefulness,
        comment,
      });
      setSurveySubmitted(true);
      setTimeout(() => {
        setShowSurvey(false);
        loadCourseDetails();
      }, 1500);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-slate-500 text-sm">
        Carregando estrutura do curso...
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-slate-500 text-sm">
        Curso não localizado.
      </div>
    );
  }

  const isHybrid = course.modality === 'hibrido';
  const isPresential = course.modality === 'presencial';
  const isEad = course.modality === 'ead';

  // Cálculos de progresso do curso híbrido
  const eadProgress = course.enrollment?.ead_progress_percent ?? (isEad ? course.enrollment?.progress_percent : 100);
  const presencialProgress = course.enrollment?.presencial_progress_percent ?? 50;
  const generalProgress = course.enrollment?.progress_percent || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Barra superior de navegação e status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/aluno/cursos')}
            className="p-1.5 text-slate-500 hover:text-slate-800 rounded-md transition-colors"
            title="Voltar aos cursos"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="uppercase font-semibold tracking-wider text-slate-700">
                {course.modality === 'hibrido' ? 'Formação Híbrida' : course.modality.toUpperCase()}
              </span>
              <span aria-hidden="true">·</span>
              <span>{course.workload_hours}h</span>
              <span aria-hidden="true">·</span>
              <span>{course.category}</span>
            </div>
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight mt-0.5">
              {course.title}
            </h1>
          </div>
        </div>

        {/* Certificado disponível ou Pesquisa de Satisfação */}
        <div className="flex items-center gap-3">
          {course.certificate ? (
            <button
              onClick={() => onNavigate(`/aluno/certificados`)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-md shadow-xs transition-colors"
            >
              <Award className="w-4 h-4 text-emerald-700" />
              <span>Ver Certificado Emitido</span>
            </button>
          ) : course.enrollment?.status === 'concluido' ? (
            <button
              onClick={() => setShowSurvey(true)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-md transition-colors"
            >
              <Star className="w-4 h-4 text-amber-500" />
              <span>Avaliar este Curso</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* CURSO HÍBRIDO: REQUISITO 14 — DUAS ÁREAS DISTINTAS E PROGRESSO SEPARADO */}
      {isHybrid && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Acompanhamento Híbrido
              </div>
              <div className="text-sm text-slate-700 mt-0.5">
                Esta capacitação integra módulos de estudo virtual com encontros práticos presenciais.
              </div>
            </div>

            {/* Progresso consolidado do Híbrido */}
            <div className="flex items-center gap-4 text-xs">
              <div className="text-slate-600">
                EAD: <strong className="text-slate-900">{eadProgress}%</strong>
              </div>
              <span className="text-slate-300">·</span>
              <div className="text-slate-600">
                Presencial: <strong className="text-slate-900">{presencialProgress}%</strong>
              </div>
              <span className="text-slate-300">·</span>
              <div className="text-blue-800 font-semibold bg-blue-50 px-2.5 py-1 rounded">
                Progresso Geral: {generalProgress}%
              </div>
            </div>
          </div>

          {/* Abas das 2 Áreas */}
          <div className="flex border-b border-slate-200 pt-2">
            <button
              onClick={() => setHybridTab('online')}
              className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-colors ${
                hybridTab === 'online'
                  ? 'border-blue-700 text-blue-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Área 1: Parte Online (Vídeos & PDFs)
            </button>
            <button
              onClick={() => setHybridTab('presencial')}
              className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-colors ${
                hybridTab === 'presencial'
                  ? 'border-blue-700 text-blue-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Área 2: Parte Presencial (Encontros & Frequência)
            </button>
          </div>
        </div>
      )}

      {/* ÁREA PRESENCIAL (Quando for curso Presencial ou aba Presencial do Híbrido) */}
      {(isPresential || (isHybrid && hybridTab === 'presencial')) && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
              Encontros Presenciais Agendados
            </div>
            <p className="text-xs text-slate-500 mb-6">
              A presença é registrada pelo professor em sala de aula ou via escaneamento do QR Code oficial.
            </p>

            <div className="space-y-4">
              {course.classes && course.classes.length > 0 ? (
                course.classes.flatMap((cl: any) => cl.meetings || []).map((meeting: Meeting, index: number) => (
                  <div
                    key={meeting.id}
                    className="border border-slate-200 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-300 transition-colors"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-semibold text-blue-700">Encontro #{index + 1}</span>
                        <span aria-hidden="true">·</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {meeting.meeting_date}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {meeting.start_time} às {meeting.end_time}
                        </span>
                      </div>

                      <h3 className="text-sm font-semibold text-slate-900">
                        {meeting.title}
                      </h3>

                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{meeting.location} — {meeting.room || 'Auditório Principal'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {meeting.materials_pdf_url && (
                        <a
                          href={meeting.materials_pdf_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Apostila (PDF)</span>
                        </a>
                      )}

                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-800 bg-emerald-50 rounded-md">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Presença Confirmada
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 py-4">Nenhum encontro agendado para esta turma.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ÁREA ONLINE / EAD (Módulos, Aulas, Player e Prova) */}
      {(isEad || (isHybrid && hybridTab === 'online')) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna 1 & 2: Player da Aula Selecionada */}
          <div className="lg:col-span-2 space-y-4">
            {selectedLesson ? (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                {/* Visualizador de Mídia conforme content_type */}
                <div className="bg-slate-950 aspect-video flex items-center justify-center relative">
                  {selectedLesson.content_type === 'video' && selectedLesson.content_url ? (
                    <video
                      ref={videoRef}
                      src={selectedLesson.content_url}
                      controls
                      onTimeUpdate={handleVideoTimeUpdate}
                      className="w-full h-full object-contain"
                    />
                  ) : selectedLesson.content_type === 'audio' && selectedLesson.audio_url ? (
                    <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-slate-900 text-white space-y-4">
                      <Volume2 className="w-12 h-12 text-blue-400" />
                      <div className="text-sm font-medium">{selectedLesson.title}</div>
                      <audio
                        ref={audioRef}
                        src={selectedLesson.audio_url}
                        controls
                        className="w-full max-w-md mt-2"
                        onEnded={() => handleLessonComplete(selectedLesson)}
                      />
                    </div>
                  ) : selectedLesson.content_type === 'pdf' ? (
                    <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-slate-900 text-white text-center space-y-4">
                      <FileText className="w-12 h-12 text-blue-400" />
                      <div className="text-sm font-medium">{selectedLesson.title}</div>
                      <p className="text-xs text-slate-400 max-w-sm">
                        Material de leitura obrigatório disponibilizado para os servidores municipais.
                      </p>
                      <div className="flex gap-3">
                        <a
                          href={selectedLesson.pdf_url || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md inline-flex items-center gap-1.5"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Abrir Documento PDF
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full p-8 bg-slate-900 text-white flex flex-col items-center justify-center text-center">
                      <FileText className="w-10 h-10 text-slate-400 mb-2" />
                      <span className="text-sm font-medium">Conteúdo em Texto Consolidado</span>
                    </div>
                  )}
                </div>

                {/* Descrição da Aula e Botão de Conclusão */}
                <div className="p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <div className="text-xs text-slate-500 flex items-center gap-2">
                        <span className="uppercase font-medium text-slate-700">
                          {selectedLesson.content_type.toUpperCase()}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{selectedLesson.duration_minutes} minutos estimados</span>
                      </div>
                      <h2 className="text-lg font-semibold text-slate-900 mt-1">
                        {selectedLesson.title}
                      </h2>
                    </div>

                    <button
                      onClick={() => handleLessonComplete(selectedLesson)}
                      className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-md shadow-xs transition-colors ${
                        selectedLesson.progress?.completed
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-blue-700 hover:bg-blue-800 text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{selectedLesson.progress?.completed ? 'Aula Concluída' : 'Marcar como Concluída'}</span>
                    </button>
                  </div>

                  {selectedLesson.description && (
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {selectedLesson.description}
                    </p>
                  )}

                  {/* Conteúdo textual formatado se for aula do tipo texto */}
                  {selectedLesson.text_content && (
                    <div className="mt-4 p-5 bg-slate-50 rounded-lg text-xs text-slate-700 leading-relaxed font-mono whitespace-pre-wrap border border-slate-200">
                      {selectedLesson.text_content}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 text-xs">
                Selecione uma aula no menu lateral para iniciar o estudo.
              </div>
            )}

            {/* Banner da Avaliação Final */}
            {course.assessment && (
              <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-900">
                    <FileCheck2 className="w-4 h-4 text-blue-700" />
                    <span>{course.assessment.title}</span>
                  </div>
                  <p className="text-xs text-blue-800/80 max-w-xl">
                    Tempo: {course.assessment.time_limit_minutes} minutos · Nota mínima: {course.assessment.min_score_percent}% · Prova controlada com cronômetro no servidor e salvamento contínuo.
                  </p>
                </div>

                <button
                  onClick={() => onNavigate(`/aluno/avaliacao/${course.assessment.id}`)}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-md shadow-xs shrink-0 transition-colors"
                >
                  Iniciar Avaliação Oficial →
                </button>
              </div>
            )}
          </div>

          {/* Coluna 3: Lista de Módulos e Aulas */}
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                Grade de Aulas do Curso
              </h3>

              <div className="space-y-4">
                {course.modules?.map((module: Module) => (
                  <div key={module.id} className="space-y-2">
                    <div className="text-xs font-semibold text-slate-800">
                      {module.title}
                    </div>

                    <div className="space-y-1 pl-1">
                      {module.lessons?.map((lesson: Lesson) => {
                        const isCurrent = selectedLesson?.id === lesson.id;
                        const isDone = lesson.progress?.completed;

                        return (
                          <button
                            key={lesson.id}
                            onClick={() => setSelectedLesson(lesson)}
                            className={`w-full text-left p-2.5 rounded-md text-xs flex items-center justify-between transition-colors ${
                              isCurrent
                                ? 'bg-blue-50 text-blue-900 font-medium border border-blue-200'
                                : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                              {isDone ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              ) : (
                                <Play className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              )}
                              <span className="truncate">{lesson.title}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {lesson.duration_minutes}m
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE PESQUISA DE SATISFAÇÃO (REQUISITO 34) */}
      {showSurvey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6">
            <h3 className="text-base font-semibold text-slate-900">
              Avaliação de Satisfação do Curso
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Sua opinião ajuda a Prefeitura e os instrutores a aprimorarem os programas de capacitação continuada.
            </p>

            {surveySubmitted ? (
              <div className="py-6 text-center text-xs text-emerald-700 font-medium">
                Avaliação registrada com sucesso! Muito obrigado pela sua contribuição.
              </div>
            ) : (
              <form onSubmit={handleSurveySubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Nota Geral do Curso (1 a 5 estrelas):
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        className={`p-1.5 rounded transition-colors ${
                          rating >= star ? 'text-amber-500' : 'text-slate-300'
                        }`}
                      >
                        <Star className="w-6 h-6 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Utilidade para sua rotina no serviço público:
                  </label>
                  <select
                    value={usefulness}
                    onChange={(e) => setUsefulness(Number(e.target.value))}
                    className="w-full text-xs border border-slate-300 rounded-md px-3 py-2 bg-white"
                  >
                    <option value={5}>5 — Extremamente aplicável e transformador</option>
                    <option value={4}>4 — Muito útil para o meu setor</option>
                    <option value={3}>3 — Razoável / Conceitual</option>
                    <option value={2}>2 — Pouca aplicação prática</option>
                    <option value={1}>1 — Não atendeu às expectativas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Comentário ou Sugestão de Melhoria:
                  </label>
                  <textarea
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Deixe suas impressões sobre o conteúdo, didática do professor e materiais..."
                    className="w-full text-xs border border-slate-300 rounded-md p-2.5"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSurvey(false)}
                    className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                  >
                    Depois
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-medium bg-blue-700 hover:bg-blue-800 text-white rounded-md shadow-xs"
                  >
                    Enviar Avaliação
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
