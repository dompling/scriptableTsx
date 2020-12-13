import {isLaunchInsideApp, showActionSheet, showNotification, showPreviewOptions, useStorage} from '@app/lib/help';
import {WstackProps} from '@app/types/widget';
import {FC} from 'react';

interface actionsProps {
  title: string;
  func: any;
}

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

/**纵向居中组件*/
const ColCenter: FC<WstackProps> = ({children, ...props}) => {
  return (
    <wstack {...props} flexDirection="column">
      <wspacer />
      {children}
      <wspacer />
    </wstack>
  );
};

/**纵横都居中的组件*/
const Center: FC<WstackProps> = ({children, ...props}) => {
  return (
    <RowCenter {...props}>
      <ColCenter>{children}</ColCenter>
    </RowCenter>
  );
};

class TodayOilPrice {
  async init() {
    if (config.runsInApp) {
      await this.showMenu();
    }
    const widget = (await this.render()) as ListWidget;
    Script.setWidget(widget);
    Script.complete();
  }

  async getLocation() {
    const location = await Location.current();
    console.log(location);
  }

  //渲染组件
  async render(): Promise<unknown> {
    await this.getLocation();
    // 多久（毫秒）更新一次小部件（默认3小时）
    const updateInterval = 3 * 60 * 60 * 1000;
    return <wbox padding={[0, 0, 0, 0]} updateDate={new Date(Date.now() + updateInterval)}></wbox>;
  }

  // 显示菜单
  async showMenu() {
    const itemList: actionsProps[] = [
      {
        title: '预览组件',
        func: showPreviewOptions(this.render.bind(this)),
      },
    ];
    const selectIndex = await showActionSheet({
      title: '菜单',
      itemList: itemList.map(item => item.title),
    });
    const actionItem: actionsProps | undefined = itemList.find((_, index: number) => selectIndex === index);
    actionItem && (await actionItem.func());
  }
}

(async () => {
  new TodayOilPrice().init();
})();
