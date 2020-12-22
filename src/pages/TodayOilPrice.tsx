import {FC} from 'react';
import Base, {RenderError} from '@app/Base';
import C2Pin from '@app/assets/pinyin';
import {WstackProps} from '@app/types/widget';
import {request, useSetting} from '@app/lib/help';

interface oilRes {
  cate: string;
  value: string;
}

interface locationType {
  administrativeArea: string;
  location: {
    latitude: number;
    longitude: number;
  };
  country: string;
  locality: string;
  subLocality: string;
}

interface gasStationResponse {
  title: string;
  address: string;
  tel: string;
  category: string;
  location: {
    lat: number;
    lng: number;
  };
  _distance: number;
  ad_info: {
    adcode: number;
    province: string;
    city: string;
    district: string;
  };
}

const title = new Font('AppleSDGothicNeo-Bold', 16);

/**横向居中组件*/
const RowCenter: FC<WstackProps> = ({children, ...props}) => {
  return (
    <wstack {...props}>
      <wspacer />
      {children}
      <wspacer />
    </wstack>
  );
};

class Widget extends Base {
  name = '地方油价';
  en = 'todayOilPrice';
  token: string | undefined;
  location: locationType | undefined;
  headerColor = '#40a9ff';
  bodyColor = '#69c0ff';

  componentWillMount = async () => {
    this.registerAction('代理缓存', this.setMenuTencentToken);
    this.registerAction('腾讯Token', this.setMenuTokenInput);
    this.baseActions = [
      {
        title: '颜色主题',
        func: async () => {
          const inputValue = {headerColor: '顶部油价背景', bodyColor: '加油站背景'};
          return this.showAlertCatchInput('颜色主题', 'hex 颜色', inputValue, 'oilBackground');
        },
      },
      ...this.baseActions.splice(-1, 1),
    ];
    const {getSetting} = useSetting(this.en);
    const cache = (await getSetting<{token?: string}>(this.BOX_CATCH_KEY)) || {};
    this.token = cache?.token;

    const {headerColor, bodyColor} =
      (await getSetting<{headerColor: string; bodyColor: string}>('oilBackground')) || {};
    this.headerColor = headerColor || this.headerColor;
    this.bodyColor = bodyColor || this.bodyColor;

    this.fontColor = '#fff';
  };

  setMenuTokenInput = () => {
    return this.showAlertCatchInput('腾讯Token', 'BoxJS 缓存', {token: '腾讯地图 Token'});
  };

  setMenuTencentToken = () => {
    return this.setCacheBoxJSData({token: '@caiyun.token.tencent'});
  };

  getLocation = async (): Promise<string[]> => {
    try {
      const location = await Location.current();
      const locationText = await Location.reverseGeocode(location.latitude, location.longitude);
      console.log(locationText);
      const {locality = '成都', administrativeArea = '四川'} = (locationText[0] || {}) as locationType;
      this.location = (locationText[0] || {}) as locationType;
      return [administrativeArea, locality];
    } catch (e) {
      console.log('❌错误信息：' + e);
      return [];
    }
  };

  searchGasStation = async (): Promise<gasStationResponse[]> => {
    const {latitude = 39.908491, longitude = 116.374328} = this.location?.location || {};
    const params: {[key: string]: any} = {
      boundary: `nearby(${latitude},${longitude},5000)`,
      page_size: 20,
      page_index: 1,
      keyword: '加油站',
      orderby: '_distance',
      key: this.token,
    };
    const data = Object.keys(params).map((key: string) => `${key}=${params[key]}`);
    const url = 'https://apis.map.qq.com/ws/place/v1/search?' + encodeURIComponent(data.join('&'));
    console.log(url);
    const res = (await request<{[key: string]: any; data: gasStationResponse[]}>({url, dataType: 'json'})).data?.data;
    const size = config.widgetFamily === 'large' ? 4 : 1;
    return res?.splice(0, size) as gasStationResponse[];
  };

  renderWebView = async (str: string[]): Promise<oilRes[]> => {
    const webView = new WebView();
    let _area: string[] | string = [C2Pin.fullChar(str[0].replace('省', '')), C2Pin.fullChar(str[1])];
    if (!_area[0]) {
      _area = _area[1].replace('shi', '/');
    } else {
      _area = _area.join('/') + '.html';
    }
    const url = `http://youjia.chemcp.com/${_area}`;
    await webView.loadURL(url);
    const javascript = `
    const data = [];
    const oil = document.querySelectorAll('table')[4].querySelectorAll('tr');
    for (let i = 0;i<oil.length;i++ ){
       const dateItem = {};
       let value = oil[i].innerText;
       value = value.split('\t');
       dateItem.cate = value[0];
       dateItem.value = value[1];
       data.push(dateItem);
    }
    completion(data);
    `;
    return await webView
      .evaluateJavaScript(javascript, true)
      .then(async e => {
        return typeof e === 'string' ? JSON.parse(e) : e;
      })
      .catch(() => {
        return {};
      });
  };

  //当前时间
  nowTime(): string {
    const date = new Date();
    return date.toLocaleTimeString('chinese', {hour12: false});
  }

  content = (data: oilRes) => {
    return (
      <wstack flexDirection="column" verticalAlign="center">
        <RowCenter>
          <wtext textAlign="center" textColor={this.fontColor} font={title}>
            {data.cate.replace('汽油', '')}
          </wtext>
        </RowCenter>
        <wspacer length={10} />
        <RowCenter>
          <wtext textColor={this.fontColor} font={12} textAlign="center">
            {data.value.replace('/升', '')}
          </wtext>
        </RowCenter>
      </wstack>
    );
  };

  stackCellText = (data: {icon: string; href: string; label: string; value: string}) => {
    return (
      <wstack verticalAlign="center">
        <wspacer length={5} />
        <wimage src={data.icon} width={10} height={10} filter={this.fontColor} />
        <wspacer length={5} />
        <wtext href={data.href} font={10} textColor={this.fontColor} maxLine={1}>
          {data.label}：{data.value || '-'}
        </wtext>
        <wspacer />
      </wstack>
    );
  };

  stackGasStation = (gasStation: gasStationResponse[]) => {
    return gasStation.map((item, index) => {
      const href = `iosamap://navi?sourceApplication=applicationName&backScheme=applicationScheme&poiname=fangheng&poiid=BGVIS&lat=${item.location.lat}&lon=${item.location.lng}&dev=1&style=2`;
      return (
        <wstack flexDirection="column" borderRadius={4} href={href}>
          {this.stackCellText({value: `${item.title}(${item._distance}米)`, label: '油站', href, icon: 'car'})}
          <wspacer length={2} />
          {this.stackCellText({value: item.address, label: '地址', href, icon: 'mappin.and.ellipse'})}
          <wspacer length={2} />
          {this.stackCellText({value: item.tel, label: '电话', href: 'tel:' + item.tel, icon: 'iphone'})}
          {gasStation.length - 1 !== index && <wspacer />}
        </wstack>
      );
    });
  };

  //渲染组件
  render = async (): Promise<unknown> => {
    let gasStation: gasStationResponse[] = [];
    if (config.widgetFamily === 'small') return RenderError('暂不支持');
    const locality = await this.getLocation();
    const data = await this.renderWebView(locality);
    if (this.token) gasStation = (await this.searchGasStation()) || [];
    return (
      <wbox padding={[0, 0, 0, 0]} updateDate={new Date(Date.now() + (await this.updateInterval()))}>
        <wstack background={this.headerColor} padding={[10, 10, 10, 10]}>
          {data.map(item => {
            const city = locality[1].replace('市', '');
            const cate = item.cate.replace(city, '').replace('#', '号').replace('价格', '');
            return this.content({...item, cate});
          })}
        </wstack>
        {gasStation.length > 0 && (
          <wstack background={this.bodyColor} flexDirection="column" padding={[10, 10, 10, 10]}>
            {this.stackGasStation(gasStation)}
          </wstack>
        )}
        <wspacer />
        <wstack verticalAlign="center" padding={[0, 10, 10, 10]}>
          <wimage src={'https://www.bitauto.com/favicon.ico'} width={15} height={15} />
          <wspacer length={10} />
          <wtext opacity={0.5} font={14}>
            今日油价
          </wtext>
          <wspacer />
          <wimage src="arrow.clockwise" width={10} height={10} opacity={0.5} />
          <wspacer length={10} />
          <wtext font={12} textAlign="right" opacity={0.5}>
            {this.nowTime()}
          </wtext>
        </wstack>
      </wbox>
    );
  };
}

ICONCOLOR = 'purple'; // 小组件颜色
ICONGLYPH = 'oil-can'; // 小组件图标
EndAwait(() => new Widget().init());
