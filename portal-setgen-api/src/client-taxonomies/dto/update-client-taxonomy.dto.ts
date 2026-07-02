import { PartialType } from '@nestjs/swagger';
import { CreateClientTaxonomyDto } from './create-client-taxonomy.dto';

export class UpdateClientTaxonomyDto extends PartialType(CreateClientTaxonomyDto) {}
