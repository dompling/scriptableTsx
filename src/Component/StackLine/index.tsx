import React, {FC} from 'react';
import RowCenter from '@app/Component/RowCeneter';

const StackLine: FC<{borderColor: string; flexDirection?: 'row' | 'column'}> = props => {
  return (
    <wstack background={props.borderColor}>
      <RowCenter flexDirection={props.flexDirection}>
        <wstack height={1} width={1} />
      </RowCenter>
    </wstack>
  );
};

export default StackLine;
