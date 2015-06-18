export class PropertyBag {
    /**
     * This callback is called after a property value is read
     * @callback Microsoft.Office.Controls.Fundamental.PropertyBag~afterRead
     * @param {object} target - The target object which the property value is read
     * @param {object} afterReadArgs
     * @param {object} afterReadArgs.name - The property name
     * @param {object} afterReadArgs.newValue - The property value. The callback can change this value and it is changed in return
     */

    /**
     * This callback is called before a property value is wrote
     * @callback Microsoft.Office.Controls.Fundamental.PropertyBag~beforeChange
     * @param {object} target - The target object which the property value is read
     * @param {object} beforeChangeArgs
     * @param {object} beforeChangeArgs.name - The property name
     * @param {object} beforeChangeArgs.oldValue - The property current value.
     * @param {object} beforeChangeArgs.newValue - The new value of property. You can change the value in callback and changed value takes effect
     * @param {object} beforeChangeArgs.cancel - Change to true if you want to prevent from changing the value
     */

    /**
     * This callback is called after a property value is wrote
     * @callback Microsoft.Office.Controls.Fundamental.PropertyBag~afterChange
     * @param {object} target - The target object which the property value is read
     * @param {object} afterChangeArgs
     * @param {object} afterChangeArgs.name - The property name
     * @param {object} afterChangeArgs.oldValue - The property original value.
     * @param {object} afterChangeArgs.newValue - The property current value. The callback can change this value and it is changed in return
     */

    /**
     * @constructor Microsoft.Office.Controls.Fundamental.PropertyBag
     * @param {object} base0 - A object holds the inital property values, the value in the object will override the value in base1
     * @param {object} base1 - A object holds the inital property values
     * @deprecated You should not use this constructor to create a property bag any longer.
     * A replaced static method [property]{@link Microsoft.Office.Controls.Fundamental.PropertyBag.property} is provided 
     */
    constructor(base0 = {}, base1 = {}) {
        $.extend(true, this, base0, base1);
    }

    /**
     * This is a member function wrapper for [property]{@link Microsoft.Office.Controls.Fundamental.PropertyBag.property}
     * @method Microsoft.Office.Controls.Fundamental.PropertyBag#$property
     * @deprecated You should not use this constructor to create a property bag any longer.
     * A replaced static method [property]{@link Microsoft.Office.Controls.Fundamental.PropertyBag.property} is provided 
     */
    public $property(options) {
        options.target = this;

        return PropertyBag.property(options);
    }

    /**
     * This method is used to change the value in a property bag and fire an event in the mean time. You should follow the
     * following pattern to define a property.
     *
     *     function person() {
     *         this._properties = {};
     *
     *         this.name = function () {
     *             return Microsoft.Office.Controls.Fundamental.PropertyBag.property({
     *                 target: this._properties,
     *                 name: 'name',
     *                 args: arguments,
     *             });
     *         }
     *     }
     *
     * @method Microsoft.Office.Controls.Fundamental.PropertyBag.property
     * @param {object} options
     * @param {object} options.target - The object which the operation is on
     * @param {string} options.name - The property name
     * @param {object[]} options.args - The arguments which is used to call the property function.
     * We follow the jQuery pattern of a property, says if you have a property which named as name.
     * You should define a method name and it is treated as getter if you call it without arguments,
     * while treated as setter if you passed and value.
     * @param {Microsoft.Office.Controls.Fundamental.PropertyBag~afterRead=} options.afterRead - The callback which will be called after the value read from target
     * @param {Microsoft.Office.Controls.Fundamental.PropertyBag~beforeChange=} options.beforeChange - The callback which will be called before the value is writing to target
     * @param {Microsoft.Office.Controls.Fundamental.PropertyBag~afterChange=} options.afterChange - The callback which will be called after the value is writing to target
     * @return {object} The property current value. We always return the value whatever you are calling the method as setter or getter.
     * You can change the return value by changing the args.newValue in afterRead and afterChange
     */
    public static property(options) {
        var target = options.target,
            name = options.name,
            args = options.args,
            afterRead = options.afterRead,
            beforeChange = options.beforeChange,
            afterChange = options.afterChange;

        if (args.length > 0) {
            var oldValue = target[name], newValue = args[0];

            if (oldValue == newValue || (typeof(oldValue) == 'number' && isNaN(oldValue) && isNaN(newValue))) {
                return newValue;
            }

            if (beforeChange) {
                var beforeChangeArgs = { name: name, newValue: newValue, oldValue: oldValue, cancel: false };

                beforeChange(target, beforeChangeArgs);

                if (beforeChangeArgs.cancel) {
                    return;
                }

                newValue = beforeChangeArgs.newValue;
                oldValue = beforeChangeArgs.oldValue;
            }

            target[name] = newValue;

            if (afterChange) {
                var afterChangeArgs = { name: name, newValue: newValue, oldValue: oldValue };

                afterChange(target, afterChangeArgs);
                return afterChange.newValue;
            }

            return target[name];
        } else {
            var afterReadArgs = { name: name, newValue: target[name] };

            if (afterRead) {
                afterRead(target, afterReadArgs);
            }

            return afterReadArgs.newValue;
        }
    }
}

