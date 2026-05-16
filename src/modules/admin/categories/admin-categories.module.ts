import { Module } from '@nestjs/common';
import { AdminCategoriesService } from './admin-categories.service';
import { AdminCategoriesController } from './admin-categories.controller';

@Module({
  controllers: [AdminCategoriesController],
  providers: [AdminCategoriesService],
})
export class AdminCategoriesModule {}
