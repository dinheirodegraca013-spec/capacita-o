import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api.ts';
import { Assessment, Question, AssessmentAttempt, Certificate } from '../../types/index.ts';
import {
  Clock,
  AlertTriangle,
  Maximize2,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Award,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface ControlledExamRoomProps {
  assessmentId: string;
  onNavigate: (path: string) => void;
}

export const ControlledExamRoom: React.FC<ControlledExamRoomProps> = ({ assessmentId, onNavigate }) => {
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [attempt, setAttempt] = useState<AssessmentAttempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [savingQuestionId, setSavingQuestionId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [examStarted, setExamStarted] = useState<boolean>(false);
  const [incidentWarning, setIncidentWarning] = useState<string | null>(null);
  const [result, setResult] = useState<{
    scorePercent: number;
    passed: boolean;
    correctCount: number;
    totalQuestions: number;
    certificate: Certificate | null;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    loadAssessment();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [assessmentId]);

  const loadAssessment = async () => {
    try {
      setLoading(true);
      const data = await api.getAssessment(assessmentId);
      setAssessment(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = async () => {
    try {
      setLoading(true);
      const data = await api.startAssessment(assessmentId);
      setAttempt(data.attempt);
      setRemainingSeconds(data.remainingSeconds);
      setQuestions(data.questions);
      setAnswers(data.attempt.answers || {});
      setExamStarted(true);

      // Tenta acionar tela cheia para ambiente focado
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {
          // Permissão não concedida ou bloqueada pelo navegador, continua com monitoramento
        });
      }

      startServerAuthoritativeCountdown(data.attempt.expires_at);
    } catch (err: any) {
      alert(err.message || 'Erro ao iniciar avaliação.');
    } finally {
      setLoading(false);
    }
  };

  // Contagem regressiva calculada estritamente com base na expiração do servidor
  const startServerAuthoritativeCountdown = (expiresAtIso: string) => {
    if (timerRef.current) clearInterval(timerRef.current);

    const expiresAtMs = new Date(expiresAtIso).getTime();

    timerRef.current = setInterval(() => {
      const now = Date.now();
      const diffSeconds = Math.max(0, Math.floor((expiresAtMs - now) / 1000));
      setRemainingSeconds(diffSeconds);

      if (diffSeconds <= 0) {
        clearInterval(timerRef.current);
        handleAutoFinish('TEMPO_ESGOTADO');
      }
    }, 1000);
  };

  // REQUISITO 19: Monitoramento de troca de aba, perda de foco e saída de tela cheia
  useEffect(() => {
    if (!examStarted || !attempt || attempt.status !== 'in_progress') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        registerIncident('tab_switch', 'Servidor alternou para outra aba ou minimizou a janela.');
      }
    };

    const handleWindowBlur = () => {
      registerIncident('window_blur', 'Foco da janela de prova foi perdido.');
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        registerIncident('exit_fullscreen', 'Modo tela cheia foi desativado.');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [examStarted, attempt]);

  const registerIncident = async (type: string, details: string) => {
    if (!attempt || attempt.status !== 'in_progress') return;

    try {
      const res = await api.recordAssessmentIncident(attempt.id, {
        incident_type: type,
        details,
      });

      setIncidentWarning(
        `Ocorrência #${res.exit_count} de ${res.max_allowed}: Troca de aba ou perda de foco detectada.`
      );

      if (res.terminated) {
        if (timerRef.current) clearInterval(timerRef.current);
        alert('A avaliação foi ENCERRADA compulsoriamente devido ao limite de saídas de tela/aba atingido.');
        setAttempt({ ...attempt, status: 'terminated_by_violations' });
        onNavigate('/aluno');
      }
    } catch (err) {
      console.error('Falha ao registrar incidente', err);
    }
  };

  // REQUISITO 21: Salvamento automático contínuo de respostas
  const handleSelectOption = async (questionId: string, optionId: string) => {
    if (!attempt || attempt.status !== 'in_progress') return;

    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    setSavingQuestionId(questionId);

    try {
      await api.saveAssessmentAnswer(attempt.id, {
        questionId,
        optionId,
      });
    } catch (err) {
      console.error('Falha no auto-save', err);
    } finally {
      setSavingQuestionId(null);
    }
  };

  const handleFinishExam = async () => {
    if (!attempt) return;
    const unansweredCount = questions.length - Object.keys(answers).length;
    if (unansweredCount > 0) {
      const confirmSubmit = window.confirm(
        `Você ainda possui ${unansweredCount} questão(ões) sem resposta. Deseja realmente finalizar e entregar a prova?`
      );
      if (!confirmSubmit) return;
    }

    try {
      setLoading(true);
      if (timerRef.current) clearInterval(timerRef.current);
      const res = await api.finishAssessment(attempt.id);
      setResult(res);
      setAttempt(res.attempt);
    } catch (err: any) {
      alert(err.message || 'Falha ao encerrar prova.');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoFinish = async (reason: string) => {
    if (!attempt) return;
    try {
      const res = await api.finishAssessment(attempt.id);
      setResult(res);
      setAttempt(res.attempt);
      alert('O tempo limite de prova se esgotou no servidor. As respostas salvas foram computadas automaticamente.');
    } catch (err) {
      console.error(err);
    }
  };

  // Formata MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading && !examStarted) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center text-xs text-slate-500">
        Preparando ambiente seguro de avaliação...
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center text-xs text-slate-500">
        Avaliação não localizada.
      </div>
    );
  }

  // TELA DE RESULTADO PÓS-PROVA
  if (result) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-xs text-center space-y-6">
          <div className="flex justify-center">
            {result.passed ? (
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                <XCircle className="w-10 h-10" />
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              {result.passed ? 'Parabéns! Você foi Aprovado(a)!' : 'Avaliação Não Atingiu a Nota Mínima'}
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              {result.passed
                ? 'Seu aproveitamento cumpriu com êxito os critérios estabelecidos pelo Município para homologação da capacitação.'
                : `A nota obtida foi de ${result.scorePercent}%. A nota de corte exigida é de ${assessment.min_score_percent}%. Você poderá realizar nova tentativa conforme as regras do curso.`}
            </p>
          </div>

          {/* Placar Oficial */}
          <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto p-4 bg-slate-50 rounded-lg text-center border border-slate-200">
            <div>
              <div className="text-[11px] text-slate-500">Acertos</div>
              <div className="text-base font-semibold text-slate-900 mt-0.5">
                {result.correctCount} / {result.totalQuestions}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">Aproveitamento</div>
              <div className={`text-base font-semibold mt-0.5 ${result.passed ? 'text-emerald-700' : 'text-rose-700'}`}>
                {result.scorePercent}%
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">Nota Mínima</div>
              <div className="text-base font-semibold text-slate-900 mt-0.5">
                {assessment.min_score_percent}%
              </div>
            </div>
          </div>

          {/* Certificado Emitido */}
          {result.certificate && (
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-lg max-w-md mx-auto text-left flex items-start gap-3">
              <Award className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-900">
                <div className="font-semibold">Certificado Emitido com Sucesso!</div>
                <div className="mt-0.5">
                  Código Verificador: <span className="font-mono font-bold">{result.certificate.code}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-3 pt-4">
            {result.certificate ? (
              <button
                onClick={() => onNavigate('/aluno/certificados')}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-md shadow-xs flex items-center gap-2"
              >
                <Award className="w-4 h-4" />
                <span>Visualizar e Baixar Certificado</span>
              </button>
            ) : (
              <button
                onClick={() => onNavigate(`/aluno/curso/${assessment.course_id}`)}
                className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-md shadow-xs"
              >
                Voltar ao Curso
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // TELA DE APRESENTAÇÃO / INSTRUÇÕES ANTES DE INICIAR
  if (!examStarted) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
              Ambiente Controlado de Prova
            </div>
            <h1 className="text-xl font-semibold text-slate-900 mt-1">
              {assessment.title}
            </h1>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              {assessment.description}
            </p>
          </div>

          {/* Regras e Diretrizes de Monitoramento Institucional */}
          <div className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-800">
              Regras e Condições de Aplicação:
            </h2>
            <ul className="text-xs text-slate-600 space-y-2 list-disc pl-5">
              <li>
                <strong>Tempo Total: </strong>{assessment.time_limit_minutes} minutos corridos, controlados pelo relógio do <strong>servidor</strong>.
              </li>
              <li>
                <strong>Nota Mínima para Aprovação: </strong>{assessment.min_score_percent}% de acerto.
              </li>
              <li>
                <strong>Salvamento Automático: </strong>Cada alternativa marcada é gravada imediatamente no servidor.
              </li>
              <li>
                <strong>Detecção de Perda de Foco: </strong>Trocar de aba, minimizar o navegador ou sair da tela cheia registrará advertência formal.
              </li>
              <li>
                <strong>Limite de Tolerância: </strong>Ao atingir {assessment.max_exit_tolerated} saídas/ocorrências, a prova será encerrada automaticamente.
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => onNavigate(`/aluno/curso/${assessment.course_id}`)}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              ← Voltar aos materiais
            </button>
            <button
              onClick={handleStartExam}
              className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
            >
              Entrar em Tela Cheia e Iniciar Prova →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // AMBIENTE ATIVO DE PROVA EM ANDAMENTO
  return (
    <div ref={containerRef} className="min-h-screen bg-slate-50 pb-16">
      {/* Barra Fixa Superior com Cronômetro e Alertas */}
      <div className="sticky top-0 z-50 bg-white border-b border-slate-200 px-4 sm:px-8 py-3 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-700" />
            <span className="text-xs font-semibold text-slate-800 truncate max-w-xs sm:max-w-md">
              {assessment.title}
            </span>
          </div>

          {/* Temporizador do Servidor */}
          <div className="flex items-center gap-4">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-xs font-bold ${
                remainingSeconds < 300
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
                  : 'bg-slate-100 text-slate-800 border border-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTime(remainingSeconds)}</span>
            </div>

            <button
              onClick={handleFinishExam}
              className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
            >
              Entregar Avaliação
            </button>
          </div>
        </div>
      </div>

      {/* Alerta de Incidente se houver */}
      {incidentWarning && (
        <div className="max-w-4xl mx-auto mt-4 px-4">
          <div className="p-3 bg-amber-50 border border-amber-300 rounded-md text-xs text-amber-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-700" />
              <span>{incidentWarning}</span>
            </div>
            <button
              onClick={() => setIncidentWarning(null)}
              className="text-[11px] underline font-medium hover:text-amber-950"
            >
              Ciente
            </button>
          </div>
        </div>
      )}

      {/* Questões */}
      <div className="max-w-4xl mx-auto px-4 mt-6 space-y-6">
        {questions.map((question, qIndex) => {
          const selectedOption = answers[question.id];
          const isSaving = savingQuestionId === question.id;

          return (
            <div
              key={question.id}
              className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-slate-800">Questão {qIndex + 1} de {questions.length}</span>
                  <span aria-hidden="true">·</span>
                  <span className="capitalize">{question.difficulty}</span>
                  <span aria-hidden="true">·</span>
                  <span>{question.category}</span>
                </div>

                {isSaving ? (
                  <span className="text-[10px] text-blue-600 font-mono">Salvando...</span>
                ) : selectedOption ? (
                  <span className="text-[10px] text-emerald-700 flex items-center gap-1 font-mono">
                    <CheckCircle2 className="w-3 h-3" /> Salva
                  </span>
                ) : null}
              </div>

              <div className="text-sm font-medium text-slate-900 leading-relaxed">
                {question.prompt}
              </div>

              {/* Alternativas */}
              <div className="space-y-2 pt-2">
                {question.options.map((option, optIdx) => {
                  const letter = String.fromCharCode(65 + optIdx); // A, B, C, D
                  const isChecked = selectedOption === option.id;

                  return (
                    <label
                      key={option.id}
                      onClick={() => handleSelectOption(question.id, option.id)}
                      className={`w-full flex items-start gap-3 p-3 rounded-lg border text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? 'border-blue-600 bg-blue-50/60 text-blue-950 font-medium'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question_${question.id}`}
                        checked={isChecked}
                        onChange={() => handleSelectOption(question.id, option.id)}
                        className="mt-0.5 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-bold shrink-0">{letter})</span>
                      <span className="flex-1 leading-normal">{option.text}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Rodapé de Entrega */}
        <div className="p-6 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Respostas preenchidas: <strong className="text-slate-900">{Object.keys(answers).length}</strong> de {questions.length}
          </div>
          <button
            onClick={handleFinishExam}
            className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
          >
            Finalizar e Entregar Prova
          </button>
        </div>
      </div>
    </div>
  );
};
