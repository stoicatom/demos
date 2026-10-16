import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = '服务器内部异常，请联系管理员';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        message = (res as any).message || exception.message;
      }
      if (Array.isArray(message)) {
        message = message.join('; ');
      }
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled Exception at ${request.method} ${request.url}: ${exception.message}`, exception.stack);
    }

    response.status(status).json({
      code: status,
      message,
      data: null,
      path: request.url,
      timestamp: Date.now(),
    });
  }
}
