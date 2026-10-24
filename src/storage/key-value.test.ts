import AsyncStorage from '@react-native-async-storage/async-storage';

import { asyncStorage, deviceStorage, pickDeviceStorage } from './device-storage';
import { memoryStorage } from './key-value';

describe('memoryStorage', () => {
  it('grava, lê e apaga', async () => {
    const storage = memoryStorage({ a: '1' });

    await storage.setItem('b', '2');
    await storage.removeItem('a');

    expect(await storage.getItem('a')).toBeNull();
    expect(await storage.getItem('b')).toBe('2');
    expect(storage.dump()).toEqual({ b: '2' });
  });
});

describe('deviceStorage', () => {
  beforeEach(() => AsyncStorage.clear());

  it('grava, lê e apaga no AsyncStorage', async () => {
    await deviceStorage.setItem('numa.test', 'x');
    expect(await AsyncStorage.getItem('numa.test')).toBe('x');
    expect(await deviceStorage.getItem('numa.test')).toBe('x');

    await deviceStorage.removeItem('numa.test');

    expect(await deviceStorage.getItem('numa.test')).toBeNull();
  });
});

describe('pickDeviceStorage', () => {
  it('no aparelho e no navegador, usa o AsyncStorage', () => {
    expect(pickDeviceStorage(false, false)).toBe(asyncStorage);
    expect(pickDeviceStorage(true, true)).toBe(asyncStorage);
  });

  it('na geração das páginas estáticas (web sem window), não lê nem salva nada', async () => {
    const storage = pickDeviceStorage(true, false);
    await storage.setItem('numa.test', 'x');
    await storage.removeItem('numa.test');

    expect(await storage.getItem('numa.test')).toBeNull();
    expect(await AsyncStorage.getItem('numa.test')).toBeNull();
  });
});
