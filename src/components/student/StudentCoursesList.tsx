import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { Course } from '../../types/index.ts';
import { BookOpen, Clock, CheckCircle2, Play } from 'lucide-react';

interface StudentCoursesListProps {
  onNavigate: (path: string) => void;
}

export const StudentCoursesList: React.FC<StudentCoursesListProps> = ({ onNavigate }) => {
  const [courses, setCourses] = useState<(Course & { enrollment?: any })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModality, setSelectedModality] = useState<string>('todos');

  useEffect(() => {
    loadCourses();
  }, []);

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

  const filtered = courses.filter((c) => {
    if (selectedModality === 'todos') return true;
    return c.modality === selectedModality;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Catálogo de Cursos & Capacitações
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Programas formativos para servidores públicos municipais da administração direta e indireta.
          </p>
        </div>

        {/* Filtros interativos limpos (Segmented buttons) */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'ead', label: 'EAD' },
            { id: 'presencial', label: 'Presencial' },
            { id: 'hibrido', label: 'Híbrido' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedModality(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                selectedModality === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-xs text-slate-500 py-12 text-center">Carregando cursos...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 text-xs">
          Nenhum curso localizado para este filtro.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((course) => {
            const isCompleted = course.enrollment?.status === 'concluido';
            const progress = course.enrollment?.progress_percent || 0;

            return (
              <div
                key={course.id}
                className="bg-white border border-slate-200 rounded-xl p-6 hover:border-slate-300 transition-colors flex flex-col justify-between shadow-xs"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                    <span className="uppercase font-semibold text-slate-700">
                      {course.modality === 'hibrido' ? 'Híbrido' : course.modality.toUpperCase()}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{course.workload_hours}h</span>
                    <span aria-hidden="true">·</span>
                    <span>{course.category}</span>
                  </div>

                  <h3 className="text-base font-semibold text-slate-900 leading-snug">
                    {course.title}
                  </h3>

                  <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                    {course.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    {isCompleted ? (
                      <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Concluído
                      </span>
                    ) : progress > 0 ? (
                      <span className="text-xs text-slate-600">
                        {progress}% concluído
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Não iniciado</span>
                    )}
                  </div>

                  <button
                    onClick={() => onNavigate(`/aluno/curso/${course.id}`)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
                  >
                    <span>{progress > 0 ? 'Continuar' : 'Acessar'}</span>
                    <Play className="w-3.5 h-3.5 fill-white" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
