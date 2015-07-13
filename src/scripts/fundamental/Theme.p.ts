export class Theme {
    private static _StyleParserMapping = {
        'background-color': '_parser_default',
        'border': '_parser_border',
        'border-left': '_parser_border',
        'border-right': '_parser_border',
        'border-top': '_parser_border',
        'border-bottom': '_parser_border',
        'padding': '_parser_padding',
        'height': '_parser_numberWithUnit',
        'width': '_parser_numberWithUnit',
        'font-size': '_parser_numberWithUnit',
    };
    private _html;
    private _id;
    public values;
    public texts;

    constructor(html, id) {
        this._html = html;
        this._id = id;
        this.values = {};
    }

    public load(name) {
        var themeElement = $(this._html);

        $(document.body).append(themeElement);

        themeElement.attr('id', this._id);
        themeElement.attr('class', name);

        var cssTexts = this._match(themeElement.find('*').addBack());

        this._parseCssText(cssTexts);

        themeElement.remove();
    }

    private _parseCssText(cssTexts) {
        this.values = {};
        this.texts = {}

        for (var prefix in cssTexts) {
            var cssStyles = cssTexts[prefix].split(';');
            var cssStyleMap = {};

            for (var index in cssStyles) {
                var cssStyle = cssStyles[index].trim();

                if (cssStyle == '') {
                    continue;
                }

                var cssStyleName = cssStyle.substring(0, cssStyle.indexOf(':')).trim(),
                    cssStyleValue = cssStyle.substring(cssStyle.indexOf(':') + 1).trim();
                cssStyleMap[cssStyleName] = cssStyleValue;
            }

            var directions = { 'top': 0, 'right': 0, 'bottom': 0, 'left': 0 };

            for (var direction in directions) {
                if (cssStyleMap['border-' + direction + '-width'] && cssStyleMap['border-' + direction + '-style'] && cssStyleMap['border-' + direction + '-color']) {
                    cssStyleMap['border-' + direction] = cssStyleMap['border-' + direction + '-width'] + ' ' + cssStyleMap['border-' + direction + '-style'] + ' ' + cssStyleMap['border-' + direction + '-color'];
                }
            }

            for (var cssStyleName in cssStyleMap) {
                var cssStyleValue = cssStyleMap[cssStyleName];

                this.values[prefix + cssStyleName] = this._parseStyle(cssStyleName, cssStyleValue);
                this.texts[prefix + cssStyleName] = this.values[prefix + cssStyleName].text;
            }
        }
    }

    private _parseStyle(name, value) {
        var parser = Theme[Theme._StyleParserMapping[name]];

        if (parser) {
            return parser(value);
        } else {
            console.warn('Cannot get the parser of ' + name);
            return { text: value };
        }
    }

    private static _parser_default(value) {
        return { text: value };
    }

    private static _parser_border(value) {
        var parts = value.split(' ');

        switch (parts.length) {
            case 1:
                parts[1] = 'solid';
                parts[2] = 'transparent';
                break;

            case 2:
                if (parts[1] == 'currentColor' || parts[1] == 'none') {
                    parts[1] = 'solid';
                    parts[2] = 'transparent';
                }
                break;
        }

        var width = parts.shift(),
            style = parts.shift(),
            color = parts.join(' ');

        if (!Theme._checkPixelUnit(width)) {
            throw Microsoft.Office.Controls.Fundamental.createError(0, 'Theme', 'border width unit can be in pixel only');
        }

        return {
            width: width,
            number: parseInt(width),
            style: style,
            color: color,
            text: width + ' ' + style + ' ' + color,
        };
    }

    private static _checkPixelUnit(text) {
        return /^\d+px$/.test(text);
    }

    private static _parser_padding(value) {
        var parts = value.split(' ');

        switch (parts.length) {
            case 0:
                parts[0] = '0px';
                parts[1] = '0px';
                parts[2] = '0px';
                parts[3] = '0px';
                break;

            case 1:
                parts[1] = parts[2] = parts[3] = parts[0];
                break;

            case 2:
                parts[3] = parts[1];
                parts[2] = parts[0];
                break;

            case 3:
                parts[3] = parts[1];
                break;
        }

        if (!Theme._checkPixelUnit(parts[0])
            || !Theme._checkPixelUnit(parts[1])
            || !Theme._checkPixelUnit(parts[2])
            || !Theme._checkPixelUnit(parts[3])) {
            throw Microsoft.Office.Controls.Fundamental.createError(0, 'Theme', 'padding can be in pixel only');
        }

        return {
            top: parseInt(parts[0]),
            end: parseInt(parts[1]),
            bottom: parseInt(parts[2]),
            front: parseInt(parts[3]),
            ltr: parts[0] + ' ' + parts[1] + ' ' + parts[2] + ' ' + parts[3],
            rtl: parts[0] + ' ' + parts[3] + ' ' + parts[2] + ' ' + parts[1],
        };
    }

    private static _parser_numberWithUnit(value) {
        if (!Theme._checkPixelUnit(value)) {
            throw Microsoft.Office.Controls.Fundamental.createError(0, 'Theme', 'unit can be in pixel only');
        }
        return {
            number: parseInt(value),
            text: value
        };
    }

    private _match(elements) {
        var sheets = document.styleSheets,
            cssTexts = {},
            matches = elements[0].matches || elements[0].webkitMatchesSelector || elements[0].mozMatchesSelector || elements[0].msMatchesSelector || elements[0].oMatchesSelector;

        for (var sheetIndex in sheets) {
            var rules = (<any>sheets[sheetIndex]).rules || (<any>sheets[sheetIndex]).cssRules;

            for (var ruleIndex in rules) {
                var selectorText = rules[ruleIndex].selectorText;

                console.log(selectorText);

                if (!selectorText) {
                    continue;
                }

                for (var elementIndex = 0; elementIndex < elements.length; elementIndex++) {
                    if (matches.call(elements[elementIndex], selectorText) && selectorText.indexOf('#' + this._id) >= 0) {
                        var prefix = $(elements[elementIndex]).attr('prefix');

                        if (!cssTexts[prefix]) {
                            cssTexts[prefix] = this._stripBrucket(rules[ruleIndex].cssText);
                        } else {
                            cssTexts[prefix] += ' ' + this._stripBrucket(rules[ruleIndex].cssText);
                        }
                    }
                }
            }
        }

        return cssTexts;
    }

    private _stripBrucket(cssText) {
        var startIndex = cssText.indexOf('{'),
            endIndex = cssText.lastIndexOf('}');

        return cssText.substring(startIndex + 2, endIndex - 1);
    }
}

