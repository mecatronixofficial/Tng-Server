import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { uploadImageMaxMb } from '../../modules/uploads/upload-limits';

interface ErrorResponseShape {
  statusCode: number;
  message: string | string[];
  error?: string;
  path: string;
  timestamp: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const r = exception.getResponse();
      if (typeof r === 'string') {
        message = r;
      } else {
        const obj = r as Record<string, any>;
        message = obj.message ?? exception.message;
        error = obj.error;
      }
    } else if (exception && typeof exception === 'object' && 'message' in exception) {
      const err = exception as Error & {
        code?: string;
        status?: number;
        statusCode?: number;
      };

      message = err.message;

      if (err.code === 'LIMIT_FILE_SIZE') {
        status = HttpStatus.PAYLOAD_TOO_LARGE;
        message = `Image is too large. Maximum allowed size is ${uploadImageMaxMb}MB.`;
        error = 'Payload Too Large';
      } else if (err.status === 413 || err.statusCode === 413) {
        status = HttpStatus.PAYLOAD_TOO_LARGE;
        message = err.message || 'Request payload is too large';
        error = 'Payload Too Large';
      }

      // Mongo duplicate key
      if ((exception as any).code === 11000) {
        status = HttpStatus.CONFLICT;
        const fields = Object.keys((exception as any).keyValue || {});
        message = `Duplicate value for: ${fields.join(', ')}`;
      }
    }

    if (status >= 500) {
      this.logger.error(`${req.method} ${req.url} → ${status}`, (exception as Error)?.stack);
    }

    const body: ErrorResponseShape = {
      statusCode: status,
      message,
      error,
      path: req.url,
      timestamp: new Date().toISOString(),
    };

    res.status(status).json(body);
  }
}
