import { Test, TestingModule } from '@nestjs/testing';
import { AdminBrandsService } from './admin-brands.service';

describe('AdminBrandsService', () => {
  let service: AdminBrandsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminBrandsService],
    }).compile();

    service = module.get<AdminBrandsService>(AdminBrandsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
