import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { Organization, AuditLog, User, Course } from '../../types/index.ts';
import {
  Building,
  Shield,
  Users,
  GraduationCap,
  Plus,
  CheckCircle2,
  Lock,
  Search,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'prefeituras' | 'auditoria' | 'usuarios'>('prefeituras');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal nova prefeitura
  const [newOrgModalOpen, setNewOrgModalOpen] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const [orgCnpj, setOrgCnpj] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#0f3a63');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [orgs, logs, usrs] = await Promise.all([
        api.getOrganizations(),
        api.getAuditLogs(),
        api.getUsers(),
      ]);
      setOrganizations(orgs);
      setAuditLogs(logs);
      setUsers(usrs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || !orgSlug.trim()) return;

    try {
      await api.createOrganization({
        name: orgName.trim(),
        slug: orgSlug.trim(),
        cnpj: orgCnpj.trim(),
        primary_color: primaryColor,
      });
      setNewOrgModalOpen(false);
      setOrgName('');
      setOrgSlug('');
      setOrgCnpj('');
      loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Falha ao cadastrar prefeitura.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
            Administração Geral Multi-Tenant · CapacitaGov
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 mt-0.5">
            Painel do Administrador Geral
          </h1>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('prefeituras')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'prefeituras' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Prefeituras ({organizations.length})
          </button>
          <button
            onClick={() => setActiveTab('usuarios')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'usuarios' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Usuários Globais ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('auditoria')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'auditoria' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Auditoria LGPD ({auditLogs.length})
          </button>
        </div>
      </div>

      {/* ABA: PREFEITURAS */}
      {activeTab === 'prefeituras' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-slate-900">
              Órgãos e Municípios Cadastrados (Multi-Tenant)
            </h2>
            <button
              onClick={() => setNewOrgModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Cadastrar Nova Prefeitura</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {organizations.map((org) => (
              <div
                key={org.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4"
              >
                <div className="flex items-start gap-3">
                  {org.coat_of_arms_url ? (
                    <img
                      src={org.coat_of_arms_url}
                      alt={org.name}
                      className="w-12 h-12 object-contain rounded-md"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-md bg-slate-800 text-white flex items-center justify-center font-bold text-sm">
                      MUN
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-slate-900">{org.name}</h3>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">
                      Slug: {org.slug} · CNPJ: {org.cnpj || 'Sob consulta'}
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    Ativa
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span>Cor primária:</span>
                    <span
                      className="w-4 h-4 rounded-full border border-slate-200"
                      style={{ backgroundColor: org.primary_color }}
                    />
                  </div>
                  <span className="text-[11px]">Isolamento RLS: Ativado</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ABA: AUDITORIA LGPD (REQUISITO 35 & 37) */}
      {activeTab === 'auditoria' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-700" />
                <span>Trilha de Auditoria e Conformidade Institucional (LGPD)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Rastreabilidade de todas as ações de matrícula, login, prova e certificados.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Data / Hora</th>
                  <th className="py-2.5 px-3 font-semibold">Usuário / Ator</th>
                  <th className="py-2.5 px-3 font-semibold">Ação Registrada</th>
                  <th className="py-2.5 px-3 font-semibold">Detalhes</th>
                  <th className="py-2.5 px-3 font-semibold">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800 whitespace-nowrap">
                      {log.user_name || 'Sistema'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-blue-700 font-semibold whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-md truncate">
                      {log.details || log.entity_name}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">
                      {log.ip_address || '127.0.0.1'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA: USUÁRIOS GLOBAIS */}
      {activeTab === 'usuarios' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Quadro Global de Usuários do Ecossistema
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Nome</th>
                  <th className="py-2.5 px-3 font-semibold">E-mail</th>
                  <th className="py-2.5 px-3 font-semibold">Perfil (RBAC)</th>
                  <th className="py-2.5 px-3 font-semibold">CPF</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-medium text-slate-900">{u.name}</td>
                    <td className="py-2.5 px-3 text-slate-600">{u.email}</td>
                    <td className="py-2.5 px-3 uppercase font-semibold text-blue-700">{u.role}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">{u.cpf}</td>
                    <td className="py-2.5 px-3 text-emerald-700 font-medium">Ativo</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Nova Prefeitura */}
      {newOrgModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6">
            <h3 className="text-base font-semibold text-slate-900">
              Cadastrar Nova Organização / Prefeitura
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Gera isolamento por tenant no banco de dados e cria parâmetros institucionais.
            </p>

            <form onSubmit={handleCreateOrg} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nome da Instituição:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Prefeitura Municipal de Feira de Santana"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-md px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Slug do Município (Identificador):
                </label>
                <input
                  type="text"
                  placeholder="Ex: pmfs"
                  value={orgSlug}
                  onChange={(e) => setOrgSlug(e.target.value.toLowerCase())}
                  className="w-full text-xs font-mono border border-slate-300 rounded-md px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  CNPJ:
                </label>
                <input
                  type="text"
                  placeholder="Ex: 14.043.593/0001-44"
                  value={orgCnpj}
                  onChange={(e) => setOrgCnpj(e.target.value)}
                  className="w-full text-xs font-mono border border-slate-300 rounded-md px-3 py-2"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setNewOrgModalOpen(false)}
                  className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-blue-700 hover:bg-blue-800 text-white rounded-md shadow-xs"
                >
                  Salvar e Ativar Tenant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
