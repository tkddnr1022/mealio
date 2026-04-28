import { resolveRecipeSortPolicy } from './recipe-sort.policy';

describe('resolveRecipeSortPolicy', () => {
  it('기본 정렬은 latest 정책을 반환한다', () => {
    const policy = resolveRecipeSortPolicy();
    expect(policy.key).toBe('latest');
    expect(policy.orderBy).toEqual([
      { createdAt: 'desc' },
      { stats: { viewCount: 'desc' } },
      { stats: { likeCount: 'desc' } },
      { id: 'desc' },
    ]);
  });

  it('viewCount 정렬은 통계 정렬 정책을 반환한다', () => {
    const policy = resolveRecipeSortPolicy('viewCount');
    expect(policy.key).toBe('viewCount');
    expect(policy.orderBy).toEqual([
      { stats: { viewCount: 'desc' } },
      { stats: { likeCount: 'desc' } },
      { id: 'desc' },
    ]);
  });
});

