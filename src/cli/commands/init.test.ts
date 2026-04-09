import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { buildInitCommand } from './init';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envlayer-init-test-'));
}

describe('buildInitCommand', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('creates a schema file at the default output path', async () => {
    const outputPath = path.join(tmpDir, 'envlayer.schema.json');
    const cmd = buildInitCommand();
    await cmd.parseAsync(['--output', outputPath], { from: 'user' });

    expect(fs.existsSync(outputPath)).toBe(true);
    const content = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
    expect(content).toHaveProperty('version', 1);
    expect(content).toHaveProperty('variables');
    expect(content.variables).toHaveProperty('NODE_ENV');
  });

  it('includes expected default environments', async () => {
    const outputPath = path.join(tmpDir, 'schema.json');
    const cmd = buildInitCommand();
    await cmd.parseAsync(['--output', outputPath], { from: 'user' });

    const content = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
    expect(content.environments).toEqual(['development', 'staging', 'production']);
  });

  it('throws if schema file already exists without --force', async () => {
    const outputPath = path.join(tmpDir, 'envlayer.schema.json');
    fs.writeFileSync(outputPath, '{}', 'utf-8');

    const cmd = buildInitCommand();
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as never);
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await cmd.parseAsync(['--output', outputPath], { from: 'user' });

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('already exists'));

    exitSpy.mockRestore();
    consoleSpy.mockRestore();
  });

  it('overwrites existing file when --force is provided', async () => {
    const outputPath = path.join(tmpDir, 'envlayer.schema.json');
    fs.writeFileSync(outputPath, '{"old":true}', 'utf-8');

    const cmd = buildInitCommand();
    await cmd.parseAsync(['--output', outputPath, '--force'], { from: 'user' });

    const content = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
    expect(content).toHaveProperty('version', 1);
    expect(content).not.toHaveProperty('old');
  });
});
