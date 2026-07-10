const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const exclusionList = require('metro-config/src/defaults/exclusionList');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');
const appNodeModules = path.join(projectRoot, 'node_modules');
const libraryPackage = require('../package.json');
const peerDependencies = Object.keys(libraryPackage.peerDependencies ?? {});

const escapePathForRegex = (filePath) =>
  filePath.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [...(config.watchFolders ?? []), workspaceRoot];

config.resolver = {
  ...config.resolver,
  blockList: exclusionList(
    peerDependencies.map(
      (dependency) =>
        new RegExp(
          `^${escapePathForRegex(
            path.join(workspaceRoot, 'node_modules', dependency)
          )}\\/.*$`
        )
    )
  ),
  extraNodeModules: {
    ...(config.resolver.extraNodeModules ?? {}),
    [libraryPackage.name]: path.join(workspaceRoot, 'src'),
    ...Object.fromEntries(
      peerDependencies.map((dependency) => [
        dependency,
        path.join(appNodeModules, dependency),
      ])
    ),
  },
};

module.exports = config;
