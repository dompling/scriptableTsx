import {FC} from 'react';
import Base from '@app/Base';
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
  constructor() {
    super();
    this.registerAction('腾讯Token', this.setMenuTokenInput);
    this.registerAction('代理缓存', this.setMenuTencentToken);
  }

  name = '地方油价';
  en = 'todayOilPrice';
  token: string | undefined;
  location: locationType | undefined;

  componentWillMount = async () => {
    const {getSetting} = useSetting(this.en);
    const cache = (await getSetting<{token?: string}>(this.BOX_CATCH_KEY)) || {};
    this.token = cache?.token;
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
      const {locality, administrativeArea} = locationText[0] as locationType;
      this.location = locationText[0] as locationType;
      return [administrativeArea, locality];
    } catch (e) {
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
    const res = (await request<{[key: string]: any; data: gasStationResponse[]}>({url, dataType: 'json'})).data?.data;
    return res?.splice(0, 4) as gasStationResponse[];
  };

  renderWebView = async (str: string[]): Promise<oilRes[]> => {
    const webView = new WebView();
    const _area = [C2Pin.fullChar(str[0].replace('省', '')), C2Pin.fullChar(str[1])];
    const url = `http://youjia.chemcp.com/${_area.join('/')}.html`;
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
          <wtext textAlign="center" color={this.fontColor} font={title}>
            {data.cate.replace('汽油', '')}
          </wtext>
        </RowCenter>
        <wspacer length={10} />
        <RowCenter>
          <wtext color={this.fontColor} font={12} textAlign="center">
            {data.value.replace('/升', '')}
          </wtext>
        </RowCenter>
      </wstack>
    );
  };

  stackGasStation = (gasStation: gasStationResponse[]) => {
    return gasStation.map(item => {
      return (
        <>
          <wstack
            background={this.fontColor}
            flexDirection="column"
            borderRadius={4}
            padding={[2, 0, 2, 0]}
            href={`iosamap://path?sourceApplication=${item.title}&dlat=${item.location.lat}&dlon=${item.location.lng}&dname=${item.address}&dev=0&t=0`}
          >
            <wstack verticalAlign="center">
              <wspacer length={5} />
              <wimage src="star.fill" width={10} height={10} />
              <wspacer length={5} />
              <wtext font={10} textColor={this.backgroundColor}>
                油站：{item.title}({item._distance}米)
              </wtext>
              <wspacer />
            </wstack>
            <wspacer length={2} />
            <wstack verticalAlign="center">
              <wspacer length={5} />
              <wimage src="star.fill" width={10} height={10} />
              <wspacer length={5} />
              <wtext href={'tel:' + item.tel} font={10} textColor={this.backgroundColor}>
                电话：{item.tel}
              </wtext>
              <wspacer />
            </wstack>
            <wspacer length={2} />
            <wstack verticalAlign="center">
              <wspacer length={5} />
              <wimage src="star.fill" width={10} height={10} />
              <wspacer length={5} />
              <wtext font={10} textColor={this.backgroundColor}>
                地址：{item.address}
              </wtext>
              <wspacer />
            </wstack>
          </wstack>
          <wspacer />
        </>
      );
    });
  };

  //渲染组件
  render = async (): Promise<unknown> => {
    let gasStation: gasStationResponse[] = [];
    if (config.widgetFamily === 'small') return;
    const locality = await this.getLocation();
    const data = await this.renderWebView(locality);
    const background = await this.getBackgroundImage();
    if (config.widgetFamily === 'large') gasStation = await this.searchGasStation();
    return (
      <wbox
        background={background || this.backgroundColor}
        updateDate={new Date(Date.now() + (await this.updateInterval()))}
      >
        <wstack verticalAlign="center">
          <wimage src={'https://www.bitauto.com/favicon.ico'} width={15} height={15} />
          <wspacer length={10} />
          <wtext opacity={0.9} font={14} textColor={this.fontColor}>
            今日油价
          </wtext>
        </wstack>
        <wspacer />
        <wstack>
          {data.map(item => {
            const city = locality[1].replace('市', '');
            const cate = item.cate.replace(city, '').replace('#', '号').replace('价格', '');
            return this.content({...item, cate});
          })}
        </wstack>
        <wspacer />
        {gasStation.length > 0 && <wstack flexDirection="column">{this.stackGasStation(gasStation)}</wstack>}
        <wtext font={12} textAlign="right" opacity={0.5}>
          更新于:{this.nowTime()}
        </wtext>
      </wbox>
    );
  };
}
EndAwait(() => new Widget().init());
