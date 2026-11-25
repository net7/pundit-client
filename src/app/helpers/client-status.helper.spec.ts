import { noticeApplies, parseClientStatus } from './client-status.helper';

const maintenance = (extra: Record<string, unknown> = {}) => ({
  id: 'maintenance', active: true, level: 'maintenance', ...extra
});

describe('parseClientStatus', () => {
  it('reads an empty notice list as no notice', () => {
    expect(parseClientStatus({ version: 1, notices: [] })).toEqual({ notices: [] });
  });

  it('reads a maintenance notice', () => {
    expect(parseClientStatus({ version: 1, notices: [maintenance()] })).toEqual({
      notices: [{ id: 'maintenance', maxClientVersion: null }]
    });
  });

  it('reads maxClientVersion', () => {
    const status = parseClientStatus({
      version: 1,
      notices: [maintenance({ appliesTo: { maxClientVersion: '1.18.0' } })]
    });
    expect(status?.notices[0].maxClientVersion).toBe('1.18.0');
  });

  it('ignores unknown fields', () => {
    const status = parseClientStatus({
      version: 1,
      extra: true,
      notices: [maintenance({ message: { en: 'x' }, blockActions: true, appliesTo: { other: 1 } })]
    });
    expect(status).toEqual({ notices: [{ id: 'maintenance', maxClientVersion: null }] });
  });

  it('ignores notices of other levels', () => {
    expect(parseClientStatus({ version: 1, notices: [maintenance({ level: 'info' })] }))
      .toEqual({ notices: [] });
  });

  it('ignores inactive notices', () => {
    expect(parseClientStatus({ version: 1, notices: [maintenance({ active: false })] }))
      .toEqual({ notices: [] });
  });

  it('ignores notices without id or level', () => {
    expect(parseClientStatus({
      version: 1,
      notices: [{ active: true, level: 'maintenance' }, { id: 'x', active: true }, null, 'x']
    })).toEqual({ notices: [] });
  });

  it('keeps a non-string maxClientVersion as invalid', () => {
    const status = parseClientStatus({
      version: 1, notices: [maintenance({ appliesTo: { maxClientVersion: 118 } })]
    });
    expect(status?.notices[0].maxClientVersion).toBe('');
  });

  it.each([
    ['another format version', { version: 2, notices: [] }],
    ['no version', { notices: [] }],
    ['no notices array', { version: 1 }],
    ['notices not an array', { version: 1, notices: {} }],
    ['null', null],
    ['a string', 'maintenance'],
    ['an array', []],
  ])('rejects %s', (_label, json) => {
    expect(parseClientStatus(json)).toBeNull();
  });
});

describe('noticeApplies', () => {
  const notice = (maxClientVersion: string | null) => ({ id: 'maintenance', maxClientVersion });

  it('applies to every client without maxClientVersion', () => {
    expect(noticeApplies(notice(null), '1.19.0')).toEqual({ id: 'maintenance', outdated: false });
  });

  it.each([
    ['1.18.0', '1.18.0'],
    ['1.18.0', '1.17.0'],
    ['1.18.0', '1.18.0.1'],
    ['1.18.0', '1.9.5'],
    ['1.18', '1.18.7'],
    ['1.18.0.65535', '1.18.0.3'],
  ])('applies as outdated when max is %s and the client is %s', (max, client) => {
    expect(noticeApplies(notice(max), client)).toEqual({ id: 'maintenance', outdated: true });
  });

  it.each([
    ['1.18.0', '1.19.0'],
    ['1.18.0', '1.19.0.2'],
    ['1.18.0', '1.18.1'],
    ['1.18', '1.19.0'],
    ['1.18.0', '2.0.0'],
  ])('does not apply when max is %s and the client is %s', (max, client) => {
    expect(noticeApplies(notice(max), client)).toBeNull();
  });

  it.each(['latest', '', '1..0', '1.18.x', ' 1.18.0', '-1.0'])(
    'applies with the maintenance text when maxClientVersion is invalid (%p)',
    (max) => {
      expect(noticeApplies(notice(max), '1.19.0')).toEqual({ id: 'maintenance', outdated: false });
    }
  );

  it.each([null, '', 'dev'])(
    'applies with the maintenance text when the client version is unknown (%p)',
    (client) => {
      expect(noticeApplies(notice('1.18.0'), client)).toEqual({ id: 'maintenance', outdated: false });
    }
  );
});
