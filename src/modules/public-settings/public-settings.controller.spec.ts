import { Test, TestingModule } from '@nestjs/testing';
import { PublicSettingsController } from './public-settings.controller';

describe('PublicSettingsController', () => {
  let controller: PublicSettingsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PublicSettingsController],
    }).compile();

    controller = module.get<PublicSettingsController>(PublicSettingsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
