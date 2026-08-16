import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { PERMISSIONS } from '../../common/constants/permissions';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { AdminService } from './admin.service';
import { AdminStatsQueryDto, AdminStatsResponseDto } from './dto';

@ApiTags('Admin')
@ApiBearerAuth('access-token')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @RequirePermissions(PERMISSIONS.ANALYTICS_VIEW)
  @ApiOperation({
    summary:
      'Admin: dashboard stats (orders today, revenue today, low-stock count)',
  })
  @ApiOkResponse({ type: AdminStatsResponseDto })
  getStats(@Query() query: AdminStatsQueryDto) {
    return this.adminService.getStats(query);
  }
}
