import {FC} from 'react';
import Base, {RenderError} from '@app/Base';
import {request, showNotification, useSetting} from '@app/lib/help';
import RowCenter from '@app/Component/RowCeneter';

const canvasSize = 258;
const smallCircle = 60;

const canvas = new DrawContext();
canvas.opaque = false;
canvas.respectScreenScale = false;
canvas.size = new Size(258, 258);

const drawCircle = (
  x: number,
  y: number,
  color: string,
  textConfig?: {
    color: string;
    text: string;
    value: string;
  },
  line = 4,
  size = smallCircle,
) => {
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

function sinDeg(deg: number) {
  return Math.sin((deg * Math.PI) / 180);
}

function cosDeg(deg: number) {
  return Math.cos((deg * Math.PI) / 180);
}

const drawCenterCircle = (start: number, color: string, degree: number) => {
  canvas.setFillColor(new Color(color, 1));
  for (let i = start; i < degree + start; i++) {
    const x = canvasSize + 80 * sinDeg(i) - canvasSize / 2;
    const y = canvasSize - 80 * cosDeg(i) - canvasSize / 2;
    if (i === start) {
      drawCircle(x, y, color, undefined, 12, 6);
      i += 4;
    } else if (i < degree + start - 2) {
      const rect = new Rect(x, y, 8, 8);
      canvas.fillEllipse(rect);
    }
  }
};

const drawCenterText = async (
  color: string,
  textConfig: {
    color: string;
    value: string;
  },
) => {
  const circleSize = 140;
  const circleRect = new Rect(
    canvasSize / 2 - circleSize + 74,
    canvasSize / 2 - circleSize + 74,
    circleSize,
    circleSize,
  );
  canvas.setFillColor(new Color(color, 1));
  canvas.fillEllipse(circleRect);

  const img = (
    await request<Image>({
      url: 'https://gitee.com/scriptableJS/Scriptable/raw/master/JDDou/jddnew.png',
      method: 'GET',
      dataType: 'image',
    })
  ).data as Image;
  const point = canvasSize / 2;
  const imgSize = 52;
  canvas.drawImageInRect(img, new Rect(point - imgSize / 2, point - imgSize, imgSize, imgSize));
  const size = 100;
  canvas.setFont(Font.title2());
  canvas.setTextColor(new Color(textConfig.color, 1));
  // const rect = new Rect(point - size / 2 + 5, point, size, size / 2);
  // canvas.setTextAlignedCenter();
  // canvas.drawTextInRect(textConfig.text, rect);

  const rect2 = new Rect(point - size / 2 + 5, point + 4, size, size / 2);
  canvas.setFont(Font.title1());
  canvas.drawTextInRect(`${textConfig.value}`, rect2);
};

const Label: FC<{
  label: string;
  value: string;
  color: string;
  labelColor: string;
}> = ({label, value, color, labelColor}) => {
  return (
    <RowCenter verticalAlign={'center'}>
      <wimage filter={labelColor} src={label} width={15} height={15} borderRadius={4} />
      <wspacer length={5} />
      <wtext font={12} textColor={color}>
        {value}
      </wtext>
    </RowCenter>
  );
};

const Avatar: FC<{url: string}> = ({url}) => {
  return (
    <wimage
      src={
        url ||
        'https://img11.360buyimg.com/jdphoto/s120x120_jfs/t21160/90/706848746/2813/d1060df5/5b163ef9N4a3d7aa6.png'
      }
      width={60}
      height={60}
      borderRadius={30}
      borderWidth={1}
      borderColor={'#f4f4f4'}
    />
  );
};

const transforJSON = (str: string) => {
  if (typeof str === 'string') {
    try {
      return JSON.parse(str);
    } catch (e) {
      console.log(e);
      return [];
    }
  }
  console.log('It is not a string!');
};

const {getSetting, setSetting} = useSetting('JDDou');

class Widget extends Base {
  name = '京东豆';
  en = 'JDDou';
  cookie: any = {};
  CookiesData: any[] = [];
  userInfo: any = {base: {}};
  timerKeys: string[] = [];
  incomeBean = 0;
  expenseBean = 0;
  jintie = 0;
  gangben = 0;

  componentWillMount = async () => {
    this.registerAction('代理缓存', this.actionSettings);
    this.registerAction('账号设置', async () => {
      const index = await this.generateAlert('设置账号信息', ['网站登录', '手动输入']);
      if (index === 0) {
        await this.jdWebView();
      } else {
        await this.showAlertCatchInput('账号设置', '京东账号 Ck', {userName: '昵称', cookie: 'Cookie'}, 'JDCK');
      }
    });
    this.registerAction('圆形背景', async () => {
      return this.showAlertCatchInput('圆形背景', '中心圆背景', {light: '白天', dark: '夜间'}, 'centerCircle');
    });
  };

  componentDidMount = async () => {
    const ckIndex = args.widgetParameter;
    const cookies = await getSetting<any[]>('Cookies');
    this.cookie = await getSetting('JDCK');
    if (cookies && cookies[ckIndex]) this.cookie = cookies[ckIndex];
    this.userInfo = await this.fetchUserInfo();
    this.timerKeys = this.getDay(1);
    await this.getAmountData();
    await this.fetchBaseInfo();
    await this.drawImg();
  };

  jdWebView = async () => {
    const webView = new WebView();
    const url = 'https://mcr.jd.com/credit_home/pages/index.html?btPageType=BT&channelName=024';
    await webView.loadURL(url);
    await webView.present(false);
    const req = new Request('https://ms.jr.jd.com/gw/generic/bt/h5/m/firstScreenNew');
    req.method = 'POST';
    req.body = 'reqData={"clientType":"ios","clientVersion":"13.2.3","deviceId":"","environment":"3"}';
    await req.loadJSON();
    const cookies = req.response.cookies;
    const account = {userName: '', cookie: ''};
    const cookie: string[] = [];
    cookies.forEach((item: any) => {
      const value = `${item.name}=${item.value}`;
      if (item.name === 'pt_key') cookie.push(value);
      if (item.name === 'pt_pin') {
        account.userName = item.value;
        cookie.push(value);
      }
    });
    account.cookie = cookie.join('; ');
    if (account.cookie) {
      await setSetting('JDCK', account, false);
      await showNotification({title: this.name, body: 'cookie获取成功，请关闭窗口！'});
      console.log(`${this.name}: cookie获取成功，请关闭窗口！`);
    }
  };

  actionSettings = async () => {
    try {
      const table = new UITable();
      await this._loadJDCk();
      if (!this.CookiesData.length) throw new Error('BoxJS 数据读取失败');
      // 如果是节点，则先远程获取
      this.CookiesData.map((t, index) => {
        const r = new UITableRow();
        r.addText(`parameter：${index}    ${t.userName}`);
        r.onSelect = () => setSetting('JDCK', t, true);
        table.addRow(r);
      });
      await setSetting('Cookies', this.CookiesData);
      await table.present(false);
    } catch (e) {
      await showNotification({
        title: this.name,
        body: 'BoxJS 数据读取失败，请点击通知查看教程',
        openURL: 'https://chavyleung.gitbook.io/boxjs/awesome/videos',
      });
    }
  };

  // 加载京东 Ck 节点列表
  _loadJDCk = async () => {
    try {
      const CookiesData = await this.getBoxJsCache('CookiesJD');
      if (CookiesData) this.CookiesData = transforJSON(CookiesData);
      const CookieJD = await this.getBoxJsCache('CookieJD');
      if (CookieJD) {
        const userName = CookieJD.match(/pt_pin=(.+?);/)[1];
        const ck1 = {cookie: CookieJD, userName};
        this.CookiesData.push(ck1);
      }
      const Cookie2JD = await this.getBoxJsCache('CookieJD2');
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

  drawImg = async () => {
    drawCircle(5, 5, '#DD8AB7', {
      color: this.fontColor,
      text: '收入',
      value: `${this.incomeBean}`,
    });
    drawCircle(193, 5, '#FBBFA7', {
      color: this.fontColor,
      text: '支出',
      value: `${this.expenseBean}`,
    });
    drawCircle(5, 193, '#A4E0de', {
      color: this.fontColor,
      text: '津贴',
      value: `${this.jintie}`,
    });
    drawCircle(193, 193, '#D1C0A5', {
      color: this.fontColor,
      text: '钢镚',
      value: `${this.gangben}`,
    });
    const expen = Math.abs(this.expenseBean);
    const total = this.userInfo.base.jdNum + this.incomeBean + expen;
    const incomeBean = Math.floor(Math.floor((this.incomeBean / total) * 100) * 3.6);
    const expenseBean = Math.floor(Math.floor((expen / total) * 100) * 3.6);
    const jdNum = Math.floor(Math.floor((this.userInfo.base.jdNum / total) * 100) * 3.6);
    console.log(jdNum);
    console.log(incomeBean);
    console.log(expenseBean);
    drawCenterCircle(0, '#c3cdF2', jdNum);
    drawCenterCircle(jdNum, '#DD8AB7', incomeBean);
    drawCenterCircle(jdNum + incomeBean, '#FBBFA7', expenseBean);
    const {light, dark} = (await getSetting<{light: string; dark: string}>('centerCircle')) || {};
    const centerCircleColor = Device.isUsingDarkAppearance() ? dark || '#1C1C1C' : light || '#F4F4F4';
    await drawCenterText(centerCircleColor, {color: this.fontColor, value: this.userInfo.base.jdNum});
  };

  fetchBaseInfo = async () => {
    //津贴查询
    const url1 = 'https://ms.jr.jd.com/gw/generic/uc/h5/m/mySubsidyBalance';
    const req1 = new Request(url1);
    const Referer = 'https://home.m.jd.com/myJd/newhome.action?sceneval=2&ufc=&';
    req1.headers = {cookie: this.cookie.cookie, Referer: Referer};
    const data1 = await req1.loadJSON();
    if (data1.resultCode === 0) {
      this.jintie = data1.resultData.data.balance;
    }

    //钢镚查询
    const url2 = 'https://coin.jd.com/m/gb/getBaseInfo.html';
    const req2 = new Request(url2);
    req2.headers = {cookie: this.cookie.cookie, Referer: Referer};
    const data2 = await req2.loadJSON();
    if (data2.gbBalance) {
      this.gangben = data2.gbBalance;
    }
  };

  fetchUserInfo = async () => {
    const options = {
      headers: {
        Accept: 'application/json,text/plain, */*',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'zh-cn',
        Connection: 'keep-alive',
        Cookie: this.cookie.cookie,
        Referer: 'https://wqs.jd.com/my/jingdou/my.shtml?sceneval=2',
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
      },
    };
    const url = 'https://wq.jd.com/user/info/QueryJDUserInfo?sceneval=2';
    return (await request<any>({url, method: 'POST', header: options.headers})).data;
  };

  getAmountData = async () => {
    let i = 0,
      page = 1;
    do {
      const response = await this.getJingBeanBalanceDetail(page);
      console.log(`第${page}页：${response.code === '0' ? '请求成功' : '请求失败'}`);
      if (response.code === '3') {
        i = 1;
        console.log(response);
      }
      if (response && response.code === '0') {
        page++;
        const detailList = response.jingDetailList;
        if (detailList && detailList.length > 0) {
          for (const item of detailList) {
            const dates = item.date.split(' ');
            if (this.timerKeys.indexOf(dates[0]) > -1) {
              if (this.timerKeys[0] === dates[0]) {
                const amount = Number(item.amount);
                if (amount > 0) this.incomeBean += amount;
                if (amount < 0) this.expenseBean += amount;
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

  getJingBeanBalanceDetail = async (page: number) => {
    const options = {
      url: `https://bean.m.jd.com/beanDetail/detail.json`,
      body: `page=${page}`,
      headers: {
        'X-Requested-With': `XMLHttpRequest`,
        Connection: `keep-alive`,
        'Accept-Encoding': `gzip, deflate, br`,
        'Content-Type': `application/x-www-form-urlencoded; charset=UTF-8`,
        Origin: `https://bean.m.jd.com`,
        'User-Agent': `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.1 Safari/605.1.15`,
        Cookie: this.cookie.cookie,
        Host: `bean.m.jd.com`,
        Referer: `https://bean.m.jd.com/beanDetail/index.action?resourceValue=bean`,
        'Accept-Language': `zh-cn`,
        Accept: `application/json, text/javascript, */*; q=0.01`,
      },
    };
    return (await request<any>({url: options.url, method: 'POST', data: options.body, header: options.headers})).data;
  };

  getDay(dayNumber: number) {
    const data = [];
    let i = dayNumber;
    do {
      const today = new Date();
      const year = today.getFullYear();
      const targetday_milliseconds = today.getTime() - 1000 * 60 * 60 * 24 * i;
      today.setTime(targetday_milliseconds); //注意，这行是关键代码
      let month: any = today.getMonth() + 1;
      month = month >= 10 ? month : `0${month}`;
      let day: any = today.getDate();
      day = day >= 10 ? day : `0${day}`;
      data.push(`${year}-${month}-${day}`);
      i--;
    } while (i >= 0);
    return data;
  }

  //渲染组件
  render = async (): Promise<unknown> => {
    if (config.widgetFamily === 'large') return RenderError('暂不支持');
    const contentImg = canvas.getImage();
    return (
      <wbox
        background={(await this.getBackgroundImage()) || this.backgroundColor}
        updateDate={new Date(Date.now() + (await this.updateInterval()))}
        padding={[0, 0, 0, 0]}
      >
        <wstack href={'https://home.m.jd.com/myJd/home.action'} verticalAlign={'center'}>
          <wspacer />
          <RowCenter flexDirection={'column'}>
            <wimage src={contentImg} width={150} height={150} />
          </RowCenter>
          <wspacer />
          {config.widgetFamily === 'medium' && (
            <wstack flexDirection={'column'} verticalAlign={'center'}>
              <wspacer />
              <RowCenter>
                <Avatar url={this.userInfo.base.headImageUrl} />
              </RowCenter>
              <wspacer />
              <Label
                color={this.fontColor}
                labelColor={'#f95e4c'}
                label={'person.circle'}
                value={this.userInfo.base.nickname}
              />
              <wspacer />
              <Label
                color={this.fontColor}
                labelColor={'#f7de65'}
                label={'creditcard.circle'}
                value={`${this.userInfo.base.levelName}(${this.userInfo.base.userLevel})`}
              />
              <wspacer />
            </wstack>
          )}
          <wspacer />
        </wstack>
      </wbox>
    );
  };
}

ICONCOLOR = 'purple'; // 小组件颜色
ICONGLYPH = 'yen-sign'; // 小组件图标
EndAwait(() => new Widget().init());
