export class Calculator {
    public static calculateScrollTopAfterSwitchView(oldCanvasHeight, newCanvasHeight, oldViewportHeight, newViewportHeight, oldViewportScrollTop) {
        var oldCanvasViewportHeight = oldCanvasHeight - oldViewportHeight;
        var newCanvasViewportHeight = newCanvasHeight - newViewportHeight;

        if (newCanvasViewportHeight < 0) {
            return 0;
        } else {
            return Math.floor(oldViewportScrollTop / oldCanvasViewportHeight * newCanvasViewportHeight);
        }
    }

    public static changeInLimitedRange(value, offset, min, max) {
        value += offset;

        if (value < min) {
            value = min;
        } else if (value > max) {
            value = max;
        }

        return value;
    }

    public static compareValueArray(values0, values1) {
        for (var i = 0; i < values0.length; i++) {
            if (values0[i] < values1[i]) {
                return -1;
            } else if (values0[i] > values1[i]) {
                return 1;
            }
        }

        return 0;
    }

    public static intersection(firstLower, firstUpper, secondLower, secondUpper) {
        if (isNaN(firstLower + firstUpper + secondLower + secondUpper) ||
            firstLower > secondUpper ||
            secondLower > firstUpper) {
            return null;
        } else {
            return {
                lower: Math.max(firstLower, secondLower),
                upper: Math.min(firstUpper, secondUpper),
            };
        }
    }

    public static union(firstLower, firstUpper, secondLower, secondUpper) {
        if (isNaN(firstLower + firstUpper + secondLower + secondUpper) ||
            firstLower > secondUpper ||
            secondLower > firstUpper) {
            return null;
        } else {
            return {
                lower: Math.min(firstLower, secondLower),
                upper: Math.max(firstUpper, secondUpper),
            };
        }
    }
}

