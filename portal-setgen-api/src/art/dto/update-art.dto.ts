import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateArtDto } from './create-art.dto';

export class UpdateArtDto extends PartialType(
  OmitType(CreateArtDto, ['serviceOrderId'] as const),
) {}
