import { Test, TestingModule } from '@nestjs/testing';
import { CountrySettingsService } from './country-settings.service';

describe('CountrySettingsService', () => {
  let service: CountrySettingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CountrySettingsService],
    }).compile();

    service = module.get<CountrySettingsService>(CountrySettingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
