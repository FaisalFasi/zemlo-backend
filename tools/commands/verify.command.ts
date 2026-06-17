import {
  type VerificationProfile,
  verificationProfiles,
} from '../config/verification.config';
import { runNpmScript } from '../shared/run-npm-script';

function isVerificationProfile(value: string): value is VerificationProfile {
  return Object.hasOwn(verificationProfiles, value);
}

export async function runVerifyCommand(args: string[]): Promise<void> {
  const requestedProfile = args[0] ?? 'quick';

  if (!isVerificationProfile(requestedProfile)) {
    throw new Error(
      `Unknown verification profile "${requestedProfile}". Use "quick" or "full".`,
    );
  }

  const steps = verificationProfiles[requestedProfile];

  console.log(
    `\nRunning Zemlo ${requestedProfile} verification (${steps.length} steps)...\n`,
  );

  for (const [index, step] of steps.entries()) {
    console.log(
      `\n[${index + 1}/${steps.length}] ${step.label} — npm run ${step.npmScript}\n`,
    );

    await runNpmScript(step.npmScript);
  }

  console.log(
    `\n✅ Zemlo ${requestedProfile} verification completed successfully.\n`,
  );
}
