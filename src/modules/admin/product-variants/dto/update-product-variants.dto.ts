import { PartialType } from '@nestjs/swagger';
import { CreateProductVariantDto } from './create-product-variants.dto';

export class UpdateProductVariantDto extends PartialType(
  CreateProductVariantDto,
) {}
