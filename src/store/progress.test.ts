import { useProgress } from './progress';

beforeEach(() => useProgress.setState(useProgress.getInitialState(), true));

describe('useProgress.recordPlayedDay', () => {
  it('conta o dia na sequência, sem mexer nas etapas', () => {
    const { stages } = useProgress.getState();

    useProgress.getState().recordPlayedDay('2026-11-10');
    useProgress.getState().recordPlayedDay('2026-11-11');

    expect(useProgress.getState().streak).toEqual({
      current: 2,
      best: 2,
      lastPlayedDate: '2026-11-11',
    });
    expect(useProgress.getState().stages).toBe(stages);
  });
});
