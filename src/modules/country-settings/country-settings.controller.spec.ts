import { Test, TestingModule } from '@nestjs/testing';
import { CountrySettingsController } from './country-settings.controller';

describe('CountrySettingsController', () => {
  let controller: CountrySettingsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CountrySettingsController],
    }).compile();

    controller = module.get<CountrySettingsController>(CountrySettingsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
