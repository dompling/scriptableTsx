import React, {FC} from 'react';
import {WstackProps} from '@app/types/widget';
import RowCenter from '@app/Component/RowCeneter';

const JustCenter: FC<WstackProps> = ({children, ...props}) => {
  return (
    <RowCenter {...props}>
      <wstack flexDirection={props.flexDirection === 'column' ? 'row' : 'column'}>
        <wspacer />
        {children}
        <wspacer />
      </wstack>
    </RowCenter>
  );
};

export default JustCenter;
