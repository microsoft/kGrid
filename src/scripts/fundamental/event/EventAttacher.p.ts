export class EventAttacher {
    public disposer;

    /**
     * EventAttacher is a class you can use to attach a callback to an EventSite/jQuery Object.
     * The callback will be detached after dispose.
     * @constructor Microsoft.Office.Controls.Fundamental.EventAttacher
     * @param {object} eventSite - An object of EventSite or jQuery
     * @param {string} events - Space sperated event names
     * @param {callback} callback - Callback of event
     */
    constructor(eventSite, events, callback) {
        /**
         * Disposer object
         * @member {Microsoft.Office.Controls.Fundamental.Disposer} Microsoft.Office.Controls.Fundamental.EventAttacher#disposer
         */
        this.disposer = new Fundamental.Disposer(() => {
            for (var i = 0; i < events.length; i++) {
                eventSite.off(events[i], callback);
            }
        });

        events = events.split(' ');

        for (var i = 0; i < events.length; i++) {
            eventSite.on(events[i], callback);
        }
    }
}

