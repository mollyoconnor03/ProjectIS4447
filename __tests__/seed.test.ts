/**
 * @jest-environment node
 */
import { seedIfEmpty } from '../db/seed';
import { db } from '../db/client';

jest.mock('../db/client', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
  },
}));

jest.mock('../db/schema', () => ({
  usersTable: {},
  categoriesTable: {},
  tripsTable: {},
  activitiesTable: {},
  targetsTable: {},
}));

jest.mock('expo-crypto', () => ({
  digestStringAsync: jest.fn().mockResolvedValue('mock_hash'),
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
}));

describe('seedIfEmpty', () => {
  let mockInsert: jest.Mock;
  let mockValues: jest.Mock;
  let mockReturning: jest.Mock;
  let mockSelect: jest.Mock;
  let mockFrom: jest.Mock;

  beforeEach(() => {
    mockReturning = jest.fn()
      .mockResolvedValueOnce([{ id: 1, name: 'Molly', email: 'demo@aistear.com', passwordHash: 'mock_hash' }])
      .mockResolvedValueOnce([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 }])
      .mockResolvedValueOnce([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 }]);

    mockValues = jest.fn().mockReturnValue({ returning: mockReturning });
    mockInsert = db.insert as jest.Mock;
    mockInsert.mockReturnValue({ values: mockValues });

    mockFrom = jest.fn().mockResolvedValue([]);
    mockSelect = db.select as jest.Mock;
    mockSelect.mockReturnValue({ from: mockFrom });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('inserts a user named Molly when no users exist', async () => {
    await seedIfEmpty();
    expect(mockInsert).toHaveBeenCalled();
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Molly' })
    );
  });

  it('inserts the user with the correct email', async () => {
    await seedIfEmpty();
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'demo@aistear.com' })
    );
  });

  it('skips seeding when users already exist', async () => {
    mockFrom.mockResolvedValue([{ id: 99, name: 'Existing User' }]);
    await seedIfEmpty();
    expect(mockInsert).not.toHaveBeenCalled();
  });
});
