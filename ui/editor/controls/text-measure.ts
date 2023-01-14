export function measureTest(text:string, fontName: string, weight: string, fontSize: number): SizeInfo{

    let div = document.createElement('div');
    div.id = '__textMeasure';
    div.style.position = 'absolute';
    div.style.top = '-500px';
    div.style.left = '0';
    div.innerHTML = text;
    div.style.display = 'inline';
    div.style.fontFamily = fontName;
    div.style.fontWeight = weight;
    div.style.fontSize = fontSize + 'px';
    div.style.lineHeight = '1.4em';
    document.body.appendChild(div);

    let cssSize = {width: div.offsetWidth, height: div.offsetHeight},
        cssInfo = window.getComputedStyle(div, null),
        fontSizePx = parseFloat(cssInfo.fontSize);

    div.remove();
    let canvas = document.createElement('canvas'),
        context = canvas.getContext('2d');

    context.font = fontSizePx + 'px ' + fontName;
    context.textAlign = 'left';
    context.fillStyle = 'blue';
    context.textBaseline = 'alphabetic'

    let metrics = context.measureText(text);
    let metrics2 = context.measureText('a');
    let lineGap = (cssSize.height - (metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent)),
        advMetrics = {
            letterHeight: metrics2.actualBoundingBoxAscent,
            width: metrics.width,
            cssHeight: cssSize.height,
            cssFontSizePx: fontSizePx,
            fontAscent: metrics.fontBoundingBoxAscent,
            fontDescent: metrics.fontBoundingBoxDescent,
            actualAscent: metrics.actualBoundingBoxAscent,
            actualDescent: metrics.actualBoundingBoxDescent,
            lineHeight: cssSize.height,
            lineGap: lineGap,
            lineGapTop: lineGap / 2,
            lineGapBottom: lineGap / 2
        };

    return advMetrics;
}

export type SizeInfo = {
    letterHeight: number;
    width: number;
    cssHeight: number;
    cssFontSizePx: number;
    fontAscent: number;
    fontDescent: number;
    actualAscent: number;
    actualDescent: number;
    lineHeight: number;
    lineGap: number;
    lineGapTop: number;
    lineGapBottom: number;
}