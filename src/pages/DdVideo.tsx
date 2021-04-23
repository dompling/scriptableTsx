import {FC} from 'react';
import Base, {actionsProps} from '@app/Base';
import {request, getRandomArrayElements, useSetting, showNotification} from '@app/lib/help';
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
      height={118}
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

  componentWillMount = async () => {
    this.registerAction('监控列表', this.delCollectTable, {
      name: 'folder.badge.minus',
      color: '#ff4d4f',
    });

    this.registerAction('低端影视', this.collectTable, {
      name: 'folder.badge.plus',
      color: '#bae637',
    });
  };

  componentDidMount = async () => {
    const req = await request({
      url: `http://api.sodion.net/api_v1/grap/ddrk?time=${today}`,
      method: 'GET',
      useCache: false,
    });
    const dataSource = req.data as SeasonProps[];
    const {getSetting} = useSetting(this.en);
    const collect = (await getSetting<string[]>('collect')) || [];
    const collectDataSource: SeasonProps[] = [];
    const _dataSource: SeasonProps[] = [];
    dataSource.forEach(item => {
      if (collect.indexOf(item.title.split(' ')[0]) !== -1) {
        collectDataSource.push(item);
      } else {
        _dataSource.push(item);
      }
    });
    const collectLen = collectDataSource.length;
    const data = collectLen < 6 ? [...collectDataSource, ..._dataSource.splice(0, 6 - collectLen)] : collectDataSource;
    if (config.widgetFamily === 'medium') this.dataSource = [data.splice(0, 3)];
    if (config.widgetFamily === 'large') this.dataSource = [data.splice(0, 3), data];
  };

  collectTable = async () => {
    const req = await request({
      url: `http://api.sodion.net/api_v1/grap/ddrk`,
      method: 'GET',
    });
    let dataSource = req.data as SeasonProps[];
    const {getSetting, setSetting} = useSetting(this.en);
    const collect = (await getSetting<string[]>('collect')) || [];
    dataSource = dataSource.filter(item => collect.indexOf(item.title.split(' ')[0]) === -1);
    const actions: actionsProps[] = dataSource.map(item => {
      const title = item.title.split(' ')[0];
      return {
        title: item.title,
        onClick: async (_: any, row: any) => {
          const collect = (await getSetting<string[]>('collect')) || [];
          if (collect.length === 6) return showNotification({title: '关注数已经达到最大，请去关注列表清除'});
          collect.push(title);
          await setSetting('collect', collect.slice(-6));
          table.removeRow(row);
          table.reload();
        },
        icon: {name: 'video.badge.plus'},
      } as actionsProps;
    });
    const table = new UITable();
    await this.showActionSheet(table, '低端影视每日更新（最多监控 6 部）', actions);
    await table.present();
  };

  delCollectTable = async () => {
    const table = new UITable();
    const {getSetting, setSetting} = useSetting(this.en);
    const collect = (await getSetting<string[]>('collect')) || [];
    const actions: actionsProps[] = collect.map((item, index) => {
      return {
        title: item,
        // dismissOnSelect: true,
        onClick: async (_: any, row: any) => {
          collect.splice(index, 1);
          await setSetting('collect', collect);
          table.removeRow(row);
          table.reload();
        },
        icon: {name: 'delete.right', color: '#ff4d4f'},
      } as actionsProps;
    });
    try {
      await this.showActionSheet(table, '删除关注', actions);
      await table.present();
    } catch (e) {
      console.log(e);
    }
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
                  {key !== this.dataSource.length - 1 && <wspacer />}
                </>
              );
            })}
          </wstack>
        </RowCenter>
        <wspacer length={5} />
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
