import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface JwtUserPayload {
  sub: string;
  email: string;
  role: string;
  name?: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof JwtUserPayload | undefined, ctx: ExecutionContext): any => {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user as JwtUserPayload;
    return data ? user?.[data] : user;
  },
);
