var controls: any = Microsoft.Office.Controls;

module Microsoft.Office.Controls {
    export class ListControlHelper {
        public static createDropDown(menuDefinitions, options) {
            var menu = $('<div class="dropdown msoc-enhanced-list-dropdown"><button class="dropdown-toggle"></button><ul class="dropdown-menu dropdown-menu-right" role="menu" aria-labelledby="dropdownMenu1"></ul></div>');

            var menuItemContainer = menu.find('ul');

            function closeMenu() {
                menu.removeClass('open');

                if (menuDefinitions.onClose) {
                    menuDefinitions.onClose();
                }
                state = 'close';
                menu.remove();
            }

            function createMenuItemClickCallback(item) {
                return () => {
                    if (state != 'open') {
                        return;
                    }

                    var args = {
                        close: true,
                        checked: item.checked,
                    };

                    if (item.onClick) {
                        item.onClick(item, args);
                    }

                    if (args.close) {
                        closeMenu();
                    } else {
                        if (args.checked) {
                            item.element.find('a > i').css('visibility', 'visible');
                        } else {
                            item.element.find('a > i').css('visibility', 'hidden');
                        }

                        item.checked = args.checked;
                    }
                }
            }

            var items = menuDefinitions.items;
            var state = 'initial';

            for (var i = 0; i < items.length; i++) {
                var item = items[i];
                var menuItem;

                if (item.data != '-') {
                    menuItem = $('<li role="presentation"><a role="menuitem" tabindex="-1" href="javascript:void(0)"><i class="msoc-enhanced-list-dropdowncheck ms-Icon ms-Icon--check"></i><span/></a></li>');
                    menuItem.find('a > span').text(item.data);
                    menuItem.find('a').on('click', createMenuItemClickCallback(item));

                    if (!item.checked) {
                        menuItem.find('a > i').css('visibility', 'hidden');
                    }
                } else {
                    menuItem = $('<li role="presentation" class="divider"></li>');
                }

                item.element = menuItem;
                menuItemContainer.append(menuItem);
            }

            var dropDown: any = menu.find('.dropdown-toggle');

            dropDown.on('focusout', (event) => {
                    if (state != 'open') {
                        return;
                    }

                    // Check if user mousedown on the menu item
                    if (!$.contains(menu.get(0), event.relatedTarget)) {
                        closeMenu();
                    } else {
                        dropDown.focus();
                    }
                });

            (<any>menu).open = () => {
                dropDown.dropdown('toggle');

                var menuWidth = menu.find('ul').width();

                if (menuWidth > options.end) {
                    menu.css(options.direction.front(), menuWidth);
                }
                dropDown.focus();
                state = 'open';
            }

            (<any>menu).close = () => {
                if (state != 'open') {
                    return;
                }

                closeMenu();
            }

            (<any>menu).dispose = () => {
                $(window).off('resize', windowResizeHandler);
            };

            menu.css(options.direction.front(), options.end);
            menu.css('top', options.bottom);

            var windowResizeHandler = () => {
                closeMenu();
                (<any>menu).dispose();
            };

            $(window).on('resize', windowResizeHandler);

            return menu;
         }
    }

    export class EnhancedListCellRender {
        private _column;
        private _alignToEnd;

        constructor(column, alignToEnd = false) {
            this._column = column;
            this._alignToEnd = alignToEnd;
        }

        public title(args) {
            var result = this._getValue(args);

            if (result.state == 'done') {
                return result.value;
            }
        }

        public render(args) {
            var result = this._getValue(args), resolvedValue;

            switch (result.state) {
                case 'done':
                    resolvedValue = result.value;
                    break;

                case 'resolving':
                    resolvedValue = result.state;
                    break;

                case 'fail':
                case 'retrying':
                    resolvedValue = result.state + ': ' + result.failCount;
                    break;
            }

            if (typeof(resolvedValue) == 'function') {
                resolvedValue(args.element);
            } else {
                args.element.textContent = resolvedValue;
                args.element.setAttribute('title', resolvedValue);
            }

            if (this._alignToEnd && args.view != controls.ViewType.Stack) {
                args.element.style.textAlign = args.rtl ? 'left' : 'right';
            }

            return result.promise;
        }

        private _getValue(args): any {
            if (!args.cellData) {
                return {
                    state: 'done',
                    value: '',
                };
            } else if (!args.cellData.resolver) {
                return {
                    state: 'done',
                    value: typeof(args.cellData.displayValue) == 'undefined' ? '' : args.cellData.displayValue,
                };
            } else {
                if (typeof(args.cellData.rawValue) == 'undefined' || args.cellData.rawValue === null) {
                    return {
                        state: 'done',
                        value: '',
                    };
                }

                if (!args.cellData.resolve) {
                    args.cellData.resolve = {
                        state: 'initial',
                        failCount: 0,
                    };
                }

                if (args.cellData.resolve.state == 'done') {
                    return {
                        state: 'done',
                        value: args.cellData.displayValue,
                    }
                }

                if (args.cellData.resolve.state == 'resolving') {
                    return {
                        state: args.cellData.resolve.failCount > 0 ? 'retrying' : 'resolving',
                        failCount: args.cellData.resolve.failCount,
                    };
                }

                if (args.cellData.resolve.state == 'fail' && args.cellData.resolve.failCount >= 3) {
                    return {
                        state: 'fail',
                        failCount: args.cellData.resolve.failCount,
                    };
                }

                var resolve;

                if (typeof(args.cellData.resolver) == 'string') {
                    resolve = eval(args.cellData.resolver);
                } else {
                    resolve = args.cellData.resolver;
                }

                args.cellData.resolve.state = 'resolving';

                var promise = resolve(args.cellData.rawValue)
                    .done((value) => {
                        args.cellData.displayValue = value;
                        args.cellData.resolve.state = 'done';
                        args.cellData.resolve.failCount = 0;
                    })
                    .fail(() => {
                        args.cellData.resolve.state = 'fail';
                        args.cellData.resolve.failCount++;
                    });

                // BUG? If we failed to resolve data in synchronizd mode, we will return fail directly
                if (args.cellData.resolve.state == 'resolving') {
                    return {
                        state: args.cellData.resolve.failCount > 0 ? 'retrying' : 'resolving',
                        failCount: args.cellData.resolve.failCount,
                        promise: promise,
                    };
                } else {
                    return {
                        state: args.cellData.resolve.state,
                        failCount: args.cellData.resolve.failCount,
                        value: args.cellData.displayValue,
                    };
                }
            }
        }
    }

    export class EnhancedListFirstCellRender {
        private _column;
        private _enhancedListControl;

        constructor(enhancedListControl, column) {
            this._enhancedListControl = enhancedListControl;
            this._column = column;
        }

        public title(args) {
            return '';
        }

        public render(args) {
            var selectedRange = this._enhancedListControl.selectedRangeOfPosition(new controls.Position(args.rowIndex, args.columnIndex)),
                selected = !!(selectedRange && selectedRange.type() == controls.RangeType.Row);

            var checker = $('<div><i class="ms-Icon ms-Icon--check"></i></div>');
            if (!args.cellData || !args.cellData.edit) {
                if (selected && this._enhancedListControl.editable()) {
                    $(args.element).append(checker);
                }
                else {
                    args.element.textContent = null;
                }
            } else {
                args.element.textContent = null;
            }
        }
    }


    export class EnhancedListHeaderCellRender {
        private _column;
        private _enhancedListControl;
        private _alignToEnd;

        constructor(enhancedListControl, column, alignToEnd = false) {
            this._column = column;
            this._enhancedListControl = enhancedListControl;
            this._alignToEnd = alignToEnd;
        }

        public title(args) {
            return this._getSubject(args);
        }

        public render(args) {
            var value = this._getSubject(args),
                icons = this._getIcons(args),
                direction = new controls.Fundamental.TextDirection(args.rtl);

            if (args.view == controls.ViewType.Stack) {
                args.element.textContent = value;
                $(args.element).attr('title', value);
                $(args.element).css('text-align', direction.front());
            } else {
                var element = $('<div class="msoc-enhanced-list-header-text"></div><div class="msoc-enhanced-list-icon-area"></div>'),
                    checkbox = $('<div class="msoc-enhanced-list-header-text"></div><div><i class="ms-Icon ms-Icon--checkboxEmpty"></i></div>'),
                    textElement = element.eq(0),
                    width = args.width,
                    height = args.height,
                    theme = args.theme,
                    headerCellPadding = theme.value('table.headerCellPadding'),
                    showDropDown = this._column.sortable || this._column.filterable,
                    dropDownWidth = showDropDown ? 26 : 0;


                $(args.element).html('');
                if (args.columnUniqueId == this._enhancedListControl.firstColumnUniqueId())
                {
                    if (this._enhancedListControl.editable()) {
                        $(args.element).append(checkbox);
                    }
                    else {
                        args.element.textContent = null;
                }
                }
                else
                {
                    $(args.element).append(element);
                }
                textElement.get(0).textContent = value;
                textElement.attr('title', value);
                textElement.css('text-align', this._alignToEnd ? direction.end() : direction.front());
                element.css('top', headerCellPadding.top + 'px');
                element.css('height', (height - headerCellPadding.top - headerCellPadding.bottom) + 'px');
                element.css('line-height', (height - headerCellPadding.top - headerCellPadding.bottom) + 'px');
                element.eq(1).css(direction.end(), (dropDownWidth + headerCellPadding.end) + 'px');
                element.eq(1).css('text-align', 'center');

                if (showDropDown) {
                    var dropDown = $('<div class="msoc-enhanced-list-context-button"><i class="ms-Icon ms-Icon--chevronDown"></i></div>');

                    $(args.element).append(dropDown);
                    dropDown.css(direction.end(), headerCellPadding.end + 'px');
                }

                for (var i = 0; i < icons.length; i++) {
                    element.eq(1).append('<i class="ms-Icon ms-Icon--' + icons[i] + '"></i>');
                }

                element.eq(1).css('width', (26 * icons.length) + 'px');
                element.eq(0).css(direction.end(), (dropDownWidth + 26 * icons.length + headerCellPadding.end) + 'px');
                element.eq(0).css(direction.front(), headerCellPadding.front + 'px');

                var sortDirection = this._getSortDirection(args);

                if (sortDirection) {
                    var sortIndicator = $('<div class="msoc-enhanced-list-sort-indicator"><i class="ms-Icon ms-Icon--' + (sortDirection == 'asc' ? 'caretUp' : 'caretDown') + '"></i></div>');

                    $(args.element).append(sortIndicator);
                }
            }
        }

        private _getIcons(args) {
            return typeof(args.data) == 'string' ? [] : args.data.icons;
        }

        private _getSortDirection(args) {
            return typeof(args.data) == 'string' ? null : args.data.sortDirection;
        }

        private _getSubject(args) {
            return typeof(args.data) == 'string' ? args.data : args.data.displayName;
        }
    }

    export class EnhancedCellEditor {
        private _externalEditor;
        private _enhancedListControl;

        constructor(enhancedListControl, externalEditor) {
            this._externalEditor = externalEditor;
            this._enhancedListControl = enhancedListControl;
        }

        public edit(args) {
            var events = args.events;

            if (!this._enhancedListControl.editable()) {
                events.emit('reject', this, null);
                return;
            }

            var row = args.row,
                column = args.column,
                rowIndex = args.rowIndex,
                columnIndex = args.columnIndex,
                rtl = args.rtl,
                width = args.width,
                height = args.height,
                cellData = args.cellData,
                disposer = new controls.Fundamental.Disposer();

            var element = $('<div style="width:0px;height:0px;" tabindex="0"></div><div></div><div style="width:0px;height:0px;" tabindex="0"></div>');

            $(args.element).append(element);
            element.eq(1).css('width', args.width + 'px').css('height', args.height + 'px');

            disposer.addDisposable(
                new controls.Fundamental.EventAttacher(
                    element.eq(0),
                    'focus',
                    () => {
                        this._enhancedListControl.stopOperation();
                        if (args.columnIndex > 1) {
                            this._enhancedListControl.table.edit(args.rowIndex, args.columnIndex - 1);
                        } else {
                            this._enhancedListControl.table.edit(args.rowIndex, this._enhancedListControl.table.columnCount() - 1);
                        }
                    }));

            disposer.addDisposable(
                new controls.Fundamental.EventAttacher(
                    element.eq(2),
                    'focus',
                    () => {
                        this._enhancedListControl.stopOperation();
                        if (args.columnIndex < this._enhancedListControl.table.columnCount() - 1) {
                            this._enhancedListControl.table.edit(args.rowIndex, args.columnIndex + 1);
                        } else {
                            this._enhancedListControl.table.edit(args.rowIndex, 1);
                        }
                    }));

            this._externalEditor({
                element: element[1],
                cellData: cellData,
                events: events,
                rowIndex: rowIndex,
                columnIndex: columnIndex,
                row: row,
                column: args.column.listControl.getColumnById(column.columnId),
                rtl: rtl,
            })
            .done((value) => {
                events.emit('accept', this, value);
                delete value.resolve;
            })
            .fail(() => events.emit('reject', this, null))
            .always(() => disposer.dispose());
        }
    }

    export class EnhancedColumnDefinition {
        private _properties;

        constructor(options) {
            this._properties = $.extend(true, {
                data: {
                    displayName: '',
                    icons: [],
                    sortDirection: null,
                },
                sortable: true,
                filterable: true,
                table: {
                },
                stack: {
                },
            }, options);
        }

        public listControl(value?) {
            return controls.Fundamental.PropertyBag.property({
                target: this._properties,
                name: 'listControl',
                args: arguments,
            });
        }

        public columnId(value?) {
            return controls.Fundamental.PropertyBag.property({
                target: this._properties,
                name: 'columnId',
                args: arguments,
            });
        }

        public data(value?) {
            return controls.Fundamental.PropertyBag.property({
                target: this._properties,
                name: 'data',
                args: arguments,
                afterChange: () => {
                    if (this._properties.listControl) {
                        var columnIndex = this._properties.listControl.getColumnIndexById(this._properties.columnId);

                        if (!isNaN(columnIndex)) {
                            this._properties.listControl.invalidateHeaderCell(columnIndex);
                        }
                    }
                }
            });
        }

        public displayName(value?) {
            return controls.Fundamental.PropertyBag.property({
                target: this._properties.data,
                name: 'displayName',
                args: arguments,
                afterChange: () => {
                    if (this._properties.listControl) {
                        var columnIndex = this._properties.listControl.getColumnIndexById(this._properties.columnId);

                        if (!isNaN(columnIndex)) {
                            this._properties.listControl.invalidateHeaderCell(columnIndex);
                        }
                    }
                }
            });
        }

        public icons(value?) {
            return controls.Fundamental.PropertyBag.property({
                target: this._properties.data,
                name: 'icons',
                args: arguments,
                afterChange: () => {
                    if (this._properties.listControl) {
                        var columnIndex = this._properties.listControl.getColumnIndexById(this._properties.columnId);

                        if (!isNaN(columnIndex)) {
                            this._properties.listControl.invalidateHeaderCell(columnIndex);
                        }
                    }
                }
            });
        }

        public sortDirection(value?) {
            return controls.Fundamental.PropertyBag.property({
                target: this._properties.data,
                name: 'sortDirection',
                args: arguments,
                afterChange: () => {
                    if (this._properties.listControl) {
                        var columnIndex = this._properties.listControl.getColumnIndexById(this._properties.columnId);

                        if (!isNaN(columnIndex)) {
                            this._properties.listControl.invalidateHeaderCell(columnIndex);
                        }
                    }
                }
            });
        }

        public field(value?) {
            return controls.Fundamental.PropertyBag.property({
                target: this._properties,
                name: 'field',
                args: arguments,
            });
        }

        public sortable(value?) {
            return controls.Fundamental.PropertyBag.property({
                target: this._properties,
                name: 'sortable',
                args: arguments,
            });
        }

        public filterable(value?) {
            return controls.Fundamental.PropertyBag.property({
                target: this._properties,
                name: 'filterable',
                args: arguments,
            });
        }

        public width(value?) {
            return controls.Fundamental.PropertyBag.property({
                target: this._properties,
                name: 'width',
                args: arguments,
            });
        }

        public cellEditor(value?) {
            return controls.Fundamental.PropertyBag.property({
                target: this._properties,
                name: 'cellEditor',
                args: arguments,
            });
        }

        public tag(value?) {
            return controls.Fundamental.PropertyBag.property({
                target: this._properties,
                name: 'tag',
                args: arguments,
            });
        }

        public columnDefinition() {
            return this._properties;
        }
    }

    export class EnhancedListControl {
        public disposer;
        public table;
        public stack;
        private _properties;
        private _listControl;
        private _root;
        private _events;
        private _columns;
        private _firstColumnUniqueId;

        constructor(root) {
            this._root = $(root);
            this.disposer = new controls.Fundamental.Disposer(() => {
                this._listControl.dispose();
                this._columns = null;
            });
            this._properties = new controls.Fundamental.PropertyBag({
                editable: false,
            });

            this.disposer.addDisposable(new controls.Fundamental.EventAttacher($(window), 'resize orientationchange', ()=> this._onWindowResize()));
            this.disposer.addDisposable(this._events = new controls.Fundamental.EventSite());
            this._columns = [];

            this._listControl = new controls.ListControl(root);

            var enhancedColumnDefinition = new EnhancedColumnDefinition({
                filterable: false,
                sortable: false,
                field: '$status',
                table: { width: 30 },
            });

            var columnDefinition = enhancedColumnDefinition.columnDefinition();

            columnDefinition.headerRender = new EnhancedListHeaderCellRender(this, columnDefinition);
            columnDefinition.cellRender = new EnhancedListFirstCellRender(this, columnDefinition);

            this._firstColumnUniqueId = this._listControl.addColumns([columnDefinition])[0];

            this._listControl.stack.columns([]);
            this.table = this._listControl.table;
            this.stack = this._listControl.stack;
            this._attachProxyEvents();
            this._onWindowResize();
        }

        public firstColumnUniqueId() {
            return this._firstColumnUniqueId;
        }

        public editable() {
            return this._properties.$property({
                name: 'editable',
                args: arguments,
                afterChange: (sender, args) => {
                        var columnIndex = this._listControl.getColumnIndexById(this._firstColumnUniqueId);
                        if (!isNaN(columnIndex)) {
                            this.invalidateHeaderCell(columnIndex);
                            this.invalidateRange(new controls.Range(controls.RangeType.Column, NaN, NaN, columnIndex, columnIndex));
                        }

                        if (args.newValue) {
                            this._listControl.theme(controls.Theme.Editable);
                        } else {
                            this._listControl.theme(controls.Theme.Default);
                        }
                },
            });
        }

        public rtl() {
            return this._listControl.rtl.apply(this._listControl, arguments);
        }

        public updateUI() {
            return this._listControl.updateUI.apply(this._listControl, arguments);
        }

        public viewType() {
            return this._listControl.viewType.apply(this._listControl, arguments);
        }

        public selectedRanges() {
            return this._listControl.selectedRanges.apply(this._listControl, arguments);
        }

        public selectedRangeOfPosition() {
            return this._listControl.selectedRangeOfPosition.apply(this._listControl, arguments);
        }

        public selectedRangeOfCursor() {
            return this._listControl.selectedRangeOfCursor.apply(this._listControl, arguments);
        }

        public selectionMode() {
            return this._listControl.selectionMode.apply(this._listControl, arguments);
        }

        public cursor() {
            return this._listControl.cursor.apply(this._listControl, arguments);
        }

        public select() {
            return this._listControl.select.apply(this._listControl, arguments);
        }

        public deselect() {
            return this._listControl.deselect.apply(this._listControl, arguments);
        }

        public theme() {
            return this._listControl.theme.apply(this._listControl, arguments);
        }

        public on() {
            return this._events.on.apply(this._events, arguments);
        }

        public off() {
            return this._events.off.apply(this._events, arguments);
        }

        public invalidateRange(range: Range) {
            return this._listControl.invalidateRange.apply(this._listControl, arguments);
        }

        public invalidate() {
            return this._listControl.invalidate.apply(this._listControl, arguments);
        }

        public invalidateHeaderCell(columnIndex) {
            return this._listControl.invalidateHeaderCell.apply(this._listControl, arguments);
        }

        public invalidateHeaderRange(range: Range) {
            return this._listControl.invalidateHeaderRange.apply(this._listControl, arguments);
        }

        public addColumns(enhancedColumnDefinitions) {
            var columns = [];

            for (var columnIndex = 0; columnIndex < enhancedColumnDefinitions.length; columnIndex++) {
                var enhancedColumnDefinition = enhancedColumnDefinitions[columnIndex];
                var column = enhancedColumnDefinition.columnDefinition();

                if (!column.headerRender) {
                    column.headerRender = new EnhancedListHeaderCellRender(this, column);
                }

                if (!column.cellRender) {
                    column.cellRender = new EnhancedListCellRender(column, column.alignToEnd);
                }

                columns.push(column);
            }

            var columnIds = this._listControl.addColumns(columns);

            for (var columnIndex = 0; columnIndex < enhancedColumnDefinitions.length; columnIndex++) {
                this._columns[columnIds[columnIndex]] = enhancedColumnDefinitions[columnIndex];
                enhancedColumnDefinitions[columnIndex].columnId(columnIds[columnIndex]);
                enhancedColumnDefinitions[columnIndex].listControl(this);
            }

            return columnIds;
        }

        public rows() {
            return this._listControl.rows.apply(this._listControl, arguments);
        }

        public getRowById() {
            return this._listControl.getRowById.apply(this._listControl, arguments);
        }

        public getRowByIndex() {
            return this._listControl.getRowByIndex.apply(this._listControl, arguments);
        }

        public getRowsByIndex() {
            return this._listControl.getRowsByIndex.apply(this._listControl, arguments);
        }

        public updateRowById() {
            return this._listControl.updateRowById.apply(this._listControl, arguments);
        }

        public updateRowByIndex() {
            return this._listControl.updateRowByIndex.apply(this._listControl, arguments);
        }

        public updateRowsByIndex() {
            return this._listControl.updateRowsByIndex.apply(this._listControl, arguments);
        }

        public removeRowById() {
            return this._listControl.removeRowById.apply(this._listControl, arguments);
        }

        public removeRowByIndex() {
            return this._listControl.removeRowByIndex.apply(this._listControl, arguments);
        }

        public removeRowsByIndex() {
            return this._listControl.removeRowsByIndex.apply(this._listControl, arguments);
        }

        public insertRowById() {
            return this._listControl.insertRowById.apply(this._listControl, arguments);
        }

        public insertRowByIndex() {
            return this._listControl.insertRowByIndex.apply(this._listControl, arguments);
        }

        public insertRowsByIndex() {
            return this._listControl.insertRowsByIndex.apply(this._listControl, arguments);
        }

        public rowCount() {
            return this._listControl.rowCount.apply(this._listControl, arguments);
        }

        public scrollTo() {
            return this._listControl.scrollTo.apply(this._listControl, arguments);
        }

        public getColumnIndexById() {
            return this._listControl.getColumnIndexById.apply(this._listControl, arguments);
        }

        public stopOperation() {
            return this._listControl.stopOperation.apply(this._listControl, arguments);
        }

        public getOperationName() {
            return this._listControl.getOperationName.apply(this._listControl, arguments);
        }

        public dispose() {
            this.disposer.dispose();
        }

        public adjustSize() {
            this._onWindowResize();
        }

        public getColumnById(columnId) {
            return this._columns[columnId];
        }

        private _onWindowResize() {
            var width = $(window).width();
            var rootWidth = this._root.width();
            var rootHeight = this._root.height();

            if (width < 480) {
                this._listControl.viewType(controls.ViewType.Stack);
            } else {
                this._listControl.viewType(controls.ViewType.Table);
            }

            $('#forWidth').val('rootWidth:' + rootWidth + ', windowWidth: ' + width);

            this._listControl.width(rootWidth);
            this._listControl.height(rootHeight);
            this._listControl.stack.headerWidth(Math.floor(rootWidth * 0.2));
            this._listControl.updateUI();
        }

        private _attachProxyEvent(name) {
            this.disposer.addDisposable(
                new controls.Fundamental.EventAttacher(
                    this._listControl,
                    name,
                    () => {
                        arguments[0] = this;
                        Array.prototype.unshift.call(arguments, name);

                        return this._events.emit.apply(this._events, arguments);
                    }));
        }

        private showDropDownMenu(dropDownMenuElement,args)
        {

            var coordinate = controls.Fundamental.CoordinateFactory.fromElement(this._listControl.rtl(), dropDownMenuElement),
                menu,
                isDropDownClosed = false;

            args.updateDropDown = (menuDefinitions) => {
                if (isDropDownClosed) {
                    return;
                }

                var oldOnClose = menuDefinitions.onClose;

                menuDefinitions.onClose = () => {
                    isDropDownClosed = true;
                    dropDownMenuElement.removeClass('msoc-enhanced-list-context-button-down');

                    if (oldOnClose) {
                        oldOnClose();
                    }

                    menu.dispose();
                }

                if (menu) {
                    menu.remove();
                    menu.dispose();
                }

                menu = ListControlHelper.createDropDown(
                    menuDefinitions,
                    {
                        bottom: coordinate.top() + dropDownMenuElement.height(),
                        end: coordinate.front() + dropDownMenuElement.width(),
                        direction: new controls.Fundamental.TextDirection(this._listControl.rtl()),
                    });

                $(document.body).append(menu);
                (<any>menu).open();
                dropDownMenuElement.addClass('msoc-enhanced-list-context-button-down');
                isDropDownClosed = false;
            };

            return this._events.emit('headerDropDown', this, args);
        }

        private _attachProxyEvents() {
            var selectRow = (rowIndex, columnIndex) => {
                if (this._listControl.selectionMode() == controls.SelectionMode.MultipleRows
                    || this._listControl.selectionMode() == controls.SelectionMode.Range) {
                    var selectedRanges = this._listControl.selectedRanges(),
                        keepSelectedRanges = selectedRanges.length == 0 || selectedRanges[0].type() == controls.RangeType.Row,
                        range = this._listControl.selectedRangeOfPosition(new controls.Position(rowIndex, columnIndex));

                    disableInvalidateFirstColumn = true;
                    if (range && range.type() == controls.RangeType.Row) {
                        this._listControl.deselect(new controls.Range(controls.RangeType.Row, rowIndex, rowIndex, NaN, NaN));
                    } else {
                        this._listControl.select(new controls.Range(controls.RangeType.Row, rowIndex, rowIndex, NaN, NaN), keepSelectedRanges);
                    }

                    this._listControl.invalidateRange(new controls.Range(controls.RangeType.Range, rowIndex, rowIndex, columnIndex, columnIndex));
                    disableInvalidateFirstColumn = false;
                }
            }

            var disableInvalidateFirstColumn = false;
            this._attachProxyEvent('rowClick');
            this._attachProxyEvent('beforeRender');
            this._attachProxyEvent('beforeCursorChange');
            this._attachProxyEvent('cursorChange');
            this._attachProxyEvent('selectionChange');
            this._attachProxyEvent('beforeSelect');
            this._attachProxyEvent('beforeDeselect');
            this._attachProxyEvent('beforeColumnReorder');
            this.disposer.addDisposable(
                new controls.Fundamental.EventAttacher(
                    this._root,
                    'keydown',
                    (event) => {
                        var shiftKey = event.shiftKey;

                        if (!shiftKey) {
                            switch (event.which) {
                                case 13:
                                    var cursor = this._listControl.cursor();

                                    this._listControl.table.edit(cursor.rowIndex, cursor.columnIndex);
                                    break;

                                case 32:
                                    var cursor = this._listControl.cursor();

                                    selectRow(cursor.rowIndex, cursor.columnIndex);
                                    break;
                            }
                        }
                    }));
            this.disposer.addDisposable(
                new controls.Fundamental.EventAttacher(
                    this._listControl,
                    'selectionChange',
                    (sender, args) => {
                        if (!disableInvalidateFirstColumn) {
                            this._listControl.invalidateRange(new controls.Range(controls.RangeType.Column, NaN, NaN, 0, 0));
                        }
                    }));
            this.disposer.addDisposable(
                new controls.Fundamental.EventAttacher(
                    this._listControl,
                    'beforeColumnReorder',
                    (sender, args) => {
                        if (args.fromColumnIndex == 0 || args.toColumnIndex == 0) {
                            args.cancel = true;
                        }
                    }));
            this.disposer.addDisposable(
                new controls.Fundamental.EventAttacher(
                    this._listControl,
                    'beforeSelect',
                    (sender, args) => {
                        if (args.reason == 'mouse' && args.range.type() == controls.RangeType.Row) {
                            args.cancel = true;
                        }
                    }));
            this.disposer.addDisposable(
                new controls.Fundamental.EventAttacher(
                    this._listControl,
                    'beforeCursorChange',
                    (sender, args) => {
                        if (args.columnIndex == 0 && this._properties.editable) {
                            args.cancel == true;
                        } else if (this._listControl.getOperationName() == 'table.edit') {
                            var row = this._listControl.getRowByIndex(args.rowIndex);

                            if (!row || !row['$status'].edit) {
                                args.cancel = true;
                            } else {
                                this._listControl.stopOperation();
                                this._listControl.table.edit(args.rowIndex, args.columnIndex);
                            }
                        }
                    }));
            this.disposer.addDisposable(
                new controls.Fundamental.EventAttacher(
                    this._listControl,
                    'rowClick',
                    (sender, args) => {
                        if (args.columnIndex == 0) {
                            selectRow(args.rowIndex, args.rowIndex);
                        }
                    }));
            this.disposer.addDisposable(
                new controls.Fundamental.EventAttacher(
                    this._listControl,
                    'headerRowClick',
                    (sender, args) => {
                        if (args.event.which != 1) {
                            // Not left button
                            return;
                        }
                        var dropDownMenuElement = $(args.event.target).closest('.msoc-enhanced-list-context-button');
                        args.column = this.getColumnById(args.columnId);

                        if (dropDownMenuElement.length > 0) {
                            this.showDropDownMenu(dropDownMenuElement, args);
                        } else {
                            return this._events.emit('headerRowClick', this, args);
                       }
                    }));

            this.disposer.addDisposable(
                new controls.Fundamental.EventAttacher(
                    this._listControl,
                    'headerRowContextMenu',
                    (sender, args) => {
                        if (args.event.which != 3) {
                            // Not right button
                            return;
                        }
                        args.event.preventDefault();
                        var dropDownMenuElement = $(args.event.target).closest('.msoc-enhanced-list-context-button');
                        if (typeof (args.columnId) != 'undefined') {
                            args.column = this.getColumnById(args.columnId);
                        }
                        else if (typeof (args.columnUniqueId) != 'undefined') {
                            args.column = this.getColumnById(args.columnUniqueId);
                        }

                        if (dropDownMenuElement.length > 0) {
                            this.showDropDownMenu(dropDownMenuElement, args);
                        } else {
                            return this._events.emit('headerRowContextMenu', this, args);
                        }
                    }));
        }
    }
}

