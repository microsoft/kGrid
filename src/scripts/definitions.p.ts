class Constants {
    public static RatioToOperationScrollArea = 0.2;
    public static OperationScrollNumber = 20;
}

export interface IOperation extends Support.IDisposable {
    start(...args): JQueryPromise<any>;
}

export enum SelectionMode {
    SingleRow,
    MultipleRows,
    Cell,
    Range,
}

export enum RangeType {
    Row,
    Column,
    Range,
}

enum RenderState {
    Initial,
    OutDated,
    Painted,
};

export interface IRender {
    render(args);
    title(args);
}

export interface IEditor {
    edit(args);
}

export enum ViewType {
    Table,
    Stack,
}

export interface IListView extends Support.IDisposable {
    name(): string;
    type(): ViewType;
    activate(): void;
    deactivate(): void;
    updateUI(): boolean;
    controller(): any;
    invalidate();
    invalidateRange(range: Range);
    invalidateHeaderRange(range: Range);
    getColumnIdByIndex(columnIndex);
    getColumnIndexById(columnUniqueId);
}

export enum CursorMovement {
    Forward,
    Backward,
    Up,
    Down,
    LineFirst,
    LineEnd,
    PageUp,
    PageDown,
    Top,
    Bottom,
}

/// <summary>
/// Column definition, used by list control
/// </summary>
export class ColumnDefinition {
    public name;
    public data;
    public field;
    public width;
    public headerRender;
    public cellRender;
    public cellEditor;
}

