import React, {FC} from 'react';
import {WstackProps} from '@app/types/widget';

const RowCenter: FC<WstackProps> = ({children, ...props}) => {
  return (
    <wstack {...props}>
      <wspacer />
      {children}
      <wspacer />
    </wstack>
  );
};

export default RowCenter;
