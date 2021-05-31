import {
  ExegesisContext,
  ExegesisPluginInstance,
  HttpIncomingMessage,
} from 'exegesis-express';
import { domainsAuditLog, HTTP_HEADER } from '@viron/lib';

// 接続元IPアドレスを取得
const getSourceIp = (req: HttpIncomingMessage): string | null => {
  let xForwardedFor = req.headers[HTTP_HEADER.X_FORWARDED_FOR] || [];
  if (typeof xForwardedFor === 'string') {
    xForwardedFor = xForwardedFor.split(',');
  }
  return xForwardedFor[0] ?? req.socket.remoteAddress ?? null;
};

// 監査ログの書き込みを行う
const postController = async (ctx: ExegesisContext): Promise<void> => {
  if (ctx.api.operationObject['x-exegesis-auditlog']?.skip) {
    return;
  }

  const log = {
    requestMethod: ctx.req.method ?? null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    requestUri: (ctx.req as any).path as string,
    sourceIp: getSourceIp(ctx.req),
    userId: (ctx.user?.userId as string) ?? null,
    requestBody: JSON.stringify(ctx.req.body || {}),
    statusCode: ctx.res.statusCode,
  };
  await domainsAuditLog.createOne(log);
};

export const exegesisPluginAuditlog = {
  info: {
    name: 'exegesis-plugin-auditlog',
  },
  makeExegesisPlugin: (): ExegesisPluginInstance => {
    return { postController };
  },
};
