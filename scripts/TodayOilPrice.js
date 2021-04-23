// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: oil-can;

/**
 * 作者: 2Ya
 * 版本: 1.0.0
 * 更新时间：4/23/2021
 * github: https://github.com/dompling/Scriptable
 */

// @编译时间 1619170056159
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
  const getSetting = async (key) => {
    const fileExists = await isFileExists();
    if (!fileExists)
      return null;
    if (isUseICloud())
      await fileManager.downloadFileFromiCloud(settingsPath);
    const json = fileManager.readString(settingsPath);
    const settings = JSON.parse(json) || {};
    return settings[key];
  };
  const setSetting = async (key, value, notify = true) => {
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
  return {getSetting, setSetting, clear};
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
  const {title: title2, desc, cancelText = "取消", itemList} = args2;
  const alert = new Alert();
  title2 && (alert.title = title2);
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
  const {title: title2, content, showCancel = true, cancelText = "取消", confirmText = "确定", inputItems = []} = args2;
  const alert = new Alert();
  title2 && (alert.title = title2);
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
    const {title: title2, subtitle = "", body = "", openURL, sound, ...others} = args2;
    let notification = new Notification();
    notification.title = title2;
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
      const {getSetting} = useSetting(this.en);
      const {getStorage: getStorage2} = useStorage("boxjs");
      this.prefix = await getStorage2("prefix") || this.prefix;
      const fontColorLight = await getSetting("fontColorLight") || this.fontColor;
      const fontColorDark = await getSetting("fontColorDark") || this.fontColor;
      this.fontColor = Device.isUsingDarkAppearance() ? fontColorDark : fontColorLight;
      const backgroundColorLight = await getSetting("backgroundColorLight") || "#fff";
      const backgroundColorDark = await getSetting("backgroundColorDark") || "#000";
      this.backgroundColor = Device.isUsingDarkAppearance() ? this.getBackgroundColor(backgroundColorDark) : this.getBackgroundColor(backgroundColorLight);
      const opacityLight = await getSetting("opacityLight") || this.opacity;
      const opacityDark = await getSetting("opacityDark") || this.opacity;
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
      const {getSetting} = useSetting(this.en);
      const updateInterval = await getSetting("updateInterval") || "30";
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
          const {getSetting, setSetting} = useSetting(this.en);
          const updateInterval = await getSetting("updateInterval") || "";
          const {texts} = await showModal({
            title: "刷新时间",
            inputItems: [
              {
                placeholder: "刷新时间单位分钟",
                text: `${updateInterval}`
              }
            ]
          });
          await setSetting("updateInterval", texts);
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
    this.setLightAndDark = async (title2, desc, key) => {
      try {
        const {getSetting, setSetting} = useSetting(this.en);
        const light = `${key}Light`, dark = `${key}Dark`;
        const lightText = await getSetting(light) || "";
        const darkText = await getSetting(dark) || "";
        const a = new Alert();
        a.title = "白天和夜间" + title2;
        a.message = !desc ? "请自行去网站上搜寻颜色（Hex 颜色）" : desc;
        a.addTextField("白天", lightText);
        a.addTextField("夜间", darkText);
        a.addAction("确定");
        a.addCancelAction("取消");
        const id = await a.presentAlert();
        if (id === -1)
          return;
        await setSetting(light, a.textFieldValue(0), false);
        await setSetting(dark, a.textFieldValue(1));
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
    this.registerAction = (title2, onClick, icon = {
      name: "gear",
      color: "#096dd9"
    }) => {
      const url = typeof icon === "string" ? icon : false;
      const action = {title: title2, onClick};
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
          row.onSelect = () => item.onClick(item, row);
        table.addRow(row);
      }
      table.reload();
    };
    this.showActionSheet = async (table, title2, actions) => {
      await this.preferences(table, actions, title2);
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
        const {setSetting} = useSetting(this.en);
        await setSetting(this.BOX_CATCH_KEY, settings, false);
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
    this.showAlertCatchInput = async (title2, content, opt, useKey) => {
      const {getSetting, setSetting} = useSetting(this.en);
      const catchValue = await getSetting(useKey || this.BOX_CATCH_KEY) || {};
      const settings = catchValue;
      const inputItems = Object.keys(opt).map((key) => {
        return {placeholder: opt[key], text: catchValue[key]};
      });
      const {texts, confirm} = await showModal({title: title2, content, inputItems});
      Object.keys(opt).map((key, index) => {
        settings[key] = texts[index];
      });
      if (confirm) {
        await setSetting(useKey || this.BOX_CATCH_KEY, settings);
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

// src/assets/pinyin.ts
var pinYin = {
  a: "啊阿锕",
  ai: "埃挨哎唉哀皑癌蔼矮艾碍爱隘诶捱嗳嗌嫒瑷暧砹锿霭",
  an: "鞍氨安俺按暗岸胺案谙埯揞犴庵桉铵鹌顸黯",
  ang: "肮昂盎",
  ao: "凹敖熬翱袄傲奥懊澳坳拗嗷噢岙廒遨媪骜聱螯鏊鳌鏖",
  ba: "芭捌扒叭吧笆八疤巴拔跋靶把耙坝霸罢爸茇菝萆捭岜灞杷钯粑鲅魃",
  bai: "白柏百摆佰败拜稗薜掰鞴",
  ban: "斑班搬扳般颁板版扮拌伴瓣半办绊阪坂豳钣瘢癍舨",
  bang: "邦帮梆榜膀绑棒磅蚌镑傍谤蒡螃",
  bao: "苞胞包褒雹保堡饱宝抱报暴豹鲍爆勹葆宀孢煲鸨褓趵龅",
  bo: "剥薄玻菠播拨钵波博勃搏铂箔伯帛舶脖膊渤泊驳亳蕃啵饽檗擘礴钹鹁簸跛",
  bei: "杯碑悲卑北辈背贝钡倍狈备惫焙被孛陂邶埤蓓呗怫悖碚鹎褙鐾",
  ben: "奔苯本笨畚坌锛",
  beng: "崩绷甭泵蹦迸唪嘣甏",
  bi: "逼鼻比鄙笔彼碧蓖蔽毕毙毖币庇痹闭敝弊必辟壁臂避陛匕仳俾芘荜荸吡哔狴庳愎滗濞弼妣婢嬖璧贲畀铋秕裨筚箅篦舭襞跸髀",
  bian: "鞭边编贬扁便变卞辨辩辫遍匾弁苄忭汴缏煸砭碥稹窆蝙笾鳊",
  biao: "标彪膘表婊骠飑飙飚灬镖镳瘭裱鳔",
  bie: "鳖憋别瘪蹩鳘",
  bin: "彬斌濒滨宾摈傧浜缤玢殡膑镔髌鬓",
  bing: "兵冰柄丙秉饼炳病并禀邴摒绠枋槟燹",
  bu: "捕卜哺补埠不布步簿部怖拊卟逋瓿晡钚醭",
  ca: "擦嚓礤",
  cai: "猜裁材才财睬踩采彩菜蔡",
  can: "餐参蚕残惭惨灿骖璨粲黪",
  cang: "苍舱仓沧藏伧",
  cao: "操糙槽曹草艹嘈漕螬艚",
  ce: "厕策侧册测刂帻恻",
  ceng: "层蹭噌",
  cha: "插叉茬茶查碴搽察岔差诧猹馇汊姹杈楂槎檫钗锸镲衩",
  chai: "拆柴豺侪茈瘥虿龇",
  chan: "搀掺蝉馋谗缠铲产阐颤冁谄谶蒇廛忏潺澶孱羼婵嬗骣觇禅镡裣蟾躔",
  chang: "昌猖场尝常长偿肠厂敞畅唱倡伥鬯苌菖徜怅惝阊娼嫦昶氅鲳",
  chao: "超抄钞朝嘲潮巢吵炒怊绉晁耖",
  che: "车扯撤掣彻澈坼屮砗",
  chen: "郴臣辰尘晨忱沉陈趁衬称谌抻嗔宸琛榇肜胂碜龀",
  cheng: "撑城橙成呈乘程惩澄诚承逞骋秤埕嵊徵浈枨柽樘晟塍瞠铖裎蛏酲",
  chi: "吃痴持匙池迟弛驰耻齿侈尺赤翅斥炽傺墀芪茌搋叱哧啻嗤彳饬沲媸敕胝眙眵鸱瘛褫蚩螭笞篪豉踅踟魑",
  chong: "充冲虫崇宠茺忡憧铳艟",
  chou: "抽酬畴踌稠愁筹仇绸瞅丑俦圳帱惆溴妯瘳雠鲋",
  chu: "臭初出橱厨躇锄雏滁除楚础储矗搐触处亍刍憷绌杵楮樗蜍蹰黜",
  chuan: "揣川穿椽传船喘串掾舛惴遄巛氚钏镩舡",
  chuang: "疮窗幢床闯创怆",
  chui: "吹炊捶锤垂陲棰槌",
  chun: "春椿醇唇淳纯蠢促莼沌肫朐鹑蝽",
  chuo: "戳绰蔟辶辍镞踔龊",
  ci: "疵茨磁雌辞慈瓷词此刺赐次荠呲嵯鹚螅糍趑",
  cong: "聪葱囱匆从丛偬苁淙骢琮璁枞",
  cu: "凑粗醋簇猝殂蹙",
  cuan: "蹿篡窜汆撺昕爨",
  cui: "摧崔催脆瘁粹淬翠萃悴璀榱隹",
  cun: "村存寸磋忖皴",
  cuo: "撮搓措挫错厝脞锉矬痤鹾蹉躜",
  da: "搭达答瘩打大耷哒嗒怛妲疸褡笪靼鞑",
  dai: "呆歹傣戴带殆代贷袋待逮怠埭甙呔岱迨逯骀绐玳黛",
  dan: "耽担丹单郸掸胆旦氮但惮淡诞弹蛋亻儋卩萏啖澹檐殚赕眈瘅聃箪",
  dang: "当挡党荡档谠凼菪宕砀铛裆",
  dao: "刀捣蹈倒岛祷导到稻悼道盗叨啁忉洮氘焘忑纛",
  de: "德得的锝",
  deng: "蹬灯登等瞪凳邓噔嶝戥磴镫簦",
  di: "堤低滴迪敌笛狄涤翟嫡抵底地蒂第帝弟递缔氐籴诋谛邸坻莜荻嘀娣柢棣觌砥碲睇镝羝骶",
  dian: "颠掂滇碘点典靛垫电佃甸店惦奠淀殿丶阽坫埝巅玷癜癫簟踮",
  diao: "碉叼雕凋刁掉吊钓调轺铞蜩粜貂",
  die: "跌爹碟蝶迭谍叠佚垤堞揲喋渫轶牒瓞褶耋蹀鲽鳎",
  ding: "丁盯叮钉顶鼎锭定订丢仃啶玎腚碇町铤疔耵酊",
  dong: "东冬董懂动栋侗恫冻洞垌咚岽峒夂氡胨胴硐鸫",
  dou: "兜抖斗陡豆逗痘蔸钭窦窬蚪篼酡",
  du: "都督毒犊独读堵睹赌杜镀肚度渡妒芏嘟渎椟橐牍蠹笃髑黩",
  duan: "端短锻段断缎彖椴煅簖",
  dui: "堆兑队对怼憝碓",
  dun: "墩吨蹲敦顿囤钝盾遁炖砘礅盹镦趸",
  duo: "掇哆多夺垛躲朵跺舵剁惰堕咄哚缍柁铎裰踱",
  e: "蛾峨鹅俄额讹娥恶厄扼遏鄂饿噩谔垩垭苊莪萼呃愕屙婀轭曷腭硪锇锷鹗颚鳄",
  en: "恩蒽摁唔嗯",
  er: "而儿耳尔饵洱二贰迩珥铒鸸鲕",
  fa: "发罚筏伐乏阀法珐垡砝",
  fan: "藩帆番翻樊矾钒繁凡烦反返范贩犯饭泛蘩幡犭梵攵燔畈蹯",
  fang: "坊芳方肪房防妨仿访纺放匚邡彷钫舫鲂",
  fei: "菲非啡飞肥匪诽吠肺废沸费芾狒悱淝妃绋绯榧腓斐扉祓砩镄痱蜚篚翡霏鲱",
  fen: "芬酚吩氛分纷坟焚汾粉奋份忿愤粪偾瀵棼愍鲼鼢",
  feng: "丰封枫蜂峰锋风疯烽逢冯缝讽奉凤俸酆葑沣砜",
  fu: "佛否夫敷肤孵扶拂辐幅氟符伏俘服浮涪福袱弗甫抚辅俯釜斧脯腑府腐赴副覆赋复傅付阜父腹负富讣附妇缚咐匐凫郛芙苻茯莩菔呋幞滏艴孚驸绂桴赙黻黼罘稃馥虍蚨蜉蝠蝮麸趺跗鳆",
  ga: "噶嘎蛤尬呷尕尜旮钆",
  gai: "该改概钙盖溉丐陔垓戤赅胲",
  gan: "干甘杆柑竿肝赶感秆敢赣坩苷尴擀泔淦澉绀橄旰矸疳酐",
  gang: "冈刚钢缸肛纲岗港戆罡颃筻",
  gong: "杠工攻功恭龚供躬公宫弓巩汞拱贡共蕻廾咣珙肱蚣蛩觥",
  gao: "篙皋高膏羔糕搞镐稿告睾诰郜蒿藁缟槔槁杲锆",
  ge: "哥歌搁戈鸽胳疙割革葛格阁隔铬个各鬲仡哿塥嗝纥搿膈硌铪镉袼颌虼舸骼髂",
  gei: "给",
  gen: "根跟亘茛哏艮",
  geng: "耕更庚羹埂耿梗哽赓鲠",
  gou: "钩勾沟苟狗垢构购够佝诟岣遘媾缑觏彀鸲笱篝鞲",
  gu: "辜菇咕箍估沽孤姑鼓古蛊骨谷股故顾固雇嘏诂菰哌崮汩梏轱牯牿胍臌毂瞽罟钴锢瓠鸪鹄痼蛄酤觚鲴骰鹘",
  gua: "刮瓜剐寡挂褂卦诖呱栝鸹",
  guai: "乖拐怪哙",
  guan: "棺关官冠观管馆罐惯灌贯倌莞掼涫盥鹳鳏",
  guang: "光广逛犷桄胱疒",
  gui: "瑰规圭硅归龟闺轨鬼诡癸桂柜跪贵刽匦刿庋宄妫桧炅晷皈簋鲑鳜",
  gun: "辊滚棍丨衮绲磙鲧",
  guo: "锅郭国果裹过馘蠃埚掴呙囗帼崞猓椁虢锞聒蜮蜾蝈",
  ha: "哈",
  hai: "骸孩海氦亥害骇咴嗨颏醢",
  han: "酣憨邯韩含涵寒函喊罕翰撼捍旱憾悍焊汗汉邗菡撖阚瀚晗焓颔蚶鼾",
  hen: "夯痕很狠恨",
  hang: "杭航沆绗珩桁",
  hao: "壕嚎豪毫郝好耗号浩薅嗥嚆濠灏昊皓颢蚝",
  he: "呵喝荷菏核禾和何合盒貉阂河涸赫褐鹤贺诃劾壑藿嗑嗬阖盍蚵翮",
  hei: "嘿黑",
  heng: "哼亨横衡恒訇蘅",
  hong: "轰哄烘虹鸿洪宏弘红黉讧荭薨闳泓",
  hou: "喉侯猴吼厚候后堠後逅瘊篌糇鲎骺",
  hu: "呼乎忽瑚壶葫胡蝴狐糊湖弧虎唬护互沪户冱唿囫岵猢怙惚浒滹琥槲轷觳烀煳戽扈祜鹕鹱笏醐斛",
  hua: "花哗华猾滑画划化话劐浍骅桦铧稞",
  huai: "槐徊怀淮坏还踝",
  huan: "欢环桓缓换患唤痪豢焕涣宦幻郇奂垸擐圜洹浣漶寰逭缳锾鲩鬟",
  huang: "荒慌黄磺蝗簧皇凰惶煌晃幌恍谎隍徨湟潢遑璜肓癀蟥篁鳇",
  hui: "灰挥辉徽恢蛔回毁悔慧卉惠晦贿秽会烩汇讳诲绘诙茴荟蕙哕喙隳洄彗缋珲晖恚虺蟪麾",
  hun: "荤昏婚魂浑混诨馄阍溷缗",
  huo: "豁活伙火获或惑霍货祸攉嚯夥钬锪镬耠蠖",
  ji: "击圾基机畸稽积箕肌饥迹激讥鸡姬绩缉吉极棘辑籍集及急疾汲即嫉级挤几脊己蓟技冀季伎祭剂悸济寄寂计记既忌际妓继纪居丌乩剞佶佴脔墼芨芰萁蒺蕺掎叽咭哜唧岌嵴洎彐屐骥畿玑楫殛戟戢赍觊犄齑矶羁嵇稷瘠瘵虮笈笄暨跻跽霁鲚鲫髻麂",
  jia: "嘉枷夹佳家加荚颊贾甲钾假稼价架驾嫁伽郏拮岬浃迦珈戛胛恝铗镓痂蛱笳袈跏",
  jian: "歼监坚尖笺间煎兼肩艰奸缄茧检柬碱硷拣捡简俭剪减荐槛鉴践贱见键箭件健舰剑饯渐溅涧建僭谏谫菅蒹搛囝湔蹇謇缣枧柙楗戋戬牮犍毽腱睑锏鹣裥笕箴翦趼踺鲣鞯",
  jiang: "僵姜将浆江疆蒋桨奖讲匠酱降茳洚绛缰犟礓耩糨豇",
  jiao: "蕉椒礁焦胶交郊浇骄娇嚼搅铰矫侥脚狡角饺缴绞剿教酵轿较叫佼僬茭挢噍峤徼姣纟敫皎鹪蛟醮跤鲛",
  jie: "窖揭接皆秸街阶截劫节桔杰捷睫竭洁结解姐戒藉芥界借介疥诫届偈讦诘喈嗟獬婕孑桀獒碣锴疖袷颉蚧羯鲒骱髫",
  jin: "巾筋斤金今津襟紧锦仅谨进靳晋禁近烬浸尽卺荩堇噤馑廑妗缙瑾槿赆觐钅锓衿矜",
  jing: "劲荆兢茎睛晶鲸京惊精粳经井警景颈静境敬镜径痉靖竟竞净刭儆阱菁獍憬泾迳弪婧肼胫腈旌",
  jiong: "炯窘冂迥扃",
  jiu: "揪究纠玖韭久灸九酒厩救旧臼舅咎就疚僦啾阄柩桕鹫赳鬏",
  ju: "鞠拘狙疽驹菊局咀矩举沮聚拒据巨具距踞锯俱句惧炬剧倨讵苣苴莒掬遽屦琚枸椐榘榉橘犋飓钜锔窭裾趄醵踽龃雎鞫",
  juan: "捐鹃娟倦眷卷绢鄄狷涓桊蠲锩镌隽",
  jue: "撅攫抉掘倔爵觉决诀绝厥劂谲矍蕨噘崛獗孓珏桷橛爝镢蹶觖",
  jun: "均菌钧军君峻俊竣浚郡骏捃狻皲筠麇",
  ka: "喀咖卡佧咔胩",
  ke: "咯坷苛柯棵磕颗科壳咳可渴克刻客课岢恪溘骒缂珂轲氪瞌钶疴窠蝌髁",
  kai: "开揩楷凯慨剀垲蒈忾恺铠锎",
  kan: "刊堪勘坎砍看侃凵莰莶戡龛瞰",
  kang: "康慷糠扛抗亢炕坑伉闶钪",
  kao: "考拷烤靠尻栲犒铐",
  ken: "肯啃垦恳垠裉颀",
  keng: "吭忐铿",
  kong: "空恐孔控倥崆箜",
  kou: "抠口扣寇芤蔻叩眍筘",
  ku: "枯哭窟苦酷库裤刳堀喾绔骷",
  kua: "夸垮挎跨胯侉",
  kuai: "块筷侩快蒯郐蒉狯脍",
  kuan: "宽款髋",
  kuang: "匡筐狂框矿眶旷况诓诳邝圹夼哐纩贶",
  kui: "亏盔岿窥葵奎魁傀馈愧溃馗匮夔隗揆喹喟悝愦阕逵暌睽聩蝰篑臾跬",
  kun: "坤昆捆困悃阃琨锟醌鲲髡",
  kuo: "括扩廓阔蛞",
  la: "垃拉喇蜡腊辣啦剌摺邋旯砬瘌",
  lai: "莱来赖崃徕涞濑赉睐铼癞籁",
  lan: "蓝婪栏拦篮阑兰澜谰揽览懒缆烂滥啉岚懔漤榄斓罱镧褴",
  lang: "琅榔狼廊郎朗浪莨蒗啷阆锒稂螂",
  lao: "捞劳牢老佬姥酪烙涝唠崂栳铑铹痨醪",
  le: "勒乐肋仂叻嘞泐鳓",
  lei: "雷镭蕾磊累儡垒擂类泪羸诔荽咧漯嫘缧檑耒酹",
  ling: "棱冷拎玲菱零龄铃伶羚凌灵陵岭领另令酃塄苓呤囹泠绫柃棂瓴聆蛉翎鲮",
  leng: "楞愣",
  li: "厘梨犁黎篱狸离漓理李里鲤礼莉荔吏栗丽厉励砾历利傈例俐痢立粒沥隶力璃哩俪俚郦坜苈莅蓠藜捩呖唳喱猁溧澧逦娌嫠骊缡珞枥栎轹戾砺詈罹锂鹂疠疬蛎蜊蠡笠篥粝醴跞雳鲡鳢黧",
  lian: "俩联莲连镰廉怜涟帘敛脸链恋炼练挛蔹奁潋濂娈琏楝殓臁膦裢蠊鲢",
  liang: "粮凉梁粱良两辆量晾亮谅墚椋踉靓魉",
  liao: "撩聊僚疗燎寥辽潦了撂镣廖料蓼尥嘹獠寮缭钌鹩耢",
  lie: "列裂烈劣猎冽埒洌趔躐鬣",
  lin: "琳林磷霖临邻鳞淋凛赁吝蔺嶙廪遴檩辚瞵粼躏麟",
  liu: "溜琉榴硫馏留刘瘤流柳六抡偻蒌泖浏遛骝绺旒熘锍镏鹨鎏",
  long: "龙聋咙笼窿隆垄拢陇弄垅茏泷珑栊胧砻癃",
  lou: "楼娄搂篓漏陋喽嵝镂瘘耧蝼髅",
  lu: "芦卢颅庐炉掳卤虏鲁麓碌露路赂鹿潞禄录陆戮垆摅撸噜泸渌漉璐栌橹轳辂辘氇胪镥鸬鹭簏舻鲈",
  lv: "驴吕铝侣旅履屡缕虑氯律率滤绿捋闾榈膂稆褛",
  luan: "峦孪滦卵乱栾鸾銮",
  lue: "掠略锊",
  lun: "轮伦仑沦纶论囵",
  luo: "萝螺罗逻锣箩骡裸落洛骆络倮荦摞猡泺椤脶镙瘰雒",
  ma: "妈麻玛码蚂马骂嘛吗唛犸嬷杩麽",
  mai: "埋买麦卖迈脉劢荬咪霾",
  man: "瞒馒蛮满蔓曼慢漫谩墁幔缦熳镘颟螨鳗鞔",
  mang: "芒茫盲忙莽邙漭朦硭蟒",
  meng: "氓萌蒙檬盟锰猛梦孟勐甍瞢懵礞虻蜢蠓艋艨黾",
  miao: "猫苗描瞄藐秒渺庙妙喵邈缈缪杪淼眇鹋蜱",
  mao: "茅锚毛矛铆卯茂冒帽貌贸侔袤勖茆峁瑁昴牦耄旄懋瞀蛑蝥蟊髦",
  me: "么",
  mei: "玫枚梅酶霉煤没眉媒镁每美昧寐妹媚坶莓嵋猸浼湄楣镅鹛袂魅",
  men: "门闷们扪玟焖懑钔",
  mi: "眯醚靡糜迷谜弥米秘觅泌蜜密幂芈冖谧蘼嘧猕獯汨宓弭脒敉糸縻麋",
  mian: "棉眠绵冕免勉娩缅面沔湎腼眄",
  mie: "蔑灭咩蠛篾",
  min: "民抿皿敏悯闽苠岷闵泯珉",
  ming: "明螟鸣铭名命冥茗溟暝瞑酩",
  miu: "谬",
  mo: "摸摹蘑模膜磨摩魔抹末莫墨默沫漠寞陌谟茉蓦馍嫫镆秣瘼耱蟆貊貘",
  mou: "谋牟某厶哞婺眸鍪",
  mu: "拇牡亩姆母墓暮幕募慕木目睦牧穆仫苜呒沐毪钼",
  na: "拿哪呐钠那娜纳内捺肭镎衲箬",
  nai: "氖乃奶耐奈鼐艿萘柰",
  nan: "南男难囊喃囡楠腩蝻赧",
  nao: "挠脑恼闹孬垴猱瑙硇铙蛲",
  ne: "淖呢讷",
  nei: "馁",
  nen: "嫩能枘恁",
  ni: "妮霓倪泥尼拟你匿腻逆溺伲坭猊怩滠昵旎祢慝睨铌鲵",
  nian: "蔫拈年碾撵捻念廿辇黏鲇鲶",
  niang: "娘酿",
  niao: "鸟尿茑嬲脲袅",
  nie: "捏聂孽啮镊镍涅乜陧蘖嗫肀颞臬蹑",
  nin: "您柠",
  ning: "狞凝宁拧泞佞蓥咛甯聍",
  niu: "牛扭钮纽狃忸妞蚴",
  nong: "脓浓农侬",
  nu: "奴努怒呶帑弩胬孥驽",
  nv: "女恧钕衄",
  nuan: "暖",
  nuenue: "虐",
  nue: "疟谑",
  nuo: "挪懦糯诺傩搦喏锘",
  ou: "哦欧鸥殴藕呕偶沤怄瓯耦",
  pa: "啪趴爬帕怕琶葩筢",
  pai: "拍排牌徘湃派俳蒎",
  pan: "攀潘盘磐盼畔判叛爿泮袢襻蟠蹒",
  pang: "乓庞旁耪胖滂逄",
  pao: "抛咆刨炮袍跑泡匏狍庖脬疱",
  pei: "呸胚培裴赔陪配佩沛掊辔帔淠旆锫醅霈",
  pen: "喷盆湓",
  peng: "砰抨烹澎彭蓬棚硼篷膨朋鹏捧碰坯堋嘭怦蟛",
  pi: "砒霹批披劈琵毗啤脾疲皮匹痞僻屁譬丕陴邳郫圮鼙擗噼庀媲纰枇甓睥罴铍痦癖疋蚍貔",
  pian: "篇偏片骗谝骈犏胼褊翩蹁",
  piao: "飘漂瓢票剽嘌嫖缥殍瞟螵",
  pie: "撇瞥丿苤氕",
  pin: "拼频贫品聘拚姘嫔榀牝颦",
  ping: "乒坪苹萍平凭瓶评屏俜娉枰鲆",
  po: "坡泼颇婆破魄迫粕叵鄱溥珀钋钷皤笸",
  pou: "剖裒踣",
  pu: "扑铺仆莆葡菩蒲埔朴圃普浦谱曝瀑匍噗濮璞氆镤镨蹼",
  qi: "期欺栖戚妻七凄漆柒沏其棋奇歧畦崎脐齐旗祈祁骑起岂乞企启契砌器气迄弃汽泣讫亟亓圻芑萋葺嘁屺岐汔淇骐绮琪琦杞桤槭欹祺憩碛蛴蜞綦綮趿蹊鳍麒",
  qia: "掐恰洽葜",
  qian: "牵扦钎铅千迁签仟谦乾黔钱钳前潜遣浅谴堑嵌欠歉佥阡芊芡荨掮岍悭慊骞搴褰缱椠肷愆钤虔箝",
  qiang: "枪呛腔羌墙蔷强抢嫱樯戗炝锖锵镪襁蜣羟跫跄",
  qiao: "橇锹敲悄桥瞧乔侨巧鞘撬翘峭俏窍劁诮谯荞愀憔缲樵毳硗跷鞒",
  qie: "切茄且怯窃郄唼惬妾挈锲箧",
  qin: "钦侵亲秦琴勤芹擒禽寝沁芩蓁蕲揿吣嗪噙溱檎螓衾",
  qing: "青轻氢倾卿清擎晴氰情顷请庆倩苘圊檠磬蜻罄箐謦鲭黥",
  qiong: "琼穷邛茕穹筇銎",
  qiu: "秋丘邱球求囚酋泅俅氽巯艽犰湫逑遒楸赇鸠虬蚯蝤裘糗鳅鼽",
  qu: "趋区蛆曲躯屈驱渠取娶龋趣去诎劬蕖蘧岖衢阒璩觑氍祛磲癯蛐蠼麴瞿黢",
  quan: "圈颧权醛泉全痊拳犬券劝诠荃獾悛绻辁畎铨蜷筌鬈",
  que: "缺炔瘸却鹊榷确雀阙悫",
  qun: "裙群逡",
  ran: "然燃冉染苒髯",
  rang: "瓤壤攘嚷让禳穰",
  rao: "饶扰绕荛娆桡",
  ruo: "惹若弱",
  re: "热偌",
  ren: "壬仁人忍韧任认刃妊纫仞荏葚饪轫稔衽",
  reng: "扔仍",
  ri: "日",
  rong: "戎茸蓉荣融熔溶容绒冗嵘狨缛榕蝾",
  rou: "揉柔肉糅蹂鞣",
  ru: "茹蠕儒孺如辱乳汝入褥蓐薷嚅洳溽濡铷襦颥",
  ruan: "软阮朊",
  rui: "蕊瑞锐芮蕤睿蚋",
  run: "闰润",
  sa: "撒洒萨卅仨挲飒",
  sai: "腮鳃塞赛噻",
  san: "三叁伞散彡馓氵毵糁霰",
  sang: "桑嗓丧搡磉颡",
  sao: "搔骚扫嫂埽臊瘙鳋",
  se: "瑟色涩啬铩铯穑",
  sen: "森",
  seng: "僧",
  sha: "莎砂杀刹沙纱傻啥煞脎歃痧裟霎鲨",
  shai: "筛晒酾",
  shan: "珊苫杉山删煽衫闪陕擅赡膳善汕扇缮剡讪鄯埏芟潸姗骟膻钐疝蟮舢跚鳝",
  shang: "墒伤商赏晌上尚裳垧绱殇熵觞",
  shao: "梢捎稍烧芍勺韶少哨邵绍劭苕潲蛸笤筲艄",
  she: "奢赊蛇舌舍赦摄射慑涉社设厍佘猞畲麝",
  shen: "砷申呻伸身深娠绅神沈审婶甚肾慎渗诜谂吲哂渖椹矧蜃",
  sheng: "声生甥牲升绳省盛剩胜圣丞渑媵眚笙",
  shi: "师失狮施湿诗尸虱十石拾时什食蚀实识史矢使屎驶始式示士世柿事拭誓逝势是嗜噬适仕侍释饰氏市恃室视试谥埘莳蓍弑唑饣轼耆贳炻礻铈铊螫舐筮豕鲥鲺",
  shou: "收手首守寿授售受瘦兽扌狩绶艏",
  shu: "蔬枢梳殊抒输叔舒淑疏书赎孰熟薯暑曙署蜀黍鼠属术述树束戍竖墅庶数漱恕倏塾菽忄沭涑澍姝纾毹腧殳镯秫鹬",
  shua: "刷耍唰涮",
  shuai: "摔衰甩帅蟀",
  shuan: "栓拴闩",
  shuang: "霜双爽孀",
  shui: "谁水睡税",
  shun: "吮瞬顺舜恂",
  shuo: "说硕朔烁蒴搠嗍濯妁槊铄",
  si: "斯撕嘶思私司丝死肆寺嗣四伺似饲巳厮俟兕菥咝汜泗澌姒驷缌祀祠锶鸶耜蛳笥",
  song: "松耸怂颂送宋讼诵凇菘崧嵩忪悚淞竦",
  sou: "搜艘擞嗽叟嗖嗾馊溲飕瞍锼螋",
  su: "苏酥俗素速粟僳塑溯宿诉肃夙谡蔌嗉愫簌觫稣",
  suan: "酸蒜算",
  sui: "虽隋随绥髓碎岁穗遂隧祟蓑冫谇濉邃燧眭睢",
  sun: "孙损笋荪狲飧榫跣隼",
  suo: "梭唆缩琐索锁所唢嗦娑桫睃羧",
  ta: "塌他它她塔獭挞蹋踏闼溻遢榻沓",
  tai: "胎苔抬台泰酞太态汰邰薹肽炱钛跆鲐",
  tan: "坍摊贪瘫滩坛檀痰潭谭谈坦毯袒碳探叹炭郯蕈昙钽锬覃",
  tang: "汤塘搪堂棠膛唐糖傥饧溏瑭铴镗耥螗螳羰醣",
  thang: "倘躺淌",
  theng: "趟烫",
  tao: "掏涛滔绦萄桃逃淘陶讨套挑鼗啕韬饕",
  te: "特",
  teng: "藤腾疼誊滕",
  ti: "梯剔踢锑提题蹄啼体替嚏惕涕剃屉荑悌逖绨缇鹈裼醍",
  tian: "天添填田甜恬舔腆掭忝阗殄畋钿蚺",
  tiao: "条迢眺跳佻祧铫窕龆鲦",
  tie: "贴铁帖萜餮",
  ting: "厅听烃汀廷停亭庭挺艇莛葶婷梃蜓霆",
  tong: "通桐酮瞳同铜彤童桶捅筒统痛佟僮仝茼嗵恸潼砼",
  tou: "偷投头透亠",
  tu: "凸秃突图徒途涂屠土吐兔堍荼菟钍酴",
  tuan: "湍团疃",
  tui: "推颓腿蜕褪退忒煺",
  tun: "吞屯臀饨暾豚窀",
  tuo: "拖托脱鸵陀驮驼椭妥拓唾乇佗坨庹沱柝砣箨舄跎鼍",
  wa: "挖哇蛙洼娃瓦袜佤娲腽",
  wai: "歪外",
  wan: "豌弯湾玩顽丸烷完碗挽晚皖惋宛婉万腕剜芄苋菀纨绾琬脘畹蜿箢",
  wang: "汪王亡枉网往旺望忘妄罔尢惘辋魍",
  wei: "威巍微危韦违桅围唯惟为潍维苇萎委伟伪尾纬未蔚味畏胃喂魏位渭谓尉慰卫倭偎诿隈葳薇帏帷崴嵬猥猬闱沩洧涠逶娓玮韪軎炜煨熨痿艉鲔",
  wen: "瘟温蚊文闻纹吻稳紊问刎愠阌汶璺韫殁雯",
  weng: "嗡翁瓮蓊蕹",
  wo: "挝蜗涡窝我斡卧握沃莴幄渥杌肟龌",
  wu: "巫呜钨乌污诬屋无芜梧吾吴毋武五捂午舞伍侮坞戊雾晤物勿务悟误兀仵阢邬圬芴庑怃忤浯寤迕妩骛牾焐鹉鹜蜈鋈鼯",
  xi: "昔熙析西硒矽晰嘻吸锡牺稀息希悉膝夕惜熄烯溪汐犀檄袭席习媳喜铣洗系隙戏细僖兮隰郗茜葸蓰奚唏徙饩阋浠淅屣嬉玺樨曦觋欷熹禊禧钸皙穸蜥蟋舾羲粞翕醯鼷",
  xia: "瞎虾匣霞辖暇峡侠狭下厦夏吓掀葭嗄狎遐瑕硖瘕罅黠",
  xian: "锨先仙鲜纤咸贤衔舷闲涎弦嫌显险现献县腺馅羡宪陷限线冼藓岘猃暹娴氙祆鹇痫蚬筅籼酰跹",
  xiang: "相厢镶香箱襄湘乡翔祥详想响享项巷橡像向象芗葙饷庠骧缃蟓鲞飨",
  xiao: "萧硝霄削哮嚣销消宵淆晓小孝校肖啸笑效哓咻崤潇逍骁绡枭枵筱箫魈",
  xie: "楔些歇蝎鞋协挟携邪斜胁谐写械卸蟹懈泄泻谢屑偕亵勰燮薤撷廨瀣邂绁缬榭榍歙躞",
  xin: "薪芯锌欣辛新忻心信衅囟馨莘歆铽鑫",
  xing: "星腥猩惺兴刑型形邢行醒幸杏性姓陉荇荥擤悻硎",
  xiong: "兄凶胸匈汹雄熊芎",
  xiu: "休修羞朽嗅锈秀袖绣莠岫馐庥鸺貅髹",
  xu: "墟戌需虚嘘须徐许蓄酗叙旭序畜恤絮婿绪续讴诩圩蓿怵洫溆顼栩煦砉盱胥糈醑",
  xuan: "轩喧宣悬旋玄选癣眩绚儇谖萱揎馔泫洵渲漩璇楦暄炫煊碹铉镟痃",
  xue: "靴薛学穴雪血噱泶鳕",
  xun: "勋熏循旬询寻驯巡殉汛训讯逊迅巽埙荀薰峋徇浔曛窨醺鲟",
  ya: "压押鸦鸭呀丫芽牙蚜崖衙涯雅哑亚讶伢揠吖岈迓娅琊桠氩砑睚痖",
  yan: "焉咽阉烟淹盐严研蜒岩延言颜阎炎沿奄掩眼衍演艳堰燕厌砚雁唁彦焰宴谚验厣靥赝俨偃兖讠谳郾鄢芫菸崦恹闫阏洇湮滟妍嫣琰晏胭腌焱罨筵酽魇餍鼹",
  yang: "殃央鸯秧杨扬佯疡羊洋阳氧仰痒养样漾徉怏泱炀烊恙蛘鞅",
  yao: "邀腰妖瑶摇尧遥窑谣姚咬舀药要耀夭爻吆崾徭瀹幺珧杳曜肴鹞窈繇鳐",
  ye: "椰噎耶爷野冶也页掖业叶曳腋夜液谒邺揶馀晔烨铘",
  yi: "一壹医揖铱依伊衣颐夷遗移仪胰疑沂宜姨彝椅蚁倚已乙矣以艺抑易邑屹亿役臆逸肄疫亦裔意毅忆义益溢诣议谊译异翼翌绎刈劓佾诒圪圯埸懿苡薏弈奕挹弋呓咦咿噫峄嶷猗饴怿怡悒漪迤驿缢殪贻旖熠钇镒镱痍瘗癔翊衤蜴舣羿翳酏黟",
  yin: "茵荫因殷音阴姻吟银淫寅饮尹引隐印胤鄞堙茚喑狺夤氤铟瘾蚓霪龈",
  ying: "英樱婴鹰应缨莹萤营荧蝇迎赢盈影颖硬映嬴郢茔莺萦撄嘤膺滢潆瀛瑛璎楹鹦瘿颍罂",
  yo: "哟唷",
  yong: "拥佣臃痈庸雍踊蛹咏泳涌永恿勇用俑壅墉慵邕镛甬鳙饔",
  you: "幽优悠忧尤由邮铀犹油游酉有友右佑釉诱又幼卣攸侑莸呦囿宥柚猷牖铕疣蝣鱿黝鼬",
  yu: "迂淤于盂榆虞愚舆余俞逾鱼愉渝渔隅予娱雨与屿禹宇语羽玉域芋郁吁遇喻峪御愈欲狱育誉浴寓裕预豫驭禺毓伛俣谀谕萸蓣揄喁圄圉嵛狳饫庾阈妪妤纡瑜昱觎腴欤於煜燠聿钰鹆瘐瘀窳蝓竽舁雩龉",
  yuan: "鸳渊冤元垣袁原援辕园员圆猿源缘远苑愿怨院塬沅媛瑗橼爰眢鸢螈鼋",
  yue: "曰约越跃钥岳粤月悦阅龠樾刖钺",
  yun: "耘云郧匀陨允运蕴酝晕韵孕郓芸狁恽纭殒昀氲",
  za: "匝砸杂拶咂",
  zai: "栽哉灾宰载再在咱崽甾",
  zan: "攒暂赞瓒昝簪糌趱錾",
  zang: "赃脏葬奘戕臧",
  zao: "遭糟凿藻枣早澡蚤躁噪造皂灶燥唣缫",
  ze: "责择则泽仄赜啧迮昃笮箦舴",
  zei: "贼",
  zen: "怎谮",
  zeng: "增憎曾赠缯甑罾锃",
  zha: "扎喳渣札轧铡闸眨栅榨咋乍炸诈揸吒咤哳怍砟痄蚱齄",
  zhai: "摘斋宅窄债寨砦",
  zhan: "瞻毡詹粘沾盏斩辗崭展蘸栈占战站湛绽谵搌旃",
  zhang: "樟章彰漳张掌涨杖丈帐账仗胀瘴障仉鄣幛嶂獐嫜璋蟑",
  zhao: "招昭找沼赵照罩兆肇召爪诏棹钊笊",
  zhe: "遮折哲蛰辙者锗蔗这浙谪陬柘辄磔鹧褚蜇赭",
  zhen: "珍斟真甄砧臻贞针侦枕疹诊震振镇阵缜桢榛轸赈胗朕祯畛鸩",
  zheng: "蒸挣睁征狰争怔整拯正政帧症郑证诤峥钲铮筝",
  zhi: "芝枝支吱蜘知肢脂汁之织职直植殖执值侄址指止趾只旨纸志挚掷至致置帜峙制智秩稚质炙痔滞治窒卮陟郅埴芷摭帙忮彘咫骘栉枳栀桎轵轾攴贽膣祉祗黹雉鸷痣蛭絷酯跖踬踯豸觯",
  zhong: "中盅忠钟衷终种肿重仲众冢锺螽舂舯踵",
  zhou: "舟周州洲诌粥轴肘帚咒皱宙昼骤啄着倜诹荮鬻纣胄碡籀舳酎鲷",
  zhu: "珠株蛛朱猪诸诛逐竹烛煮拄瞩嘱主著柱助蛀贮铸筑住注祝驻伫侏邾苎茱洙渚潴驺杼槠橥炷铢疰瘃蚰竺箸翥躅麈",
  zhua: "抓",
  zhuai: "拽",
  zhuan: "专砖转撰赚篆抟啭颛",
  zhuang: "桩庄装妆撞壮状丬",
  zhui: "椎锥追赘坠缀萑骓缒",
  zhun: "谆准",
  zhuo: "捉拙卓桌琢茁酌灼浊倬诼廴蕞擢啜浞涿杓焯禚斫",
  zi: "兹咨资姿滋淄孜紫仔籽滓子自渍字谘嵫姊孳缁梓辎赀恣眦锱秭耔笫粢觜訾鲻髭",
  zong: "鬃棕踪宗综总纵腙粽",
  zou: "邹走奏揍鄹鲰",
  zu: "租足卒族祖诅阻组俎菹啐徂驵蹴",
  zuan: "钻纂攥缵",
  zui: "嘴醉最罪",
  zun: "尊遵撙樽鳟",
  zuo: "昨左佐柞做作坐座阝阼胙祚酢",
  cou: "薮楱辏腠",
  nang: "攮哝囔馕曩",
  o: "喔",
  dia: "嗲",
  chuai: "嘬膪踹",
  cen: "岑涔",
  diu: "铥",
  nou: "耨",
  fou: "缶",
  bia: "髟"
};
var pinyin_default = function() {
  return {
    firstChar(str) {
      let firstStr = "";
      for (let i = 0; i < str.length; i++) {
        let code = str.charCodeAt(i);
        if (code >= 19968 && code <= 40869) {
          for (let item in pinYin) {
            if (pinYin.hasOwnProperty(item)) {
              if (pinYin[item].indexOf(str[i]) > -1) {
                firstStr += item.substring(0, 1);
                break;
              }
            }
          }
        }
      }
      return firstStr;
    },
    fullChar(str) {
      let fullStr = "";
      for (let i = 0; i < str.length; i++) {
        let code = str.charCodeAt(i);
        if (code >= 19968 && code <= 40869) {
          for (let item in pinYin) {
            if (pinYin.hasOwnProperty(item)) {
              if (pinYin[item].indexOf(str[i]) > -1) {
                fullStr += item;
                break;
              }
            }
          }
        }
      }
      return fullStr;
    }
  };
}();

// src/Component/RowCeneter/index.tsx
var RowCenter = ({children, ...props}) => {
  return /* @__PURE__ */ h("wstack", {
    ...props
  }, /* @__PURE__ */ h("wspacer", null), children, /* @__PURE__ */ h("wspacer", null));
};
var RowCeneter_default = RowCenter;

// src/pages/TodayOilPrice.tsx
var title = new Font("AppleSDGothicNeo-Bold", 16);
var Widget = class extends Base_default {
  constructor() {
    super(...arguments);
    this.name = "地方油价";
    this.en = "todayOilPrice";
    this.headerColor = "#40a9ff";
    this.bodyColor = "#69c0ff";
    this.componentWillMount = async () => {
      this.registerAction("代理缓存", this.setMenuTencentToken);
      this.registerAction("腾讯Token", this.setMenuTokenInput);
      this.baseActions = [
        {
          title: "颜色主题",
          onClick: async () => {
            const inputValue = {headerColor: "顶部油价背景", bodyColor: "加油站背景"};
            return this.showAlertCatchInput("颜色主题", "hex 颜色", inputValue, "oilBackground");
          }
        },
        ...this.baseActions.splice(-1, 1)
      ];
      const {getSetting} = useSetting(this.en);
      const cache = await getSetting(this.BOX_CATCH_KEY) || {};
      this.token = cache?.token;
      const {headerColor, bodyColor} = await getSetting("oilBackground") || {};
      this.headerColor = headerColor || this.headerColor;
      this.bodyColor = bodyColor || this.bodyColor;
      this.fontColor = "#fff";
    };
    this.setMenuTokenInput = () => {
      return this.showAlertCatchInput("腾讯Token", "BoxJS 缓存", {token: "腾讯地图 Token"});
    };
    this.setMenuTencentToken = () => {
      return this.setCacheBoxJSData({token: "@caiyun.token.tencent"});
    };
    this.getLocation = async () => {
      try {
        const location = await Location.current();
        const locationText = await Location.reverseGeocode(location.latitude, location.longitude);
        console.log(locationText);
        const {locality = "", administrativeArea = "四川"} = locationText[0] || {};
        this.location = locationText[0] || {};
        return [administrativeArea, locality];
      } catch (e) {
        console.log("❌错误信息：" + e);
        return [];
      }
    };
    this.searchGasStation = async () => {
      const {latitude = 39.908491, longitude = 116.374328} = this.location?.location || {};
      const params = {
        boundary: `nearby(${latitude},${longitude},5000)`,
        page_size: 20,
        page_index: 1,
        keyword: "加油站",
        orderby: "_distance",
        key: this.token
      };
      const data = Object.keys(params).map((key) => `${key}=${params[key]}`);
      const url = "https://apis.map.qq.com/ws/place/v1/search?" + encodeURIComponent(data.join("&"));
      console.log(url);
      const res = (await request({url, dataType: "json"})).data?.data;
      const size = config.widgetFamily === "large" ? 4 : 1;
      return res?.splice(0, size);
    };
    this.renderWebView = async (str) => {
      const webView = new WebView();
      let _area = [pinyin_default.fullChar(str[0].replace("省", "")), pinyin_default.fullChar(str[1])];
      if (!_area[0]) {
        _area = _area[1].replace("shi", "/");
      } else {
        _area = _area.join("/") + ".html";
      }
      const url = `http://youjia.chemcp.com/${_area}`;
      await webView.loadURL(url);
      const javascript = `
    const data = [];
    const oil = document.querySelectorAll('table')[4].querySelectorAll('tr');
    for (let i = 0;i<oil.length;i++ ){
       const dateItem = {};
       let value = oil[i].innerText;
       value = value.split('	');
       dateItem.cate = value[0];
       dateItem.value = value[1];
       data.push(dateItem);
    }
    completion(data);
    `;
      return await webView.evaluateJavaScript(javascript, true).then(async (e) => {
        return typeof e === "string" ? JSON.parse(e) : e;
      }).catch(() => {
        return {};
      });
    };
    this.content = (data) => {
      return /* @__PURE__ */ h("wstack", {
        flexDirection: "column",
        verticalAlign: "center"
      }, /* @__PURE__ */ h(RowCeneter_default, null, /* @__PURE__ */ h("wtext", {
        textAlign: "center",
        textColor: this.fontColor,
        font: title
      }, data.cate.replace("汽油", ""))), /* @__PURE__ */ h("wspacer", {
        length: 10
      }), /* @__PURE__ */ h(RowCeneter_default, null, /* @__PURE__ */ h("wtext", {
        textColor: this.fontColor,
        font: 12,
        textAlign: "center"
      }, data.value.replace("/升", ""))));
    };
    this.stackCellText = (data) => {
      return /* @__PURE__ */ h("wstack", {
        verticalAlign: "center"
      }, /* @__PURE__ */ h("wspacer", {
        length: 5
      }), /* @__PURE__ */ h("wimage", {
        src: data.icon,
        width: 10,
        height: 10,
        filter: this.fontColor
      }), /* @__PURE__ */ h("wspacer", {
        length: 5
      }), /* @__PURE__ */ h("wtext", {
        href: data.href,
        font: 10,
        textColor: this.fontColor,
        maxLine: 1
      }, data.label, "：", data.value || "-"), /* @__PURE__ */ h("wspacer", null));
    };
    this.stackGasStation = (gasStation) => {
      return gasStation.map((item, index) => {
        const href = `iosamap://navi?sourceApplication=applicationName&backScheme=applicationScheme&poiname=fangheng&poiid=BGVIS&lat=${item.location.lat}&lon=${item.location.lng}&dev=1&style=2`;
        return /* @__PURE__ */ h("wstack", {
          flexDirection: "column",
          borderRadius: 4,
          href
        }, this.stackCellText({value: `${item.title}(${item._distance}米)`, label: "油站", href, icon: "car"}), /* @__PURE__ */ h("wspacer", {
          length: 2
        }), this.stackCellText({value: item.address, label: "地址", href, icon: "mappin.and.ellipse"}), /* @__PURE__ */ h("wspacer", {
          length: 2
        }), this.stackCellText({value: item.tel, label: "电话", href: "tel:" + item.tel, icon: "iphone"}), gasStation.length - 1 !== index && /* @__PURE__ */ h("wspacer", null));
      });
    };
    this.render = async () => {
      let gasStation = [];
      if (config.widgetFamily === "small")
        return RenderError("暂不支持");
      const locality = await this.getLocation();
      const data = await this.renderWebView(locality);
      if (this.token)
        gasStation = await this.searchGasStation() || [];
      return /* @__PURE__ */ h("wbox", {
        padding: [0, 0, 0, 0],
        updateDate: new Date(Date.now() + await this.updateInterval())
      }, /* @__PURE__ */ h("wstack", {
        background: this.headerColor,
        padding: [10, 10, 10, 10]
      }, data.map((item) => {
        const city = locality[1].replace("市", "");
        const cate = item.cate.replace(city, "").replace("#", "号").replace("价格", "");
        return this.content({...item, cate});
      })), gasStation.length > 0 && /* @__PURE__ */ h("wstack", {
        background: this.bodyColor,
        flexDirection: "column",
        padding: [10, 10, 10, 10]
      }, this.stackGasStation(gasStation)), /* @__PURE__ */ h("wspacer", null), /* @__PURE__ */ h("wstack", {
        verticalAlign: "center",
        padding: [0, 10, 10, 10]
      }, /* @__PURE__ */ h("wimage", {
        src: "https://www.bitauto.com/favicon.ico",
        width: 15,
        height: 15
      }), /* @__PURE__ */ h("wspacer", {
        length: 10
      }), /* @__PURE__ */ h("wtext", {
        opacity: 0.5,
        font: 14
      }, "今日油价"), /* @__PURE__ */ h("wspacer", null), /* @__PURE__ */ h("wimage", {
        src: "arrow.clockwise",
        width: 10,
        height: 10,
        opacity: 0.5
      }), /* @__PURE__ */ h("wspacer", {
        length: 10
      }), /* @__PURE__ */ h("wtext", {
        font: 12,
        textAlign: "right",
        opacity: 0.5
      }, this.nowTime())));
    };
  }
  nowTime() {
    const date = new Date();
    return date.toLocaleTimeString("chinese", {hour12: false});
  }
};


EndAwait(() => new Widget().init());

await __topLevelAwait__();

