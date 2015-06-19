export class BrowserDetector {
    public static requestAnimationFrame;
    public static now;

    public static staticInitialize() {
        if (window.requestAnimationFrame) {
            BrowserDetector.requestAnimationFrame = (handler) => {
                return window.requestAnimationFrame(handler);
            };
        } else {
            BrowserDetector.requestAnimationFrame = (handler) => {
                return window.setTimeout(handler, 16.67); // 16.67 = 1000 / 60
            };
        }

        if (window.performance && window.performance.now) {
            BrowserDetector.now = () => {
                return window.performance.now();
            };
        } else {
            BrowserDetector.now = () => {
                return (new Date()).valueOf();
            };
        }
    }

    public static isTouchEvent(type) {
        switch (type) {
            case 'touchstart':
            case 'touchmove':
            case 'touchend':
            case 'touchcancel':
                return true;

            default:
                return false;
        }
    }

    public static getChangedPointerIdentifier(event) {
        var isTouch = BrowserDetector.isTouchEvent(event.type);

        if (isTouch) {
            var result = [];

            for (var i = 0; i < event.originalEvent.changedTouches.length; i++) {
                result.push('touch.' + event.originalEvent.changedTouches[0].identifier);
            }

            return result;
        } else {
            return ['mouse'];
        }
    }
}

BrowserDetector.staticInitialize();

