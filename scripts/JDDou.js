// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: yen-sign;

/**
 * 作者: 2Ya
 * 版本: 1.0.0
 * 更新时间：4/14/2021
 * github: https://github.com/dompling/Scriptable
 */

// @编译时间 1618368689391
const MODULE = module;
let __topLevelAwait__ = () => Promise.resolve();
function EndAwait(promiseFunc) {
  __topLevelAwait__ = promiseFunc
};
    
// src/lib/constants.ts
var URLSchemeFrom;
(function(URLSchemeFrom2) {
  URLSchemeFrom2["WIDGET"] = "widget";
})(URLSchemeFrom || (URLSchemeFrom = {}));

// src/lib/help.ts
function fm() {
  return FileManager[MODULE.filename.includes("Documents/iCloud~") ? "iCloud" : "local"]();
}
function setStorageDirectory(dirPath) {
  return {
    setStorage(key, value) {
      const hashKey = hash(key);
      const filePath = FileManager.local().joinPath(dirPath, hashKey);
      if (value instanceof Image) {
        FileManager.local().writeImage(filePath, value);
        return;
      }
      if (value instanceof Data) {
        FileManager.local().write(filePath, value);
      }
      Keychain.set(hashKey, JSON.stringify(value));
    },
    getStorage(key) {
      const hashKey = hash(key);
      const filePath = FileManager.local().joinPath(FileManager.local().libraryDirectory(), hashKey);
      if (FileManager.local().fileExists(filePath)) {
        const image = Image.fromFile(filePath);
        const file = Data.fromFile(filePath);
        return image ? image : file ? file : null;
      }
      if (Keychain.contains(hashKey)) {
        return JSON.parse(Keychain.get(hashKey));
      } else {
        return null;
      }
    },
    removeStorage(key) {
      const hashKey = hash(key);
      const filePath = FileManager.local().joinPath(FileManager.local().libraryDirectory(), hashKey);
      if (FileManager.local().fileExists(filePath)) {
        FileManager.local().remove(hashKey);
      }
      if (Keychain.contains(hashKey)) {
        Keychain.remove(hashKey);
      }
    }
  };
}
var setStorage = setStorageDirectory(fm().libraryDirectory()).setStorage;
var getStorage = setStorageDirectory(FileManager.local().libraryDirectory()).getStorage;
var removeStorage = setStorageDirectory(FileManager.local().libraryDirectory()).removeStorage;
var setCache = setStorageDirectory(FileManager.local().temporaryDirectory()).setStorage;
var getCache = setStorageDirectory(FileManager.local().temporaryDirectory()).getStorage;
var removeCache = setStorageDirectory(FileManager.local().temporaryDirectory()).removeStorage;
function useStorage(nameSpace) {
  const _nameSpace = nameSpace || `${MODULE.filename}`;
  return {
    setStorage(key, value) {
      setStorage(`${_nameSpace}${key}`, value);
    },
    getStorage(key) {
      return getStorage(`${_nameSpace}${key}`);
    },
    removeStorage(key) {
      removeStorage(`${_nameSpace}${key}`);
    }
  };
}
function useSetting(settingFilename) {
  const isUseICloud = () => {
    return MODULE.filename.includes("Documents/iCloud~");
  };
  const generateSettingFileName = () => {
    return MODULE.filename.match(/[^\/]+$/)?.[0].replace(".js", "") || hash(`settings:${MODULE.filename}`);
  };
  const fileManager = fm();
  const settingsFolderPath = fileManager.joinPath(fileManager.documentsDirectory(), "/settings-json");
  const _settingFilename = `${settingFilename || generateSettingFileName()}.json`;
  const settingsPath = fileManager.joinPath(settingsFolderPath, _settingFilename);
  const isFileExists = async () => {
    if (!fileManager.fileExists(settingsFolderPath)) {
      fileManager.createDirectory(settingsFolderPath, true);
    }
    if (!fileManager.fileExists(settingsPath)) {
      await fileManager.writeString(settingsPath, "{}");
      return false;
    }
    return true;
  };
  const getSetting2 = async (key) => {
    const fileExists = await isFileExists();
    if (!fileExists)
      return null;
    if (isUseICloud())
      await fileManager.downloadFileFromiCloud(settingsPath);
    const json = fileManager.readString(settingsPath);
    const settings = JSON.parse(json) || {};
    return settings[key];
  };
  const setSetting2 = async (key, value, notify = true) => {
    const fileExists = await isFileExists();
    if (!fileExists) {
      await fileManager.writeString(settingsPath, JSON.stringify({
        [key]: value
      }));
      return;
    }
    if (isUseICloud())
      await fileManager.downloadFileFromiCloud(settingsPath);
    const json = fileManager.readString(settingsPath);
    const settings = JSON.parse(json) || {};
    settings[key] = value;
    await fileManager.writeString(settingsPath, JSON.stringify(settings));
    if (notify)
      await showNotification({title: "消息提示", body: "设置保存成功,稍后刷新组件"});
    return settings;
  };
  const clear = async (notify = true) => {
    await fileManager.writeString(settingsPath, JSON.stringify({}));
    if (notify)
      await showNotification({title: "消息提示", body: "设置保存成功,稍后刷新组件"});
  };
  return {getSetting: getSetting2, setSetting: setSetting2, clear};
}
async function request(args2) {
  const {
    url,
    data,
    header,
    dataType = "json",
    method = "GET",
    timeout = 60 * 1e3,
    useCache = false,
    failReturnCache = true
  } = args2;
  const cacheKey = `url:${url}`;
  const cache = getStorage(cacheKey);
  if (useCache && cache !== null)
    return cache;
  const req = new Request(url);
  req.method = method;
  header && (req.headers = header);
  data && (req.body = data);
  req.timeoutInterval = timeout / 1e3;
  req.allowInsecureRequest = true;
  let res;
  try {
    switch (dataType) {
      case "json":
        res = await req.loadJSON();
        break;
      case "text":
        res = await req.loadString();
        break;
      case "image":
        res = await req.loadImage();
        break;
      case "data":
        res = await req.load();
        break;
      default:
        res = await req.loadJSON();
    }
    const result = {...req.response, data: res};
    setStorage(cacheKey, result);
    return result;
  } catch (err) {
    if (cache !== null && failReturnCache)
      return cache;
    return err;
  }
}
async function showActionSheet(args2) {
  const {title, desc, cancelText = "取消", itemList} = args2;
  const alert = new Alert();
  title && (alert.title = title);
  desc && (alert.message = desc);
  for (const item of itemList) {
    if (typeof item === "string") {
      alert.addAction(item);
    } else {
      switch (item.type) {
        case "normal":
          alert.addAction(item.text);
          break;
        case "warn":
          alert.addDestructiveAction(item.text);
          break;
        default:
          alert.addAction(item.text);
          break;
      }
    }
  }
  alert.addCancelAction(cancelText);
  const tapIndex = await alert.presentSheet();
  return tapIndex;
}
async function showModal(args2) {
  const {title, content, showCancel = true, cancelText = "取消", confirmText = "确定", inputItems = []} = args2;
  const alert = new Alert();
  title && (alert.title = title);
  content && (alert.message = content);
  showCancel && cancelText && alert.addCancelAction(cancelText);
  alert.addAction(confirmText);
  for (const input of inputItems) {
    const {type = "text", text = "", placeholder = ""} = input;
    if (type === "password") {
      alert.addSecureTextField(placeholder, text);
    } else {
      alert.addTextField(placeholder, text);
    }
  }
  const tapIndex = await alert.presentAlert();
  const texts = inputItems.map((item, index) => alert.textFieldValue(index));
  return tapIndex === -1 ? {
    cancel: true,
    confirm: false,
    texts
  } : {
    cancel: false,
    confirm: true,
    texts
  };
}
async function showNotification(args2) {
  try {
    const {title, subtitle = "", body = "", openURL, sound, ...others} = args2;
    let notification = new Notification();
    notification.title = title;
    notification.subtitle = subtitle;
    notification.body = body;
    openURL && (notification.openURL = openURL);
    sound && (notification.sound = sound);
    notification = Object.assign(notification, others);
    return await notification.schedule();
  } catch (e) {
    console.log(e);
  }
}
async function getImage(args2) {
  const {filepath, url, useCache = true} = args2;
  const generateDefaultImage = async () => {
    const ctx = new DrawContext();
    ctx.size = new Size(100, 100);
    ctx.setFillColor(Color.red());
    ctx.fillRect(new Rect(0, 0, 100, 100));
    return await ctx.getImage();
  };
  try {
    if (filepath) {
      return Image.fromFile(filepath) || await generateDefaultImage();
    }
    if (!url)
      return await generateDefaultImage();
    const cacheKey = `image:${url}`;
    if (useCache) {
      const cache = getCache(url);
      if (cache instanceof Image) {
        return cache;
      } else {
        removeCache(cacheKey);
      }
    }
    const res = await request({url, dataType: "image"});
    const image = res && res.data;
    image && setCache(cacheKey, image);
    return image || await generateDefaultImage();
  } catch (err) {
    return await generateDefaultImage();
  }
}
function hash(string) {
  let hash2 = 0, i, chr;
  for (i = 0; i < string.length; i++) {
    chr = string.charCodeAt(i);
    hash2 = (hash2 << 5) - hash2 + chr;
    hash2 |= 0;
  }
  return `hash_${hash2}`;
}
async function setTransparentBackground(tips) {
  const phoneSizea = {
    "2778": {
      small: 510,
      medium: 1092,
      large: 1146,
      left: 96,
      right: 678,
      top: 246,
      middle: 882,
      bottom: 1518
    },
    "2532": {
      small: 474,
      medium: 1014,
      large: 1062,
      left: 78,
      right: 618,
      top: 231,
      middle: 819,
      bottom: 1407
    },
    "2688": {
      small: 507,
      medium: 1080,
      large: 1137,
      left: 81,
      right: 654,
      top: 228,
      middle: 858,
      bottom: 1488
    },
    "1792": {
      small: 338,
      medium: 720,
      large: 758,
      left: 54,
      right: 436,
      top: 160,
      middle: 580,
      bottom: 1e3
    },
    "2436": {
      small: 465,
      medium: 987,
      large: 1035,
      left: 69,
      right: 591,
      top: 213,
      middle: 783,
      bottom: 1353
    },
    "2208": {
      small: 471,
      medium: 1044,
      large: 1071,
      left: 99,
      right: 672,
      top: 114,
      middle: 696,
      bottom: 1278
    },
    "1334": {
      small: 296,
      medium: 642,
      large: 648,
      left: 54,
      right: 400,
      top: 60,
      middle: 412,
      bottom: 764
    },
    "1136": {
      small: 282,
      medium: 584,
      large: 622,
      left: 30,
      right: 332,
      top: 59,
      middle: 399,
      bottom: 399
    },
    "1624": {
      small: 310,
      medium: 658,
      large: 690,
      left: 46,
      right: 394,
      top: 142,
      middle: 522,
      bottom: 902
    },
    "2001": {
      small: 444,
      medium: 963,
      large: 972,
      left: 81,
      right: 600,
      top: 90,
      middle: 618,
      bottom: 1146
    }
  };
  const cropImage = (img2, rect) => {
    const draw = new DrawContext();
    draw.size = new Size(rect.width, rect.height);
    draw.drawImageAtPoint(img2, new Point(-rect.x, -rect.y));
    return draw.getImage();
  };
  const shouldExit = await showModal({
    content: tips || "开始之前，请先前往桌面,截取空白界面的截图。然后回来继续",
    cancelText: "我已截图",
    confirmText: "前去截图 >"
  });
  if (!shouldExit.cancel)
    return;
  const img = await Photos.fromLibrary();
  const imgHeight = img.size.height;
  const phone = phoneSizea[imgHeight];
  if (!phone) {
    const help4 = await showModal({
      content: "好像您选择的照片不是正确的截图，或者您的机型我们暂时不支持。点击确定前往社区讨论",
      confirmText: "帮助",
      cancelText: "取消"
    });
    if (help4.confirm)
      Safari.openInApp("https://support.qq.com/products/287371", false);
    return;
  }
  const sizes = ["小尺寸", "中尺寸", "大尺寸"];
  const sizeIndex = await showActionSheet({
    title: "你准备用哪个尺寸",
    itemList: sizes
  });
  const widgetSize = sizes[sizeIndex];
  const selectLocation = (positions2) => showActionSheet({
    title: "你准备把组件放桌面哪里？",
    desc: imgHeight == 1136 ? " （备注：当前设备只支持两行小组件，所以下边选项中的「中间」和「底部」的选项是一致的）" : "",
    itemList: positions2
  });
  const crop = {w: 0, h: 0, x: 0, y: 0};
  let positions;
  let _positions;
  let positionIndex;
  let keys;
  let key;
  switch (widgetSize) {
    case "小尺寸":
      crop.w = phone.small;
      crop.h = phone.small;
      positions = ["左上角", "右上角", "中间左", "中间右", "左下角", "右下角"];
      _positions = ["top left", "top right", "middle left", "middle right", "bottom left", "bottom right"];
      positionIndex = await selectLocation(positions);
      keys = _positions[positionIndex].split(" ");
      crop.y = phone[keys[0]];
      crop.x = phone[keys[1]];
      break;
    case "中尺寸":
      crop.w = phone.medium;
      crop.h = phone.small;
      crop.x = phone.left;
      positions = ["顶部", "中间", "底部"];
      _positions = ["top", "middle", "bottom"];
      positionIndex = await selectLocation(positions);
      key = _positions[positionIndex];
      crop.y = phone[key];
      break;
    case "大尺寸":
      crop.w = phone.medium;
      crop.h = phone.large;
      crop.x = phone.left;
      positions = ["顶部", "底部"];
      _positions = ["top", "middle"];
      positionIndex = await selectLocation(positions);
      key = _positions[positionIndex];
      crop.y = phone[key];
      break;
  }
  return cropImage(img, new Rect(crop.x, crop.y, crop.w, crop.h));
}

// src/lib/jsx-runtime.ts
var GenrateView = class {
  static setListWidget(listWidget) {
    this.listWidget = listWidget;
  }
  static async wbox(props, ...children) {
    const {background, spacing, href, updateDate, padding, onClick} = props;
    try {
      isDefined(background) && await setBackground(this.listWidget, background);
      isDefined(spacing) && (this.listWidget.spacing = spacing);
      isDefined(href) && (this.listWidget.url = href);
      isDefined(updateDate) && (this.listWidget.refreshAfterDate = updateDate);
      isDefined(padding) && this.listWidget.setPadding(...padding);
      isDefined(onClick) && runOnClick(this.listWidget, onClick);
      await addChildren(this.listWidget, children);
    } catch (err) {
      console.error(err);
    }
    return this.listWidget;
  }
  static wstack(props, ...children) {
    return async (parentInstance) => {
      const widgetStack = parentInstance.addStack();
      const {
        background,
        spacing,
        padding,
        width = 0,
        height = 0,
        borderRadius,
        borderWidth,
        borderColor,
        href,
        verticalAlign,
        flexDirection,
        onClick
      } = props;
      try {
        isDefined(background) && await setBackground(widgetStack, background);
        isDefined(spacing) && (widgetStack.spacing = spacing);
        isDefined(padding) && widgetStack.setPadding(...padding);
        isDefined(borderRadius) && (widgetStack.cornerRadius = borderRadius);
        isDefined(borderWidth) && (widgetStack.borderWidth = borderWidth);
        isDefined(borderColor) && (widgetStack.borderColor = getColor(borderColor));
        isDefined(href) && (widgetStack.url = href);
        widgetStack.size = new Size(width, height);
        const verticalAlignMap = {
          bottom: () => widgetStack.bottomAlignContent(),
          center: () => widgetStack.centerAlignContent(),
          top: () => widgetStack.topAlignContent()
        };
        isDefined(verticalAlign) && verticalAlignMap[verticalAlign]();
        const flexDirectionMap = {
          row: () => widgetStack.layoutHorizontally(),
          column: () => widgetStack.layoutVertically()
        };
        isDefined(flexDirection) && flexDirectionMap[flexDirection]();
        isDefined(onClick) && runOnClick(widgetStack, onClick);
      } catch (err) {
        console.error(err);
      }
      await addChildren(widgetStack, children);
    };
  }
  static wimage(props) {
    return async (parentInstance) => {
      const {
        src,
        href,
        resizable,
        width = 0,
        height = 0,
        opacity,
        borderRadius,
        borderWidth,
        borderColor,
        containerRelativeShape,
        filter,
        imageAlign,
        mode,
        onClick
      } = props;
      let _image = src;
      typeof src === "string" && isUrl(src) && (_image = await getImage({url: src}));
      typeof src === "string" && !isUrl(src) && (_image = SFSymbol.named(src).image);
      const widgetImage = parentInstance.addImage(_image);
      widgetImage.image = _image;
      try {
        isDefined(href) && (widgetImage.url = href);
        isDefined(resizable) && (widgetImage.resizable = resizable);
        widgetImage.imageSize = new Size(width, height);
        isDefined(opacity) && (widgetImage.imageOpacity = opacity);
        isDefined(borderRadius) && (widgetImage.cornerRadius = borderRadius);
        isDefined(borderWidth) && (widgetImage.borderWidth = borderWidth);
        isDefined(borderColor) && (widgetImage.borderColor = getColor(borderColor));
        isDefined(containerRelativeShape) && (widgetImage.containerRelativeShape = containerRelativeShape);
        isDefined(filter) && (widgetImage.tintColor = getColor(filter));
        const imageAlignMap = {
          left: () => widgetImage.leftAlignImage(),
          center: () => widgetImage.centerAlignImage(),
          right: () => widgetImage.rightAlignImage()
        };
        isDefined(imageAlign) && imageAlignMap[imageAlign]();
        const modeMap = {
          fit: () => widgetImage.applyFittingContentMode(),
          fill: () => widgetImage.applyFillingContentMode()
        };
        isDefined(mode) && modeMap[mode]();
        isDefined(onClick) && runOnClick(widgetImage, onClick);
      } catch (err) {
        console.error(err);
      }
    };
  }
  static wspacer(props) {
    return async (parentInstance) => {
      const widgetSpacer = parentInstance.addSpacer();
      const {length} = props;
      try {
        isDefined(length) && (widgetSpacer.length = length);
      } catch (err) {
        console.error(err);
      }
    };
  }
  static wtext(props, ...children) {
    return async (parentInstance) => {
      const widgetText = parentInstance.addText("");
      const {
        textColor,
        font,
        opacity,
        maxLine,
        scale,
        shadowColor,
        shadowRadius,
        shadowOffset,
        href,
        textAlign,
        onClick
      } = props;
      if (children && Array.isArray(children)) {
        widgetText.text = children.join("");
      }
      try {
        isDefined(textColor) && (widgetText.textColor = getColor(textColor));
        isDefined(font) && (widgetText.font = typeof font === "number" ? Font.systemFont(font) : font);
        isDefined(opacity) && (widgetText.textOpacity = opacity);
        isDefined(maxLine) && (widgetText.lineLimit = maxLine);
        isDefined(scale) && (widgetText.minimumScaleFactor = scale);
        isDefined(shadowColor) && (widgetText.shadowColor = getColor(shadowColor));
        isDefined(shadowRadius) && (widgetText.shadowRadius = shadowRadius);
        isDefined(shadowOffset) && (widgetText.shadowOffset = shadowOffset);
        isDefined(href) && (widgetText.url = href);
        const textAlignMap = {
          left: () => widgetText.leftAlignText(),
          center: () => widgetText.centerAlignText(),
          right: () => widgetText.rightAlignText()
        };
        isDefined(textAlign) && textAlignMap[textAlign]();
        isDefined(onClick) && runOnClick(widgetText, onClick);
      } catch (err) {
        console.error(err);
      }
    };
  }
  static wdate(props) {
    return async (parentInstance) => {
      const widgetDate = parentInstance.addDate(new Date());
      const {
        date,
        mode,
        textColor,
        font,
        opacity,
        maxLine,
        scale,
        shadowColor,
        shadowRadius,
        shadowOffset,
        href,
        textAlign,
        onClick
      } = props;
      try {
        isDefined(date) && (widgetDate.date = date);
        isDefined(textColor) && (widgetDate.textColor = getColor(textColor));
        isDefined(font) && (widgetDate.font = typeof font === "number" ? Font.systemFont(font) : font);
        isDefined(opacity) && (widgetDate.textOpacity = opacity);
        isDefined(maxLine) && (widgetDate.lineLimit = maxLine);
        isDefined(scale) && (widgetDate.minimumScaleFactor = scale);
        isDefined(shadowColor) && (widgetDate.shadowColor = getColor(shadowColor));
        isDefined(shadowRadius) && (widgetDate.shadowRadius = shadowRadius);
        isDefined(shadowOffset) && (widgetDate.shadowOffset = shadowOffset);
        isDefined(href) && (widgetDate.url = href);
        const modeMap = {
          time: () => widgetDate.applyTimeStyle(),
          date: () => widgetDate.applyDateStyle(),
          relative: () => widgetDate.applyRelativeStyle(),
          offset: () => widgetDate.applyOffsetStyle(),
          timer: () => widgetDate.applyTimerStyle()
        };
        isDefined(mode) && modeMap[mode]();
        const textAlignMap = {
          left: () => widgetDate.leftAlignText(),
          center: () => widgetDate.centerAlignText(),
          right: () => widgetDate.rightAlignText()
        };
        isDefined(textAlign) && textAlignMap[textAlign]();
        isDefined(onClick) && runOnClick(widgetDate, onClick);
      } catch (err) {
        console.error(err);
      }
    };
  }
};
function h(type, props, ...children) {
  props = props || {};
  const listWidget = new ListWidget();
  GenrateView.setListWidget(listWidget);
  const _children = flatteningArr(children);
  switch (type) {
    case "wbox":
      return GenrateView.wbox(props, ..._children);
    case "wdate":
      return GenrateView.wdate(props);
    case "wimage":
      return GenrateView.wimage(props);
    case "wspacer":
      return GenrateView.wspacer(props);
    case "wstack":
      return GenrateView.wstack(props, ..._children);
    case "wtext":
      return GenrateView.wtext(props, ..._children);
    default:
      return type instanceof Function ? type({children: _children, ...props}) : null;
  }
}
function Fragment({children}) {
  return children;
}
function flatteningArr(arr) {
  return [].concat(...arr.map((item) => {
    return Array.isArray(item) ? flatteningArr(item) : item;
  }));
}
function getColor(color) {
  return typeof color === "string" ? new Color(color, 1) : color;
}
async function getBackground(bg) {
  bg = typeof bg === "string" && !isUrl(bg) || bg instanceof Color ? getColor(bg) : bg;
  if (typeof bg === "string") {
    bg = await getImage({url: bg});
  }
  return bg;
}
async function setBackground(widget, bg) {
  const _bg = await getBackground(bg);
  if (_bg instanceof Color) {
    widget.backgroundColor = _bg;
  }
  if (_bg instanceof Image) {
    widget.backgroundImage = _bg;
  }
  if (_bg instanceof LinearGradient) {
    widget.backgroundGradient = _bg;
  }
}
async function addChildren(instance, children) {
  if (children && Array.isArray(children)) {
    for (const child of children) {
      child instanceof Function ? await child(instance) : "";
    }
  }
}
function isDefined(value) {
  if (typeof value === "number" && !isNaN(value)) {
    return true;
  }
  return value !== void 0 && value !== null;
}
function isUrl(value) {
  const reg = /^(http|https)\:\/\/[\w\W]+/;
  return reg.test(value);
}
function runOnClick(instance, onClick) {
  const _eventId = hash(onClick.toString());
  instance.url = `${URLScheme.forRunningScript()}?eventId=${encodeURIComponent(_eventId)}&from=${URLSchemeFrom.WIDGET}`;
  const {eventId, from} = args.queryParameters;
  if (eventId && eventId === _eventId && from === URLSchemeFrom.WIDGET) {
    onClick();
  }
}

// src/Base.tsx
var FILE_MGR_LOCAL = fm();
var Base = class {
  constructor() {
    this.componentWillMountBefore = async () => {
      this.backgroundKey = `${this.en}_background`;
      const {getSetting: getSetting2} = useSetting(this.en);
      const {getStorage: getStorage2} = useStorage("boxjs");
      this.prefix = await getStorage2("prefix") || this.prefix;
      const fontColorLight = await getSetting2("fontColorLight") || this.fontColor;
      const fontColorDark = await getSetting2("fontColorDark") || this.fontColor;
      this.fontColor = Device.isUsingDarkAppearance() ? fontColorDark : fontColorLight;
      const backgroundColorLight = await getSetting2("backgroundColorLight") || "#fff";
      const backgroundColorDark = await getSetting2("backgroundColorDark") || "#000";
      this.backgroundColor = Device.isUsingDarkAppearance() ? this.getBackgroundColor(backgroundColorDark) : this.getBackgroundColor(backgroundColorLight);
      const opacityLight = await getSetting2("opacityLight") || this.opacity;
      const opacityDark = await getSetting2("opacityDark") || this.opacity;
      this.opacity = Device.isUsingDarkAppearance() ? opacityDark : opacityLight;
      typeof this.componentWillMount === "function" && await this.componentWillMount();
    };
    this.name = "菜单";
    this.en = "base";
    this.prefix = "boxjs.net";
    this.useBoxJS = true;
    this.BOX_CATCH_KEY = "BoxJSData";
    this.backgroundKey = "";
    this.render = async () => false;
    this.componentWillMount = async () => {
    };
    this.componentDidMount = async () => {
    };
    this.fontColor = Device.isUsingDarkAppearance() ? "#fff" : "#000";
    this.opacity = Device.isUsingDarkAppearance() ? "0.7" : "0.4";
    this.updateInterval = async () => {
      const {getSetting: getSetting2} = useSetting(this.en);
      const updateInterval = await getSetting2("updateInterval") || "30";
      return parseInt(updateInterval) * 1e3 * 60;
    };
    this.previewClick = async (size) => {
      try {
        config.widgetFamily = size;
        const render = async () => {
          await this.componentDidMount();
          return this.render();
        };
        const w = await render();
        const fnc = size.toLowerCase().replace(/( |^)[a-z]/g, (L) => L.toUpperCase());
        w && await w[`present${fnc}`]();
      } catch (e) {
        console.log(e);
      }
    };
    this.widgetAction = [
      {
        title: "小尺寸",
        val: "small",
        dismissOnSelect: true,
        onClick: () => this.previewClick("small"),
        url: "https://z3.ax1x.com/2021/03/26/6v5wIP.png"
      },
      {
        title: "中尺寸",
        val: "medium",
        dismissOnSelect: true,
        onClick: () => this.previewClick("medium"),
        url: "https://z3.ax1x.com/2021/03/26/6v5dat.png"
      },
      {
        title: "大尺寸",
        val: "large",
        dismissOnSelect: true,
        onClick: () => this.previewClick("large"),
        url: "https://z3.ax1x.com/2021/03/26/6v5BPf.png"
      }
    ];
    this.baseActions = [
      {
        title: "字体颜色",
        val: "白天 | 夜间",
        icon: {name: "sun.max.fill", color: "#d48806"},
        onClick: async () => {
          await this.setLightAndDark("字体颜色", "Hex 颜色", "fontColor");
        }
      },
      {
        title: "背景设置",
        icon: {name: "photo.on.rectangle", color: "#fa8c16"},
        dismissOnSelect: true,
        onClick: async () => {
          const actions = [
            {
              title: "白天图",
              dismissOnSelect: true,
              icon: {name: "photo.on.rectangle", color: "#fa8c16"},
              onClick: async () => {
                const image = await Photos.fromLibrary();
                if (!await this.verifyImage(image))
                  return;
                await this.setImage(image, `${this.backgroundKey}_light`);
              }
            },
            {
              title: "夜间图",
              icon: {name: "photo.fill.on.rectangle.fill", color: "#fa541c"},
              dismissOnSelect: true,
              onClick: async () => {
                const image = await Photos.fromLibrary();
                if (!await this.verifyImage(image))
                  return;
                await this.setImage(image, `${this.backgroundKey}_night`);
              }
            },
            {
              title: "透明度",
              icon: {name: "record.circle", color: "#722ed1"},
              onClick: async () => {
                return this.setLightAndDark("透明度", false, "opacity");
              }
            },
            {
              title: "背景色",
              icon: {name: "photo", color: "#13c2c2"},
              onClick: async () => {
                return this.setLightAndDark("背景色", false, "backgroundColor");
              }
            }
          ];
          const table = new UITable();
          await this.showActionSheet(table, "背景设置", actions);
          await table.present();
        }
      },
      {
        title: "透明背景",
        icon: {name: "text.below.photo", color: "#faad14"},
        onClick: async () => {
          const image = await setTransparentBackground();
          image && await this.setImage(image, this.backgroundKey);
        }
      },
      {
        title: "清空背景",
        icon: {name: "clear", color: "#f5222d"},
        onClick: async () => {
          await this.setImage(null, `${this.backgroundKey}_light`);
          await this.setImage(null, `${this.backgroundKey}_night`);
          await this.setImage(null, this.backgroundKey);
        }
      }
    ];
    this.actions = [
      {
        title: "刷新时间",
        icon: {name: "arrow.clockwise", color: "#1890ff"},
        onClick: async () => {
          const {getSetting: getSetting2, setSetting: setSetting2} = useSetting(this.en);
          const updateInterval = await getSetting2("updateInterval") || "";
          const {texts} = await showModal({
            title: "刷新时间",
            inputItems: [
              {
                placeholder: "刷新时间单位分钟",
                text: `${updateInterval}`
              }
            ]
          });
          await setSetting2("updateInterval", texts);
        }
      }
    ];
    this.getBackgroundColor = (color) => {
      const colors = color.split(",");
      if (colors.length > 0) {
        const locations = [];
        const linearColor = new LinearGradient();
        const cLen = colors.length;
        linearColor.colors = colors.map((item, index) => {
          locations.push(Math.floor((index + 1) / cLen * 100) / 100);
          return new Color(item, 1);
        });
        linearColor.locations = locations;
        return linearColor;
      }
      return color;
    };
    this.setLightAndDark = async (title, desc, key) => {
      try {
        const {getSetting: getSetting2, setSetting: setSetting2} = useSetting(this.en);
        const light = `${key}Light`, dark = `${key}Dark`;
        const lightText = await getSetting2(light) || "";
        const darkText = await getSetting2(dark) || "";
        const a = new Alert();
        a.title = "白天和夜间" + title;
        a.message = !desc ? "请自行去网站上搜寻颜色（Hex 颜色）" : desc;
        a.addTextField("白天", lightText);
        a.addTextField("夜间", darkText);
        a.addAction("确定");
        a.addCancelAction("取消");
        const id = await a.presentAlert();
        if (id === -1)
          return;
        await setSetting2(light, a.textFieldValue(0), false);
        await setSetting2(dark, a.textFieldValue(1));
      } catch (e) {
        console.log(e);
      }
    };
    this.verifyImage = async (img) => {
      try {
        const {width, height} = img.size;
        const direct = true;
        if (width > 1e3) {
          const options = ["取消", "打开图像处理"];
          const message = "您的图片像素为" + width + " x " + height + "\n请将图片" + (direct ? "宽度" : "高度") + "调整到 1000 以下\n" + (!direct ? "宽度" : "高度") + "自动适应";
          const index = await this.generateAlert(message, options);
          if (index === 1)
            await Safari.openInApp("https://www.sojson.com/image/change.html", false);
          return false;
        }
        return true;
      } catch (e) {
        return false;
      }
    };
    this.setImage = async (img, key, notify = true) => {
      const path = FILE_MGR_LOCAL.joinPath(FILE_MGR_LOCAL.documentsDirectory(), "/images");
      if (!FILE_MGR_LOCAL.fileExists(path))
        FILE_MGR_LOCAL.createDirectory(path, true);
      const imgPath = FILE_MGR_LOCAL.joinPath(path, `img_${key}.jpg`);
      if (!img) {
        if (FILE_MGR_LOCAL.fileExists(imgPath))
          FILE_MGR_LOCAL.remove(imgPath);
      } else {
        FILE_MGR_LOCAL.writeImage(imgPath, img);
      }
      if (notify)
        await showNotification({title: this.name, body: "设置生效，稍后刷新", sound: "alert"});
    };
    this.getBackgroundImage = async () => {
      let result = void 0;
      const light = `${this.backgroundKey}_light`;
      const dark = `${this.backgroundKey}_dark`;
      const isNight = Device.isUsingDarkAppearance();
      const path1 = FILE_MGR_LOCAL.joinPath(FILE_MGR_LOCAL.documentsDirectory(), "/images/img_" + light + ".jpg");
      const path2 = FILE_MGR_LOCAL.joinPath(FILE_MGR_LOCAL.documentsDirectory(), "/images/img_" + dark + ".jpg");
      const path3 = FILE_MGR_LOCAL.joinPath(FILE_MGR_LOCAL.documentsDirectory(), "/images/img_" + this.backgroundKey + ".jpg");
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
        return this.shadowImage(result, "#000000", parseFloat(this.opacity));
      }
      return result;
    };
    this.registerAction = (title, onClick, icon = {
      name: "gear",
      color: "#096dd9"
    }) => {
      const url = typeof icon === "string" ? icon : false;
      const action = {title, onClick};
      if (url) {
        action.url = url;
      } else {
        action.icon = icon;
      }
      this.actions.splice(1, 0, action);
    };
    this.drawTableIcon = async (icon = "square.grid.2x2", color = "#e8e8e8", cornerWidth = 42) => {
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
    this.preferences = async (table, arr, outfit) => {
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
          const icon = item.icon || {};
          const image = await this.drawTableIcon(icon.name, icon.color, item.cornerWidth);
          const imageCell = row.addImage(image);
          imageCell.widthWeight = 100;
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
          const imgCell = UITableCell.imageAtURL("https://gitee.com/scriptableJS/Scriptable/raw/master/images/more.png");
          imgCell.rightAligned();
          imgCell.widthWeight = 500;
          row.addCell(imgCell);
        }
        row.dismissOnSelect = false;
        if (item.onClick)
          row.onSelect = () => item.onClick(item);
        table.addRow(row);
      }
      table.reload();
    };
    this.showActionSheet = async (table, title, actions) => {
      await this.preferences(table, actions, title);
    };
    this.showMenu = async () => {
      const table = new UITable();
      table.showSeparators = true;
      table.removeAllRows();
      const topRow = new UITableRow();
      topRow.height = 60;
      const leftText = topRow.addButton("Github");
      leftText.widthWeight = 0.3;
      leftText.onTap = async () => {
        await Safari.openInApp("https://github.com/dompling/Scriptable");
      };
      const centerRow = topRow.addImageAtURL("https://s3.ax1x.com/2021/03/16/6y4oJ1.png");
      centerRow.widthWeight = 0.4;
      centerRow.centerAligned();
      centerRow.onTap = async () => {
        await Safari.open("https://t.me/Scriptable_JS");
      };
      const rightText = topRow.addButton("重置所有");
      rightText.widthWeight = 0.3;
      rightText.rightAligned();
      rightText.onTap = async () => {
        const options = ["取消", "重置"];
        const message = "该操作不可逆，会清空所有组件配置！重置后请重新打开设置菜单。";
        const index = await this.generateAlert(message, options);
        if (index === 0)
          return;
        const {clear} = useSetting(this.en);
        return clear();
      };
      table.addRow(topRow);
      await this.preferences(table, this.widgetAction, "组件预览");
      await this.preferences(table, this.actions, "组件设置");
      await this.preferences(table, this.baseActions, "主题设置");
      await table.present();
    };
    this.getBoxJsCache = async (key) => {
      try {
        const url = "http://" + this.prefix + "/query/boxdata";
        const boxdata = (await request({url, dataType: "json"})).data;
        if (key)
          return boxdata.datas[key];
        return boxdata.datas;
      } catch (e) {
        console.log(e);
        return false;
      }
    };
    this.setCacheBoxJSData = async (opt) => {
      const options = ["取消", "确定"];
      const message = "代理缓存仅支持 BoxJS 相关的代理\nLoon,Qx,Surge";
      const index = await this.generateAlert(message, options);
      if (index === 0)
        return;
      try {
        const boxJSData = await this.getBoxJsCache();
        const settings = {};
        Object.keys(opt).forEach((key) => {
          settings[key] = boxJSData[opt[key]] || "";
        });
        const {setSetting: setSetting2} = useSetting(this.en);
        await setSetting2(this.BOX_CATCH_KEY, settings, false);
        await showNotification({
          title: this.name,
          body: "缓存读取:" + JSON.stringify(settings),
          sound: "alert"
        });
      } catch (e) {
        console.log(e);
        await showNotification({
          title: this.name,
          body: "BoxJS 缓存读取失败！点击查看相关教程",
          openURL: "https://chavyleung.gitbook.io/boxjs/awesome/videos",
          sound: "alert"
        });
      }
    };
    this.showAlertCatchInput = async (title, content, opt, useKey) => {
      const {getSetting: getSetting2, setSetting: setSetting2} = useSetting(this.en);
      const catchValue = await getSetting2(useKey || this.BOX_CATCH_KEY) || {};
      const settings = catchValue;
      const inputItems = Object.keys(opt).map((key) => {
        return {placeholder: opt[key], text: catchValue[key]};
      });
      const {texts, confirm} = await showModal({title, content, inputItems});
      Object.keys(opt).map((key, index) => {
        settings[key] = texts[index];
      });
      if (confirm) {
        await setSetting2(useKey || this.BOX_CATCH_KEY, settings);
        return settings;
      }
    };
  }
  async init() {
    await this.componentWillMountBefore();
    if (config.runsInApp) {
      await this.showMenu();
    } else {
      await this.componentDidMount();
      const widget = await this.render();
      Script.setWidget(widget);
      Script.complete();
    }
  }
  async generateAlert(message, options) {
    const alert = new Alert();
    alert.message = message;
    for (const option of options) {
      alert.addAction(option);
    }
    return await alert.presentAlert();
  }
  shadowImage(img, color = "#000000", opacity) {
    if (!opacity || opacity === 0)
      return img;
    const ctx = new DrawContext();
    ctx.size = img.size;
    ctx.drawImageInRect(img, new Rect(0, 0, img.size["width"], img.size["height"]));
    ctx.setFillColor(new Color(color, opacity));
    ctx.fillRect(new Rect(0, 0, img.size["width"], img.size["height"]));
    return ctx.getImage();
  }
};
var RenderError = async (text) => {
  return /* @__PURE__ */ h("wbox", null, /* @__PURE__ */ h("wspacer", null), /* @__PURE__ */ h("wtext", {
    textAlign: "center"
  }, text), /* @__PURE__ */ h("wspacer", null));
};
var Base_default = Base;

// src/Component/RowCeneter/index.tsx
var RowCenter = ({children, ...props}) => {
  return /* @__PURE__ */ h("wstack", {
    ...props
  }, /* @__PURE__ */ h("wspacer", null), children, /* @__PURE__ */ h("wspacer", null));
};
var RowCeneter_default = RowCenter;

// src/pages/JDDou.tsx
var canvasSize = 258;
var smallCircle = 60;
var canvas = new DrawContext();
canvas.opaque = false;
canvas.respectScreenScale = false;
canvas.size = new Size(258, 258);
var drawCircle = (x, y, color, textConfig, line = 4, size = smallCircle) => {
  const circle = new Rect(x, y, size, size);
  canvas.setStrokeColor(new Color(color, 1));
  canvas.setLineWidth(line);
  canvas.strokeEllipse(circle);
  if (textConfig) {
    canvas.setFont(Font.systemFont(12));
    canvas.setTextColor(new Color(textConfig.color, 1));
    const point = new Point(x + 18, y + 10);
    canvas.drawText(textConfig.text, point);
    const rect = new Rect(x + 10, y + 30, 40, 20);
    canvas.setTextAlignedCenter();
    canvas.drawTextInRect(`${textConfig.value}`, rect);
  }
};
function sinDeg(deg) {
  return Math.sin(deg * Math.PI / 180);
}
function cosDeg(deg) {
  return Math.cos(deg * Math.PI / 180);
}
var drawCenterCircle = (start, color, degree) => {
  canvas.setFillColor(new Color(color, 1));
  for (let i = start; i < degree + start; i++) {
    const x = canvasSize + 80 * sinDeg(i) - canvasSize / 2;
    const y = canvasSize - 80 * cosDeg(i) - canvasSize / 2;
    if (i === start) {
      drawCircle(x, y, color, void 0, 12, 6);
      i += 4;
    } else if (i < degree + start - 2) {
      const rect = new Rect(x, y, 8, 8);
      canvas.fillEllipse(rect);
    }
  }
};
var drawCenterText = async (color, textConfig) => {
  if (color) {
    const circleSize = 140;
    const circleRect = new Rect(canvasSize / 2 - circleSize + 74, canvasSize / 2 - circleSize + 74, circleSize, circleSize);
    canvas.setFillColor(new Color(color, 1));
    canvas.fillEllipse(circleRect);
  }
  const img = (await request({
    url: "https://gitee.com/scriptableJS/Scriptable/raw/master/JDDou/jddnew.png",
    method: "GET",
    dataType: "image"
  })).data;
  const point = canvasSize / 2;
  const imgSize = 52;
  canvas.drawImageInRect(img, new Rect(point - imgSize / 2, point - imgSize / 1.3, imgSize, imgSize));
  const size = 100;
  canvas.setTextColor(new Color(textConfig.color, 1));
  const rect2 = new Rect(point - size / 2 + 5, point + 15, size, size / 2);
  canvas.setFont(Font.title1());
  canvas.drawTextInRect(`${textConfig.value}`, rect2);
};
var Label = ({label, value, color, labelColor}) => {
  return /* @__PURE__ */ h("wstack", {
    verticalAlign: "center"
  }, /* @__PURE__ */ h("wimage", {
    filter: labelColor,
    src: label,
    width: 15,
    height: 15,
    borderRadius: 4
  }), /* @__PURE__ */ h("wspacer", {
    length: 5
  }), /* @__PURE__ */ h("wtext", {
    font: 12,
    textColor: color
  }, value));
};
var Avatar = ({url}) => {
  return /* @__PURE__ */ h("wimage", {
    src: url || "https://img11.360buyimg.com/jdphoto/s120x120_jfs/t21160/90/706848746/2813/d1060df5/5b163ef9N4a3d7aa6.png",
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#f4f4f4"
  });
};
var transforJSON = (str) => {
  if (typeof str === "string") {
    try {
      return JSON.parse(str);
    } catch (e) {
      console.log(e);
      return [];
    }
  }
  console.log("It is not a string!");
};
var {getSetting, setSetting} = useSetting("JDDou");
var Widget = class extends Base_default {
  constructor() {
    super(...arguments);
    this.name = "京东豆";
    this.en = "JDDou";
    this.cookie = {};
    this.CookiesData = [];
    this.JDDataSource = {};
    this.timerKeys = [];
    this.incomeBean = 0;
    this.expenseBean = 0;
    this.beanNum = 0;
    this.jintie = 0;
    this.gangben = 0;
    this.componentWillMount = async () => {
      this.registerAction("代理缓存", this.actionSettings);
      this.registerAction("账号设置", async () => {
        const index = await this.generateAlert("设置账号信息", ["网站登录", "手动输入"]);
        if (index === 0) {
          await this.jdWebView();
        } else {
          await this.showAlertCatchInput("账号设置", "京东账号 Ck", {userName: "昵称", cookie: "Cookie"}, "JDCK");
        }
      });
      this.registerAction("圆形背景", async () => {
        return this.showAlertCatchInput("圆形背景", "中心圆背景", {light: "白天", dark: "夜间"}, "centerCircle");
      });
    };
    this.componentDidMount = async () => {
      const ckIndex = args.widgetParameter;
      const cookies = await getSetting("Cookies");
      this.cookie = await getSetting("JDCK");
      if (cookies && cookies[ckIndex])
        this.cookie = cookies[ckIndex];
      this.JDDataSource = await this.fetchJDDataSource();
      this.beanNum = parseInt(this.JDDataSource.assetInfo.beanNum || "0");
      this.timerKeys = this.getDay(1);
      await this.getAmountData();
      await this.fetchBaseInfo();
      await this.drawImg();
    };
    this.jdWebView = async () => {
      const webView = new WebView();
      const url = "https://mcr.jd.com/credit_home/pages/index.html?btPageType=BT&channelName=024";
      await webView.loadURL(url);
      await webView.present(false);
      const req = new Request("https://ms.jr.jd.com/gw/generic/bt/h5/m/firstScreenNew");
      req.method = "POST";
      req.body = 'reqData={"clientType":"ios","clientVersion":"13.2.3","deviceId":"","environment":"3"}';
      await req.loadJSON();
      const cookies = req.response.cookies;
      const account = {userName: "", cookie: ""};
      const cookie = [];
      cookies.forEach((item) => {
        const value = `${item.name}=${item.value}`;
        if (item.name === "pt_key")
          cookie.push(value);
        if (item.name === "pt_pin") {
          account.userName = item.value;
          cookie.push(value);
        }
      });
      account.cookie = cookie.join("; ");
      if (account.cookie) {
        await setSetting("JDCK", account, false);
        await showNotification({title: this.name, body: "cookie获取成功，请关闭窗口！"});
        console.log(`${this.name}: cookie获取成功，请关闭窗口！`);
      }
    };
    this.actionSettings = async () => {
      try {
        const table = new UITable();
        await this._loadJDCk();
        if (!this.CookiesData.length)
          throw new Error("BoxJS 数据读取失败");
        this.CookiesData.map((t, index) => {
          const r = new UITableRow();
          r.addText(`parameter：${index}    ${t.userName}`);
          r.onSelect = () => setSetting("JDCK", t, true);
          table.addRow(r);
        });
        await setSetting("Cookies", this.CookiesData);
        await table.present(false);
      } catch (e) {
        await showNotification({
          title: this.name,
          body: "BoxJS 数据读取失败，请点击通知查看教程",
          openURL: "https://chavyleung.gitbook.io/boxjs/awesome/videos"
        });
      }
    };
    this._loadJDCk = async () => {
      try {
        const CookiesData = await this.getBoxJsCache("CookiesJD");
        this.CookiesData = [];
        if (CookiesData)
          this.CookiesData = transforJSON(CookiesData);
        const CookieJD = await this.getBoxJsCache("CookieJD");
        if (CookieJD) {
          const userName = CookieJD.match(/pt_pin=(.+?);/)[1];
          const ck1 = {cookie: CookieJD, userName};
          this.CookiesData.push(ck1);
        }
        const Cookie2JD = await this.getBoxJsCache("CookieJD2");
        if (Cookie2JD) {
          const userName = Cookie2JD.match(/pt_pin=(.+?);/)[1];
          const ck2 = {cookie: Cookie2JD, userName};
          this.CookiesData.push(ck2);
        }
        return true;
      } catch (e) {
        console.log(e);
        this.CookiesData = [];
        return false;
      }
    };
    this.drawImg = async () => {
      drawCircle(5, 5, "#DD8AB7", {
        color: this.fontColor,
        text: "收入",
        value: `${this.incomeBean}`
      });
      drawCircle(193, 5, "#FBBFA7", {
        color: this.fontColor,
        text: "支出",
        value: `${this.expenseBean}`
      });
      drawCircle(5, 193, "#A4E0de", {
        color: this.fontColor,
        text: "津贴",
        value: `${this.jintie}`
      });
      drawCircle(193, 193, "#D1C0A5", {
        color: this.fontColor,
        text: "钢镚",
        value: `${this.gangben}`
      });
      const expen = Math.abs(this.expenseBean);
      const total = this.beanNum + this.incomeBean + expen;
      const incomeBean = Math.floor(Math.floor(this.incomeBean / total * 100) * 3.6);
      const expenseBean = Math.floor(Math.floor(expen / total * 100) * 3.6);
      const jdNum = Math.floor(Math.floor(this.beanNum / total * 100) * 3.6);
      console.log(jdNum);
      console.log(incomeBean);
      console.log(expenseBean);
      drawCenterCircle(0, "#c3cdF2", jdNum);
      drawCenterCircle(jdNum, "#DD8AB7", incomeBean);
      drawCenterCircle(jdNum + incomeBean, "#FBBFA7", expenseBean);
      const {light, dark} = await getSetting("centerCircle") || {};
      const centerCircleColor = Device.isUsingDarkAppearance() ? dark : light;
      await drawCenterText(centerCircleColor || "", {color: this.fontColor, value: `${this.beanNum}`});
    };
    this.fetchBaseInfo = async () => {
      const url1 = "https://ms.jr.jd.com/gw/generic/uc/h5/m/mySubsidyBalance";
      const req1 = new Request(url1);
      const Referer = "https://home.m.jd.com/myJd/newhome.action?sceneval=2&ufc=&";
      req1.headers = {cookie: this.cookie.cookie, Referer};
      const data1 = await req1.loadJSON();
      if (data1.resultCode === 0) {
        this.jintie = data1.resultData.data.balance;
      }
      const url2 = "https://coin.jd.com/m/gb/getBaseInfo.html";
      const req2 = new Request(url2);
      req2.headers = {cookie: this.cookie.cookie, Referer};
      const data2 = await req2.loadJSON();
      if (data2.gbBalance) {
        this.gangben = data2.gbBalance;
      }
    };
    this.fetchJDDataSource = async () => {
      const headers = {
        cookie: this.cookie.cookie,
        "User-Agent": "scriptable"
      };
      const url = "https://me-api.jd.com/user_new/info/GetJDUserInfoUnion";
      return ((await request({url, header: headers})).data || {}).data;
    };
    this.getAmountData = async () => {
      let i = 0, page = 1;
      do {
        const response = await this.getJingBeanBalanceDetail(page);
        console.log(`第${page}页：${response.code === "0" ? "请求成功" : "请求失败"}`);
        if (response.code === "3") {
          i = 1;
          console.log(response);
        }
        if (response && response.code === "0") {
          page++;
          const detailList = response.jingDetailList;
          if (detailList && detailList.length > 0) {
            for (const item of detailList) {
              const dates = item.date.split(" ");
              if (this.timerKeys.indexOf(dates[0]) > -1) {
                if (this.timerKeys[0] === dates[0]) {
                  const amount = Number(item.amount);
                  if (amount > 0)
                    this.incomeBean += amount;
                  if (amount < 0)
                    this.expenseBean += amount;
                }
              } else {
                i = 1;
                break;
              }
            }
          }
        }
      } while (i === 0);
    };
    this.getJingBeanBalanceDetail = async (page) => {
      const options = {
        url: `https://bean.m.jd.com/beanDetail/detail.json`,
        body: `page=${page}`,
        headers: {
          "X-Requested-With": `XMLHttpRequest`,
          Connection: `keep-alive`,
          "Accept-Encoding": `gzip, deflate, br`,
          "Content-Type": `application/x-www-form-urlencoded; charset=UTF-8`,
          Origin: `https://bean.m.jd.com`,
          "User-Agent": `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.1 Safari/605.1.15`,
          Cookie: this.cookie.cookie,
          Host: `bean.m.jd.com`,
          Referer: `https://bean.m.jd.com/beanDetail/index.action?resourceValue=bean`,
          "Accept-Language": `zh-cn`,
          Accept: `application/json, text/javascript, */*; q=0.01`
        }
      };
      return (await request({url: options.url, method: "POST", data: options.body, header: options.headers})).data;
    };
    this.render = async () => {
      if (config.widgetFamily === "large")
        return RenderError("暂不支持");
      const contentImg = canvas.getImage();
      const baseInfo = this.JDDataSource.userInfo.baseInfo;
      return /* @__PURE__ */ h("wbox", {
        background: await this.getBackgroundImage() || this.backgroundColor,
        updateDate: new Date(Date.now() + await this.updateInterval()),
        padding: [0, 0, 0, 0]
      }, /* @__PURE__ */ h("wstack", {
        href: "https://home.m.jd.com/myJd/home.action",
        verticalAlign: "center"
      }, /* @__PURE__ */ h("wspacer", null), /* @__PURE__ */ h(RowCeneter_default, {
        flexDirection: "column"
      }, /* @__PURE__ */ h("wimage", {
        src: contentImg,
        width: 150,
        height: 150
      })), config.widgetFamily === "medium" && /* @__PURE__ */ h(Fragment, null, /* @__PURE__ */ h("wspacer", {
        length: 5
      }), /* @__PURE__ */ h("wstack", {
        flexDirection: "column",
        verticalAlign: "center"
      }, /* @__PURE__ */ h("wspacer", null), /* @__PURE__ */ h(RowCeneter_default, null, /* @__PURE__ */ h(Avatar, {
        url: baseInfo.headImageUrl
      })), /* @__PURE__ */ h("wspacer", {
        length: 10
      }), /* @__PURE__ */ h(RowCeneter_default, null, /* @__PURE__ */ h("wstack", {
        flexDirection: "column"
      }, /* @__PURE__ */ h(Label, {
        color: this.fontColor,
        labelColor: "#f95e4c",
        label: "person.circle",
        value: baseInfo.nickname
      }), /* @__PURE__ */ h("wspacer", {
        length: 10
      }), /* @__PURE__ */ h(Label, {
        color: this.fontColor,
        labelColor: "#f7de65",
        label: "creditcard.circle",
        value: `${baseInfo.levelName}(${baseInfo.userLevel})`
      }))), /* @__PURE__ */ h("wspacer", null))), /* @__PURE__ */ h("wspacer", null)));
    };
  }
  getDay(dayNumber) {
    const data = [];
    let i = dayNumber;
    do {
      const today = new Date();
      const year = today.getFullYear();
      const targetday_milliseconds = today.getTime() - 1e3 * 60 * 60 * 24 * i;
      today.setTime(targetday_milliseconds);
      let month = today.getMonth() + 1;
      month = month >= 10 ? month : `0${month}`;
      let day = today.getDate();
      day = day >= 10 ? day : `0${day}`;
      data.push(`${year}-${month}-${day}`);
      i--;
    } while (i >= 0);
    return data;
  }
};


EndAwait(() => new Widget().init());

await __topLevelAwait__();

