import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

function flattenConstraints(node: any): string[] {
  if (!node || typeof node !== 'object') return [];
  const out: string[] = [];
  if (node.constraints && typeof node.constraints === 'object') {
    out.push(...Object.values(node.constraints).map(String));
  }
  if (Array.isArray(node.children)) {
    for (const child of node.children) out.push(...flattenConstraints(child));
  }
  return out;
}

function toMessageString(payload: any): string {
  if (typeof payload === 'string') return payload;
  if (!payload) return 'Internal server error';

  // class-validator: array of ValidationError
  if (Array.isArray(payload)) {
    const parts = payload.flatMap((p) =>
      typeof p === 'string' ? [p] : flattenConstraints(p) || [],
    );
    if (parts.length) return parts.join('; ');
    return 'Invalid request';
  }

  if (typeof payload === 'object') {
    if (typeof payload.message === 'string') return payload.message;
    if (Array.isArray(payload.message)) return toMessageString(payload.message);
    if (typeof payload.error === 'string') return payload.error;
  }

  return 'Internal server error';
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const raw =
      exception instanceof HttpException
        ? exception.getResponse()
        : exception instanceof Error
          ? { message: exception.message }
          : { message: 'Internal server error' };

    const message = toMessageString(raw);

    const body: Record<string, any> = {
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
    };

    // Preserve structured details for clients that want them.
    if (Array.isArray(raw)) {
      body.errors = raw;
    } else if (raw && typeof raw === 'object') {
      const { message: _ignored, ...rest } = raw as any;
      if (Object.keys(rest).length) body.details = rest;
    }

    if (status >= 500) {
      // eslint-disable-next-line no-console
      console.error('Unhandled exception:', exception);
    }

    response.status(status).json(body);
  }
}
