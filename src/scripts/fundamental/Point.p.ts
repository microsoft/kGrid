export class Point {
    public static Null = new Point(NaN, NaN);
    public top;
    public front;

    constructor(top, front) {
        this.top = top;
        this.front = front;
    }

    public isValid() {
        return !isNaN(this.top) && !isNaN(this.front);
    }

    public equals(point) {
        if (!this.isValid() && !point.isValid()) {
            return true;
        }

        return this.top == point.top && this.front == point.front;
    }
}

