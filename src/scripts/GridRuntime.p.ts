export class GridRuntime {
    public id;
    public rootClass;
    public container;
    public dataContexts;
    public features;
    public events;
    public invoker;

    public direction;
    public width;
    public height;
    public theme;

    public selectionMode;

    public buildCssRootSelector(builder: Fundamental.CssTextBuilder, additinalSelector?: string) {
        builder.push('.');
        builder.push(this.rootClass);

        if (additinalSelector) {
            builder.push(additinalSelector);
        }

        builder.push(' ');
    }
}

