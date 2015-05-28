export class EventSite {
    public disposer;
    private _sites;

    /**
     * This callback is called when a specified event is emitted
     * @callback Microsoft.Office.Controls.Fundamental.EventSite~EventCallback
     * @param {object} sender - Sender of event
     * @param {object} args - Arguments of event
     */

    /**
     * EventSite is a class you can use to emit your custom event on it. Other class can hook to the event
     * @constructor Microsoft.Office.Controls.Fundamental.EventSite
     */
    constructor() {
        /**
         * Disposer object
         * @member {Microsoft.Office.Controls.Fundamental.Disposer} Microsoft.Office.Controls.Fundamental.EventSite#disposer
         */
        this.disposer = new Fundamental.Disposer(() => this._sites = null);

        this._sites = {};
    }

    /**
     * Attach a callback to an event
     * @method Microsoft.Office.Controls.Fundamental.EventSite#on
     * @param {string} event - Name of event
     * @param {Microsoft.Office.Controls.Fundamental.EventSite~EventCallback} callback - Callback of event
     */
    public on(event, callback) {
        if (this.disposer.isDisposed) {
            return;
        }

        var site = this._sites[event];

        if (!site) {
            this._sites[event] = site = [];
        }

        site.push(callback);
    }

    /**
     * Detach a callback from an event
     * @method Microsoft.Office.Controls.Fundamental.EventSite#off
     * @param {string} event - Name of event
     * @param {Microsoft.Office.Controls.Fundamental.EventSite~EventCallback} callback - Callback of event
     */
    public off(event, callback) {
        if (this.disposer.isDisposed) {
            return;
        }

        if (!this._sites[event]) {
            return;
        }

        this._sites[event] = $.grep(this._sites[event], (c) => c != callback);
    }

    /**
     * Emit an event
     * @method Microsoft.Office.Controls.Fundamental.EventSite#emit
     * @param {string} event - Name of event
     * @param {object} sender - Sender of event
     * @param {object} args - Arguments of event
     */
    public emit(event, sender, args) {
        if (this.disposer.isDisposed || this.disposer.isDisposing) {
            return;
        }

        var site = this._sites[event];

        if (!site) {
            return;
        }

        for (var i = 0; i < site.length; i++) {
            site[i](sender, args);
        }
    }
}

