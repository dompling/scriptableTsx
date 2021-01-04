import {FC} from 'react';
import Base from '@app/Base';
import {WstackProps} from '@app/types/widget';
import {request, useSetting} from '@app/lib/help';

interface locationType {
  administrativeArea: string;
  location: {
    latitude: number;
    longitude: number;
  };
  country: string;
  locality: string;
  subLocality: string;
  postalAddress: {
    postalCode: string;
    street: string;
    state: string;
    subAdministrativeArea: string;
    subLocality: string;
    isoCountryCode: string;
    country: string;
    city: string;
  };
}

interface covid_19Item {
  confirm: number;
  confirm_add: string;
  confirm_cuts: string;
  country: string;
  date: string;
  dead: number;
  dead_cuts: string;
  description: string;
  heal: string;
  heal_cuts: string;
  newConfirm: string;
  newDead: string;
  newHeal: string;
  now_confirm_cuts: string;
  province: string;
  city?: string;
}

interface provinceCompareItem {
  confirmAdd: number;
  dead: number;
  heal: number;
  nowConfirm: number;
  zero: number;
}

interface covid_19Response {
  ret: number;
  info: string;
  data:
    | covid_19Item[]
    | {
        provinceCompare: {
          [key: string]: provinceCompareItem;
        };
      }
    | null;
}

interface covid_19NewsItem {
  cms_id: string;
  news_url: string;
  publish_time: string;
  shortcut: string;
  srcfrom: string;
  title: string;
}

const addumFont = 12;
const viewColor = '#aaa';
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
  name = '疫情数据';
  en = 'covid-19';
  today = '';
  pinyin = '';
  province: covid_19Item | undefined;
  city: covid_19Item | undefined;
  updateData: provinceCompareItem | undefined;
  location: locationType | undefined;
  baseUrl = `https://api.inews.qq.com/newsqa/v1/query/pubished/daily/list`;
  news: covid_19NewsItem[] | undefined;

  componentWillMount = async () => {
    this.registerAction('地区拼音', async () => {
      const options = {py: '尝试首字母或者全拼'};
      await this.showAlertCatchInput('地区拼音', '首字母或全部拼音', options, 'pinyin');
    });
    const {getSetting} = useSetting(this.en);
    this.pinyin = ((await getSetting<{py: string}>('pinyin')) || {}).py || this.pinyin;
    this.pinyin = this.pinyin.trim();
  };

  componentDidMount = async () => {
    const dateFormat = new DateFormatter();
    dateFormat.dateFormat = 'MM.dd';
    this.today = dateFormat.string(new Date());

    this.location = await this.getLocation();
    if (!this.location) return;
    const {state = ''} = this.location.postalAddress;
    let {city = ''} = this.location.postalAddress;
    let province: string;
    if (state) {
      province = state.replace('省', '').replace('市', '');
      this.province = await this.getCovid19({province});
    } else {
      province = city.replace('省', '').replace('市', '');
      this.province = await this.getCovid19({province});
    }
    if (state && city) {
      province = state.replace('省', '').replace('市', '');
      city = city.replace('省', '').replace('市', '');
      this.city = await this.getCovid19({province, city});
    }
    await this.getCovid19ProvinceCompare();
    config.widgetFamily === 'large' && (await this.getCovid19News());
  };

  getLocation = async (): Promise<locationType | undefined> => {
    try {
      const location = await Location.current();
      const locationText = await Location.reverseGeocode(location.latitude, location.longitude);
      console.log(locationText);
      return locationText[0] as locationType;
    } catch (e) {
      console.log('❌定位失败：' + e);
    }
  };

  getCovid19 = async (params: {
    province: string;
    city?: string;
    [key: string]: any;
  }): Promise<covid_19Item | undefined> => {
    const query = Object.keys(params).map((item: string) => {
      return `${item}=${encodeURIComponent(params[item])}`;
    });
    query.push('today=' + this.today);
    const url = `${this.baseUrl}?${query.join('&')}`;
    console.log(url);
    const response = (await request<covid_19Response>({method: 'POST', url, useCache: true})).data as covid_19Response;
    if (response.ret === 0 && response.data && response.data instanceof Array) {
      const covid_19: covid_19Item = response.data[response.data.length - 1];
      if (covid_19) return covid_19;
    }
  };

  async getCovid19ProvinceCompare() {
    const url = `https://api.inews.qq.com/newsqa/v1/query/inner/publish/modules/list?modules=provinceCompare&today=${this.today}`;
    const response = (await request<any>({method: 'POST', url})).data;
    if (response.ret === 0 && response.data) {
      const data = response.data.provinceCompare;
      if (!this.location) return;
      let {state = '', city = ''} = this.location.postalAddress;
      state = state.replace('省', '').replace('市', '');
      city = city.replace('省', '').replace('市', '');
      if (data[state]) this.updateData = data[state] || undefined;
      if (data[city]) this.updateData = data[state] || undefined;
    }
  }

  async getCovid19News() {
    if (!this.pinyin) return;
    const url = `https://api.dreamreader.qq.com/news/v1/province/news/list?province_code=${this.pinyin}&page_size=4&today=${this.today}`;
    console.log(url);
    const response = (await request<any>({url, method: 'GET', useCache: true})).data.data.items as covid_19NewsItem[];
    if (response) this.news = response;
  }

  formatNumber(number: number | undefined): string {
    if (!number) return `+0`;
    return number >= 0 ? `+${number}` : `${number}`;
  }

  //当前时间
  nowTime(): string {
    const date = new Date();
    return date.toLocaleTimeString('chinese', {hour12: false});
  }

  tabInfo = (data: {color: string; addnum: string; tabText: string; value: string; bg: string}) => {
    return (
      <wstack flexDirection={'column'} background={data.bg}>
        <wspacer />
        <RowCenter>
          <wtext font={addumFont} textColor={viewColor}>
            较上日
          </wtext>
          <wtext font={addumFont} textColor={data.color}>
            {data.addnum}
          </wtext>
        </RowCenter>
        <wspacer length={2} />
        <RowCenter>
          <wtext textColor={data.color}>{data.value}</wtext>
        </RowCenter>
        <wspacer length={2} />
        <RowCenter>
          <wtext font={addumFont} textColor={viewColor}>
            {data.tabText}
          </wtext>
        </RowCenter>
        <wspacer />
      </wstack>
    );
  };
  //渲染组件
  render = async (): Promise<unknown> => {
    const Footer = () => {
      return (
        <wstack verticalAlign="center" padding={[0, 10, 10, 10]}>
          <wimage src={'https://img.icons8.com/cute-clipart/2x/coronavirus.png'} width={15} height={15} />
          <wspacer length={10} />
          <wtext opacity={0.5} font={14} textColor={this.fontColor}>
            疫情日报
          </wtext>
          <wspacer />
          <wimage src="arrow.clockwise" width={10} height={10} opacity={0.5} filter={this.fontColor} />
          <wspacer length={10} />
          <wtext font={12} textAlign="right" opacity={0.5} textColor={this.fontColor}>
            {this.nowTime()}
          </wtext>
        </wstack>
      );
    };

    if (config.widgetFamily === 'small') {
      return (
        <wbox>
          <wspacer />
          <wtext textAlign="center">暂不支持</wtext>
          <wspacer />
        </wbox>
      );
    }

    return (
      <wbox
        background={(await this.getBackgroundImage()) || this.backgroundColor}
        updateDate={new Date(Date.now() + (await this.updateInterval()))}
      >
        <wspacer />
        <wstack borderRadius={10}>
          {this.tabInfo({
            color: '#f23a3b',
            bg: '#fff0f1',
            value: `${(this.province?.confirm || 0) - parseInt(this.province?.heal || '0') || '-'}`,
            tabText: '现有确诊',
            addnum: this.formatNumber(this.updateData?.nowConfirm),
          })}
          <wspacer length={2} />
          {this.tabInfo({
            color: '#cc1e1e',
            bg: '#fff0f1',
            value: `${this.province?.confirm || '-'}`,
            tabText: '累计确诊',
            addnum: this.formatNumber(this.updateData?.confirmAdd),
          })}
          <wspacer length={2} />
          {this.tabInfo({
            color: '#178b50',
            bg: '#f0f8f4',
            value: `${this.province?.heal || '-'}`,
            tabText: '累计治愈',
            addnum: this.formatNumber(this.updateData?.heal),
          })}
          <wspacer length={2} />
          {this.tabInfo({
            color: '#4e5a65',
            bg: '#f2f6f7',
            value: `${this.province?.dead || '-'}`,
            tabText: '累计死亡',
            addnum: this.formatNumber(this.updateData?.dead),
          })}
        </wstack>
        <wspacer length={5} />
        <wstack borderRadius={10} padding={[5, 5, 5, 5]} flexDirection={'column'} background={'#f8f8f8'}>
          <wstack verticalAlign={'center'}>
            <wimage src={'location'} filter={'#005dff'} width={12} height={12} />
            <wspacer length={5} />
            <wtext textColor={'#005dff'} font={addumFont}>
              {(this.location?.postalAddress.city || '') + (this.location?.postalAddress.street || '') || '未找到定位'}
            </wtext>
            <wspacer />
          </wstack>

          {this.city && (
            <>
              <wspacer length={5} />
              <wstack verticalAlign={'center'}>
                <wspacer />
                <wtext font={addumFont} textColor={viewColor}>
                  {this.city?.confirm_add || '0'}新增
                </wtext>
                <wspacer />
                <wtext font={addumFont} textColor={viewColor}>
                  {this.city?.confirm || '0'}确诊
                </wtext>
                <wspacer />
                <wtext font={addumFont} textColor={viewColor}>
                  {this.city?.heal || '0'}治愈
                </wtext>
                <wspacer />
                <wtext font={addumFont} textColor={viewColor}>
                  {this.city?.dead || '0'}死亡
                </wtext>
                <wspacer />
              </wstack>
            </>
          )}
        </wstack>
        {this.news && (
          <>
            <wspacer length={5} />
            <wstack borderRadius={10} padding={[5, 5, 5, 5]} flexDirection={'column'}>
              {this.news.map((item, index) => {
                return (
                  <>
                    <wstack href={item.news_url}>
                      <wstack flexDirection={'column'}>
                        <wtext font={addumFont} maxLine={1} textColor={this.fontColor}>
                          {item.title}
                        </wtext>
                        <wspacer length={5} />
                        <wtext font={addumFont} textColor={this.fontColor} opacity={0.5}>
                          {item.srcfrom}
                        </wtext>
                      </wstack>
                      <wspacer />
                      <wimage src={item.shortcut} width={40} height={30} borderRadius={4} />
                    </wstack>
                    {(this.news && this.news?.length - 1) !== index && <wspacer length={5} />}
                  </>
                );
              })}
            </wstack>
          </>
        )}
        <wspacer />
        <Footer />
      </wbox>
    );
  };
}

ICONCOLOR = 'purple'; // 小组件颜色
ICONGLYPH = 'bug'; // 小组件图标
EndAwait(() => new Widget().init());
