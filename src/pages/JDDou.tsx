import {FC} from 'react';
import Base, {RenderError} from '@app/Base';
import {WstackProps} from '@app/types/widget';
import {request, useSetting} from '@app/lib/help';

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
  name = '京东豆';
  en = 'JDDou';

  componentWillMount = async () => {};

  //渲染组件
  render = async (): Promise<unknown> => {
    return (
      <wbox
        background={(await this.getBackgroundImage()) || this.backgroundColor}
        padding={[0, 0, 0, 0]}
        updateDate={new Date(Date.now() + (await this.updateInterval()))}
      >
        <wstack />
      </wbox>
    );
  };
}

ICONCOLOR = 'purple'; // 小组件颜色
ICONGLYPH = 'oil-can'; // 小组件图标
EndAwait(() => new Widget().init());
