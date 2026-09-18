import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export const User = createParamDecorator(
  (data: string, context: ExecutionContext) => {
    const req: Request = context.switchToHttp().getRequest();
    const user = req.user;

    return data ? user?.[data] : user;
  },
);
