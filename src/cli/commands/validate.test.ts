import { buildValidateCommand } from './validate';
import fs from 'fs';
import path from 'path';
import os from 'os';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envlayer-validate-'));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

describe('buildValidateCommand', () => {
  it('returns a Command named validate', () => {
    const cmd = buildValidateCommand();
    expect(cmd.name()).toBe('validate');
  });

  it('exits with code 1 when schema file does not exist', () => {
    const mockExit = jest.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    });
    const cmd = buildValidateCommand();
    expect(() =>
      cmd.parse(['node', 'envlayer', '--schema', '/nonexistent/schema.json'])
    ).toThrow('process.exit(1)');
    mockExit.mockRestore();
  });

  it('exits with code 1 when schema JSON is invalid', () => {
    const tmpDir = makeTmpDir();
    const schemaPath = writeFile(tmpDir, 'schema.json', '{ invalid json }');
    const mockExit = jest.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    });
    const cmd = buildValidateCommand();
    expect(() =>
      cmd.parse(['node', 'envlayer', '--schema', schemaPath])
    ).toThrow('process.exit(1)');
    mockExit.mockRestore();
  });

  it('succeeds and prints valid message for a matching .env file', () => {
    const tmpDir = makeTmpDir();
    writeFile(tmpDir, '.env', 'APP_PORT=3000\nAPP_SECRET=supersecret');
    const schema = {
      APP_PORT: { type: 'string', required: true },
      APP_SECRET: { type: 'string', required: true },
    };
    const schemaPath = writeFile(tmpDir, 'schema.json', JSON.stringify(schema));
    const mockExit = jest.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    });
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const cmd = buildValidateCommand();
    cmd.parse(['node', 'envlayer', '--schema', schemaPath, '--dir', tmpDir]);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('✅'));
    consoleSpy.mockRestore();
    mockExit.mockRestore();
  });
});
