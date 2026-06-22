import fs from 'fs';

let isPlaywrightAvailable: boolean | null = null;

export function checkPlaywright(): boolean {
  if (isPlaywrightAvailable !== null) {
    return isPlaywrightAvailable;
  }

  try {
    if (process.env.SKIP_PLAYWRIGHT === 'true' || process.env.SKIP_PLAYWRIGHT === '1') {
      isPlaywrightAvailable = false;
      return false;
    }

    const cacheDirs = [
      '/root/.cache/ms-playwright',
      process.env.HOME ? `${process.env.HOME}/.cache/ms-playwright` : null,
      process.env.USERPROFILE ? `${process.env.USERPROFILE}/.cache/ms-playwright` : null,
    ].filter(Boolean);

    let foundAnyDir = false;
    for (const dir of cacheDirs) {
      if (dir && fs.existsSync(dir)) {
        foundAnyDir = true;
        const files = fs.readdirSync(dir);
        const hasChromeOrChromium = files.some(f => f.startsWith('chromium') || f.startsWith('chrome'));
        if (hasChromeOrChromium) {
          isPlaywrightAvailable = true;
          return true;
        }
      }
    }

    // If none of the directories contain chromium/chrome, fallback is false
    isPlaywrightAvailable = false;
  } catch (err) {
    isPlaywrightAvailable = false;
  }

  return isPlaywrightAvailable;
}
