import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { ZodValidationException } from 'nestjs-zod';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.originalUrl ?? request.url,
      method: request.method,
      message: this.extractMessage(exception),
    });
  }

  private extractMessage(exception: unknown): string | string[] {
    if (exception instanceof ZodValidationException) {
      const zodError = exception.getZodError();
      return zodError.issues.map(issue =>
        issue.path.length ? `${issue.path.join('.')}: ${issue.message}` : issue.message,
      );
    }

    if (!(exception instanceof HttpException)) {
      return 'Erro interno do servidor. Tente novamente ou contate o suporte.';
    }

    const exceptionResponse = exception.getResponse();
    if (typeof exceptionResponse === 'string') return exceptionResponse;

    const { message } = exceptionResponse as { message?: string | string[] };
    return message ?? exception.message;
  }
}
