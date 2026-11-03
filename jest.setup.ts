jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(async () => ({
    execAsync: jest.fn(),
    getAllAsync: jest.fn(async () => []),
    getFirstAsync: jest.fn(async () => ({ user_version: 1, size: 8192 })),
    runAsync: jest.fn(),
    withTransactionAsync: jest.fn(async (task: () => Promise<void>) => task()),
  })),
}));
