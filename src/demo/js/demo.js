$(function () {

    /// 1 . basic example
    var root1 = $('#basic');
    var listControlElement1 = $('<div style="position: relative;"></div>');
    root1.append(listControlElement1);

    listControlObject1 = new Microsoft.Office.Controls.ListControl(listControlElement1[0]);
    listControlObject1.width(548);
    listControlObject1.height(398);

    listControlObject1.addColumns([
    { data: 'No.', field: 'no', table: { width: 100 }, },
    { data: 'Name', field: 'name', table: { width: 100 }, },
    { data: 'Distance from Sun (AU)', field: 'distance', table: { width: 200 }, }]);

    data1 = [
    { no: 1, name: 'Mercury', distance: 0.4 },
    { no: 2, name: 'Venus', distance: 0.7 },
    { no: 3, name: 'Earth', distance: 1 },
    { no: 4, name: 'Mars', distance: 1.5 },
    { no: 5, name: 'Jupiter', distance: 5.2 },
    { no: 6, name: 'Saturn', distance: 9.5 },
    { no: 7, name: 'Uranus', distance: 19.2 },
    { no: 8, name: 'Neptune', distance: 30.1 },
    ];

    listControlObject1.rows(data1);

    /// 2 . rtl example
    var root2 = $('#rtl');
    var listControlElement2 = $('<div style="position: relative;"></div>');
    root2.append(listControlElement2);

    listControlObject2 = new Microsoft.Office.Controls.ListControl(listControlElement2[0]);
    listControlObject2.width(548);
    listControlObject2.height(398);

    listControlObject2.addColumns([
    { data: 'No.', field: 'no', table: { width: 100 }, },
    { data: 'Name', field: 'name', table: { width: 100 }, },
    { data: 'Distance from Sun (AU)', field: 'distance', table: { width: 200 }, }]);

    data2 = [
    { no: 1, name: 'Mercury', distance: 0.4 },
    { no: 2, name: 'Venus', distance: 0.7 },
    { no: 3, name: 'Earth', distance: 1 },
    { no: 4, name: 'Mars', distance: 1.5 },
    { no: 5, name: 'Jupiter', distance: 5.2 },
    { no: 6, name: 'Saturn', distance: 9.5 },
    { no: 7, name: 'Uranus', distance: 19.2 },
    { no: 8, name: 'Neptune', distance: 30.1 },
    ];
    listControlObject2.rows(data2);

    var button2 = $('#rtl_button');
    button2.on('click', function () {
        listControlObject2.rtl(!listControlObject2.rtl());
        listControlObject2.updateUI();
    });

    /// 3. stack view example

    var root3 = $('#stackview');
    var listControlElement3 = $('<div style="position: relative;"></div>');
    root3.append(listControlElement3);

    listControlObject3 = new Microsoft.Office.Controls.ListControl(listControlElement3[0]);
    listControlObject3.width(548);
    listControlObject3.height(398);

    listControlObject3.addColumns([
    { data: 'No.', field: 'no', table: { width: 100 }, },
    { data: 'Name', field: 'name', table: { width: 100 }, },
    { data: 'Distance from Sun (AU)', field: 'distance', table: { width: 200 }, }]);

    data3 = [
    { no: 1, name: 'Mercury', distance: 0.4 },
    { no: 2, name: 'Venus', distance: 0.7 },
    { no: 3, name: 'Earth', distance: 1 },
    { no: 4, name: 'Mars', distance: 1.5 },
    { no: 5, name: 'Jupiter', distance: 5.2 },
    { no: 6, name: 'Saturn', distance: 9.5 },
    { no: 7, name: 'Uranus', distance: 19.2 },
    { no: 8, name: 'Neptune', distance: 30.1 },
    ];

    listControlObject3.rows(data3);

    var button3 = $('#view_button');
    button3.on('click', function () {
        listControlObject3.viewType(listControlObject3.viewType() == Microsoft.Office.Controls.ViewType.Stack ? Microsoft.Office.Controls.ViewType.Table : Microsoft.Office.Controls.ViewType.Stack);
        listControlObject3.updateUI();
    });

    /// 4. selection example
    var root4 = $('#select');
    var listControlElement4 = $('<div style="position: relative;"></div>');
    root4.append(listControlElement4);

    listControlObject4 = new Microsoft.Office.Controls.ListControl(listControlElement4[0]);
    listControlObject4.width(548);
    listControlObject4.height(398);

    listControlObject4.addColumns([
    { data: 'No.', field: 'no', table: { width: 100 }, },
    { data: 'Name', field: 'name', table: { width: 100 }, },
    { data: 'Distance from Sun (AU)', field: 'distance', table: { width: 200 }, }]);

    data4 = [
    { no: 1, name: 'Mercury', distance: 0.4 },
    { no: 2, name: 'Venus', distance: 0.7 },
    { no: 3, name: 'Earth', distance: 1 },
    { no: 4, name: 'Mars', distance: 1.5 },
    { no: 5, name: 'Jupiter', distance: 5.2 },
    { no: 6, name: 'Saturn', distance: 9.5 },
    { no: 7, name: 'Uranus', distance: 19.2 },
    { no: 8, name: 'Neptune', distance: 30.1 },
    ];

    listControlObject4.rows(data4);


    /// 5. theme example
    var root5 = $('#theme');
    var listControlElement5 = $('<div style="position: relative;"></div>');
    root5.append(listControlElement5);

    listControlObject5 = new Microsoft.Office.Controls.ListControl(listControlElement5[0]);
    listControlObject5.width(548);
    listControlObject5.height(398);

    listControlObject5.addColumns([
    { data: 'No.', field: 'no', table: { width: 100 }, },
    { data: 'Name', field: 'name', table: { width: 100 }, },
    { data: 'Distance from Sun (AU)', field: 'distance', table: { width: 200 }, }]);

    data5 = [
    { no: 1, name: 'Mercury', distance: 0.4 },
    { no: 2, name: 'Venus', distance: 0.7 },
    { no: 3, name: 'Earth', distance: 1 },
    { no: 4, name: 'Mars', distance: 1.5 },
    { no: 5, name: 'Jupiter', distance: 5.2 },
    { no: 6, name: 'Saturn', distance: 9.5 },
    { no: 7, name: 'Uranus', distance: 19.2 },
    { no: 8, name: 'Neptune', distance: 30.1 },
    ];

    listControlObject5.rows(data5);

    var button = $('#theme_button');
    button.on('click', function () {
        var theme;

        if (listControlObject5.theme() == Microsoft.Office.Controls.Theme.Default) {
            theme = Microsoft.Office.Controls.Theme.Editable;
        } else if (listControlObject5.theme() == Microsoft.Office.Controls.Theme.Editable) {
            theme = Microsoft.Office.Controls.Theme.Zebra;
        } else {
            theme = Microsoft.Office.Controls.Theme.Default;
        }

        listControlObject5.theme(theme);
        listControlObject5.updateUI();
    });

    var button = $('#customize_theme_button');
    var dialog;

    button.on('click', function () {
        if (!dialog) {
            root5.append('<div id="customizeTheme"><textarea maxlength="65535" style="width: 720px; height: 500px"></textarea></div>');

            dialog = $('#customizeTheme');
        }

        $('#customizeTheme > textarea').val('{\n\t\'backgroundColor\': \'#ffffff\',\n\t\'hoverBackgroundColor\': \'#f4f4f4\',\n\t\'selectionBackgroundColor\': \'#cde6f7\',\n\t\'cellPadding\': Theme.parsePadding(\'1px 5px 1px 5px\'),\n\t\'cellFontFamily\': \'"Segoe UI Web Semilight", "Segoe UI Semilight", "Segoe WP Semilight", "Segoe UI", "Segoe WP", Tahoma, Arial, sans-serif\',\n\t\'cellFontSize\': \'12px\',\n\t\'cellColor\': \'#666666\',\n\t\'headerCellColor\': \'#333333\',\n\t\'headerCellFontSize\': \'12px\',\n\n\t\'stack.cellCursor\': \'pointer\',\n\t\'stack.cellHBorder\': Theme.parseBorder(\'solid 1px #cccccc\'),\n\t\'stack.cellHeight\': 28,\n\t\'stack.headerCursor\': \'pointer\',\n\t\'stack.selectionIndicatorWidth\': 16,\n\t\'stack.selectionIndicatorPadding\': Theme.parsePadding(\'4px 3px 4px 5px\'),\n\t\'stack.headerCellFontFamily\': \'"Segoe UI Web Semilight", "Segoe UI Semilight", "Segoe WP Semilight", "Segoe UI", "Segoe WP", Tahoma, Arial, sans-serif\',\n\t\'stack.headerEndBorder\': Theme.parseBorder(\'solid 1px #cccccc\'),\n\t\'stack.headerHBorder\': Theme.parseBorder(\'solid 1px #cccccc\'),\n\t\'stack.rowBorder\': Theme.parseBorder(\'solid 1px #cccccc\'),\n\t\'stack.rowPadding\': Theme.parsePadding(\'5px 3px 5px 3px\'),\n\n\t\'table.cellCursor\': \'cell\',\n\t\'table.cellHBorder\': Theme.parseBorder(\'solid 1px transparent\'),\n\t\'table.cellVBorder\': Theme.parseBorder(\'solid 1px transparent\'),\n\t\'table.cellWidth\': 100,\n\t\'table.cursorBorder\': Theme.parseBorder(\'solid 1px #cccccc\'),\n\t\'table.headerBottomBorder\': Theme.parseBorder(\'solid 1px #eaeaea\'),\n\t\'table.headerCellVBorder\': Theme.parseBorder(\'solid 1px #eaeaea\'),\n\t\'table.headerCursor\': \'pointer\',\n\t\'table.headerCellFontFamily\': \'"Segoe UI Semibold", "Segoe UI Web Semibold", "Segoe UI Web Semilight", "Segoe UI Semilight", "Segoe WP Semilight", "Segoe UI", "Segoe WP", Tahoma, Arial, sans-serif\',\n\t\'table.headerRowHeight\': 28,\n\t\'table.rowHeight\': 30,\n\t\'table.canvasEndMargin\': 300,\n\t\'table.canvasBottomMargin\': 300,\n}\n');

        dialog.dialog({
            height: 650,
            width: 760,
            modal: true,
            buttons: {
                'Apply': function () {
                    var theme;
                    var themeString = $('#customizeTheme > textarea').val();

                    console.log(themeString);
                    var func = new Function('Theme', 'return ' + themeString + ';');
                    theme = new Microsoft.Office.Controls.Theme(func(Microsoft.Office.Controls.Theme));

                    listControlObject5.theme(theme);
                },
                'Close': function () { dialog.dialog('close') },
            }
        });
    });


    /// API list

    var root = $('#api_table');
    var listControlElement = $('<div style="position: relative;"></div>');
    root.append(listControlElement);

    listControlObject = new Microsoft.Office.Controls.ListControl(listControlElement[0]);

    listControlObject.addColumns([
    { data: 'API', field: 'API', table: { width: 200 }, },
    { data: 'Arguments', field: 'arguments', table: { width: 200 }, },
    { data: 'return', field: 'apiName', table: { width: 200 }, },
    { data: 'Definition', field: 'apiName', table: { width: 400 }, },
    ]);

    data = [
    { API: 'viewType', Arguments: 25 },
    { API: 'width', Arguments: 23 },
    { API: 'height', Arguments: 23 },
    { API: 'rowCount', Arguments: 23 },
    { API: 'rows', Arguments: 23 },
    { API: 'getRowById', Arguments: 23 },
    { API: 'getRowsByIndex', Arguments: 23 },
    { API: 'updateRowById', Arguments: 23 },
    { API: 'updateRowsByIndex', Arguments: 23 },
    { API: 'removeRowById', Arguments: 23 },
    { API: 'removeRowByIndex', Arguments: 23 },
    { API: 'removeRowsByIndex', Arguments: 23 },
    { API: 'insertRowById', Arguments: 23 },
    { API: 'insertRowByIndex', Arguments: 23 },
    { API: 'theme', Arguments: 23 },
    { API: 'selectedRanges', Arguments: 23 },
    { API: 'selectionMode', Arguments: 23 },
    { API: 'cursor', Arguments: 23 },
    { API: 'select', Arguments: 23 },
    { API: 'deselect', Arguments: 23 },
    { API: 'selectedRangeOfPosition', Arguments: 23 },
    { API: 'selectedRangeOfCursor', Arguments: 23 },
    { API: 'rtl', Arguments: 23 },
    { API: 'addColumns', Arguments: 23 },
    { API: 'updateUI', Arguments: 23 },
    { API: 'viewProperty', Arguments: 23 },
    { API: 'on', Arguments: 23 },
    { API: 'off', Arguments: 23 },
    { API: 'invalidateRow', Arguments: 23 },
    { API: 'invalidateHeaderRange', Arguments: 23 },
    { API: 'invalidateHeaderCell', Arguments: 23 },
    { API: 'invalidate', Arguments: 23 },
    { API: 'invalidateRange', Arguments: 23 },
    { API: 'getColumnById', Arguments: 23 },
    { API: 'getColumnIdByIndex', Arguments: 23 },
    { API: 'getColumnIndexById', Arguments: 23 },
    { API: 'scrollTo', Arguments: 23 },
    { API: 'getOperationName', Arguments: 23 },
    { API: 'stopOperation', Arguments: 23 },
    ];

    listControlObject.rows(data);
})

$(document).ready(function () {
    $('#example_tab').click(function () {
        showTag('example_tab', 'demo_page');
        hideTag('API_tab', 'api_page');
    });
    $('#API_tab').click(function () {
        showTag('API_tab', 'api_page');
        hideTag('example_tab', 'demo_page');
    });

    var navmenu = $('#navmenu');
    var menulist = $('<ul></ul>');
    menulist.append('<li><a href="#get_started">Get Started</li>');
    menulist.append('<li><a href="#basic_example">Basic</li>');
    menulist.append('<li><a href="#rtl_example">Right to left</li>');
    menulist.append('<li><a href="#stack_example">Stack View</li>');
    menulist.append('<li><a href="#select_example">Selection</li>');
    menulist.append('<li><a href="#theme_example">Theme</li>');
    navmenu.append(menulist);
});

var showTag = function (button, page) {
    $('#' + button).addClass("active");
    $('#' + page).show();
}

var hideTag = function (button, page) {
    $('#' + button).removeClass("active");
    $('#' + page).hide();
}
