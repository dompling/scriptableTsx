import {FC} from 'react';
import Base from '@app/Base';
import {WstackProps} from '@app/types/widget';
import {request, useSetting} from '@app/lib/help';

const en = 'CountDown';

const weeks = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
let $calendar: any = {};
let $calendarEvent: CalendarEvent[] = [];
const $eventsBtn: {
  title: string;
  time: Date;
}[] = [];
const curr = new Date();
const today = curr.getDate();

interface calendarInterface {
  date: Date;
  lunar: string;
  isToday: boolean;
}

async function getCalendarJs() {
  const response = await request({
    url: 'https://gitee.com/domp/jnc_lunch/raw/master/public/calendar.js',
    dataType: 'text',
  });
  return evil(response.data);
}

function evil(str: unknown) {
  return new Function('return ' + str)()();
}

async function getRangeCalendarEvent(start: Date, end: Date) {
  const events = await CalendarEvent.between(start, end, []);
  return events.filter(calendar => {
    const diff = dateDiff(new Date(), calendar.endDate);
    if (diff < 0) return false;
    return !calendar.title.startsWith('Canceled:');
  });
}

function dateDiff(first: Date, second: Date) {
  const firstDate: any = new Date(first.getFullYear(), first.getMonth(), first.getDate(), 0, 0, 0);
  const secondDate: any = new Date(second.getFullYear(), second.getMonth(), second.getDate(), 0, 0, 0);
  return Math.round((secondDate - firstDate) / (1000 * 60 * 60 * 24));
}

const CreateCalendarItem: FC<{text: string; color: string; data?: calendarInterface}> = props => {
  const stackProps: WstackProps = {};
  const {data} = props;
  let {lunar} = data || {};
  if (lunar) stackProps.flexDirection = 'column';
  if (data?.isToday) stackProps.background = '#006666';
  const textColor = data?.isToday ? '#fff' : props.color;
  let circle = '';
  if (data?.date) {
    $calendarEvent.forEach(item => {
      const time = dateDiff(data?.date, item.startDate);
      if (time === 0 && item.calendar.title.includes('节假日')) {
        lunar = item.title;
        circle = item.calendar.color.hex;
      }
    });
  }
  return (
    <wstack {...stackProps} borderRadius={5} width={40} height={40} verticalAlign={'center'}>
      {lunar ? (
        <>
          <RowCenter>
            <wtext font={16} textColor={textColor} textAlign={'center'}>
              {props.text}
            </wtext>
          </RowCenter>
          <RowCenter>
            <wtext font={7} textColor={textColor} textAlign={'center'}>
              {lunar}
            </wtext>
          </RowCenter>
          {circle && (
            <>
              <wspacer length={2} />
              <RowCenter>
                <wstack width={4} height={4} borderRadius={4} background={circle} />
              </RowCenter>
            </>
          )}
        </>
      ) : (
        <wtext font={16} textColor={props.color} textAlign={'center'}>
          {props.text}
        </wtext>
      )}
    </wstack>
  );
};

const CreateCalendar: FC<{color: string; data: any[]}> = ({color, data}) => {
  const space = 5;
  return (
    <RowCenter flexDirection={'column'}>
      <RowCenter>
        {weeks.map((week, index) => (
          <>
            <CreateCalendarItem color={color} text={week} />
            {index !== weeks.length - 1 && <wspacer length={space} />}
          </>
        ))}
      </RowCenter>
      <wspacer />
      {data.map(dataItem => {
        return (
          <>
            <RowCenter>
              {dataItem.map((item: any, index: number) => {
                const textColor = index === 6 || index === 0 ? '#aaa' : color;
                return (
                  <>
                    <CreateCalendarItem color={textColor} text={`${item.date.getDate()}`} data={item} />
                    {index !== dataItem.length - 1 && <wspacer length={space} />}
                  </>
                );
              })}
            </RowCenter>
            <wspacer />
          </>
        );
      })}
    </RowCenter>
  );
};

const CreateCalendarEvent: FC<{title: string; time: Date; color: string | Color | undefined}> = ({
  color,
  time,
  title,
}) => {
  return (
    <wstack
      flexDirection={'column'}
      verticalAlign={'center'}
      borderColor={'#f4f4f4'}
      borderWidth={1}
      borderRadius={4}
      width={65}
      height={35}
    >
      <RowCenter>
        <wtext font={10} textColor={color}>
          {title}
        </wtext>
      </RowCenter>
      <RowCenter>
        <wdate date={time} mode={'timer'} font={10} textColor={'#00bbbb'} />
      </RowCenter>
    </wstack>
  );
};

const RowCenter: FC<WstackProps> = ({children, ...props}) => {
  return (
    <wstack {...props}>
      <wspacer />
      {children}
      <wspacer />
    </wstack>
  );
};

const StackLine: FC<{borderColor: string}> = props => {
  return (
    <wstack background={props.borderColor}>
      <RowCenter>
        <wstack height={1} width={1} />
      </RowCenter>
    </wstack>
  );
};

const StackHeader = (props: {color: string | Color | undefined}) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const toDay = now.getDate();
  let lunar = $calendar.solar2lunar(year, month, toDay);
  lunar = `农历${lunar.IMonthCn}${lunar.IDayCn}`;
  const events = $eventsBtn.splice(0, 3);
  return (
    <wstack verticalAlign={'center'} padding={[10, 20, 10, 20]}>
      <wstack verticalAlign={'center'} flexDirection={'column'}>
        <wtext font={13} textColor={props.color}>
          {year}年{month}月
        </wtext>
        <wtext font={12} textColor={props.color}>
          {lunar}
        </wtext>
      </wstack>
      <wspacer length={10} />
      {events.map((item, index) => (
        <>
          <CreateCalendarEvent color={props.color} time={item.time} title={item.title} />
          {index !== events.length - 1 && <wspacer length={5} />}
        </>
      ))}
    </wstack>
  );
};

class Widget extends Base {
  name = '休息日倒计时';
  en = en;
  date = new Date();
  dataSource: any[] = [];
  state = {
    week: this.date.getDay() || 7,
    friday: 0,
    lunar: '',
    today: '',
  };
  useBoxJS = false;
  private currentFriday: any;

  componentDidMount = async () => {
    this.registerAction('下班时间', async () => {
      const options = {time: '17:30:00'};
      await this.showAlertCatchInput('下班时间', '设置下班结束时间', options, 'work');
    });

    const {getSetting} = useSetting(this.en);
    const time = ((await getSetting<{time: string}>('work')) || {}).time || '17:30:00';

    $calendar = await getCalendarJs();
    this.state.friday = 5 - this.state.week;
    const {friday} = this.state;
    const now = this.date.getTime();
    this.currentFriday = new Date();
    let currentFriday = now + Math.abs(friday) * 1000 * 60 * 60 * 24;
    const event: any = {};
    if (friday) {
      event.title = '周五时间';
    } else if (friday === 0) {
      event.title = '下班时间';
      const dateFormat = new DateFormatter();
      dateFormat.dateFormat = 'YYYY/MM/dd ' + time;
      const dateStr = dateFormat.string(this.currentFriday);
      currentFriday = new Date(dateStr).getTime();
    } else {
      event.title = '休息结束';
    }
    this.currentFriday.setTime(currentFriday);
    event.time = this.currentFriday;
    $eventsBtn.push(event);
    const weekOffset = config.widgetFamily === 'large' ? [-21, -14, -7, 0, 7] : [0];
    this.dataSource = await this.createCalendar(weekOffset);
  };

  createCalendar = async (weekOffset: number[]) => {
    const range = weekOffset.length;
    const data = [];
    for (let i = 1; i <= range; i++) {
      const dataItem: calendarInterface[] = [];
      for (let col = 0; col < 7; col++) {
        const offset = weekOffset[i - 1];
        const dateOfFirstDayOfThisWeek = new Date(curr.setDate(curr.getDate() - curr.getDay()));
        const day = new Date(dateOfFirstDayOfThisWeek.setDate(dateOfFirstDayOfThisWeek.getDate() + offset + col));
        let lunar: any;
        const year = day.getFullYear();
        const month = day.getMonth() + 1;
        const toDay = day.getDate();
        lunar = $calendar.solar2lunar(year, month, toDay);
        lunar = lunar.IDayCn;
        dataItem.push({date: day, lunar, isToday: day.getDate() === today});
      }
      data.push(dataItem);
    }
    $calendarEvent = await getRangeCalendarEvent(
      data[0][0].date,
      data[data.length - 1][data[data.length - 1].length - 1].date,
    );
    $eventsBtn.push(...$calendarEvent.map(item => ({title: item.title, time: item.startDate})));
    return data;
  };

  render = async (): Promise<unknown> => {
    return (
      <wbox
        padding={[0, 0, 0, 0]}
        background={(await this.getBackgroundImage()) || this.backgroundColor}
        updateDate={new Date(Date.now() + (await this.updateInterval()))}
      >
        <StackHeader color={this.fontColor} />
        <StackLine borderColor={'#e8e8e8'} />
        <CreateCalendar color={this.fontColor} data={this.dataSource} />
        <wspacer />
      </wbox>
    );
  };
}

ICONCOLOR = 'purple'; // 小组件颜色
ICONGLYPH = 'calendar'; // 小组件图标
EndAwait(() => new Widget().init());
