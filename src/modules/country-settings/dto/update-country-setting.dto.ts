import { PartialType } from '@nestjs/swagger';
import { CreateCountrySettingDto } from './create-country-setting.dto';

export class UpdateCountrySettingDto extends PartialType(
  CreateCountrySettingDto,
) {}
