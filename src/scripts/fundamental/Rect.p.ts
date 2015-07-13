export class Rect {
    public top;
    public front;
    public width;
    public height;
    public static Null = new Rect(NaN, NaN, NaN, NaN);

    public constructor(top, front, height, width) {
        this.top = top;
        this.front = front;
        this.height = height;
        this.width = width;
    }

}

