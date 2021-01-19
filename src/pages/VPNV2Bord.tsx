import {FC} from 'react';
import Base, {RenderError} from '@app/Base';
import {request, ResponseType, showNotification, useSetting} from '@app/lib/help';
import RowCenter from '@app/Component/RowCeneter';

const en = 'VPNV2Bord';

const getChartConfig = (data: any[], color: any[], value: string, fontColor: string) => {
  console.log(data);
  const template1 = `
{
  "type": "radialGauge",
  "data": {
    "datasets": [
      {
        "data": [${parseFloat(data[0])}],
        "borderWidth": 0,
        "backgroundColor": getGradientFillHelper('vertical', ${JSON.stringify(color[0])}),
      }
    ]
  },
  "options": {
      centerPercentage: 86,
      rotation: Math.PI / 2,
      centerArea: {
        displayText: false,
      },
      options:{
      	trackColor: '#f4f4f4',
      }
  }
}
      `;
  const template2 = `
{
  "type": "radialGauge",
  "data": {
    "datasets": [
      {
       "data": [${parseFloat(data[1])}],
        "borderWidth": 0,
        "backgroundColor": getGradientFillHelper('vertical', ${JSON.stringify(color[1])}),
      }
    ]
  },
  "options": {
      layout: {
          padding: {
              left: 47,
              right: 47,
              top: 47,
              bottom: 47
          }
      },
      options:{
      	trackColor: '#f4f4f4',
      },
      centerPercentage: 80,
      rotation: Math.PI / 2,
      centerArea: {
        displayText: false,
      }
  }
}
      `;
  const template3 = `
{
  "type": "radialGauge",
  "data": {
    "datasets": [
      {
        "data": [${parseFloat(data[2])}],
        "borderWidth": 0,
        "backgroundColor": getGradientFillHelper('vertical', ${JSON.stringify(color[2])}),
      }
    ]
  },
  "options": {
      layout: {
          padding: {
              left: 94,
              right: 94,
              top: 94,
              bottom: 94
          }
      },
      options:{
      	trackColor: '#f4f4f4',
      },
      centerPercentage: 70,
      rotation: Math.PI / 2,
      centerArea: {
        displayText: true,
        fontColor: '${fontColor}',
        fontSize: 20,
        text:(value)=>{
          return '${value}';
        }
      }
  }
}
      `;
  console.log(template1);
  console.log(template2);
  console.log(template3);
  return {template1, template2, template3};
};

const Circle: FC<{
  width: number;
  height: number;
  data: {chart1: string | undefined; chart2: string | undefined; chart3: string | undefined};
}> = props => {
  return (
    <wstack
      padding={[10, 10, 10, 10]}
      background={props.data.chart3}
      verticalAlign={'center'}
      width={props.width}
      height={props.height}
    >
      <wstack background={props.data.chart2} verticalAlign={'center'} width={props.width} height={props.height}>
        <wstack background={props.data.chart1} verticalAlign={'center'} width={props.width} height={props.height} />
      </wstack>
    </wstack>
  );
};

const gradient = (color: string[]): LinearGradient => {
  const linear = new LinearGradient();
  linear.colors = color.map(item => new Color(item, 1));
  linear.locations = [0, 0.5];
  return linear;
};

const StackCell: FC<{
  url?: string;
  color?: string[];
  label: string;
  value?: string;
  size?: number;
  fontColor?: string;
}> = data => {
  return (
    <wstack verticalAlign={'center'}>
      {data.url ? (
        <wimage src={data.url} width={16} height={16} borderRadius={8} />
      ) : (
        <wstack background={gradient(data.color || [])} width={16} height={16} borderRadius={8} />
      )}
      <wspacer length={5} />
      <wtext font={data.size} textColor={data.fontColor}>
        {data.label}
      </wtext>
      {data.value && (
        <>
          <wspacer length={5} />
          <wtext textColor={data.fontColor} font={data.size}>
            {data.value || ''}
          </wtext>
          <wspacer />
        </>
      )}
    </wstack>
  );
};

const FooterCell: FC<{color: string[]; label: string; value?: string; fontColor: string}> = data => {
  return (
    <wstack flexDirection={'column'}>
      <RowCenter flexDirection={'row'}>
        <wstack background={gradient(data.color)} width={10} height={10} borderRadius={5} />
      </RowCenter>
      <wspacer length={2} />
      <RowCenter flexDirection={'row'}>
        <wtext textAlign={'center'} textColor={data.fontColor} font={8}>
          {data.value}
        </wtext>
      </RowCenter>
      <wspacer length={2} />
      <RowCenter flexDirection={'row'}>
        <wtext textAlign={'center'} textColor={data.fontColor} font={8}>
          {data.label}
        </wtext>
      </RowCenter>
    </wstack>
  );
};

interface accountItem {
  url: string;
  icon: string;
  email: string;
  title: string;
  password: string;
}

const {getSetting, setSetting} = useSetting(en);

class Widget extends Base {
  name = 'V2模板机场';
  en = en;
  chart1: string | undefined;
  chart2: string | undefined;
  chart3: string | undefined;
  logo = 'https://raw.githubusercontent.com/58xinian/icon/master/glados_animation.gif';
  color1 = ['#ef0a6a', '#b6359c'];
  color2 = ['#ff54fa', '#fad126'];
  color3 = ['#28cfb3', '#72d7cc'];
  cookies: {[key: string]: string} = {};

  dataSource = {
    restData: '0',
    usedData: '0',
    totalData: '0',
    todayData: '0',
  };

  account = {
    url: '',
    icon: '',
    title: '机场名',
    email: '',
    password: '',
  };

  componentWillMount = async () => {
    this.registerAction('删除机场', this.delSubscribe);
    this.registerAction('新增机场', this.addSubscribe);
    this.registerAction('机场列表', this.listSubscribe);
    const index: number | undefined = args.widgetParameter ? parseInt(args.widgetParameter) : undefined;
    const data = (await getSetting<accountItem[]>('subscribe')) || [];
    let account: accountItem;
    if (typeof index !== 'undefined' && data[index]) {
      account = data[index];
    } else {
      account = (await getSetting<accountItem>('account')) || this.account;
    }
    if (!account.url && data[0]) account = data[0];
    account.icon = account.icon || this.logo;
    this.account = account;
  };

  componentDidMount = async () => {
    try {
      await this.login(`${this.account.url}/api/v1/passport/auth/login`);
      await this.getSubscribe(`${this.account.url}/api/v1/user/getSubscribe`);
    } catch (e) {
      console.log('❌检测账号和配置是否有误：' + e);
    }
    await this.createChart({w: 360, h: 360});
  };

  async listSubscribe() {
    try {
      const table = new UITable();
      const dataSource = (await getSetting<accountItem[]>('subscribe')) || [];
      dataSource.map((t, index) => {
        const r = new UITableRow();
        r.addText(`parameter：${index}  机场名：${t.title}     订阅：${t.url}`);
        r.onSelect = () => setSetting('account', t);
        table.addRow(r);
      });
      await table.present(false);
    } catch (e) {
      console.log(e);
    }
  }

  async delSubscribe() {
    try {
      const table = new UITable();
      const dataSource = (await getSetting<accountItem[]>('subscribe')) || [];
      dataSource.map((t, index) => {
        const r = new UITableRow();
        r.addText(`❌   机场名：${t.title}     订阅：${t.url}`);
        r.onSelect = async () => {
          dataSource.splice(index, 1);
          await setSetting('subscribe', dataSource, false);
          await showNotification({title: this.name, body: `删除${t.title}机场成功`});
        };
        table.addRow(r);
      });
      await table.present(false);
    } catch (e) {
      console.log(e);
    }
  }

  addSubscribe = async () => {
    const options: accountItem = {
      title: '机场名称',
      url: '登陆域名',
      icon: '图标',
      email: '邮箱账号',
      password: '密码',
    };
    const dataSource = (await getSetting<accountItem[]>('subscribe')) || [];
    const account = await this.showAlertCatchInput(
      '新增订阅',
      '订阅的登陆地址域名请自行寻找，以/api/v1/passport/auth/login结尾',
      options,
      'add',
    );
    if (account) {
      dataSource.push(account);
      await setSetting('subscribe', dataSource, false);
    }
  };

  login = async (url: string) => {
    const data: any = {email: this.account.email, password: this.account.password};
    let params: any = Object.keys(data).map(key => `${key}=${encodeURIComponent(data[key])}`);
    params = params.join('&');
    const response: ResponseType<any> = await request<any>({url, method: 'POST', data: params});
    if (response.data.errors) return console.log(JSON.stringify(response.data));
    response.cookies.forEach(item => {
      this.cookies[item.name] = item.value;
    });
  };

  getSubscribe = async (url: string) => {
    let cookie: any = Object.keys(this.cookies).map(key => `${key}=${this.cookies[key]}`);
    cookie = cookie.join('; ');
    const response: ResponseType<any> = await request<any>({
      url,
      method: 'GET',
      header: {cookie, referer: `${this.account.url}/`, 'accept-language': 'zh-CN,zh;q=0.9'},
    });
    if (response.data.errors) return console.log(JSON.stringify(response.data));
    response.cookies.forEach(item => {
      this.cookies[item.name] = item.value;
    });
    const subscribe = response.data.data;
    this.dataSource.totalData = `${subscribe.transfer_enable}`;
    this.dataSource.usedData = `${subscribe.d + subscribe.u}`;
    this.dataSource.restData = `${subscribe.transfer_enable - (subscribe.d + subscribe.u)}`;
    this.dataSource.todayData = `${subscribe.reset_day}`;
  };

  createChart = async (size: {w: number; h: number}): Promise<void> => {
    const dateFormat = new DateFormatter();
    dateFormat.dateFormat = 'YYYYMMddHH';
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const days = new Date(year, month, 0).getDate();
    const today = dateFormat.string(new Date());

    const {restData, usedData, todayData, totalData} = this.dataSource;
    const total = parseFloat(totalData) || 1;
    const data3 = Math.floor((1 - parseInt(todayData) / days) * 100);
    const data2 = Math.floor((parseInt(usedData) / total) * 100);
    const data1 = Math.floor((parseInt(restData) / total) * 100);
    const data = [data1 || 0, data2 || 0, data3 || 0];

    this.dataSource.todayData = `${todayData}天后`;
    this.dataSource.usedData = this.formatFileSize(parseInt(usedData));
    this.dataSource.restData = this.formatFileSize(parseInt(restData));

    const {template1, template2, template3} = getChartConfig(
      data,
      [this.color1, this.color2, this.color3],
      this.dataSource.restData,
      this.fontColor,
    );

    const getUrl = (chart: string) => {
      return `https://quickchart.io/chart?w=${size.w}&h=${size.h}&f=png&c=${encodeURIComponent(chart)}&today=${today}`;
    };
    this.chart1 = getUrl(template1);
    this.chart2 = getUrl(template2);
    this.chart3 = getUrl(template3);
  };

  formatFileSize(fileSize: number): string {
    let temp: number | string;
    if (fileSize < 1024 * 1024) {
      temp = fileSize / 1024;
      temp = temp.toFixed(2);
      return temp + 'KB';
    } else if (fileSize < 1024 * 1024 * 1024) {
      temp = fileSize / (1024 * 1024);
      temp = temp.toFixed(2);
      return temp + 'MB';
    } else if (fileSize < 1024 * 1024 * 1024 * 1024) {
      temp = fileSize / (1024 * 1024 * 1024);
      temp = temp.toFixed(2);
      return temp + 'GB';
    } else {
      temp = fileSize / (1024 * 1024 * 1024 * 1024);
      temp = temp.toFixed(2);
      return temp + 'TB';
    }
  }

  renderSmall = async (): Promise<unknown> => {
    const {chart1, chart2, chart3} = this;
    const {todayData, restData, usedData} = this.dataSource;
    return (
      <wbox
        padding={[0, 0, 0, 0]}
        background={(await this.getBackgroundImage()) || this.backgroundColor}
        updateDate={new Date(Date.now() + (await this.updateInterval()))}
      >
        <wstack padding={[10, 5, 10, 10]} verticalAlign={'center'}>
          <StackCell url={this.account.icon} label={this.account.title} size={12} fontColor={this.fontColor} />
          <wspacer />
          <StackCell url={'arrow.clockwise'} label={todayData} size={12} fontColor={this.fontColor} />
        </wstack>
        <RowCenter flexDirection={'row'}>
          <Circle width={80} height={80} data={{chart1, chart2, chart3}} />
        </RowCenter>
        <wstack>
          <FooterCell fontColor={this.fontColor} color={this.color1} label={'剩余'} value={restData} />
          <wspacer />
          <FooterCell fontColor={this.fontColor} color={this.color2} label={'累计'} value={usedData} />
        </wstack>
      </wbox>
    );
  };

  render = async (): Promise<unknown> => {
    const {chart1, chart2, chart3} = this;
    const {todayData, restData, usedData} = this.dataSource;
    console.log(this.dataSource);
    if (config.widgetFamily === 'large') return RenderError('暂不支持');
    if (config.widgetFamily === 'small') return this.renderSmall();
    return (
      <wbox
        padding={[0, 0, 0, 0]}
        background={(await this.getBackgroundImage()) || this.backgroundColor}
        updateDate={new Date(Date.now() + (await this.updateInterval()))}
      >
        <wstack>
          <wspacer length={10} />
          <RowCenter>
            <Circle width={140} height={140} data={{chart1, chart2, chart3}} />
          </RowCenter>
          <wspacer length={20} />
          <RowCenter>
            <StackCell url={this.logo} label={this.account.title} value={'.'} fontColor={this.fontColor} />
            <wspacer length={10} />
            <StackCell color={this.color3} label={'重置'} value={todayData} fontColor={this.fontColor} />
            <wspacer length={10} />
            <StackCell color={this.color2} label={'累计'} value={usedData} fontColor={this.fontColor} />
            <wspacer length={10} />
            <StackCell color={this.color1} label={'剩余'} value={restData} fontColor={this.fontColor} />
          </RowCenter>
          <wspacer />
        </wstack>
      </wbox>
    );
  };
}

ICONCOLOR = 'purple'; // 小组件颜色
ICONGLYPH = 'paper-plane'; // 小组件图标
EndAwait(() => new Widget().init());
