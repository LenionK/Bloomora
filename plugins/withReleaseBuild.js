// Keeps two changes to android/app/build.gradle across every `expo prebuild`,
// which rewrites that folder from scratch.
//
// 1. Signs release builds with the key named in ~/.gradle/gradle.properties
//    (BLOOMORA_STORE_FILE and the others), so passwords never enter the repo.
//    Without those properties, release builds keep the debug key.
// 2. Lets CMake shorten object file paths, which on Windows would otherwise
//    pass the 260 character limit and stop the native build.
const { withAppBuildGradle } = require('expo/config-plugins');

const MARKER = '// Added by plugins/withReleaseBuild.js';

const RELEASE_BUILD = `
${MARKER}
android {
    signingConfigs {
        if (project.hasProperty('BLOOMORA_STORE_FILE')) {
            release {
                storeFile file(BLOOMORA_STORE_FILE)
                storePassword BLOOMORA_STORE_PASSWORD
                keyAlias BLOOMORA_KEY_ALIAS
                keyPassword BLOOMORA_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.findByName('release') ?: signingConfigs.debug
        }
    }
    defaultConfig {
        externalNativeBuild {
            cmake {
                arguments '-DCMAKE_OBJECT_PATH_MAX=240'
            }
        }
    }
}
`;

function addReleaseBuild(contents) {
  return contents.includes(MARKER) ? contents : contents + RELEASE_BUILD;
}

function withReleaseBuild(config) {
  return withAppBuildGradle(config, (gradleConfig) => {
    gradleConfig.modResults.contents = addReleaseBuild(
      gradleConfig.modResults.contents,
    );
    return gradleConfig;
  });
}

module.exports = withReleaseBuild;
module.exports.addReleaseBuild = addReleaseBuild;
