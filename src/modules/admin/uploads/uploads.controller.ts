import {
  Controller,
  HttpStatus,
  ParseFilePipeBuilder,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { PERMISSIONS } from '../../../common/constants/permissions';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { UploadsService } from './uploads.service';
import { UploadImageResponseDto } from './dto';

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

@ApiTags('Admin - Uploads')
@ApiBearerAuth('access-token')
@Controller('admin/uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('image')
  @RequirePermissions(PERMISSIONS.PRODUCTS_UPDATE)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOperation({
    summary: 'Admin: upload a product/variant image (returns a Cloudinary URL)',
  })
  @ApiOkResponse({ type: UploadImageResponseDto })
  uploadImage(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: /^image\/(jpeg|png|webp|gif)$/ })
        .addMaxSizeValidator({ maxSize: MAX_IMAGE_SIZE_BYTES })
        .build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY }),
    )
    file: Express.Multer.File,
  ) {
    return this.uploadsService.uploadImage(file);
  }
}
