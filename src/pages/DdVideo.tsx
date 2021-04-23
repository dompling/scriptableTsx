import {FC} from 'react';
import Base from '@app/Base';
import Stack3DLine from '@app/Component/Stack3DLine';
import {request, getRandomArrayElements, useSetting} from '@app/lib/help';
import RowCenter from '@app/Component/RowCeneter';

interface SeasonProps {
  href: string;
  img: string;
  meta: string;
  title: string;
  update: string;
}

const RowCell: FC<{
  data: SeasonProps;
}> = props => {
  const {href, img, title, update} = props.data;
  return (
    <wstack
      href={href}
      background={img}
      borderRadius={8}
      borderWidth={1}
      borderColor={'#e8e8e8'}
      flexDirection={'column'}
      width={91}
      height={108}
    >
      <wspacer />
      <wstack background={new Color('#000', 0.3)}>
        <wstack flexDirection={'column'} padding={[10, 5, 10, 5]}>
          <wtext maxLine={1} textColor={'#fff'} font={12}>
            {title}
          </wtext>
          <wtext maxLine={1} textColor={new Color('#fff', 0.7)} font={10}>
            {update}
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

class Widget extends Base {
  name = '低端影视';
  en = 'DDYs';
  useBoxJS = false;
  dataSource: SeasonProps[][] = [];

  componentDidMount = async () => {
    const req = await request({
      url: `http://api.sodion.net/api_v1/grap/ddrk?time=${today}`,
      method: 'GET',
      useCache: true,
    });
    let size = 0;
    if (config.widgetFamily === 'medium') size = 3;
    if (config.widgetFamily === 'large') size = 6;
    const dataSource = getRandomArrayElements(req.data as SeasonProps[], size);
    this.dataSource = dataSource.length > 3 ? [dataSource.splice(0, 3), dataSource] : [dataSource];
  };

  //当前时间
  nowTime(): string {
    const date = new Date();
    return date.toLocaleTimeString('chinese', {hour12: false});
  }

  render = async (): Promise<unknown> => {
    return (
      <wbox
        background={(await this.getBackgroundImage()) || this.backgroundColor}
        updateDate={new Date(Date.now() + (await this.updateInterval()))}
      >
        <RowCenter>
          <wstack flexDirection={'column'} verticalAlign={'center'}>
            {this.dataSource.map((item, key) => {
              return (
                <>
                  <wstack>
                    {item.map((season, index) => (
                      <>
                        <RowCell data={season} />
                        {item.length - 1 !== index && <wspacer />}
                      </>
                    ))}
                  </wstack>
                  {key !== item.length - 1 && <wspacer />}
                </>
              );
            })}
          </wstack>
        </RowCenter>
        <wspacer />
        <wstack verticalAlign="center">
          <wspacer />
          <wimage src={'https://vip1.loli.net/2020/04/28/nFYo8RsaT72v3y5.png'} width={75} height={15} />
          <wspacer length={10} />
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
ICONGLYPH = 'tv'; // 小组件图标
EndAwait(() => new Widget().init());
