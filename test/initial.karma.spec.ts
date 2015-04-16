describe('Basic Functionality', function() {
    it('Root Element', function(done) {
        require(['jquery', 'js/listcontrol'], function ($, listcontrol) {
            var testData = [
                    { Stage: 'Done', Waiting: { status: 'online', name: 'Rachel Falzone' }, Requestor: { status: 'away', name: 'Todd The Builder' }, 'ActiveDays': 3, StartDate: '2 days ago', Action: 'Poke' },
                    { Stage: 'Done', Waiting: { status: 'online', name: 'Rachel Falzone' }, Requestor: { status: 'away', name: 'Todd The Builder' }, 'ActiveDays': 4, StartDate: '2 days ago', Action: 'Poke' },
                    { Stage: 'Waiting', Waiting: { status: 'busy', name: 'Rachel Falzone 2' }, Requestor: { status: 'away', name: 'Todd The Builder' }, 'ActiveDays': 4, StartDate: '2 days ago', Action: 'Poke' },
                    { Stage: 'Waiting', Waiting: { status: 'busy', name: 'Rachel Falzone 2' }, Requestor: { status: 'away', name: 'Todd The Builder' }, 'ActiveDays': 4, StartDate: '2 days ago', Action: 'Poke' },
            ];

            $(document).ready(function() {
                $(document.head).append($('<style></style>').html(""));
                var root = $('<div></div>');
                $(document.body).append(root);

                var list = new listcontrol.ListControl(root);

                list.width(811);
                list.height(422);

                window.setTimeout(() => {
                    var listRootElement = root.find('> div');

                    expect(listRootElement.hasClass('msoc-list')).toBe(true);
                    expect(listRootElement.length).toBe(1);
                    expect(listRootElement.width()).toBe(811);
                    expect(listRootElement.height()).toBe(422);
                    done();
                }, 100);
            });
        });
    });
});
