import { normalizeFoodsafetyImageUrl } from '../foodsafety-image-url.util';

describe('normalizeFoodsafetyImageUrl', () => {
  it('should accept absolute http URL', () => {
    const url = 'http://www.foodsafetykorea.go.kr/uploadimg/cook/10_00017_2.png';
    expect(normalizeFoodsafetyImageUrl(url)).toBe(url);
  });

  it('should prefix relative path with foodsafety origin', () => {
    expect(normalizeFoodsafetyImageUrl('/uploadimg/cook/x.png')).toBe(
      'http://www.foodsafetykorea.go.kr/uploadimg/cook/x.png',
    );
  });

  it('should return null for empty or invalid values', () => {
    expect(normalizeFoodsafetyImageUrl('')).toBeNull();
    expect(normalizeFoodsafetyImageUrl('not-a-url')).toBeNull();
    expect(normalizeFoodsafetyImageUrl(null)).toBeNull();
  });
});
