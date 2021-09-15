import {
  showNotification,
  useStorage,
  fm,
  setTransparentBackground,
  showModal,
  useSetting,
  request,
} from '@app/lib/help';

export interface actionsProps {
  title: string;
  onClick: any;
  val?: string;
  dismissOnSelect?: boolean;
  url?: string;
  icon?: {name: string; color: string};
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
    const {getStorage} = useStorage('boxjs');
    this.prefix = (await getStorage<string>('prefix')) || this.prefix;

    const fontColorLight = (await getSetting<string>('fontColorLight')) || this.fontColor;
    const fontColorDark = (await getSetting<string>('fontColorDark')) || this.fontColor;
    this.fontColor = Device.isUsingDarkAppearance() ? fontColorDark : fontColorLight;

    const backgroundColorLight = (await getSetting<string>('backgroundColorLight')) || '#fff';
    const backgroundColorDark = (await getSetting<string>('backgroundColorDark')) || '#000';
    this.backgroundColor = Device.isUsingDarkAppearance()
      ? this.getBackgroundColor(backgroundColorDark)
      : this.getBackgroundColor(backgroundColorLight);

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
  backgroundColor: string | LinearGradient | undefined;
  fontColor: string = Device.isUsingDarkAppearance() ? '#fff' : '#000';
  opacity: string = Device.isUsingDarkAppearance() ? '0.7' : '0.4';

  updateInterval = async (): Promise<number> => {
    const {getSetting} = useSetting(this.en);
    const updateInterval: string = (await getSetting<string>('updateInterval')) || '30';
    return parseInt(updateInterval) * 1000 * 60;
  };

  previewClick = async (size: string): Promise<void> => {
    try {
      config.widgetFamily = size;
      const render = async () => {
        await this.componentDidMount();
        return this.render();
      };
      const w: any = await render();
      const fnc = size.toLowerCase().replace(/( |^)[a-z]/g, L => L.toUpperCase());
      w && (await w[`present${fnc}`]());
    } catch (e) {
      console.log(e);
    }
  };

  widgetAction: actionsProps[] = [
    {
      title: '小尺寸',
      val: 'small',
      dismissOnSelect: true,
      onClick: () => this.previewClick('small'),
      url: 'https://z3.ax1x.com/2021/03/26/6v5wIP.png',
    },
    {
      title: '中尺寸',
      val: 'medium',
      dismissOnSelect: true,
      onClick: () => this.previewClick('medium'),
      url: 'https://z3.ax1x.com/2021/03/26/6v5dat.png',
    },
    {
      title: '大尺寸',
      val: 'large',
      dismissOnSelect: true,
      onClick: () => this.previewClick('large'),
      url: 'https://z3.ax1x.com/2021/03/26/6v5BPf.png',
    },
  ];

  baseActions: actionsProps[] = [
    {
      title: '字体颜色',
      val: '白天 | 夜间',
      icon: {name: 'sun.max.fill', color: '#d48806'},
      onClick: async (): Promise<void> => {
        await this.setLightAndDark('字体颜色', 'Hex 颜色', 'fontColor');
      },
    },
    {
      title: '背景设置',
      icon: {name: 'photo.on.rectangle', color: '#fa8c16'},
      dismissOnSelect: true,
      onClick: async (): Promise<void> => {
        const actions: actionsProps[] = [
          {
            title: '白天图',
            dismissOnSelect: true,
            icon: {name: 'photo.on.rectangle', color: '#fa8c16'},
            onClick: async (): Promise<void> => {
              const image: Image = await Photos.fromLibrary();
              if (!(await this.verifyImage(image))) return;
              await this.setImage(image, `${this.backgroundKey}_light`);
            },
          },
          {
            title: '夜间图',
            icon: {name: 'photo.fill.on.rectangle.fill', color: '#fa541c'},
            dismissOnSelect: true,
            onClick: async (): Promise<void> => {
              const image: Image = await Photos.fromLibrary();
              if (!(await this.verifyImage(image))) return;
              await this.setImage(image, `${this.backgroundKey}_night`);
            },
          },
          {
            title: '透明度',
            icon: {name: 'record.circle', color: '#722ed1'},
            onClick: async (): Promise<void> => {
              return this.setLightAndDark('透明度', false, 'opacity');
            },
          },
          {
            title: '背景色',
            icon: {name: 'photo', color: '#13c2c2'},
            onClick: async () => {
              return this.setLightAndDark('背景色', false, 'backgroundColor');
            },
          },
        ];
        const table = new UITable();
        await this.showActionSheet(table, '背景设置', actions);
        await table.present();
      },
    },
    {
      title: '透明背景',
      icon: {name: 'text.below.photo', color: '#faad14'},
      onClick: async (): Promise<void> => {
        const image = await setTransparentBackground();
        image && (await this.setImage(image, this.backgroundKey));
      },
    },
    {
      title: '清空背景',
      icon: {name: 'clear', color: '#f5222d'},
      onClick: async (): Promise<void> => {
        await this.setImage(null, `${this.backgroundKey}_light`);
        await this.setImage(null, `${this.backgroundKey}_night`);
        await this.setImage(null, this.backgroundKey);
      },
    },
  ];

  actions: actionsProps[] = [
    {
      title: '刷新时间',
      icon: {name: 'arrow.clockwise', color: '#1890ff'},
      onClick: async (): Promise<void> => {
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
  ];

  getBackgroundColor = (color: string): string | LinearGradient => {
    const colors = color.split(',');
    if (colors.length > 0) {
      const locations: number[] = [];
      const linearColor = new LinearGradient();
      const cLen = colors.length;
      linearColor.colors = colors.map((item, index) => {
        locations.push(Math.floor(((index + 1) / cLen) * 100) / 100);
        return new Color(item, 1);
      });
      linearColor.locations = locations;
      return linearColor;
    }
    return color;
  };

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

  registerAction = (
    title: string,
    onClick: () => Promise<void>,
    icon: actionsProps['icon'] | string = {
      name: 'gear',
      color: '#096dd9',
    },
  ): any => {
    const url = typeof icon === 'string' ? icon : false;
    const action: actionsProps = {title, onClick};
    if (url) {
      action.url = url;
    } else {
      action.icon = icon as actionsProps['icon'];
    }
    this.actions.splice(1, 0, action);
  };

  drawTableIcon = async (icon = 'square.grid.2x2', color = '#e8e8e8', cornerWidth = 42): Promise<any> => {
    const sfi = SFSymbol.named(icon);
    sfi.applyFont(Font.mediumSystemFont(30));
    const imgData = Data.fromPNG(sfi.image).toBase64String();
    const html = `
    <img id="sourceImg" src="data:image/png;base64,${imgData}" />
    <img id="silhouetteImg" src="" />
    <canvas id="mainCanvas" />
    `;
    const js = `
    var canvas = document.createElement("canvas");
    var sourceImg = document.getElementById("sourceImg");
    var silhouetteImg = document.getElementById("silhouetteImg");
    var ctx = canvas.getContext('2d');
    var size = sourceImg.width > sourceImg.height ? sourceImg.width : sourceImg.height;
    canvas.width = size;
    canvas.height = size;
    ctx.drawImage(sourceImg, (canvas.width - sourceImg.width) / 2, (canvas.height - sourceImg.height) / 2);
    var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var pix = imgData.data;
    //convert the image into a silhouette
    for (var i=0, n = pix.length; i < n; i+= 4){
      //set red to 0
      pix[i] = 255;
      //set green to 0
      pix[i+1] = 255;
      //set blue to 0
      pix[i+2] = 255;
      //retain the alpha value
      pix[i+3] = pix[i+3];
    }
    ctx.putImageData(imgData,0,0);
    silhouetteImg.src = canvas.toDataURL();
    output=canvas.toDataURL()
    `;

    const wv = new WebView();
    await wv.loadHTML(html);
    const base64Image = await wv.evaluateJavaScript(js);
    const iconImage = await new Request(base64Image).loadImage();
    const size = new Size(160, 160);
    const ctx = new DrawContext();
    ctx.opaque = false;
    ctx.respectScreenScale = true;
    ctx.size = size;
    const path = new Path();
    const rect = new Rect(0, 0, size.width, size.width);

    path.addRoundedRect(rect, cornerWidth, cornerWidth);
    path.closeSubpath();
    ctx.setFillColor(new Color(color, 1));
    ctx.addPath(path);
    ctx.fillPath();
    const rate = 36;
    const iw = size.width - rate;
    const x = (size.width - iw) / 2;
    ctx.drawImageInRect(iconImage, new Rect(x, x, iw, iw));
    return ctx.getImage();
  };

  preferences = async (table: UITable, arr: Record<string, any>[], outfit: string): Promise<void> => {
    const header = new UITableRow();
    const heading = header.addText(outfit);
    heading.titleFont = Font.mediumSystemFont(17);
    heading.centerAligned();
    table.addRow(header);
    for (const item of arr) {
      const row = new UITableRow();
      row.dismissOnSelect = !!item.dismissOnSelect;

      if (item.url) {
        const rowIcon = row.addImageAtURL(item.url);
        rowIcon.widthWeight = 100;
      } else {
        if (parseInt(Device.systemVersion()) < 15) {
          const icon = item.icon || {};
          const image = await this.drawTableIcon(icon.name, icon.color, item.cornerWidth);
          const imageCell = row.addImage(image);
          imageCell.widthWeight = 100;
        }
      }

      const rowTitle = row.addText(item.title);
      rowTitle.widthWeight = 400;
      rowTitle.titleFont = Font.systemFont(16);
      if (item.val) {
        const valText = row.addText(`${item.val}`.toUpperCase());
        valText.widthWeight = 500;
        valText.rightAligned();
        valText.titleColor = Color.blue();
        valText.titleFont = Font.mediumSystemFont(16);
      } else {
        const imgCell = UITableCell.imageAtURL('https://gitee.com/scriptableJS/Scriptable/raw/master/images/more.png');
        imgCell.rightAligned();
        imgCell.widthWeight = 500;
        row.addCell(imgCell);
      }
      row.dismissOnSelect = false;
      if (item.onClick) row.onSelect = () => item.onClick(item, row);
      table.addRow(row);
    }
    table.reload();
  };

  showActionSheet = async (table: UITable, title: string, actions: actionsProps[]): Promise<void> => {
    await this.preferences(table, actions, title);
  };

  // 显示菜单
  showMenu = async (): Promise<void> => {
    const table = new UITable();
    table.showSeparators = true;
    table.removeAllRows();
    const topRow = new UITableRow();
    topRow.height = 60;
    const leftText = topRow.addButton('Github');
    leftText.widthWeight = 0.3;
    leftText.onTap = async () => {
      await Safari.openInApp('https://github.com/dompling/Scriptable');
    };
    const centerRow = topRow.addImageAtURL('https://s3.ax1x.com/2021/03/16/6y4oJ1.png');
    centerRow.widthWeight = 0.4;
    centerRow.centerAligned();
    centerRow.onTap = async () => {
      await Safari.open('https://t.me/Scriptable_JS');
    };
    const rightText = topRow.addButton('重置所有');
    rightText.widthWeight = 0.3;
    rightText.rightAligned();
    rightText.onTap = async () => {
      const options = ['取消', '重置'];
      const message = '该操作不可逆，会清空所有组件配置！重置后请重新打开设置菜单。';
      const index = await this.generateAlert(message, options);
      if (index === 0) return;
      const {clear} = useSetting(this.en);
      return clear();
    };
    table.addRow(topRow);
    await this.preferences(table, this.widgetAction, '组件预览');
    await this.preferences(table, this.actions, '组件设置');
    await this.preferences(table, this.baseActions, '主题设置');
    await table.present();
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
