import {FC} from 'react';
import Base from '@app/Base';
import Header from '@app/Component/Header/indext';
import Stack3DLine from '@app/Component/Stack3DLine';
import {request, getRandomArrayElements, useSetting} from '@app/lib/help';
import RowCenter from '@app/Component/RowCeneter';

interface SeasonProps {
  cover: string;
  delay: number;
  ep_id: number;
  favorites: number;
  follow: number;
  is_published: number;
  pub_index: string;
  pub_time: string;
  pub_ts: number;
  season_id: number;
  season_status: number;
  square_cover: string;
  title: string;
  url: string;
}

const RowCell: FC<{
  data: SeasonProps;
}> = props => {
  const {cover, url, title, pub_time, pub_index} = props.data;
  return (
    <wstack
      href={url}
      background={cover}
      borderRadius={4}
      borderWidth={1}
      borderColor={'#e8e8e8'}
      flexDirection={'column'}
      width={89}
      height={105}
    >
      <wspacer length={5} />
      <wstack>
        <wspacer />
        <wstack background={new Color('#000', 0.3)} borderRadius={4} padding={[0, 5, 0, 5]}>
          <wtext textColor={'#fff'} font={12}>
            {pub_index}
          </wtext>
        </wstack>
        <wspacer length={5} />
      </wstack>
      <wspacer />
      <wstack background={new Color('#000', 0.3)}>
        <wstack flexDirection={'column'} padding={[10, 5, 10, 5]}>
          <wtext maxLine={1} textColor={'#fff'} font={12}>
            {title}
          </wtext>
          <wtext textColor={new Color('#fff', 0.7)} font={10}>
            更新：{pub_time}
          </wtext>
        </wstack>
        <wspacer />
      </wstack>
    </wstack>
  );
};

const format = new DateFormatter();
format.dateFormat = 'M-d';
const today = format.string(new Date());

const {getSetting} = useSetting('BiliBili');

class Widget extends Base {
  name = '今日番剧';
  en = 'BiliBili';
  logo = 'https://www.bilibili.com/favicon.ico?v=1';
  useBoxJS = false;
  dataSource: any[] = [];

  componentWillMount = async () => {
    this.registerAction('分割颜色', async () => {
      return this.showAlertCatchInput('分割颜色', '分割线颜色', {light: '白天', dark: '夜间'}, 'line');
    });
  };

  componentDidMount = async () => {
    const req = await request({
      url: `https://bangumi.bilibili.com/web_api/timeline_global?time=${today}`,
      method: 'GET',
      useCache: true,
    });
    const response = req.data as {result: any[]; [key: string]: any};
    if (response.code === 0 && response.result.length > 0) {
      const dataSource = response.result;
      this.dataSource = (dataSource.find(item => item.date === today) || {}).seasons || [];
    }
    let size = 0;
    if (config.widgetFamily === 'medium') size = 3;
    if (config.widgetFamily === 'large') size = 6;
    this.dataSource = getRandomArrayElements(this.dataSource, size);
    this.dataSource = this.dataSource.length > 3 ? [this.dataSource.splice(0, 3), this.dataSource] : [this.dataSource];
  };

  render = async (): Promise<unknown> => {
    let lineColor: any = await getSetting<{light: string; dark: string}>('line');
    if (lineColor) {
      lineColor = Device.isUsingDarkAppearance() ? lineColor.dark : lineColor.light;
    } else {
      lineColor = '#e8e8e8';
    }
    return (
      <wbox
        background={(await this.getBackgroundImage()) || this.backgroundColor}
        updateDate={new Date(Date.now() + (await this.updateInterval()))}
      >
        <Header icon={this.logo} title={this.name} textColor={this.fontColor} />
        <wspacer length={10} />
        {config.widgetFamily === 'large' && (
          <>
            <Stack3DLine borderColor={lineColor} height={10} />
            <wspacer length={10} />
          </>
        )}
        <RowCenter>
          <wstack flexDirection={'column'}>
            {this.dataSource.map((item: SeasonProps[]) => {
              return (
                <>
                  <wstack>
                    {item.map((season, index) => (
                      <>
                        <RowCell data={season} />
                        {index !== item.length ? <wspacer length={10} /> : item.length !== 3 ? <wspacer /> : ''}
                      </>
                    ))}
                  </wstack>
                  {config.widgetFamily === 'large' && <Stack3DLine borderColor={lineColor} height={20} />}
                  <wspacer />
                </>
              );
            })}
          </wstack>
        </RowCenter>
        <wspacer />
      </wbox>
    );
  };
}

ICONCOLOR = 'purple'; // 小组件颜色
ICONGLYPH = 'tv'; // 小组件图标
EndAwait(() => new Widget().init());
