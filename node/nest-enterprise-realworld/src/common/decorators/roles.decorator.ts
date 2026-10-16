import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY } from '../constants/response-code.constant';

export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
