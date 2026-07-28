const { notarize } = require('@electron/notarize');
const path = require('path');

require('dotenv').config();

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;

  if (electronPlatformName !== 'darwin') {
    return;
  }

  const appleId = process.env.APPLE_ID?.trim();
  const appleIdPassword = (
    process.env.APPLE_APP_SPECIFIC_PASSWORD || process.env.APPLE_APP_PWD
  )?.trim();
  const teamId = process.env.APPLE_TEAM_ID?.trim();

  if (!appleId || !appleIdPassword || !teamId) {
    const message = '[MacNotarize] Apple notarization credentials are incomplete.';
    if (process.env.WESIGHT_REQUIRE_APPLE_NOTARIZATION === 'true') {
      throw new Error(message);
    }
    console.warn(`${message} Skipping app notarization.`);
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  const appPath = path.join(appOutDir, `${appName}.app`);

  console.log(`[MacNotarize] Submitting ${appName} for notarization.`);

  try {
    await notarize({
      tool: 'notarytool',
      appPath,
      appleId,
      appleIdPassword,
      teamId,
    });

    console.log(`[MacNotarize] Notarized and stapled ${appName}.`);
  } catch (error) {
    console.error(`[MacNotarize] Failed to notarize ${appName}:`, error);
    throw error;
  }
};
