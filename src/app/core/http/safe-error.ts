import { HttpErrorResponse } from '@angular/common/http';

const GENERIC = 'Não foi possível concluir a operação. Tente novamente.';

export function safeErrorMessage(
  err: unknown,
  fallback = GENERIC,
  allowedStatusMessages: Partial<Record<number, string>> = {},
): string {
  if (!(err instanceof HttpErrorResponse)) {
    return fallback;
  }

  const byStatus = allowedStatusMessages[err.status];
  if (byStatus) {
    return byStatus;
  }

  if (err.status === 401) {
    return 'Sessão expirada ou credenciais inválidas.';
  }
  if (err.status === 403) {
    return 'Acesso negado.';
  }
  if (err.status === 409) {
    return 'Não foi possível concluir com estes dados.';
  }
  if (err.status === 429) {
    return 'Muitas tentativas. Aguarde um momento e tente de novo.';
  }
  if (err.status === 503) {
    return 'Serviço temporariamente indisponível.';
  }
  if (err.status >= 500) {
    return 'Erro interno. Tente novamente mais tarde.';
  }

  const msg = err.error?.message;
  if (typeof msg === 'string' && msg.length > 0 && msg.length <= 180 && !looksSensitive(msg)) {
    return msg;
  }
  return fallback;
}

function looksSensitive(msg: string): boolean {
  return /exception|stack|sql|jdbc|token|secret|api[_-]?key|at\s+[\w.$]+/i.test(msg);
}
