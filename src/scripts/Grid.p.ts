export class Grid {
    public disposer;
    private _runtime: GridRuntime;
    private _invoke;

    public constructor(container, $invoke) {
        this.disposer = new Fundamental.Disposer(() => {
            this._runtime = null;
        });

        if (!$invoke) {
            this._invoke = invoke.inherit();
        } else {
            this._invoke = $invoke.inherit();
        }

        this._runtime = new GridRuntime();
        this._runtime.width = NaN;
        this._runtime.height = NaN;
        this._runtime.dataContexts = {};
        this._runtime.container = container;
        this._runtime.id = (new Date()).valueOf();
        this._runtime.theme = Theme.Default;
        this._runtime.selectionMode = SelectionMode.SingleRow;
        this._runtime.events = null;
        this._runtime.rootClass = 'msoc-list-' + this._runtime.id;
        this._runtime.elements = {};
        this._runtime.direction = new Fundamental.TextDirection(Fundamental.TextDirection.LTR);

        // FIXME: initialize the injection

        this._invoke.inject('runtime', this._runtime);
        this._invoke.injectFactory('rootElement', (runtime) => {
            return $(
                '<div class="msoc-list ' + runtime.rootClass + '" tabindex="0" aria-labelledby="msocListScreenReader_' + runtime.id + '">' +
                    '<div id="msocListScreenReader_' + runtime.id + '" class="msoc-list-screen-reader" aria-live="assertive"></div>' +
                    '<div class="msoc-list-content">' +
                        '<div class="msoc-list-header-viewport">' +
                            '<div class="msoc-list-header-canvas-container">' +
                                '<div class="msoc-list-header-canvas"></div>' +
                                '<div class="msoc-list-header-canvas"></div>' +
                                '<div class="msoc-list-header-canvas"></div>' +
                            '</div>' +
                        '</div>' +
                        '<div name="msoc-list-viewport-' + runtime.id + '" class="msoc-list-viewport">' +
                            '<div class="msoc-list-canvas-container">' +
                                '<div class="msoc-list-canvas"></div>' +
                                '<div class="msoc-list-canvas"></div>' +
                                '<div class="msoc-list-canvas"></div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>');
        });

        // FIXME: initillize the plug-ins

        this._invoke((rootElement) => {
            this._runtime.rootElement = rootElement;

            var container = $(this._runtime.container);

            container.html('');
            container.append(rootElement);
        });

        // window.setTimeout(() => {
        //     // FIXME: [low][1 day] Add a firefox checker
        //     // Workaround FireFox bug https://bugzilla.mozilla.org/show_bug.cgi?id=706792
        //     this._elements.canvasContainer.css('width', '1000000px');
        //     this._elements.canvasContainer.css('height', '1000000px');
        //     this._elements.viewport.scrollLeft(0);
        //     this._elements.viewport.scrollTop(0);
        //     this._elements.canvasContainer.css('width', '');
        //     this._elements.canvasContainer.css('height', '');
        //     this._elements.headerCanvasContainer.css('width', '1000000px');
        //     this._elements.headerCanvasContainer.css('height', '1000000px');
        //     this._elements.headerViewport.scrollLeft(0);
        //     this._elements.headerViewport.scrollTop(0);
        //     this._elements.headerCanvasContainer.css('width', '');
        //     this._elements.headerCanvasContainer.css('height', '');
        // });
    }

    public dispose() {
        this.disposer.dispose();
    }

    public rowsDataContext(value?) {
        return Fundamental.PropertyBag.property({
            target: this._runtime.dataContexts,
            name: 'rowsDataContext',
            args: arguments,
            afterChange: (sender, args) => {
            },
        });
    }

    public columnsDataContext(value?) {
        return Fundamental.PropertyBag.property({
            target: this._runtime.dataContexts,
            name: 'columnsDataContext',
            args: arguments,
            afterChange: (sender, args) => {
            },
        });
    }

    public width(value?) {
        return Fundamental.PropertyBag.property({
            target: this._runtime,
            name: 'width',
            args: arguments,
            afterChange: (sender, args) => {
            },
        });
    }

    public height(value?) {
        return Fundamental.PropertyBag.property({
            target: this._runtime,
            name: 'height',
            args: arguments,
            afterChange: (sender, args) => {
            },
        });
    }
}

