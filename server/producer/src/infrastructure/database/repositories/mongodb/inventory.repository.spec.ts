import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InventoryRepository } from './inventory.repository';
import { Inventory, InventoryDocument } from '@mealio/shared';

describe('InventoryRepository', () => {
  let repository: InventoryRepository;
  let model: Model<InventoryDocument>;

  const mockInventory = {
    userId: 1,
    ingredients: { ownedIds: [1], favoriteIds: [1] },
    recipes: { favoriteIds: [101] },
  } as unknown as Inventory;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryRepository,
        {
          provide: getModelToken(Inventory.name),
          useValue: {
            findOne: jest.fn(),
            findOneAndUpdate: jest.fn(),
          },
        },
      ],
    }).compile();

    repository = module.get<InventoryRepository>(InventoryRepository);
    model = module.get<Model<InventoryDocument>>(getModelToken(Inventory.name));
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findByUserId', () => {
    it('should find and return user ingredients by user id (lean + select)', async () => {
      const userId = 1;
      const exec = jest.fn().mockResolvedValue(mockInventory);
      const lean = jest.fn().mockReturnValue({ exec });
      const select = jest.fn().mockReturnValue({ lean });
      jest.spyOn(model, 'findOne').mockReturnValue({ select } as any);

      const result = await repository.findByUserId(userId);

      expect(model.findOne).toHaveBeenCalledWith({ userId });
      expect(select).toHaveBeenCalledWith(
        'userId ingredients.ownedIds ingredients.favoriteIds recipes.favoriteIds lastSyncedAt',
      );
      expect(lean).toHaveBeenCalled();
      expect(result).toEqual(mockInventory);
    });
  });

  // upsert: Producer에서는 Command를 이벤트 발행으로 대체하므로 리포지토리에 upsert 미노출 (Consumer에서 처리)
});
