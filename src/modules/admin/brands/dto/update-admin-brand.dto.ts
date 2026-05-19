import { PartialType } from '@nestjs/swagger';
import { CreateAdminBrandDto } from './create-admin-brand.dto';

export class UpdateAdminBrandDto extends PartialType(CreateAdminBrandDto) {}
