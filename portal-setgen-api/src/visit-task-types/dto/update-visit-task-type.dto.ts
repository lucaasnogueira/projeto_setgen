import { PartialType } from '@nestjs/swagger';
import { CreateVisitTaskTypeDto } from './create-visit-task-type.dto';

export class UpdateVisitTaskTypeDto extends PartialType(CreateVisitTaskTypeDto) {}
