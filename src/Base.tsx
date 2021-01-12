import {
  showActionSheet,
  showPreviewOptions,
  showNotification,
  useStorage,
  fm,
  setTransparentBackground,
  showModal,
  useSetting,
  request,
} from '@app/lib/help';

interface actionsProps {
  title: string;
  func: any;
}

const FILE_MGR_LOCAL: FileManager = fm();

class Base {
  async init(): Promise<void> {
    await this.componentWillMountBefore();
    if (config.runsInApp) {
      await this.showMenu();
    } else {
      await this.componentDidMount();
      const widget = ((await this.render()) as unknown) as ListWidget;
      Script.setWidget(widget);
      Script.complete();
    }
  }

  componentWillMountBefore = async (): Promise<void> => {
    this.backgroundKey = `${this.en}_background`;
    const {getSetting} = useSetting(this.en);
    const fontColorLight = (await getSetting<string>('fontColorLight')) || this.fontColor;
    const fontColorDark = (await getSetting<string>('fontColorDark')) || this.fontColor;
    this.fontColor = Device.isUsingDarkAppearance() ? fontColorDark : fontColorLight;

    const backgroundColorLight = (await getSetting<string>('backgroundColorLight')) || this.backgroundColor;
    const backgroundColorDark = (await getSetting<string>('backgroundColorDark')) || this.backgroundColor;
    this.backgroundColor = Device.isUsingDarkAppearance() ? backgroundColorDark : backgroundColorLight;

    const opacityLight = (await getSetting<string>('opacityLight')) || this.opacity;
    const opacityDark = (await getSetting<string>('opacityDark')) || this.opacity;
    this.opacity = Device.isUsingDarkAppearance() ? opacityDark : opacityLight;
    typeof this.componentWillMount === 'function' && (await this.componentWillMount());
  };

  name = '菜单';
  en = 'base';
  prefix = 'boxjs.net';
  useBoxJS = true;
  BOX_CATCH_KEY = 'BoxJSData';
  backgroundKey = '';
  render = async (): Promise<unknown> => false;
  componentWillMount = async (): Promise<void> => {};
  componentDidMount = async (): Promise<void> => {};
  backgroundColor: string = Device.isUsingDarkAppearance() ? '#000' : '#fff';
  fontColor: string = Device.isUsingDarkAppearance() ? '#fff' : '#000';
  opacity: string = Device.isUsingDarkAppearance() ? '0.7' : '0.4';

  updateInterval = async (): Promise<number> => {
    const {getSetting} = useSetting(this.en);
    const updateInterval: string = (await getSetting<string>('updateInterval')) || '30';
    return parseInt(updateInterval) * 1000 * 60;
  };

  baseActions: actionsProps[] = [
    {
      title: '字体颜色',
      func: async (): Promise<void> => {
        await this.setLightAndDark('字体颜色', 'Hex 颜色', 'fontColor');
      },
    },
    {
      title: '背景设置',
      func: async (): Promise<void> => {
        const actions: actionsProps[] = [
          {
            title: '白天图',
            func: async (): Promise<void> => {
              const image: Image = await Photos.fromLibrary();
              if (!(await this.verifyImage(image))) return;
              await this.setImage(image, `${this.backgroundKey}_light`);
            },
          },
          {
            title: '夜间图',
            func: async (): Promise<void> => {
              const image: Image = await Photos.fromLibrary();
              if (!(await this.verifyImage(image))) return;
              await this.setImage(image, `${this.backgroundKey}_night`);
            },
          },
          {
            title: '透明度',
            func: async (): Promise<void> => {
              return this.setLightAndDark('透明度', false, 'opacity');
            },
          },
          {
            title: '背景色',
            func: async () => {
              return this.setLightAndDark('背景色', false, 'backgroundColor');
            },
          },
        ];
        await this.showActionSheet('背景设置', actions);
      },
    },
    {
      title: '透明背景',
      func: async (): Promise<void> => {
        const image = await setTransparentBackground();
        image && (await this.setImage(image, this.backgroundKey));
      },
    },
    {
      title: '清空背景',
      func: async (): Promise<void> => {
        await this.setImage(null, `${this.backgroundKey}_light`);
        await this.setImage(null, `${this.backgroundKey}_night`);
        await this.setImage(null, this.backgroundKey);
      },
    },
    ...(this.useBoxJS
      ? [
          {
            title: 'BoxJS',
            func: async () => {
              const {getStorage, setStorage} = useStorage('boxjs');
              const boxjs: string = getStorage<string>('prefix') || this.prefix;
              const {texts} = await showModal({
                title: 'BoxJS设置',
                inputItems: [{placeholder: 'BoxJS域名', text: boxjs}],
              });
              await setStorage('prefix', texts[0]);
            },
          },
        ]
      : []),
  ];

  actions: actionsProps[] = [
    {
      title: '预览组件',
      func: async (): Promise<void> => {
        const render = async () => {
          await this.componentDidMount();
          return this.render();
        };
        await showPreviewOptions(render);
      },
    },
    {
      title: '刷新时间',
      func: async (): Promise<void> => {
        const {getSetting, setSetting} = useSetting(this.en);
        const updateInterval: string = (await getSetting<string>('updateInterval')) || '';
        const {texts} = await showModal({
          title: '刷新时间',
          inputItems: [
            {
              placeholder: '刷新时间单位分钟',
              text: `${updateInterval}`,
            },
          ],
        });
        await setSetting('updateInterval', texts);
      },
    },
    {
      title: '基础设置',
      func: async (): Promise<void> => {
        await this.showActionSheet('基础设置', this.baseActions);
      },
    },
  ];

  setLightAndDark = async (title: string, desc: string | false, key: string): Promise<void> => {
    try {
      const {getSetting, setSetting} = useSetting(this.en);
      const light = `${key}Light`,
        dark = `${key}Dark`;
      const lightText = (await getSetting<string>(light)) || '';
      const darkText = (await getSetting<string>(dark)) || '';
      const a = new Alert();
      a.title = '白天和夜间' + title;
      a.message = !desc ? '请自行去网站上搜寻颜色（Hex 颜色）' : desc;
      a.addTextField('白天', lightText);
      a.addTextField('夜间', darkText);
      a.addAction('确定');
      a.addCancelAction('取消');
      const id = await a.presentAlert();
      if (id === -1) return;
      await setSetting(light, a.textFieldValue(0), false);
      await setSetting(dark, a.textFieldValue(1));
      // 保存到本地
    } catch (e) {
      console.log(e);
    }
  };

  async generateAlert(message: string, options: string[]): Promise<number> {
    const alert: Alert = new Alert();
    alert.message = message;
    for (const option of options) {
      alert.addAction(option);
    }
    return await alert.presentAlert();
  }

  verifyImage = async (img: Image): Promise<boolean> => {
    try {
      const {width, height} = img.size;
      const direct = true;
      if (width > 1000) {
        const options = ['取消', '打开图像处理'];
        const message =
          '您的图片像素为' +
          width +
          ' x ' +
          height +
          '\n' +
          '请将图片' +
          (direct ? '宽度' : '高度') +
          '调整到 1000 以下\n' +
          (!direct ? '宽度' : '高度') +
          '自动适应';
        const index = await this.generateAlert(message, options);
        if (index === 1) await Safari.openInApp('https://www.sojson.com/image/change.html', false);
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  };

  setImage = async (img: Image | null, key: string, notify = true): Promise<void> => {
    const path = FILE_MGR_LOCAL.joinPath(FILE_MGR_LOCAL.documentsDirectory(), '/images');
    if (!FILE_MGR_LOCAL.fileExists(path)) FILE_MGR_LOCAL.createDirectory(path, true);
    const imgPath = FILE_MGR_LOCAL.joinPath(path, `img_${key}.jpg`);
    if (!img) {
      // 移除背景
      if (FILE_MGR_LOCAL.fileExists(imgPath)) FILE_MGR_LOCAL.remove(imgPath);
    } else {
      // 设置背景
      // 全部设置一遍，
      FILE_MGR_LOCAL.writeImage(imgPath, img);
    }
    if (notify) await showNotification({title: this.name, body: '设置生效，稍后刷新', sound: 'alert'});
  };

  getBackgroundImage = async (): Promise<Image | undefined> => {
    let result = undefined;
    const light = `${this.backgroundKey}_light`;
    const dark = `${this.backgroundKey}_dark`;
    const isNight = Device.isUsingDarkAppearance();
    const path1 = FILE_MGR_LOCAL.joinPath(FILE_MGR_LOCAL.documentsDirectory(), '/images/img_' + light + '.jpg');
    const path2 = FILE_MGR_LOCAL.joinPath(FILE_MGR_LOCAL.documentsDirectory(), '/images/img_' + dark + '.jpg');
    const path3 = FILE_MGR_LOCAL.joinPath(
      FILE_MGR_LOCAL.documentsDirectory(),
      '/images/img_' + this.backgroundKey + '.jpg',
    );
    if (!FILE_MGR_LOCAL.fileExists(path3)) {
      if (isNight) {
        if (FILE_MGR_LOCAL.fileExists(path1)) {
          result = Image.fromFile(path1);
        } else if (FILE_MGR_LOCAL.fileExists(path2)) {
          result = Image.fromFile(path2);
        }
      } else {
        if (FILE_MGR_LOCAL.fileExists(path2)) {
          result = Image.fromFile(path2);
        } else if (FILE_MGR_LOCAL.fileExists(path1)) {
          result = Image.fromFile(path1);
        }
      }
    } else {
      result = Image.fromFile(path3);
    }
    if (parseFloat(this.opacity) && result) {
      return this.shadowImage(result, '#000000', parseFloat(this.opacity));
    }
    return result;
  };

  shadowImage(img: Image, color = '#000000', opacity?: number): Image | undefined {
    if (!opacity || opacity === 0) return img;
    const ctx: DrawContext = new DrawContext();
    // 获取图片的尺寸
    ctx.size = img.size;
    ctx.drawImageInRect(img, new Rect(0, 0, img.size['width'], img.size['height']));
    ctx.setFillColor(new Color(color, opacity));
    ctx.fillRect(new Rect(0, 0, img.size['width'], img.size['height']));
    return ctx.getImage();
  }

  registerAction = (title: string, func: () => Promise<void>): any => {
    this.actions.splice(1, 0, {title, func} as actionsProps);
  };

  showActionSheet = async (title: string, actions: actionsProps[]): Promise<void> => {
    const selectIndex = await showActionSheet({
      title,
      itemList: actions.map(item => item.title),
    });
    const actionItem: actionsProps | undefined = actions.find((_, index: number) => selectIndex === index);
    actionItem && (await actionItem.func());
  };

  // 显示菜单
  showMenu = async (): Promise<void> => {
    await this.showActionSheet(this.name, this.actions);
  };

  getBoxJsCache = async (key?: string): Promise<string | boolean | any> => {
    try {
      const url = 'http://' + this.prefix + '/query/boxdata';
      const boxdata: any = (await request<any>({url, dataType: 'json'})).data;
      if (key) return boxdata.datas[key];
      return boxdata.datas;
    } catch (e) {
      console.log(e);
      return false;
    }
  };

  /**
   * 设置当前项目的 boxJS 缓存
   * @param opt key value
   * @returns {Promise<void>}
   */
  setCacheBoxJSData = async (opt: {[key: string]: any}): Promise<void> => {
    const options = ['取消', '确定'];
    const message = '代理缓存仅支持 BoxJS 相关的代理\nLoon,Qx,Surge';
    const index = await this.generateAlert(message, options);
    if (index === 0) return;
    try {
      const boxJSData: any = await this.getBoxJsCache();
      const settings: {[key: string]: any} = {};
      Object.keys(opt).forEach(key => {
        settings[key] = boxJSData[opt[key]] || '';
      });
      const {setSetting} = useSetting(this.en);
      await setSetting(this.BOX_CATCH_KEY, settings, false);
      await showNotification({
        title: this.name,
        body: '缓存读取:' + JSON.stringify(settings),
        sound: 'alert',
      });
    } catch (e) {
      console.log(e);
      await showNotification({
        title: this.name,
        body: 'BoxJS 缓存读取失败！点击查看相关教程',
        openURL: 'https://chavyleung.gitbook.io/boxjs/awesome/videos',
        sound: 'alert',
      });
    }
  };

  /**
   * 弹出输入框
   * @param title 标题
   * @param content  描述
   * @param opt
   * @param useKey
   * @returns {Promise<void>}
   */
  showAlertCatchInput = async (
    title: string,
    content: string,
    opt: {[key: string]: any},
    useKey?: string,
  ): Promise<void | any> => {
    const {getSetting, setSetting} = useSetting(this.en);
    const catchValue = (await getSetting<any>(useKey || this.BOX_CATCH_KEY)) || {};
    const settings: any = catchValue;
    const inputItems = Object.keys(opt).map(key => {
      return {placeholder: opt[key], text: catchValue[key]};
    });
    const {texts, confirm} = await showModal({title, content, inputItems});
    Object.keys(opt).map((key, index: number) => {
      settings[key] = texts[index];
    });
    if (confirm) {
      await setSetting(useKey || this.BOX_CATCH_KEY, settings);
      return settings;
    }
  };
}

export const RenderError = async (text: string): Promise<unknown> => {
  return (
    <wbox>
      <wspacer />
      <wtext textAlign="center">{text}</wtext>
      <wspacer />
    </wbox>
  );
};

export default Base;
