import { PartialType } from '@nestjs/swagger';
import { CreateChecklistTemplateDto } from './create-checklist-template.dto';

export class UpdateChecklistTemplateDto extends PartialType(
  CreateChecklistTemplateDto,
) {}
