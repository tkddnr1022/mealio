
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserIngredientRepository } from './user-ingredient.repository';
import {
  UserIngredient,
  UserIngredientDocument,
} from '../../mongoose/schemas/user-ingredient.schema';

describe('UserIngredientRepository', () => {
  let repository: UserIngredientRepository;
  let model: Model<UserIngredientDocument>;

  const mockUserIngredient = {
    userId: 1,
    ingredients: { '1': 'salt' },
  } as UserIngredient;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserIngredientRepository,
        {
          provide: getModelToken(UserIngredient.name),
          useValue: {
            findOne: jest.fn(),
            findOneAndUpdate: jest.fn(),
          },
        },
      ],
    }).compile();

    repository = module.get<UserIngredientRepository>(UserIngredientRepository);
    model = module.get<Model<UserIngredientDocument>>(
      getModelToken(UserIngredient.name),
    );
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findByUserId', () => {
    it('should find and return user ingredients by user id', async () => {
      const userId = 1;
      const exec = jest.fn().mockResolvedValue(mockUserIngredient);
      jest.spyOn(model, 'findOne').mockReturnValue({ exec } as any);

      const result = await repository.findByUserId(userId);

      expect(model.findOne).toHaveBeenCalledWith({ userId });
      expect(result).toEqual(mockUserIngredient);
    });
  });

  describe('upsert', () => {
    it('should upsert user ingredients', async () => {
      const userId = 1;
      const data = { ingredients: { '2': 'pepper' } };
      const exec = jest.fn().mockResolvedValue({ ...mockUserIngredient, ...data });
      jest.spyOn(model, 'findOneAndUpdate').mockReturnValue({ exec } as any);

      const result = await repository.upsert(userId, data);

      expect(model.findOneAndUpdate).toHaveBeenCalledWith({ userId }, data, {
        upsert: true,
        new: true,
      });
      expect(result).toEqual({ ...mockUserIngredient, ...data });
    });
  });
});
