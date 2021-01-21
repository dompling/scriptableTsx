import React, {FC} from 'react';
import RowCenter from '@app/Component/RowCeneter';

const topDrawing = new DrawContext();
topDrawing.size = new Size(642, 100);
topDrawing.opaque = false;
topDrawing.respectScreenScale = true;

function fillRect(drawing: DrawContext, rect: Rect, color: string) {
  const path = new Path();
  path.addRoundedRect(rect, 0, 0);
  drawing.addPath(path);
  drawing.setFillColor(new Color(color, 1));
  drawing.fillPath();
}

function drawLine(drawing: DrawContext, rect: Rect, color: string, scale: number) {
  const x1 = Math.round(rect.x + scale * 1.5);
  const y1 = rect.y - scale;
  const x2 = Math.round(rect.width + scale * 1.5);
  const point1 = new Point(x1, y1);
  const point2 = new Point(x2, y1);
  const path = new Path();
  path.move(point1);
  path.addLine(point2);
  drawing.addPath(path);
  drawing.setStrokeColor(new Color(color, 1));
  drawing.setLineWidth(60 / (40 + 15 * scale));
  drawing.strokePath();
}

const Stack3DLine: FC<{borderColor: string; rect?: Rect; height?: number}> = ({borderColor, rect, height = 30}) => {
  const rectLine = rect || new Rect(0, 70, 610, 26);
  fillRect(topDrawing, rectLine, borderColor);
  for (let i = 0; i < 40; i++) {
    drawLine(topDrawing, rectLine, borderColor, i);
  }
  return (
    <wstack background={topDrawing.getImage()}>
      <RowCenter>
        <wstack height={height} width={1} />
      </RowCenter>
    </wstack>
  );
};

export default Stack3DLine;
