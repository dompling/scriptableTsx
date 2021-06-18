import {FC} from 'react';
import Base from '@app/Base';
import {WstackProps} from '@app/types/widget';
import {request, useSetting} from '@app/lib/help';
import StackLine from '@app/Component/StackLine';
import RowCenter from '@app/Component/RowCeneter';

const en = 'CountDown';

let weeks = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const referenceTime = new Date('2001/01/01').getTime();
let $calendar: any = {};
let $calendarEvents: CalendarEvent[] = [];

const $eventsBtn: {
  title: string;
  time: Date;
}[] = [];

async function getNextCalendarEvent() {
  const events = await CalendarEvent.thisWeek([]);
  const nextWeek = await CalendarEvent.nextWeek([]);
  events.push(...nextWeek);
  return events
    .filter(calendar => {
      const diff = dateDiff(new Date(), calendar.endDate);
      if (diff < 0) return false;
      return !calendar.title.startsWith('Canceled:');
    })
    .map(item => ({title: item.title, time: item.startDate}))
    .splice(0, 2);
}

function dateDiff(first: Date, second: Date) {
  const firstDate: any = new Date(first.getFullYear(), first.getMonth(), first.getDate(), 0, 0, 0);
  const secondDate: any = new Date(second.getFullYear(), second.getMonth(), second.getDate(), 0, 0, 0);
  return Math.round((secondDate - firstDate) / (1000 * 60 * 60 * 24));
}

function getMonthDays(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getWeekday(year: number, month: number, day: number | undefined) {
  return new Date(year, month, day).getDay();
}

function getPreMonth(year: number, month: number) {
  if (month === 0) return [year - 1, 11];
  return [year, month - 1];
}

function getNextMonth(year: number, month: number) {
  if (month === 11) return [year + 1, 0];
  return [year, month + 1];
}

async function getMonthDaysArray(year: any, month: number, day: number) {
  const dayArrays: calendarInterface[] = [];

  const preMonth = getPreMonth(year, month);
  const nextMonth = getNextMonth(year, month);

  const days = getMonthDays(year, month),
    preDays = getMonthDays(preMonth[0], preMonth[1]);
  const thisMonthFirstDayInWeek = getWeekday(year, month, 1),
    thisMonthLastDayInWeek = getWeekday(year, month, days);

  //上月在当月日历面板中的排列
  for (let i = 0; i < thisMonthFirstDayInWeek; i++) {
    const date = new Date(preMonth[0], preMonth[1], i);
    let lunar = $calendar.solar2lunar(date.getFullYear(), date.getMonth() + 1, date.getDate());
    lunar = lunar.IDayCn;
    dayArrays.push({
      date,
      text: lunar,
      day: preDays - thisMonthFirstDayInWeek + i + 1,
      weekDay: weeks[i],
      weekNum: i,
    });
  }
  //当月日历面板中的排列
  for (let i = 1; i <= days; i++) {
    const weekDayFlag = (thisMonthFirstDayInWeek + i - 1) % 7;
    const date = new Date(year, month, i);
    let lunar = $calendar.solar2lunar(date.getFullYear(), date.getMonth() + 1, date.getDate());
    lunar = lunar.IDayCn;
    dayArrays.push({
      day: i,
      date,
      text: lunar,
      weekDay: weeks[weekDayFlag],
      selected: i === +day,
      isThisMonth: true,
      weekNum: weekDayFlag,
    });
  }
  //下月在当月日历面板中的排列
  for (let i = 1; i <= 6 - thisMonthLastDayInWeek; i++) {
    const weekDayFlag = (thisMonthFirstDayInWeek + days + i - 1) % 7;
    const date = new Date(nextMonth[0], nextMonth[1], i);
    let lunar = $calendar.solar2lunar(date.getFullYear(), date.getMonth() + 1, date.getDate());
    lunar = lunar.IDayCn;
    dayArrays.push({
      date,
      day: i,
      text: lunar,
      weekDay: weeks[weekDayFlag],
      weekNum: weekDayFlag,
    });
  }
  return dayArrays;
}

async function getCalendarEvent(start: Date, end: Date): Promise<CalendarEvent[]> {
  const events = await CalendarEvent.between(start, end);
  return events.filter(event => event.calendar.title.includes('节假日'));
}

interface calendarInterface {
  date: Date;
  day: number;
  text: string;
  weekDay: string;
  selected?: boolean;
  isThisMonth?: boolean;
  weekNum: number;
  calendarEvent?: CalendarEvent | undefined;
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

const CreateCalendarItem: FC<{text: string; color: string; data?: calendarInterface}> = props => {
  const stackProps: WstackProps = {};
  const {data} = props;
  const {text, calendarEvent, day} = data || {};
  if (text) stackProps.flexDirection = 'column';
  let textColor = props.color;
  if (!data) {
    if (props.text === '周六' || props.text === '周日') textColor = '#aaa';
  } else {
    if (!data?.isThisMonth || data.weekNum === 0 || data.weekNum === 6) textColor = '#aaa';
    stackProps.href = 'calshow:' + (data.date.getTime() - referenceTime) / 1000;
    if (data?.selected) stackProps.background = '#006666';
    if (data?.selected) textColor = '#fff';
  }

  return (
    <wstack flexDirection={'column'} verticalAlign={'center'} width={text ? 30 : 34} height={text ? 34 : 30}>
      <wstack {...stackProps} borderRadius={5} width={30} height={30} verticalAlign={'center'}>
        {text ? (
          <>
            <wstack width={30} height={15}>
              <wtext font={12} textColor={textColor} textAlign={'center'}>
                {day}
              </wtext>
            </wstack>
            <wstack width={30} height={15}>
              <wtext font={7} textColor={textColor} textAlign={'center'}>
                {calendarEvent ? calendarEvent.title : text}
              </wtext>
            </wstack>
          </>
        ) : (
          <wtext font={14} textColor={textColor} textAlign={'center'}>
            {props.text}
          </wtext>
        )}
      </wstack>
      {calendarEvent && config.widgetFamily !== 'large' && (
        <RowCenter>
          <wstack width={4} height={4} background={`#${calendarEvent.calendar.color.hex}`} borderRadius={2} />
        </RowCenter>
      )}
    </wstack>
  );
};

const CreateCalendar: FC<{color: string; data: any[]}> = ({color, data}) => {
  return (
    <RowCenter flexDirection={'column'}>
      <RowCenter>
        {weeks.map((week, index) => (
          <>
            <CreateCalendarItem color={color} text={week} />
            {index !== weeks.length - 1 && <wspacer />}
          </>
        ))}
      </RowCenter>
      <RowCenter flexDirection={'column'}>
        {data.map((dataItem, dataKey: number) => {
          return (
            <>
              <RowCenter>
                {dataItem.map((item: any, index: number) => {
                  return (
                    <>
                      <CreateCalendarItem color={color} text={`${item.date.getDate()}`} data={item} />
                      {index !== dataItem.length - 1 && <wspacer />}
                    </>
                  );
                })}
              </RowCenter>
              {dataKey !== data.length - 1 && <wspacer />}
            </>
          );
        })}
      </RowCenter>
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
      href={`calshow:${(time.getTime() - referenceTime) / 1000}`}
    >
      <RowCenter>
        <wtext font={10} textColor={color}>
          {title}
        </wtext>
      </RowCenter>
      <wdate date={time} mode={'timer'} font={10} textColor={'#00bbbb'} textAlign={'center'} />
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
      {config.widgetFamily !== 'small' && (
        <>
          <wspacer length={10} />
          {events.map((item, index) => (
            <>
              <CreateCalendarEvent color={props.color} time={item.time} title={item.title} />
              {index !== events.length - 1 && <wspacer length={5} />}
            </>
          ))}
        </>
      )}
    </wstack>
  );
};

class Widget extends Base {
  name = '休息日倒计时';
  en = en;
  date = new Date();
  dataSource: any = [];
  useBoxJS = false;

  componentWillMount = async () => {
    this.registerAction('下班时间', async () => {
      const options = {time: '17:30:00'};
      await this.showAlertCatchInput('下班时间', '设置下班结束时间', options, 'work');
    });
  };

  componentDidMount = async () => {
    const {getSetting} = useSetting(this.en);
    let time: any = ((await getSetting<{time: string}>('work')) || {}).time;
    $calendar = await getCalendarJs();
    if (time) {
      time = time.split(':');
      const day = this.date.getDay();
      if (day > 0 && day < 6) {
        const event: any = {};
        event.title = '下班时间';
        this.date.setHours(parseInt(time[0]), parseInt(time[1]), parseInt(time[2]));
        event.time = this.date;
        $eventsBtn.push(event);
      }
    }
    $eventsBtn.push(...(await getNextCalendarEvent()));
    await this.createCalendar();
  };

  createCalendar = async () => {
    const year = this.date.getFullYear();
    const month = this.date.getMonth();
    const day = this.date.getDate();
    const week = this.date.getDay();
    this.dataSource = await getMonthDaysArray(year, month, day);
    $calendarEvents = await getCalendarEvent(this.dataSource[0].date, this.dataSource[this.dataSource.length - 1].date);
    let thisWeekIndex = 0;
    this.dataSource = this.dataSource.map((item: calendarInterface, index: number) => {
      if (item.date.getDate() === day && item.date.getMonth() === month) thisWeekIndex = index;
      const calendarEvent = $calendarEvents.find(
        event =>
          event.startDate.getDate() === item.date.getDate() && event.startDate.getMonth() === item.date.getMonth(),
      );
      return {...item, calendarEvent};
    });
    if (config.widgetFamily === 'medium') {
      const start = thisWeekIndex - week;
      console.log(thisWeekIndex);
      this.dataSource = this.dataSource.splice(start, 7);
    } else if (config.widgetFamily === 'small') {
      this.dataSource = [
        this.dataSource[thisWeekIndex - 1],
        this.dataSource[thisWeekIndex],
        this.dataSource[thisWeekIndex + 1],
      ];
      weeks = this.dataSource.map((item: calendarInterface) => item.weekDay);
    }
    console.log(this.dataSource);

    const data: any[] = [[]];
    let i = 0;
    this.dataSource.forEach((item: any) => {
      if (data[i].length === 7) {
        i += 1;
        data[i] = [];
      }
      data[i].push(item);
    });
    this.dataSource = data;
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
