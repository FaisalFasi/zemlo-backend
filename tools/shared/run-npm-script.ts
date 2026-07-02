import { spawn } from 'node:child_process';

export async function runNpmScript(script: string): Promise<void> {
  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

  await new Promise<void>((resolve, reject) => {
    const childProcess = spawn(npmCommand, ['run', script], {
      stdio: 'inherit',
      env: process.env,
    });

    childProcess.once('error', (error) => {
      reject(
        new Error(`Unable to start npm script "${script}": ${error.message}`),
      );
    });

    childProcess.once('exit', (exitCode, signal) => {
      if (exitCode === 0) {
        resolve();
        return;
      }

      const exitReason =
        signal !== null
          ? `terminated by signal ${signal}`
          : `exited with code ${exitCode ?? 'unknown'}`;

      reject(new Error(`npm script "${script}" ${exitReason}`));
    });
  });
}
