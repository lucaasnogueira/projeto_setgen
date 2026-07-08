import { PartialType } from '@nestjs/swagger';
import { CreateFailureCategoryDto } from './create-failure-category.dto';

export class UpdateFailureCategoryDto extends PartialType(CreateFailureCategoryDto) {}
