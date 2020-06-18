import ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
import { join } from 'path';
import { TsconfigPathsPlugin } from 'tsconfig-paths-webpack-plugin';
import { defaultConfiguration } from '../../configuration/defaults';
import { appendTsExtension } from '../helpers/append-extension';
import { MultiNestCompilerPlugins } from '../plugins-loader';
import webpack = require('webpack');
import nodeExternals = require('webpack-node-externals');

export const webpackDefaultsFactory = (
  sourceRoot: string,
  relativeSourceRoot: string,
  entryFilename: string,
  isDebugEnabled = false,
  tsConfigFile = defaultConfiguration.compilerOptions.tsConfigPath,
  plugins: MultiNestCompilerPlugins,
): webpack.Configuration => ({
  entry: appendTsExtension(join(sourceRoot, entryFilename)),
  devtool: isDebugEnabled ? 'inline-source-map' : false,
  target: 'node',
  output: {
    filename: join(relativeSourceRoot, `${entryFilename}.js`),
  },
  externals: [nodeExternals()],
  module: {
    rules: [
      {
        test: /.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
              configFile: tsConfigFile,
              getCustomTransformers: (program: any) => ({
                before: plugins.beforeHooks.map((hook) => hook(program)),
                after: plugins.afterHooks.map((hook) => hook(program)),
              }),
            },
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    plugins: [
      new TsconfigPathsPlugin({
        configFile: tsConfigFile,
      }),
    ],
  },
  mode: 'none',
  optimization: {
    nodeEnv: false,
  },
  node: {
    __filename: false,
    __dirname: false,
  },
  plugins: [
    new webpack.IgnorePlugin({
      checkResource(resource: any) {
        const lazyImports = [
          '@nestjs/microservices',
          'cache-manager',
          'class-validator',
          'class-transformer',
        ];
        if (!lazyImports.includes(resource)) {
          return false;
        }
        try {
          require.resolve(resource, {
            paths: [process.cwd()],
          });
        } catch (err) {
          return true;
        }
        return false;
      },
    }),
    new ForkTsCheckerWebpackPlugin({
      typescript: {
        configFile: tsConfigFile,
      },
    }),
  ],
});
