/**
 * CapacitaGov — Supabase / Backend Gateway
 * 
 * Se as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estiverem configuradas,
 * a aplicação conecta-se diretamente ao Supabase.
 * Caso contrário, utiliza as rotas da API Express (/api/*) em tempo de execução.
 */

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    import.meta.env.VITE_SUPABASE_URL && 
    import.meta.env.VITE_SUPABASE_ANON_KEY &&
    !import.meta.env.VITE_SUPABASE_URL.includes('your-project')
  );
};

export const API_BASE = '/api';

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido na requisição.' }));
    throw new Error(errorData.message || `Erro ${response.status}: Falha ao processar solicitação.`);
  }

  return response.json();
}
