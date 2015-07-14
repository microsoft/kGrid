export interface IGridViewport {
    rootElement();
    frontContentCanvas();
    backContentCanvas();
    frontHeaderCanvas();
    backHeaderCanvas();
    scrollIntoView(rect);
}

