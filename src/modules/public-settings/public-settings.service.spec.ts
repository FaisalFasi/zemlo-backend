import { Test, TestingModule } from '@nestjs/testing';
import { PublicSettingsService } from './public-settings.service';

describe('PublicSettingsService', () => {
  let service: PublicSettingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PublicSettingsService],
    }).compile();

    service = module.get<PublicSettingsService>(PublicSettingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
