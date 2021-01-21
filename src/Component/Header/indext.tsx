import React, {FC} from 'react';

const Header: FC<{title: string; textColor?: Color | string; icon: string}> = ({textColor, title, icon, children}) => {
  return (
    <wstack verticalAlign={'center'}>
      <wimage src={icon} borderRadius={3} width={15} height={15} />
      <wspacer length={5} />
      <wtext textColor={textColor} font={12}>
        {title}
      </wtext>
      <wspacer />
      {children}
    </wstack>
  );
};

export default Header;
