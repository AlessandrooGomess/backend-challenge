import { SetMetadata } from '@nestjs/common';
import { Actions, AppSubjects } from 'src/modules/ability/app.ability';

export interface RequiredPermission {
  action: Actions;
  subject: Extract<AppSubjects, string>;
}

export const CAN_KEY = 'can';
export const Can = (action: Actions, subject: Extract<AppSubjects, string>) =>
  SetMetadata(CAN_KEY, { action, subject } satisfies RequiredPermission);
