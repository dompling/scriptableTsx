// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: bug;

/**
 * 作者: 2Ya
 * 版本: 1.0.0
 * 更新时间：12/17/2020
 * github: https://github.com/dompling/Scriptable
 */

// @编译时间 1608167731188
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
  return {getSetting, setSetting};
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
async function showPreviewOptions(render) {
  const selectIndex = await showActionSheet({
    title: "预览组件",
    desc: "测试桌面组件在各种尺寸下的显示效果",
    itemList: ["小尺寸", "中尺寸", "大尺寸", "全部尺寸"]
  });
  switch (selectIndex) {
    case 0:
      config.widgetFamily = "small";
      await (await render()).presentSmall();
      break;
    case 1:
      config.widgetFamily = "medium";
      await (await render()).presentMedium();
      break;
    case 2:
      config.widgetFamily = "large";
      await (await render()).presentLarge();
      break;
    case 3:
      config.widgetFamily = "small";
      await (await render()).presentSmall();
      config.widgetFamily = "medium";
      await (await render()).presentMedium();
      config.widgetFamily = "large";
      await (await render()).presentLarge();
      break;
  }
  return selectIndex;
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
  const imgCrop = cropImage(img, new Rect(crop.x, crop.y, crop.w, crop.h));
  return imgCrop;
}

// src/lib/jsx-runtime.ts
var GenrateView = class {
  static setListWidget(listWidget2) {
    this.listWidget = listWidget2;
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
var listWidget = new ListWidget();
GenrateView.setListWidget(listWidget);
function h(type, props, ...children) {
  props = props || {};
  const _children = flatteningArr(children);
  switch (type) {
    case "wbox":
      return GenrateView.wbox(props, ..._children);
      break;
    case "wdate":
      return GenrateView.wdate(props);
      break;
    case "wimage":
      return GenrateView.wimage(props);
      break;
    case "wspacer":
      return GenrateView.wspacer(props);
      break;
    case "wstack":
      return GenrateView.wstack(props, ..._children);
      break;
    case "wtext":
      return GenrateView.wtext(props, ..._children);
      break;
    default:
      return type instanceof Function ? type({children: _children, ...props}) : null;
      break;
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
      const {getSetting} = useSetting(this.en);
      const fontColorLight = await getSetting("fontColorLight") || this.fontColor;
      const fontColorDark = await getSetting("fontColorDark") || this.fontColor;
      this.fontColor = Device.isUsingDarkAppearance() ? fontColorDark : fontColorLight;
      const backgroundColorLight = await getSetting("backgroundColorLight") || this.backgroundColor;
      const backgroundColorDark = await getSetting("backgroundColorDark") || this.backgroundColor;
      this.backgroundColor = Device.isUsingDarkAppearance() ? backgroundColorDark : backgroundColorLight;
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
    this.backgroundKey = `${this.name}_background`;
    this.render = async () => false;
    this.componentWillMount = async () => {
    };
    this.componentDidMount = async () => {
    };
    this.backgroundColor = Device.isUsingDarkAppearance() ? "#000" : "#fff";
    this.fontColor = Device.isUsingDarkAppearance() ? "#fff" : "#000";
    this.opacity = Device.isUsingDarkAppearance() ? "0.7" : "0.4";
    this.updateInterval = async () => {
      const {getSetting} = useSetting(this.en);
      const updateInterval = await getSetting("updateInterval") || "30";
      return parseInt(updateInterval) * 1e3 * 60;
    };
    this.baseActions = [
      {
        title: "字体颜色",
        func: async () => {
          await this.setLightAndDark("字体颜色", "Hex 颜色", "fontColor");
        }
      },
      {
        title: "背景设置",
        func: async () => {
          const actions = [
            {
              title: "白天图",
              func: async () => {
                const image = await Photos.fromLibrary();
                if (!await this.verifyImage(image))
                  return;
                await this.setImage(image, `${this.backgroundKey}_light`);
              }
            },
            {
              title: "夜间图",
              func: async () => {
                const image = await Photos.fromLibrary();
                if (!await this.verifyImage(image))
                  return;
                await this.setImage(image, `${this.backgroundKey}_night`);
              }
            },
            {
              title: "透明度",
              func: async () => {
                return this.setLightAndDark("透明度", false, "opacity");
              }
            },
            {
              title: "背景色",
              func: async () => {
                return this.setLightAndDark("背景色", false, "backgroundColor");
              }
            }
          ];
          await this.showActionSheet("背景设置", actions);
        }
      },
      {
        title: "透明背景",
        func: async () => {
          const image = await setTransparentBackground();
          image && await this.setImage(image, this.backgroundKey);
        }
      },
      {
        title: "清空背景",
        func: async () => {
          await this.setImage(null, `${this.backgroundKey}_light`);
          await this.setImage(null, `${this.backgroundKey}_night`);
        }
      },
      ...this.useBoxJS ? [
        {
          title: "BoxJS",
          func: async () => {
            const {getStorage: getStorage2, setStorage: setStorage2} = useStorage("boxjs");
            const boxjs = getStorage2("prefix") || this.prefix;
            const {texts} = await showModal({
              title: "BoxJS设置",
              inputItems: [{placeholder: "BoxJS域名", text: boxjs}]
            });
            await setStorage2("prefix", texts[0]);
          }
        }
      ] : []
    ];
    this.actions = [
      {
        title: "预览组件",
        func: async () => {
          const render = async () => {
            await this.componentDidMount();
            return this.render();
          };
          await showPreviewOptions(render);
        }
      },
      {
        title: "刷新时间",
        func: async () => {
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
      },
      {
        title: "基础设置",
        func: async () => {
          await this.showActionSheet("基础设置", this.baseActions);
        }
      }
    ];
    this.setLightAndDark = async (title, desc, key) => {
      try {
        const {getSetting, setSetting} = useSetting(this.en);
        const light = `${key}Light`, dark = `${key}Dark`;
        const lightText = await getSetting(light) || "";
        const darkText = await getSetting(dark) || "";
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
      const path = FILE_MGR_LOCAL.joinPath(FILE_MGR_LOCAL.documentsDirectory(), "bg_" + key + ".jpg");
      if (!img) {
        if (FILE_MGR_LOCAL.fileExists(path))
          FILE_MGR_LOCAL.remove(path);
      } else {
        FILE_MGR_LOCAL.writeImage(path, img);
      }
      if (notify)
        await showNotification({title: this.name, body: "设置生效，稍后刷新", sound: "alert"});
    };
    this.getBackgroundImage = async () => {
      let result = void 0;
      const light = `${this.backgroundKey}_light`;
      const dark = `${this.backgroundKey}_dark`;
      const isNight = Device.isUsingDarkAppearance();
      const path1 = FILE_MGR_LOCAL.joinPath(FILE_MGR_LOCAL.documentsDirectory(), "bg_" + light + ".jpg");
      const path2 = FILE_MGR_LOCAL.joinPath(FILE_MGR_LOCAL.documentsDirectory(), "bg_" + dark + ".jpg");
      const path3 = FILE_MGR_LOCAL.joinPath(FILE_MGR_LOCAL.documentsDirectory(), "bg_" + this.backgroundKey + ".jpg");
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
      if (this.opacity && result)
        return this.shadowImage(result, "#000000", parseFloat(this.opacity));
      return result;
    };
    this.registerAction = (title, func) => {
      this.actions.splice(1, 0, {title, func});
    };
    this.showActionSheet = async (title, actions) => {
      const selectIndex = await showActionSheet({
        title,
        itemList: actions.map((item) => item.title)
      });
      const actionItem = actions.find((_, index) => selectIndex === index);
      actionItem && await actionItem.func();
    };
    this.showMenu = async () => {
      await this.showActionSheet(this.name, this.actions);
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
    this.showAlertCatchInput = async (title, content, opt, useKey) => {
      const {getSetting, setSetting} = useSetting(this.en);
      const catchValue = await getSetting(useKey || this.BOX_CATCH_KEY) || {};
      const settings = catchValue;
      const inputItems = Object.keys(opt).map((key) => {
        return {placeholder: opt[key], text: catchValue[key]};
      });
      const {texts, confirm} = await showModal({title, content, inputItems});
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
    if (!img || !opacity)
      return;
    if (opacity === 0)
      return img;
    const ctx = new DrawContext();
    ctx.size = img.size;
    ctx.drawImageInRect(img, new Rect(0, 0, img.size["width"], img.size["height"]));
    ctx.setFillColor(new Color(color, opacity));
    ctx.fillRect(new Rect(0, 0, img.size["width"], img.size["height"]));
    return ctx.getImage();
  }
};
var Base_default = Base;

// src/pages/COVID-19.tsx
var addumFont = 12;
var RowCenter = ({children, ...props}) => {
  return /* @__PURE__ */ h("wstack", {
    ...props
  }, /* @__PURE__ */ h("wspacer", null), children, /* @__PURE__ */ h("wspacer", null));
};
var Widget = class extends Base_default {
  constructor() {
    super(...arguments);
    this.name = "疫情数据";
    this.en = "covid-19";
    this.today = "";
    this.pinyin = "";
    this.baseUrl = `https://api.inews.qq.com/newsqa/v1/query/pubished/daily/list`;
    this.componentWillMount = async () => {
      this.registerAction("地区拼音", async () => {
        const options = {py: "尝试首字母或者全拼"};
        await this.showAlertCatchInput("地区拼音", "首字母或全部拼音", options, "pinyin");
      });
      const {getSetting} = useSetting(this.en);
      this.pinyin = (await getSetting("pinyin") || {}).py || this.pinyin;
      this.pinyin = this.pinyin.trim();
    };
    this.componentDidMount = async () => {
      const dateFormat = new DateFormatter();
      dateFormat.dateFormat = "MM.dd";
      this.today = dateFormat.string(new Date());
      this.location = await this.getLocation();
      if (!this.location)
        return;
      const {state = ""} = this.location.postalAddress;
      let {city = ""} = this.location.postalAddress;
      let province;
      if (state) {
        province = state.replace("省", "").replace("市", "");
        this.province = await this.getCovid19({province});
      } else {
        province = city.replace("省", "").replace("市", "");
        this.province = await this.getCovid19({province});
      }
      if (state && city) {
        province = state.replace("省", "").replace("市", "");
        city = city.replace("省", "").replace("市", "");
        this.city = await this.getCovid19({province, city});
      }
      await this.getCovid19ProvinceCompare();
      config.widgetFamily === "large" && await this.getCovid19News();
    };
    this.getLocation = async () => {
      try {
        const location = await Location.current();
        const locationText = await Location.reverseGeocode(location.latitude, location.longitude);
        console.log(locationText);
        return locationText[0];
      } catch (e) {
        console.log("❌定位失败：" + e);
      }
    };
    this.getCovid19 = async (params) => {
      const query = Object.keys(params).map((item) => {
        return `${item}=${encodeURIComponent(params[item])}`;
      });
      query.push("today=" + this.today);
      const url = `${this.baseUrl}?${query.join("&")}`;
      console.log(url);
      const response = (await request({method: "POST", url, useCache: true})).data;
      if (response.ret === 0 && response.data && response.data instanceof Array) {
        const covid_19 = response.data[response.data.length - 1];
        if (covid_19)
          return covid_19;
      }
    };
    this.tabInfo = (data) => {
      return /* @__PURE__ */ h("wstack", {
        flexDirection: "column",
        background: data.bg
      }, /* @__PURE__ */ h("wspacer", null), /* @__PURE__ */ h(RowCenter, null, /* @__PURE__ */ h("wtext", {
        font: addumFont,
        textColor: this.fontColor
      }, "较上日"), /* @__PURE__ */ h("wtext", {
        font: addumFont,
        textColor: data.color
      }, data.addnum)), /* @__PURE__ */ h("wspacer", {
        length: 2
      }), /* @__PURE__ */ h(RowCenter, null, /* @__PURE__ */ h("wtext", {
        textColor: data.color
      }, data.value)), /* @__PURE__ */ h("wspacer", {
        length: 2
      }), /* @__PURE__ */ h(RowCenter, null, /* @__PURE__ */ h("wtext", {
        font: addumFont,
        textColor: this.fontColor
      }, data.tabText)), /* @__PURE__ */ h("wspacer", null));
    };
    this.render = async () => {
      const Footer = () => {
        return /* @__PURE__ */ h("wstack", {
          verticalAlign: "center",
          padding: [0, 10, 10, 10]
        }, /* @__PURE__ */ h("wimage", {
          src: "https://img.icons8.com/cute-clipart/2x/coronavirus.png",
          width: 15,
          height: 15
        }), /* @__PURE__ */ h("wspacer", {
          length: 10
        }), /* @__PURE__ */ h("wtext", {
          opacity: 0.5,
          font: 14,
          textColor: this.fontColor
        }, "疫情日报"), /* @__PURE__ */ h("wspacer", null), /* @__PURE__ */ h("wimage", {
          src: "arrow.clockwise",
          width: 10,
          height: 10,
          opacity: 0.5,
          filter: this.fontColor
        }), /* @__PURE__ */ h("wspacer", {
          length: 10
        }), /* @__PURE__ */ h("wtext", {
          font: 12,
          textAlign: "right",
          opacity: 0.5,
          textColor: this.fontColor
        }, this.nowTime()));
      };
      if (config.widgetFamily === "small") {
        return /* @__PURE__ */ h("wbox", null, /* @__PURE__ */ h("wspacer", null), /* @__PURE__ */ h("wtext", {
          textAlign: "center"
        }, "暂不支持"), /* @__PURE__ */ h("wspacer", null));
      }
      return /* @__PURE__ */ h("wbox", {
        background: await this.getBackgroundImage() || this.backgroundColor,
        updateDate: new Date(Date.now() + await this.updateInterval())
      }, /* @__PURE__ */ h("wspacer", null), /* @__PURE__ */ h("wstack", {
        borderRadius: 10
      }, this.tabInfo({
        color: "#f23a3b",
        bg: "#fff0f1",
        value: `${(this.province?.confirm || 0) - parseInt(this.province?.heal || "0") || "-"}`,
        tabText: "现有确诊",
        addnum: this.formatNumber(this.updateData?.nowConfirm)
      }), /* @__PURE__ */ h("wspacer", {
        length: 2
      }), this.tabInfo({
        color: "#cc1e1e",
        bg: "#fff0f1",
        value: `${this.province?.confirm || "-"}`,
        tabText: "累计确诊",
        addnum: this.formatNumber(this.updateData?.confirmAdd)
      }), /* @__PURE__ */ h("wspacer", {
        length: 2
      }), this.tabInfo({
        color: "#178b50",
        bg: "#f0f8f4",
        value: `${this.province?.heal || "-"}`,
        tabText: "累计治愈",
        addnum: this.formatNumber(this.updateData?.heal)
      }), /* @__PURE__ */ h("wspacer", {
        length: 2
      }), this.tabInfo({
        color: "#4e5a65",
        bg: "#f2f6f7",
        value: `${this.province?.dead || "-"}`,
        tabText: "累计死亡",
        addnum: this.formatNumber(this.updateData?.dead)
      })), /* @__PURE__ */ h("wspacer", {
        length: 5
      }), /* @__PURE__ */ h("wstack", {
        borderRadius: 10,
        padding: [5, 5, 5, 5],
        flexDirection: "column",
        background: "#f8f8f8"
      }, /* @__PURE__ */ h("wstack", {
        verticalAlign: "center"
      }, /* @__PURE__ */ h("wimage", {
        src: "location",
        filter: "#005dff",
        width: 12,
        height: 12
      }), /* @__PURE__ */ h("wspacer", {
        length: 5
      }), /* @__PURE__ */ h("wtext", {
        textColor: "#005dff",
        font: addumFont
      }, (this.location?.postalAddress.city || "") + (this.location?.postalAddress.street || "") || "未找到定位"), /* @__PURE__ */ h("wspacer", null)), this.city && /* @__PURE__ */ h(Fragment, null, /* @__PURE__ */ h("wspacer", {
        length: 5
      }), /* @__PURE__ */ h("wstack", {
        verticalAlign: "center"
      }, /* @__PURE__ */ h("wspacer", null), /* @__PURE__ */ h("wtext", {
        font: addumFont,
        textColor: this.fontColor
      }, this.city?.confirm_add || "0", "新增"), /* @__PURE__ */ h("wspacer", null), /* @__PURE__ */ h("wtext", {
        font: addumFont,
        textColor: this.fontColor
      }, this.city?.confirm || "0", "确诊"), /* @__PURE__ */ h("wspacer", null), /* @__PURE__ */ h("wtext", {
        font: addumFont,
        textColor: this.fontColor
      }, this.city?.heal || "0", "治愈"), /* @__PURE__ */ h("wspacer", null), /* @__PURE__ */ h("wtext", {
        font: addumFont,
        textColor: this.fontColor
      }, this.city?.dead || "0", "死亡"), /* @__PURE__ */ h("wspacer", null)))), this.news && /* @__PURE__ */ h(Fragment, null, /* @__PURE__ */ h("wspacer", {
        length: 5
      }), /* @__PURE__ */ h("wstack", {
        borderRadius: 10,
        padding: [5, 5, 5, 5],
        flexDirection: "column"
      }, this.news.map((item, index) => {
        return /* @__PURE__ */ h(Fragment, null, /* @__PURE__ */ h("wstack", {
          href: item.news_url
        }, /* @__PURE__ */ h("wstack", {
          flexDirection: "column"
        }, /* @__PURE__ */ h("wtext", {
          font: addumFont,
          maxLine: 1,
          textColor: this.fontColor
        }, item.title), /* @__PURE__ */ h("wspacer", {
          length: 5
        }), /* @__PURE__ */ h("wtext", {
          font: addumFont,
          textColor: this.fontColor,
          opacity: 0.5
        }, item.srcfrom)), /* @__PURE__ */ h("wspacer", null), /* @__PURE__ */ h("wimage", {
          src: item.shortcut,
          width: 40,
          height: 30,
          borderRadius: 4
        })), (this.news && this.news?.length - 1) !== index && /* @__PURE__ */ h("wspacer", {
          length: 5
        }));
      }))), /* @__PURE__ */ h("wspacer", null), /* @__PURE__ */ h(Footer, null));
    };
  }
  async getCovid19ProvinceCompare() {
    const url = `https://api.inews.qq.com/newsqa/v1/query/inner/publish/modules/list?modules=provinceCompare&today=${this.today}`;
    const response = (await request({method: "POST", url})).data;
    if (response.ret === 0 && response.data) {
      const data = response.data.provinceCompare;
      if (!this.location)
        return;
      let {state = "", city = ""} = this.location.postalAddress;
      state = state.replace("省", "").replace("市", "");
      city = city.replace("省", "").replace("市", "");
      if (data[state])
        this.updateData = data[state] || void 0;
      if (data[city])
        this.updateData = data[state] || void 0;
    }
  }
  async getCovid19News() {
    if (!this.pinyin)
      return;
    const url = `https://api.dreamreader.qq.com/news/v1/province/news/list?province_code=${this.pinyin}&page_size=4&today=${this.today}`;
    console.log(url);
    const response = (await request({url, method: "GET", useCache: true})).data.data.items;
    if (response)
      this.news = response;
  }
  formatNumber(number) {
    if (!number)
      return `+0`;
    return number >= 0 ? `+${number}` : `${number}`;
  }
  nowTime() {
    const date = new Date();
    return date.toLocaleTimeString("chinese", {hour12: false});
  }
};


EndAwait(() => new Widget().init());

await __topLevelAwait__();

