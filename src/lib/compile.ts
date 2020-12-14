import {build, BuildOptions, OutputFile} from 'esbuild';
import fs from 'fs';
import path from 'path';
import {promisify} from 'util';
import {merge} from 'lodash';
import {obfuscate, ObfuscatorOptions} from 'javascript-obfuscator';
import {createServer} from './server';
import {loadEnvFiles} from './env';
import compileOptions from '../../scriptable.config';
import {ensureFile, remove} from 'fs-extra';

/**打包模式*/
export enum CompileType {
  /**打包一个文件夹*/
  ALL = 'all',

  /**为打包入口文件*/
  ONE = 'one',
}

export interface CompileOptions {
  /**项目根目录*/
  rootPath: string;

  /**输入文件，当 compileType 为 one 时生效*/
  inputFile: string;

  /**输入文件夹，当 compileType 为 all 时生效*/
  inputDir: string;

  /**输出文件夹*/
  outputDir: string;

  /**打包模式，all 为打包一个文件夹，one为打包入口文件*/
  compileType?: CompileType;

  /**是否在 watch 开发*/
  watch?: boolean;

  /**是否显示二维码*/
  showQrcode?: boolean;

  /**
   * esbuild 自定义配置
   * see: https://esbuild.github.io/api/#simple-options
   */
  esbuild?: BuildOptions;

  /**是否压缩代码*/
  minify?: boolean;

  /**在编译中添加额外的头部，一般是作者信息*/
  header?: string;

  /**是否加密代码*/
  encrypt?: boolean;

  /**
   * javascript-obfuscator 自定义配置
   * see: https://github.com/javascript-obfuscator/javascript-obfuscator
   */
  encryptOptions?: ObfuscatorOptions;
}

/**项目根目录*/
const rootPath = path.resolve(__dirname, '../');

/**输入文件，当 compileType 为 one 时生效*/
const inputFile: string = path.resolve(rootPath, './src/index.ts');

/**输入文件夹，当 compileType 为 all 时生效*/
const inputDir: string = path.resolve(rootPath, './src/scripts');

/**输出文件夹*/
const outputDir: string = path.resolve(rootPath, './dist');

/**打包模式，all 为打包一个文件夹，one为打包入口文件*/
const compileType = (process.env.compileType as CompileType) || CompileType.ONE;

/**是否在 watch 开发*/
const watch = Boolean(process.env.watching);

/**是否压缩代码*/
const minify = process.env.NODE_ENV === 'production';

/**是否加密代码*/
const encrypt = process.env.NODE_ENV === 'production';

const _compileOptions = {
  rootPath,
  inputFile,
  inputDir,
  outputDir,
  compileType,
  watch,
  minify,
  encrypt,
};

compile(merge(_compileOptions, compileOptions || {}));

async function compile(options: CompileOptions) {
  const {
    rootPath,
    inputDir,
    inputFile,
    outputDir,
    compileType = CompileType.ONE,
    watch = false,
    showQrcode = true,
    esbuild = {},
    minify = false,
    encrypt = false,
    encryptOptions = {},
    header = '',
  } = options;

  /**加载环境变量 .env 文件*/
  loadEnvFiles(rootPath);

  if (watch) {
    /**创建服务器*/
    createServer({
      staticDir: outputDir,
      showQrcode,
    });
  }

  // 编译时，把 process.env 环境变量替换成 dotenv 文件参数
  const define: Record<string, string> = {};
  for (const key in process.env) {
    //  不能含有括号、-号、空格
    if (/[\(\)\-\s]/.test(key)) continue;
    define[`process.env.${key}`] = JSON.stringify(process.env[key]);
  }

  // 深度获取某个文件夹里所有文件路径（包括子文件夹）
  const readdir = promisify(fs.readdir);
  const stat = promisify(fs.stat);

  async function getFilesFromDir(dir: string): Promise<string[]> {
    const subdirs = await readdir(dir);
    const files = await Promise.all(
      subdirs.map(async subdir => {
        const res = path.resolve(dir, subdir);
        return (await stat(res)).isDirectory() ? getFilesFromDir(res) : res;
      }),
    );
    return files.reduce((a: string[], f: string | string[]) => a.concat(f), []);
  }

  /**所有输出的文件信息集合*/
  let outputFilesInfo: OutputFile[] = [];

  try {
    /**计算输入文件路径集合*/
    const inputPaths: string[] = compileType === CompileType.ALL ? await getFilesFromDir(inputDir) : [inputFile];

    /** esbuild 配置*/
    const esbuildOptions: BuildOptions = {
      entryPoints: [...inputPaths],
      platform: 'node',
      charset: 'utf8',
      bundle: true,
      outdir: outputDir,
      banner: `${header}
// @编译时间 ${Date.now()}
const MODULE = module;
let __topLevelAwait__ = () => Promise.resolve();
function EndAwait(promiseFunc) {
  __topLevelAwait__ = promiseFunc
};
    `,
      footer: `
await __topLevelAwait__();
`,
      jsxFactory: 'h',
      jsxFragment: 'Fragment',
      define,
      minify,
      write: false,
      inject: [path.resolve(rootPath, './src/lib/jsx-runtime.ts')],
    };

    // 最终打包环节
    // 先清空输出文件夹
    await remove(outputDir);

    // esbuild 打包
    outputFilesInfo = (await build(merge(esbuildOptions, esbuild))).outputFiles || [];
    console.error('esbuild打包结束');
  } catch (err) {
    console.error('esbuild打包出错', err);
    process.exit(1);
  }

  const writeFile = promisify(fs.writeFile);
  for (const outputFile of outputFilesInfo) {
    let writeText = outputFile.text;
    if (encrypt) {
      // 加密环节
      try {
        /**加密配置*/
        const _encryptOptions: ObfuscatorOptions = {
          rotateStringArray: true,
          selfDefending: true,
          stringArray: true,
          splitStringsChunkLength: 100,
          stringArrayEncoding: ['rc4', 'base64'],
        };
        // 读取失败就跳下一轮
        if (!outputFile.text) continue;

        // 加密代码
        const transformCode = obfuscate(outputFile.text, merge(_encryptOptions, encryptOptions)).getObfuscatedCode();

        // 写入加入代码、和头部信息
        writeText = `${header}\n${transformCode}`;
      } catch (err) {
        console.error('加密代码失败', err);
        process.exit(1);
      }
    }
    // 确保路径存在
    await ensureFile(outputFile.path);
    // 写入代码
    await writeFile(outputFile.path, writeText, {encoding: 'utf8'});
  }

  console.log('加密代码结束');
  console.log('打包完成');
}
