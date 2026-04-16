/*!
 * FullCalendar v2.1.1
 * Docs & License: http://arshaw.com/fullcalendar/
 * (c) 2013 Adam Shaw
 */

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['jquery', 'moment'], factory);
    }
    else {
        factory(jQuery, moment);
    }
})(function ($, moment) {

    ;;

    var defaults = {

        lang: 'en',

        defaultTimedEventDuration: '02:00:00',
        defaultAllDayEventDuration: { days: 1 },
        forceEventDuration: false,
        nextDayThreshold: '09:00:00', // 9am

        // display
        defaultView: 'month',
        aspectRatio: 1.35,
        header: {
            left: 'title',
            center: '',
            right: 'today prev,next'
        },
        weekends: true,
        weekNumbers: false,

        weekNumberTitle: 'W',
        weekNumberCalculation: 'local',

        //editable: false,

        // event ajax
        lazyFetching: true,
        startParam: 'start',
        endParam: 'end',
        timezoneParam: 'timezone',

        timezone: false,

        //allDayDefault: undefined,

        // time formats
        titleFormat: {
            month: 'MMMM YYYY', // like "September 1986". each language will override this
            week: 'll', // like "Sep 4 1986"
            day: 'LL' // like "September 4 1986"
        },
        columnFormat: {
            month: 'ddd', // like "Sat"
            week: generateWeekColumnFormat,
            day: 'dddd' // like "Saturday"
        },
        timeFormat: { // for event elements
            'default': generateShortTimeFormat
        },

        displayEventEnd: {
            month: false,
            basicWeek: false,
            'default': true
        },

        // locale
        isRTL: false,
        defaultButtonText: {
            prev: "prev",
            next: "next",
            prevYear: "prev year",
            nextYear: "next year",
            today: 'today',
            month: 'month',
            week: 'week',
            day: 'day'
        },

        buttonIcons: {
            prev: 'left-single-arrow',
            next: 'right-single-arrow',
            prevYear: 'left-double-arrow',
            nextYear: 'right-double-arrow'
        },

        // jquery-ui theming
        theme: false,
        themeButtonIcons: {
            prev: 'circle-triangle-w',
            next: 'circle-triangle-e',
            prevYear: 'seek-prev',
            nextYear: 'seek-next'
        },

        dragOpacity: .75,
        dragRevertDuration: 500,
        dragScroll: true,

        //selectable: false,
        unselectAuto: true,

        dropAccept: '*',

        eventLimit: false,
        eventLimitText: 'more',
        eventLimitClick: 'popover',
        dayPopoverFormat: 'LL',

        handleWindowResize: true,
        windowResizeDelay: 200 // milliseconds before a rerender happens

    };


    function generateShortTimeFormat(options, langData) {
        return langData.longDateFormat('LT')
            .replace(':mm', '(:mm)')
            .replace(/(\Wmm)$/, '($1)') // like above, but for foreign langs
            .replace(/\s*a$/i, 't'); // convert to AM/PM/am/pm to lowercase one-letter. remove any spaces beforehand
    }


    function generateWeekColumnFormat(options, langData) {
        var format = langData.longDateFormat('L'); // for the format like "MM/DD/YYYY"
        format = format.replace(/^Y+[^\w\s]*|[^\w\s]*Y+$/g, ''); // strip the year off the edge, as well as other misc non-whitespace chars
        if (options.isRTL) {
            format += ' ddd'; // for RTL, add day-of-week to end
        }
        else {
            format = 'ddd ' + format; // for LTR, add day-of-week to beginning
        }
        return format;
    }


    var langOptionHash = {
        en: {
            columnFormat: {
                week: 'ddd M/D' // override for english. different from the generated default, which is MM/DD
            },
            dayPopoverFormat: 'dddd, MMMM D'
        }
    };


    // right-to-left defaults
    var rtlDefaults = {
        header: {
            left: 'next,prev today',
            center: '',
            right: 'title'
        },
        buttonIcons: {
            prev: 'right-single-arrow',
            next: 'left-single-arrow',
            prevYear: 'right-double-arrow',
            nextYear: 'left-double-arrow'
        },
        themeButtonIcons: {
            prev: 'circle-triangle-e',
            next: 'circle-triangle-w',
            nextYear: 'seek-prev',
            prevYear: 'seek-next'
        }
    };

    ;;

    var fc = $.fullCalendar = { version: "2.1.1" };
    var fcViews = fc.views = {};


    $.fn.fullCalendar = function (options) {
        var args = Array.prototype.slice.call(arguments, 1); // for a possible method call
        var res = this; // what this function will return (this jQuery object by default)

        this.each(function (i, _element) { // loop each DOM element involved
            var element = $(_element);
            var calendar = element.data('fullCalendar'); // get the existing calendar object (if any)
            var singleRes; // the returned value of this single method call

            // a method call
            if (typeof options === 'string') {
                if (calendar && $.isFunction(calendar[options])) {
                    singleRes = calendar[options].apply(calendar, args);
                    if (!i) {
                        res = singleRes; // record the first method call result
                    }
                    if (options === 'destroy') { // for the destroy method, must remove Calendar object data
                        element.removeData('fullCalendar');
                    }
                }
            }
                // a new calendar initialization
            else if (!calendar) { // don't initialize twice
                calendar = new Calendar(element, options);
                element.data('fullCalendar', calendar);
                calendar.render();
            }
        });

        return res;
    };


    // function for adding/overriding defaults
    function setDefaults(d) {
        mergeOptions(defaults, d);
    }


    // Recursively combines option hash-objects.
    // Better than `$.extend(true, ...)` because arrays are not traversed/copied.
    //
    // called like:
    //     mergeOptions(target, obj1, obj2, ...)
    //
    function mergeOptions(target) {

        function mergeIntoTarget(name, value) {
            if ($.isPlainObject(value) && $.isPlainObject(target[name]) && !isForcedAtomicOption(name)) {
                // merge into a new object to avoid destruction
                target[name] = mergeOptions({}, target[name], value); // combine. `value` object takes precedence
            }
            else if (value !== undefined) { // only use values that are set and not undefined
                target[name] = value;
            }
        }

        for (var i = 1; i < arguments.length; i++) {
            $.each(arguments[i], mergeIntoTarget);
        }

        return target;
    }


    // overcome sucky view-option-hash and option-merging behavior messing with options it shouldn't
    function isForcedAtomicOption(name) {
        // Any option that ends in "Time" or "Duration" is probably a Duration,
        // and these will commonly be specified as plain objects, which we don't want to mess up.
        return /(Time|Duration)$/.test(name);
    }
    // FIX: find a different solution for view-option-hashes and have a whitelist
    // for options that can be recursively merged.

    ;;

    //var langOptionHash = {}; // initialized in defaults.js
    fc.langs = langOptionHash; // expose


    // Initialize jQuery UI Datepicker translations while using some of the translations
    // for our own purposes. Will set this as the default language for datepicker.
    // Called from a translation file.
    fc.datepickerLang = function (langCode, datepickerLangCode, options) {
        var langOptions = langOptionHash[langCode];

        // initialize FullCalendar's lang hash for this language
        if (!langOptions) {
            langOptions = langOptionHash[langCode] = {};
        }

        // merge certain Datepicker options into FullCalendar's options
        mergeOptions(langOptions, {
            isRTL: options.isRTL,
            weekNumberTitle: options.weekHeader,
            titleFormat: {
                month: options.showMonthAfterYear ?
                    'YYYY[' + options.yearSuffix + '] MMMM' :
                    'MMMM YYYY[' + options.yearSuffix + ']'
            },
            defaultButtonText: {
                // the translations sometimes wrongly contain HTML entities
                prev: stripHtmlEntities(options.prevText),
                next: stripHtmlEntities(options.nextText),
                today: stripHtmlEntities(options.currentText)
            }
        });

        // is jQuery UI Datepicker is on the page?
        if ($.datepicker) {

            // Register the language data.
            // FullCalendar and MomentJS use language codes like "pt-br" but Datepicker
            // does it like "pt-BR" or if it doesn't have the language, maybe just "pt".
            // Make an alias so the language can be referenced either way.
            $.datepicker.regional[datepickerLangCode] =
                $.datepicker.regional[langCode] = // alias
                    options;

            // Alias 'en' to the default language data. Do this every time.
            $.datepicker.regional.en = $.datepicker.regional[''];

            // Set as Datepicker's global defaults.
            $.datepicker.setDefaults(options);
        }
    };


    // Sets FullCalendar-specific translations. Also sets the language as the global default.
    // Called from a translation file.
    fc.lang = function (langCode, options) {
        var langOptions;

        if (options) {
            langOptions = langOptionHash[langCode];

            // initialize the hash for this language
            if (!langOptions) {
                langOptions = langOptionHash[langCode] = {};
            }

            mergeOptions(langOptions, options || {});
        }

        // set it as the default language for FullCalendar
        defaults.lang = langCode;
    };
    ;;


    function Calendar(element, instanceOptions) {
        var t = this;



        // Build options object
        // -----------------------------------------------------------------------------------
        // Precedence (lowest to highest): defaults, rtlDefaults, langOptions, instanceOptions

        instanceOptions = instanceOptions || {};

        var options = mergeOptions({}, defaults, instanceOptions);
        var langOptions;

        // determine language options
        if (options.lang in langOptionHash) {
            langOptions = langOptionHash[options.lang];
        }
        else {
            langOptions = langOptionHash[defaults.lang];
        }

        if (langOptions) { // if language options exist, rebuild...
            options = mergeOptions({}, defaults, langOptions, instanceOptions);
        }

        if (options.isRTL) { // is isRTL, rebuild...
            options = mergeOptions({}, defaults, rtlDefaults, langOptions || {}, instanceOptions);
        }



        // Exports
        // -----------------------------------------------------------------------------------

        t.options = options;
        t.render = render;
        t.destroy = destroy;
        t.refetchEvents = refetchEvents;
        t.reportEvents = reportEvents;
        t.reportEventChange = reportEventChange;
        t.rerenderEvents = renderEvents; // `renderEvents` serves as a rerender. an API method
        t.changeView = changeView;
        t.select = select;
        t.unselect = unselect;
        t.prev = prev;
        t.next = next;
        t.prevYear = prevYear;
        t.nextYear = nextYear;
        t.today = today;
        t.gotoDate = gotoDate;
        t.incrementDate = incrementDate;
        t.zoomTo = zoomTo;
        t.getDate = getDate;
        t.getCalendar = getCalendar;
        t.getView = getView;
        t.option = option;
        t.trigger = trigger;



        // Language-data Internals
        // -----------------------------------------------------------------------------------
        // Apply overrides to the current language's data


        // Returns moment's internal locale data. If doesn't exist, returns English.
        // Works with moment-pre-2.8
        function getLocaleData(langCode) {
            var f = moment.localeData || moment.langData;
            return f.call(moment, langCode) ||
                f.call(moment, 'en'); // the newer localData could return null, so fall back to en
        }


        var localeData = createObject(getLocaleData(options.lang)); // make a cheap copy

        if (options.monthNames) {
            localeData._months = options.monthNames;
        }
        if (options.monthNamesShort) {
            localeData._monthsShort = options.monthNamesShort;
        }
        if (options.dayNames) {
            localeData._weekdays = options.dayNames;
        }
        if (options.dayNamesShort) {
            localeData._weekdaysShort = options.dayNamesShort;
        }
        if (options.firstDay != null) {
            var _week = createObject(localeData._week); // _week: { dow: # }
            _week.dow = options.firstDay;
            localeData._week = _week;
        }



        // Calendar-specific Date Utilities
        // -----------------------------------------------------------------------------------


        t.defaultAllDayEventDuration = moment.duration(options.defaultAllDayEventDuration);
        t.defaultTimedEventDuration = moment.duration(options.defaultTimedEventDuration);


        // Builds a moment using the settings of the current calendar: timezone and language.
        // Accepts anything the vanilla moment() constructor accepts.
        t.moment = function () {
            var mom;

            if (options.timezone === 'local') {
                mom = fc.moment.apply(null, arguments);

                // Force the moment to be local, because fc.moment doesn't guarantee it.
                if (mom.hasTime()) { // don't give ambiguously-timed moments a local zone
                    mom.local();
                }
            }
            else if (options.timezone === 'UTC') {
                mom = fc.moment.utc.apply(null, arguments); // process as UTC
            }
            else {
                mom = fc.moment.parseZone.apply(null, arguments); // let the input decide the zone
            }

            if ('_locale' in mom) { // moment 2.8 and above
                mom._locale = localeData;
            }
            else { // pre-moment-2.8
                mom._lang = localeData;
            }

            return mom;
        };


        // Returns a boolean about whether or not the calendar knows how to calculate
        // the timezone offset of arbitrary dates in the current timezone.
        t.getIsAmbigTimezone = function () {
            return options.timezone !== 'local' && options.timezone !== 'UTC';
        };


        // Returns a copy of the given date in the current timezone of it is ambiguously zoned.
        // This will also give the date an unambiguous time.
        t.rezoneDate = function (date) {
            return t.moment(date.toArray());
        };


        // Returns a moment for the current date, as defined by the client's computer,
        // or overridden by the `now` option.
        t.getNow = function () {
            var now = options.now;
            if (typeof now === 'function') {
                now = now();
            }
            return t.moment(now);
        };


        // Calculates the week number for a moment according to the calendar's
        // `weekNumberCalculation` setting.
        t.calculateWeekNumber = function (mom) {
            var calc = options.weekNumberCalculation;

            if (typeof calc === 'function') {
                return calc(mom);
            }
            else if (calc === 'local') {
                return mom.week();
            }
            else if (calc.toUpperCase() === 'ISO') {
                return mom.isoWeek();
            }
        };


        // Get an event's normalized end date. If not present, calculate it from the defaults.
        t.getEventEnd = function (event) {
            if (event.end) {
                return event.end.clone();
            }
            else {
                return t.getDefaultEventEnd(event.allDay, event.start);
            }
        };


        // Given an event's allDay status and start date, return swhat its fallback end date should be.
        t.getDefaultEventEnd = function (allDay, start) { // TODO: rename to computeDefaultEventEnd
            var end = start.clone();

            if (allDay) {
                end.stripTime().add(t.defaultAllDayEventDuration);
            }
            else {
                end.add(t.defaultTimedEventDuration);
            }

            if (t.getIsAmbigTimezone()) {
                end.stripZone(); // we don't know what the tzo should be
            }

            return end;
        };



        // Date-formatting Utilities
        // -----------------------------------------------------------------------------------


        // Like the vanilla formatRange, but with calendar-specific settings applied.
        t.formatRange = function (m1, m2, formatStr) {

            // a function that returns a formatStr // TODO: in future, precompute this
            if (typeof formatStr === 'function') {
                formatStr = formatStr.call(t, options, localeData);
            }

            return formatRange(m1, m2, formatStr, null, options.isRTL);
        };


        // Like the vanilla formatDate, but with calendar-specific settings applied.
        t.formatDate = function (mom, formatStr) {

            // a function that returns a formatStr // TODO: in future, precompute this
            if (typeof formatStr === 'function') {
                formatStr = formatStr.call(t, options, localeData);
            }

            return formatDate(mom, formatStr);
        };



        // Imports
        // -----------------------------------------------------------------------------------


        EventManager.call(t, options);
        var isFetchNeeded = t.isFetchNeeded;
        var fetchEvents = t.fetchEvents;



        // Locals
        // -----------------------------------------------------------------------------------


        var _element = element[0];
        var header;
        var headerElement;
        var content;
        var tm; // for making theme classes
        var currentView;
        var suggestedViewHeight;
        var windowResizeProxy; // wraps the windowResize function
        var ignoreWindowResize = 0;
        var date;
        var events = [];



        // Main Rendering
        // -----------------------------------------------------------------------------------


        if (options.defaultDate != null) {
            date = t.moment(options.defaultDate);
        }
        else {
            date = t.getNow();
        }


        function render(inc) {
            if (!content) {
                initialRender();
            }
            else if (elementVisible()) {
                // mainly for the public API
                calcSize();
                renderView(inc);
            }
        }


        function initialRender() {
            tm = options.theme ? 'ui' : 'fc';
            element.addClass('fc');

            if (options.isRTL) {
                element.addClass('fc-rtl');
            }
            else {
                element.addClass('fc-ltr');
            }

            if (options.theme) {
                element.addClass('ui-widget');
            }
            else {
                element.addClass('fc-unthemed');
            }

            content = $("<div class='fc-view-container'/>").prependTo(element);

            header = new Header(t, options);
            headerElement = header.render();
            if (headerElement) {
                element.prepend(headerElement);
            }

            changeView(options.defaultView);

            if (options.handleWindowResize) {
                windowResizeProxy = debounce(windowResize, options.windowResizeDelay); // prevents rapid calls
                $(window).resize(windowResizeProxy);
            }
        }


        function destroy() {

            if (currentView) {
                currentView.destroy();
            }

            header.destroy();
            content.remove();
            element.removeClass('fc fc-ltr fc-rtl fc-unthemed ui-widget');

            $(window).unbind('resize', windowResizeProxy);
        }


        function elementVisible() {
            return element.is(':visible');
        }



        // View Rendering
        // -----------------------------------------------------------------------------------


        function changeView(viewName) {
            renderView(0, viewName);
        }


        // Renders a view because of a date change, view-type change, or for the first time
        function renderView(delta, viewName) {
            ignoreWindowResize++;

            // if viewName is changing, destroy the old view
            if (currentView && viewName && currentView.name !== viewName) {
                header.deactivateButton(currentView.name);
                freezeContentHeight(); // prevent a scroll jump when view element is removed
                if (currentView.start) { // rendered before?
                    currentView.destroy();
                }
                currentView.el.remove();
                currentView = null;
            }

            // if viewName changed, or the view was never created, create a fresh view
            if (!currentView && viewName) {
                currentView = new fcViews[viewName](t);
                currentView.el = $("<div class='fc-view fc-" + viewName + "-view' />").appendTo(content);
                header.activateButton(viewName);
            }

            if (currentView) {

                // let the view determine what the delta means
                if (delta) {
                    date = currentView.incrementDate(date, delta);
                }

                // render or rerender the view
                if (
                    !currentView.start || // never rendered before
                    delta || // explicit date window change
                    !date.isWithin(currentView.intervalStart, currentView.intervalEnd) // implicit date window change
                ) {
                    if (elementVisible()) {

                        freezeContentHeight();
                        if (currentView.start) { // rendered before?
                            currentView.destroy();
                        }
                        currentView.render(date);
                        unfreezeContentHeight();

                        // need to do this after View::render, so dates are calculated
                        updateTitle();
                        updateTodayButton();

                        getAndRenderEvents();
                    }
                }
            }

            unfreezeContentHeight(); // undo any lone freezeContentHeight calls
            ignoreWindowResize--;
        }



        // Resizing
        // -----------------------------------------------------------------------------------


        t.getSuggestedViewHeight = function () {
            if (suggestedViewHeight === undefined) {
                calcSize();
            }
            return suggestedViewHeight;
        };


        t.isHeightAuto = function () {
            return options.contentHeight === 'auto' || options.height === 'auto';
        };


        function updateSize(shouldRecalc) {
            if (elementVisible()) {

                if (shouldRecalc) {
                    _calcSize();
                }

                ignoreWindowResize++;
                currentView.updateSize(true); // isResize=true. will poll getSuggestedViewHeight() and isHeightAuto()
                ignoreWindowResize--;

                return true; // signal success
            }
        }


        function calcSize() {
            if (elementVisible()) {
                _calcSize();
            }
        }


        function _calcSize() { // assumes elementVisible
            if (typeof options.contentHeight === 'number') { // exists and not 'auto'
                suggestedViewHeight = options.contentHeight;
            }
            else if (typeof options.height === 'number') { // exists and not 'auto'
                suggestedViewHeight = options.height - (headerElement ? headerElement.outerHeight(true) : 0);
            }
            else {
                suggestedViewHeight = Math.round(content.width() / Math.max(options.aspectRatio, .5));
            }
        }


        function windowResize(ev) {
            if (
                !ignoreWindowResize &&
                ev.target === window && // so we don't process jqui "resize" events that have bubbled up
                currentView.start // view has already been rendered
            ) {
                if (updateSize(true)) {
                    currentView.trigger('windowResize', _element);
                }
            }
        }



        /* Event Fetching/Rendering
        -----------------------------------------------------------------------------*/
        // TODO: going forward, most of this stuff should be directly handled by the view


        function refetchEvents() { // can be called as an API method
            destroyEvents(); // so that events are cleared before user starts waiting for AJAX
            fetchAndRenderEvents();
        }


        function renderEvents() { // destroys old events if previously rendered
            if (elementVisible()) {
                freezeContentHeight();
                currentView.destroyEvents(); // no performance cost if never rendered
                currentView.renderEvents(events);
                unfreezeContentHeight();
            }
        }


        function destroyEvents() {
            freezeContentHeight();
            currentView.destroyEvents();
            unfreezeContentHeight();
        }


        function getAndRenderEvents() {
            if (!options.lazyFetching || isFetchNeeded(currentView.start, currentView.end)) {
                fetchAndRenderEvents();
            }
            else {
                renderEvents();
            }
        }


        function fetchAndRenderEvents() {
            fetchEvents(currentView.start, currentView.end);
            // ... will call reportEvents
            // ... which will call renderEvents
        }


        // called when event data arrives
        function reportEvents(_events) {
            events = _events;
            renderEvents();
        }


        // called when a single event's data has been changed
        function reportEventChange() {
            renderEvents();
        }



        /* Header Updating
        -----------------------------------------------------------------------------*/


        function updateTitle() {
            header.updateTitle(currentView.title);
        }


        function updateTodayButton() {
            var now = t.getNow();
            if (now.isWithin(currentView.intervalStart, currentView.intervalEnd)) {
                header.disableButton('today');
            }
            else {
                header.enableButton('today');
            }
        }



        /* Selection
        -----------------------------------------------------------------------------*/


        function select(start, end) {

            start = t.moment(start);
            if (end) {
                end = t.moment(end);
            }
            else if (start.hasTime()) {
                end = start.clone().add(t.defaultTimedEventDuration);
            }
            else {
                end = start.clone().add(t.defaultAllDayEventDuration);
            }

            currentView.select(start, end);
        }


        function unselect() { // safe to be called before renderView
            if (currentView) {
                currentView.unselect();
            }
        }



        /* Date
        -----------------------------------------------------------------------------*/


        function prev() {
            renderView(-1);
        }


        function next() {
            renderView(1);
        }


        function prevYear() {
            date.add(-1, 'years');
            renderView();
        }


        function nextYear() {
            date.add(1, 'years');
            renderView();
        }


        function today() {
            date = t.getNow();
            renderView();
        }


        function gotoDate(dateInput) {
            date = t.moment(dateInput);
            renderView();
        }


        function incrementDate(delta) {
            date.add(moment.duration(delta));
            renderView();
        }


        // Forces navigation to a view for the given date.
        // `viewName` can be a specific view name or a generic one like "week" or "day".
        function zoomTo(newDate, viewName) {
            var viewStr;
            var match;

            if (!viewName || fcViews[viewName] === undefined) { // a general view name, or "auto"
                viewName = viewName || 'day';
                viewStr = header.getViewsWithButtons().join(' '); // space-separated string of all the views in the header

                // try to match a general view name, like "week", against a specific one, like "agendaWeek"
                match = viewStr.match(new RegExp('\\w+' + capitaliseFirstLetter(viewName)));

                // fall back to the day view being used in the header
                if (!match) {
                    match = viewStr.match(/\w+Day/);
                }

                viewName = match ? match[0] : 'agendaDay'; // fall back to agendaDay
            }

            date = newDate;
            changeView(viewName);
        }


        function getDate() {
            return date.clone();
        }



        /* Height "Freezing"
        -----------------------------------------------------------------------------*/


        function freezeContentHeight() {
            content.css({
                width: '100%',
                height: content.height(),
                overflow: 'hidden'
            });
        }


        function unfreezeContentHeight() {
            content.css({
                width: '',
                height: '',
                overflow: ''
            });
        }



        /* Misc
        -----------------------------------------------------------------------------*/


        function getCalendar() {
            return t;
        }


        function getView() {
            return currentView;
        }


        function option(name, value) {
            if (value === undefined) {
                return options[name];
            }
            if (name == 'height' || name == 'contentHeight' || name == 'aspectRatio') {
                options[name] = value;
                updateSize(true); // true = allow recalculation of height
            }
        }


        function trigger(name, thisObj) {
            if (options[name]) {
                return options[name].apply(
                    thisObj || _element,
                    Array.prototype.slice.call(arguments, 2)
                );
            }
        }

    }

    ;;

    /* Top toolbar area with buttons and title
    ----------------------------------------------------------------------------------------------------------------------*/
    // TODO: rename all header-related things to "toolbar"

    function Header(calendar, options) {
        var t = this;

        // exports
        t.render = render;
        t.destroy = destroy;
        t.updateTitle = updateTitle;
        t.activateButton = activateButton;
        t.deactivateButton = deactivateButton;
        t.disableButton = disableButton;
        t.enableButton = enableButton;
        t.getViewsWithButtons = getViewsWithButtons;

        // locals
        var el = $();
        var viewsWithButtons = [];
        var tm;


        function render() {
            var sections = options.header;

            tm = options.theme ? 'ui' : 'fc';

            if (sections) {
                el = $("<div class='fc-toolbar'/>")
                    .append(renderSection('left'))
                    .append(renderSection('right'))
                    .append(renderSection('center'))
                    .append('<div class="fc-clear"/>');

                return el;
            }
        }


        function destroy() {
            el.remove();
        }


        function renderSection(position) {
            var sectionEl = $('<div class="fc-' + position + '"/>');
            var buttonStr = options.header[position];

            if (buttonStr) {
                $.each(buttonStr.split(' '), function (i) {
                    var groupChildren = $();
                    var isOnlyButtons = true;
                    var groupEl;

                    $.each(this.split(','), function (j, buttonName) {
                        var buttonClick;
                        var themeIcon;
                        var normalIcon;
                        var defaultText;
                        var customText;
                        var innerHtml;
                        var classes;
                        var button;

                        if (buttonName == 'title') {
                            groupChildren = groupChildren.add($('<h2>&nbsp;</h2>')); // we always want it to take up height
                            isOnlyButtons = false;
                        }
                        else {
                            if (calendar[buttonName]) { // a calendar method
                                buttonClick = function () {
                                    calendar[buttonName]();
                                };
                            }
                            else if (fcViews[buttonName]) { // a view name
                                buttonClick = function () {
                                    calendar.changeView(buttonName);
                                };
                                viewsWithButtons.push(buttonName);
                            }
                            if (buttonClick) {

                                // smartProperty allows different text per view button (ex: "Agenda Week" vs "Basic Week")
                                themeIcon = smartProperty(options.themeButtonIcons, buttonName);
                                normalIcon = smartProperty(options.buttonIcons, buttonName);
                                defaultText = smartProperty(options.defaultButtonText, buttonName);
                                customText = smartProperty(options.buttonText, buttonName);

                                if (customText) {
                                    innerHtml = htmlEscape(customText);
                                }
                                else if (themeIcon && options.theme) {
                                    innerHtml = "<span class='ui-icon ui-icon-" + themeIcon + "'></span>";
                                }
                                else if (normalIcon && !options.theme) {
                                    innerHtml = "<span class='fc-icon fc-icon-" + normalIcon + "'></span>";
                                }
                                else {
                                    innerHtml = htmlEscape(defaultText || buttonName);
                                }

                                classes = [
                                    'fc-' + buttonName + '-button',
                                    tm + '-button',
                                    tm + '-state-default'
                                ];

                                button = $( // type="button" so that it doesn't submit a form
                                    '<button type="button" class="' + classes.join(' ') + '">' +
                                        innerHtml +
                                    '</button>'
                                    )
                                    .click(function () {
                                        // don't process clicks for disabled buttons
                                        if (!button.hasClass(tm + '-state-disabled')) {

                                            buttonClick();

                                            // after the click action, if the button becomes the "active" tab, or disabled,
                                            // it should never have a hover class, so remove it now.
                                            if (
                                                button.hasClass(tm + '-state-active') ||
                                                button.hasClass(tm + '-state-disabled')
                                            ) {
                                                button.removeClass(tm + '-state-hover');
                                            }
                                        }
                                    })
                                    .mousedown(function () {
                                        // the *down* effect (mouse pressed in).
                                        // only on buttons that are not the "active" tab, or disabled
                                        button
                                            .not('.' + tm + '-state-active')
                                            .not('.' + tm + '-state-disabled')
                                            .addClass(tm + '-state-down');
                                    })
                                    .mouseup(function () {
                                        // undo the *down* effect
                                        button.removeClass(tm + '-state-down');
                                    })
                                    .hover(
                                        function () {
                                            // the *hover* effect.
                                            // only on buttons that are not the "active" tab, or disabled
                                            button
                                                .not('.' + tm + '-state-active')
                                                .not('.' + tm + '-state-disabled')
                                                .addClass(tm + '-state-hover');
                                        },
                                        function () {
                                            // undo the *hover* effect
                                            button
                                                .removeClass(tm + '-state-hover')
                                                .removeClass(tm + '-state-down'); // if mouseleave happens before mouseup
                                        }
                                    );

                                groupChildren = groupChildren.add(button);
                            }
                        }
                    });

                    if (isOnlyButtons) {
                        groupChildren
                            .first().addClass(tm + '-corner-left').end()
                            .last().addClass(tm + '-corner-right').end();
                    }

                    if (groupChildren.length > 1) {
                        groupEl = $('<div/>');
                        if (isOnlyButtons) {
                            groupEl.addClass('fc-button-group');
                        }
                        groupEl.append(groupChildren);
                        sectionEl.append(groupEl);
                    }
                    else {
                        sectionEl.append(groupChildren); // 1 or 0 children
                    }
                });
            }

            return sectionEl;
        }


        function updateTitle(text) {
            el.find('h2').text(text);
        }


        function activateButton(buttonName) {
            el.find('.fc-' + buttonName + '-button')
                .addClass(tm + '-state-active');
        }


        function deactivateButton(buttonName) {
            el.find('.fc-' + buttonName + '-button')
                .removeClass(tm + '-state-active');
        }


        function disableButton(buttonName) {
            el.find('.fc-' + buttonName + '-button')
                .attr('disabled', 'disabled')
                .addClass(tm + '-state-disabled');
        }


        function enableButton(buttonName) {
            el.find('.fc-' + buttonName + '-button')
                .removeAttr('disabled')
                .removeClass(tm + '-state-disabled');
        }


        function getViewsWithButtons() {
            return viewsWithButtons;
        }

    }

    ;;

    fc.sourceNormalizers = [];
    fc.sourceFetchers = [];

    var ajaxDefaults = {
        dataType: 'json',
        cache: false
    };

    var eventGUID = 1;


    function EventManager(options) { // assumed to be a calendar
        var t = this;


        // exports
        t.isFetchNeeded = isFetchNeeded;
        t.fetchEvents = fetchEvents;
        t.addEventSource = addEventSource;
        t.removeEventSource = removeEventSource;
        t.updateEvent = updateEvent;
        t.renderEvent = renderEvent;
        t.removeEvents = removeEvents;
        t.clientEvents = clientEvents;
        t.mutateEvent = mutateEvent;


        // imports
        var trigger = t.trigger;
        var getView = t.getView;
        var reportEvents = t.reportEvents;
        var getEventEnd = t.getEventEnd;


        // locals
        var stickySource = { events: [] };
        var sources = [stickySource];
        var rangeStart, rangeEnd;
        var currentFetchID = 0;
        var pendingSourceCnt = 0;
        var loadingLevel = 0;
        var cache = [];


        $.each(
            (options.events ? [options.events] : []).concat(options.eventSources || []),
            function (i, sourceInput) {
                var source = buildEventSource(sourceInput);
                if (source) {
                    sources.push(source);
                }
            }
        );



        /* Fetching
        -----------------------------------------------------------------------------*/


        function isFetchNeeded(start, end) {
            return !rangeStart || // nothing has been fetched yet?
                // or, a part of the new range is outside of the old range? (after normalizing)
                start.clone().stripZone() < rangeStart.clone().stripZone() ||
                end.clone().stripZone() > rangeEnd.clone().stripZone();
        }


        function fetchEvents(start, end) {
            rangeStart = start;
            rangeEnd = end;
            cache = [];
            var fetchID = ++currentFetchID;
            var len = sources.length;
            pendingSourceCnt = len;
            for (var i = 0; i < len; i++) {
                fetchEventSource(sources[i], fetchID);
            }
        }


        function fetchEventSource(source, fetchID) {
            _fetchEventSource(source, function (events) {
                var isArraySource = $.isArray(source.events);
                var i;
                var event;

                if (fetchID == currentFetchID) {

                    if (events) {
                        for (i = 0; i < events.length; i++) {
                            event = events[i];

                            // event array sources have already been convert to Event Objects
                            if (!isArraySource) {
                                event = buildEvent(event, source);
                            }

                            if (event) {
                                cache.push(event);
                            }
                        }
                    }

                    pendingSourceCnt--;
                    if (!pendingSourceCnt) {
                        reportEvents(cache);
                    }
                }
            });
        }


        function _fetchEventSource(source, callback) {
            var i;
            var fetchers = fc.sourceFetchers;
            var res;

            for (i = 0; i < fetchers.length; i++) {
                res = fetchers[i].call(
                    t, // this, the Calendar object
                    source,
                    rangeStart.clone(),
                    rangeEnd.clone(),
                    options.timezone,
                    callback
                );

                if (res === true) {
                    // the fetcher is in charge. made its own async request
                    return;
                }
                else if (typeof res == 'object') {
                    // the fetcher returned a new source. process it
                    _fetchEventSource(res, callback);
                    return;
                }
            }

            var events = source.events;
            if (events) {
                if ($.isFunction(events)) {
                    pushLoading();
                    events.call(
                        t, // this, the Calendar object
                        rangeStart.clone(),
                        rangeEnd.clone(),
                        options.timezone,
                        function (events) {
                            callback(events);
                            popLoading();
                        }
                    );
                }
                else if ($.isArray(events)) {
                    callback(events);
                }
                else {
                    callback();
                }
            } else {
                var url = source.url;
                if (url) {
                    var success = source.success;
                    var error = source.error;
                    var complete = source.complete;

                    // retrieve any outbound GET/POST $.ajax data from the options
                    var customData;
                    if ($.isFunction(source.data)) {
                        // supplied as a function that returns a key/value object
                        customData = source.data();
                    }
                    else {
                        // supplied as a straight key/value object
                        customData = source.data;
                    }

                    // use a copy of the custom data so we can modify the parameters
                    // and not affect the passed-in object.
                    var data = $.extend({}, customData || {});

                    var startParam = firstDefined(source.startParam, options.startParam);
                    var endParam = firstDefined(source.endParam, options.endParam);
                    var timezoneParam = firstDefined(source.timezoneParam, options.timezoneParam);

                    if (startParam) {
                        data[startParam] = rangeStart.format();
                    }
                    if (endParam) {
                        data[endParam] = rangeEnd.format();
                    }
                    if (options.timezone && options.timezone != 'local') {
                        data[timezoneParam] = options.timezone;
                    }

                    pushLoading();
                    $.ajax($.extend({}, ajaxDefaults, source, {
                        data: data,
                        success: function (events) {
                            events = events || [];
                            var res = applyAll(success, this, arguments);
                            if ($.isArray(res)) {
                                events = res;
                            }
                            callback(events);
                        },
                        error: function () {
                            applyAll(error, this, arguments);
                            callback();
                        },
                        complete: function () {
                            applyAll(complete, this, arguments);
                            popLoading();
                        }
                    }));
                } else {
                    callback();
                }
            }
        }



        /* Sources
        -----------------------------------------------------------------------------*/


        function addEventSource(sourceInput) {
            var source = buildEventSource(sourceInput);
            if (source) {
                sources.push(source);
                pendingSourceCnt++;
                fetchEventSource(source, currentFetchID); // will eventually call reportEvents
            }
        }


        function buildEventSource(sourceInput) { // will return undefined if invalid source
            var normalizers = fc.sourceNormalizers;
            var source;
            var i;

            if ($.isFunction(sourceInput) || $.isArray(sourceInput)) {
                source = { events: sourceInput };
            }
            else if (typeof sourceInput === 'string') {
                source = { url: sourceInput };
            }
            else if (typeof sourceInput === 'object') {
                source = $.extend({}, sourceInput); // shallow copy
            }

            if (source) {

                // TODO: repeat code, same code for event classNames
                if (source.className) {
                    if (typeof source.className === 'string') {
                        source.className = source.className.split(/\s+/);
                    }
                    // otherwise, assumed to be an array
                }
                else {
                    source.className = [];
                }

                // for array sources, we convert to standard Event Objects up front
                if ($.isArray(source.events)) {
                    source.origArray = source.events; // for removeEventSource
                    source.events = $.map(source.events, function (eventInput) {
                        return buildEvent(eventInput, source);
                    });
                }

                for (i = 0; i < normalizers.length; i++) {
                    normalizers[i].call(t, source);
                }

                return source;
            }
        }


        function removeEventSource(source) {
            sources = $.grep(sources, function (src) {
                return !isSourcesEqual(src, source);
            });
            // remove all client events from that source
            cache = $.grep(cache, function (e) {
                return !isSourcesEqual(e.source, source);
            });
            reportEvents(cache);
        }


        function isSourcesEqual(source1, source2) {
            return source1 && source2 && getSourcePrimitive(source1) == getSourcePrimitive(source2);
        }


        function getSourcePrimitive(source) {
            return (
                (typeof source === 'object') ? // a normalized event source?
                    (source.origArray || source.url || source.events) : // get the primitive
                    null
            ) ||
            source; // the given argument *is* the primitive
        }



        /* Manipulation
        -----------------------------------------------------------------------------*/


        function updateEvent(event) {

            event.start = t.moment(event.start);
            if (event.end) {
                event.end = t.moment(event.end);
            }

            mutateEvent(event);
            propagateMiscProperties(event);
            reportEvents(cache); // reports event modifications (so we can redraw)
        }


        var miscCopyableProps = [
            'title',
            'url',
            'allDay',
            'className',
            'editable',
            'color',
            'backgroundColor',
            'borderColor',
            'textColor'
        ];

        function propagateMiscProperties(event) {
            var i;
            var cachedEvent;
            var j;
            var prop;

            for (i = 0; i < cache.length; i++) {
                cachedEvent = cache[i];
                if (cachedEvent._id == event._id && cachedEvent !== event) {
                    for (j = 0; j < miscCopyableProps.length; j++) {
                        prop = miscCopyableProps[j];
                        if (event[prop] !== undefined) {
                            cachedEvent[prop] = event[prop];
                        }
                    }
                }
            }
        }



        function renderEvent(eventData, stick) {
            var event = buildEvent(eventData);
            if (event) {
                if (!event.source) {
                    if (stick) {
                        stickySource.events.push(event);
                        event.source = stickySource;
                    }
                    cache.push(event);
                }
                reportEvents(cache);
            }
        }


        function removeEvents(filter) {
            var eventID;
            var i;

            if (filter == null) { // null or undefined. remove all events
                filter = function () { return true; }; // will always match
            }
            else if (!$.isFunction(filter)) { // an event ID
                eventID = filter + '';
                filter = function (event) {
                    return event._id == eventID;
                };
            }

            // Purge event(s) from our local cache
            cache = $.grep(cache, filter, true); // inverse=true

            // Remove events from array sources.
            // This works because they have been converted to official Event Objects up front.
            // (and as a result, event._id has been calculated).
            for (i = 0; i < sources.length; i++) {
                if ($.isArray(sources[i].events)) {
                    sources[i].events = $.grep(sources[i].events, filter, true);
                }
            }

            reportEvents(cache);
        }


        function clientEvents(filter) {
            if ($.isFunction(filter)) {
                return $.grep(cache, filter);
            }
            else if (filter != null) { // not null, not undefined. an event ID
                filter += '';
                return $.grep(cache, function (e) {
                    return e._id == filter;
                });
            }
            return cache; // else, return all
        }



        /* Loading State
        -----------------------------------------------------------------------------*/


        function pushLoading() {
            if (!(loadingLevel++)) {
                trigger('loading', null, true, getView());
            }
        }


        function popLoading() {
            if (!(--loadingLevel)) {
                trigger('loading', null, false, getView());
            }
        }



        /* Event Normalization
        -----------------------------------------------------------------------------*/

        function buildEvent(data, source) { // source may be undefined!
            var out = {};
            var start;
            var end;
            var allDay;
            var allDayDefault;

            if (options.eventDataTransform) {
                data = options.eventDataTransform(data);
            }
            if (source && source.eventDataTransform) {
                data = source.eventDataTransform(data);
            }

            start = t.moment(data.start || data.date); // "date" is an alias for "start"
            if (!start.isValid()) {
                return;
            }

            end = null;
            if (data.end) {
                end = t.moment(data.end);
                if (!end.isValid()) {
                    return;
                }
            }

            allDay = data.allDay;
            if (allDay === undefined) {
                allDayDefault = firstDefined(
                    source ? source.allDayDefault : undefined,
                    options.allDayDefault
                );
                if (allDayDefault !== undefined) {
                    // use the default
                    allDay = allDayDefault;
                }
                else {
                    // all dates need to have ambig time for the event to be considered allDay
                    allDay = !start.hasTime() && (!end || !end.hasTime());
                }
            }

            // normalize the date based on allDay
            if (allDay) {
                // neither date should have a time
                if (start.hasTime()) {
                    start.stripTime();
                }
                if (end && end.hasTime()) {
                    end.stripTime();
                }
            }
            else {
                // force a time/zone up the dates
                if (!start.hasTime()) {
                    start = t.rezoneDate(start);
                }
                if (end && !end.hasTime()) {
                    end = t.rezoneDate(end);
                }
            }

            // Copy all properties over to the resulting object.
            // The special-case properties will be copied over afterwards.
            $.extend(out, data);

            if (source) {
                out.source = source;
            }

            out._id = data._id || (data.id === undefined ? '_fc' + eventGUID++ : data.id + '');

            if (data.className) {
                if (typeof data.className == 'string') {
                    out.className = data.className.split(/\s+/);
                }
                else { // assumed to be an array
                    out.className = data.className;
                }
            }
            else {
                out.className = [];
            }

            out.allDay = allDay;
            out.start = start;
            out.end = end;

            if (options.forceEventDuration && !out.end) {
                out.end = getEventEnd(out);
            }

            backupEventDates(out);

            return out;
        }



        /* Event Modification Math
        -----------------------------------------------------------------------------------------*/


        // Modify the date(s) of an event and make this change propagate to all other events with
        // the same ID (related repeating events).
        //
        // If `newStart`/`newEnd` are not specified, the "new" dates are assumed to be `event.start` and `event.end`.
        // The "old" dates to be compare against are always `event._start` and `event._end` (set by EventManager).
        //
        // Returns an object with delta information and a function to undo all operations.
        //
        function mutateEvent(event, newStart, newEnd) {
            var oldAllDay = event._allDay;
            var oldStart = event._start;
            var oldEnd = event._end;
            var clearEnd = false;
            var newAllDay;
            var dateDelta;
            var durationDelta;
            var undoFunc;

            // if no new dates were passed in, compare against the event's existing dates
            if (!newStart && !newEnd) {
                newStart = event.start;
                newEnd = event.end;
            }

            // NOTE: throughout this function, the initial values of `newStart` and `newEnd` are
            // preserved. These values may be undefined.

            // detect new allDay
            if (event.allDay != oldAllDay) { // if value has changed, use it
                newAllDay = event.allDay;
            }
            else { // otherwise, see if any of the new dates are allDay
                newAllDay = !(newStart || newEnd).hasTime();
            }

            // normalize the new dates based on allDay
            if (newAllDay) {
                if (newStart) {
                    newStart = newStart.clone().stripTime();
                }
                if (newEnd) {
                    newEnd = newEnd.clone().stripTime();
                }
            }

            // compute dateDelta
            if (newStart) {
                if (newAllDay) {
                    dateDelta = dayishDiff(newStart, oldStart.clone().stripTime()); // treat oldStart as allDay
                }
                else {
                    dateDelta = dayishDiff(newStart, oldStart);
                }
            }

            if (newAllDay != oldAllDay) {
                // if allDay has changed, always throw away the end
                clearEnd = true;
            }
            else if (newEnd) {
                durationDelta = dayishDiff(
                    // new duration
                    newEnd || t.getDefaultEventEnd(newAllDay, newStart || oldStart),
                    newStart || oldStart
                ).subtract(dayishDiff(
                    // subtract old duration
                    oldEnd || t.getDefaultEventEnd(oldAllDay, oldStart),
                    oldStart
                ));
            }

            undoFunc = mutateEvents(
                clientEvents(event._id), // get events with this ID
                clearEnd,
                newAllDay,
                dateDelta,
                durationDelta
            );

            return {
                dateDelta: dateDelta,
                durationDelta: durationDelta,
                undo: undoFunc
            };
        }


        // Modifies an array of events in the following ways (operations are in order):
        // - clear the event's `end`
        // - convert the event to allDay
        // - add `dateDelta` to the start and end
        // - add `durationDelta` to the event's duration
        //
        // Returns a function that can be called to undo all the operations.
        //
        function mutateEvents(events, clearEnd, forceAllDay, dateDelta, durationDelta) {
            var isAmbigTimezone = t.getIsAmbigTimezone();
            var undoFunctions = [];

            $.each(events, function (i, event) {
                var oldAllDay = event._allDay;
                var oldStart = event._start;
                var oldEnd = event._end;
                var newAllDay = forceAllDay != null ? forceAllDay : oldAllDay;
                var newStart = oldStart.clone();
                var newEnd = (!clearEnd && oldEnd) ? oldEnd.clone() : null;

                // NOTE: this function is responsible for transforming `newStart` and `newEnd`,
                // which were initialized to the OLD values first. `newEnd` may be null.

                // normlize newStart/newEnd to be consistent with newAllDay
                if (newAllDay) {
                    newStart.stripTime();
                    if (newEnd) {
                        newEnd.stripTime();
                    }
                }
                else {
                    if (!newStart.hasTime()) {
                        newStart = t.rezoneDate(newStart);
                    }
                    if (newEnd && !newEnd.hasTime()) {
                        newEnd = t.rezoneDate(newEnd);
                    }
                }

                // ensure we have an end date if necessary
                if (!newEnd && (options.forceEventDuration || +durationDelta)) {
                    newEnd = t.getDefaultEventEnd(newAllDay, newStart);
                }

                // translate the dates
                newStart.add(dateDelta);
                if (newEnd) {
                    newEnd.add(dateDelta).add(durationDelta);
                }

                // if the dates have changed, and we know it is impossible to recompute the
                // timezone offsets, strip the zone.
                if (isAmbigTimezone) {
                    if (+dateDelta || +durationDelta) {
                        newStart.stripZone();
                        if (newEnd) {
                            newEnd.stripZone();
                        }
                    }
                }

                event.allDay = newAllDay;
                event.start = newStart;
                event.end = newEnd;
                backupEventDates(event);

                undoFunctions.push(function () {
                    event.allDay = oldAllDay;
                    event.start = oldStart;
                    event.end = oldEnd;
                    backupEventDates(event);
                });
            });

            return function () {
                for (var i = 0; i < undoFunctions.length; i++) {
                    undoFunctions[i]();
                }
            };
        }

    }


    // updates the "backup" properties, which are preserved in order to compute diffs later on.
    function backupEventDates(event) {
        event._allDay = event.allDay;
        event._start = event.start.clone();
        event._end = event.end ? event.end.clone() : null;
    }

    ;;

    /* FullCalendar-specific DOM Utilities
    ----------------------------------------------------------------------------------------------------------------------*/


    // Given the scrollbar widths of some other container, create borders/margins on rowEls in order to match the left
    // and right space that was offset by the scrollbars. A 1-pixel border first, then margin beyond that.
    function compensateScroll(rowEls, scrollbarWidths) {
        if (scrollbarWidths.left) {
            rowEls.css({
                'border-left-width': 1,
                'margin-left': scrollbarWidths.left - 1
            });
        }
        if (scrollbarWidths.right) {
            rowEls.css({
                'border-right-width': 1,
                'margin-right': scrollbarWidths.right - 1
            });
        }
    }


    // Undoes compensateScroll and restores all borders/margins
    function uncompensateScroll(rowEls) {
        rowEls.css({
            'margin-left': '',
            'margin-right': '',
            'border-left-width': '',
            'border-right-width': ''
        });
    }


    // Given a total available height to fill, have `els` (essentially child rows) expand to accomodate.
    // By default, all elements that are shorter than the recommended height are expanded uniformly, not considering
    // any other els that are already too tall. if `shouldRedistribute` is on, it considers these tall rows and 
    // reduces the available height.
    function distributeHeight(els, availableHeight, shouldRedistribute) {

        // *FLOORING NOTE*: we floor in certain places because zoom can give inaccurate floating-point dimensions,
        // and it is better to be shorter than taller, to avoid creating unnecessary scrollbars.

        var minOffset1 = Math.floor(availableHeight / els.length); // for non-last element
        var minOffset2 = Math.floor(availableHeight - minOffset1 * (els.length - 1)); // for last element *FLOORING NOTE*
        var flexEls = []; // elements that are allowed to expand. array of DOM nodes
        var flexOffsets = []; // amount of vertical space it takes up
        var flexHeights = []; // actual css height
        var usedHeight = 0;

        undistributeHeight(els); // give all elements their natural height

        // find elements that are below the recommended height (expandable).
        // important to query for heights in a single first pass (to avoid reflow oscillation).
        els.each(function (i, el) {
            var minOffset = i === els.length - 1 ? minOffset2 : minOffset1;
            var naturalOffset = $(el).outerHeight(true);

            if (naturalOffset < minOffset) {
                flexEls.push(el);
                flexOffsets.push(naturalOffset);
                flexHeights.push($(el).height());
            }
            else {
                // this element stretches past recommended height (non-expandable). mark the space as occupied.
                usedHeight += naturalOffset;
            }
        });

        // readjust the recommended height to only consider the height available to non-maxed-out rows.
        if (shouldRedistribute) {
            availableHeight -= usedHeight;
            minOffset1 = Math.floor(availableHeight / flexEls.length);
            minOffset2 = Math.floor(availableHeight - minOffset1 * (flexEls.length - 1)); // *FLOORING NOTE*
        }

        // assign heights to all expandable elements
        $(flexEls).each(function (i, el) {
            var minOffset = i === flexEls.length - 1 ? minOffset2 : minOffset1;
            var naturalOffset = flexOffsets[i];
            var naturalHeight = flexHeights[i];
            var newHeight = minOffset - (naturalOffset - naturalHeight); // subtract the margin/padding

            if (naturalOffset < minOffset) { // we check this again because redistribution might have changed things
                $(el).height(newHeight);
            }
        });
    }


    // Undoes distrubuteHeight, restoring all els to their natural height
    function undistributeHeight(els) {
        els.height('');
    }


    // Given `els`, a jQuery set of <td> cells, find the cell with the largest natural width and set the widths of all the
    // cells to be that width.
    // PREREQUISITE: if you want a cell to take up width, it needs to have a single inner element w/ display:inline
    function matchCellWidths(els) {
        var maxInnerWidth = 0;

        els.find('> *').each(function (i, innerEl) {
            var innerWidth = $(innerEl).outerWidth();
            if (innerWidth > maxInnerWidth) {
                maxInnerWidth = innerWidth;
            }
        });

        maxInnerWidth++; // sometimes not accurate of width the text needs to stay on one line. insurance

        els.width(maxInnerWidth);

        return maxInnerWidth;
    }


    // Turns a container element into a scroller if its contents is taller than the allotted height.
    // Returns true if the element is now a scroller, false otherwise.
    // NOTE: this method is best because it takes weird zooming dimensions into account
    function setPotentialScroller(containerEl, height) {
        containerEl.height(height).addClass('fc-scroller');

        // are scrollbars needed?
        if (containerEl[0].scrollHeight - 1 > containerEl[0].clientHeight) { // !!! -1 because IE is often off-by-one :(
            return true;
        }

        unsetScroller(containerEl); // undo
        return false;
    }


    // Takes an element that might have been a scroller, and turns it back into a normal element.
    function unsetScroller(containerEl) {
        containerEl.height('').removeClass('fc-scroller');
    }


    /* General DOM Utilities
    ----------------------------------------------------------------------------------------------------------------------*/


    // borrowed from https://github.com/jquery/jquery-ui/blob/1.11.0/ui/core.js#L51
    function getScrollParent(el) {
        var position = el.css('position'),
            scrollParent = el.parents().filter(function () {
                var parent = $(this);
                return (/(auto|scroll)/).test(
                    parent.css('overflow') + parent.css('overflow-y') + parent.css('overflow-x')
                );
            }).eq(0);

        return position === 'fixed' || !scrollParent.length ? $(el[0].ownerDocument || document) : scrollParent;
    }


    // Given a container element, return an object with the pixel values of the left/right scrollbars.
    // Left scrollbars might occur on RTL browsers (IE maybe?) but I have not tested.
    // PREREQUISITE: container element must have a single child with display:block
    function getScrollbarWidths(container) {
        var containerLeft = container.offset().left;
        var containerRight = containerLeft + container.width();
        var inner = container.children();
        var innerLeft = inner.offset().left;
        var innerRight = innerLeft + inner.outerWidth();

        return {
            left: innerLeft - containerLeft,
            right: containerRight - innerRight
        };
    }


    // Returns a boolean whether this was a left mouse click and no ctrl key (which means right click on Mac)
    function isPrimaryMouseButton(ev) {
        return ev.which == 1 && !ev.ctrlKey;
    }


    /* FullCalendar-specific Misc Utilities
    ----------------------------------------------------------------------------------------------------------------------*/


    // Creates a basic segment with the intersection of the two ranges. Returns undefined if no intersection.
    // Expects all dates to be normalized to the same timezone beforehand.
    function intersectionToSeg(subjectStart, subjectEnd, intervalStart, intervalEnd) {
        var segStart, segEnd;
        var isStart, isEnd;

        if (subjectEnd > intervalStart && subjectStart < intervalEnd) { // in bounds at all?

            if (subjectStart >= intervalStart) {
                segStart = subjectStart.clone();
                isStart = true;
            }
            else {
                segStart = intervalStart.clone();
                isStart = false;
            }

            if (subjectEnd <= intervalEnd) {
                segEnd = subjectEnd.clone();
                isEnd = true;
            }
            else {
                segEnd = intervalEnd.clone();
                isEnd = false;
            }

            return {
                start: segStart,
                end: segEnd,
                isStart: isStart,
                isEnd: isEnd
            };
        }
    }


    function smartProperty(obj, name) { // get a camel-cased/namespaced property of an object
        obj = obj || {};
        if (obj[name] !== undefined) {
            return obj[name];
        }
        var parts = name.split(/(?=[A-Z])/),
            i = parts.length - 1, res;
        for (; i >= 0; i--) {
            res = obj[parts[i].toLowerCase()];
            if (res !== undefined) {
                return res;
            }
        }
        return obj['default'];
    }


    /* Date Utilities
    ----------------------------------------------------------------------------------------------------------------------*/

    var dayIDs = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];


    // Diffs the two moments into a Duration where full-days are recorded first, then the remaining time.
    // Moments will have their timezones normalized.
    function dayishDiff(a, b) {
        return moment.duration({
            days: a.clone().stripTime().diff(b.clone().stripTime(), 'days'),
            ms: a.time() - b.time()
        });
    }


    function isNativeDate(input) {
        return Object.prototype.toString.call(input) === '[object Date]' || input instanceof Date;
    }


    function dateCompare(a, b) { // works with Moments and native Dates
        return a - b;
    }


    /* General Utilities
    ----------------------------------------------------------------------------------------------------------------------*/

    fc.applyAll = applyAll; // export


    // Create an object that has the given prototype. Just like Object.create
    function createObject(proto) {
        var f = function () { };
        f.prototype = proto;
        return new f();
    }


    // Copies specifically-owned (non-protoype) properties of `b` onto `a`.
    // FYI, $.extend would copy *all* properties of `b` onto `a`.
    function extend(a, b) {
        for (var i in b) {
            if (b.hasOwnProperty(i)) {
                a[i] = b[i];
            }
        }
    }


    function applyAll(functions, thisObj, args) {
        if ($.isFunction(functions)) {
            functions = [functions];
        }
        if (functions) {
            var i;
            var ret;
            for (i = 0; i < functions.length; i++) {
                ret = functions[i].apply(thisObj, args) || ret;
            }
            return ret;
        }
    }


    function firstDefined() {
        for (var i = 0; i < arguments.length; i++) {
            if (arguments[i] !== undefined) {
                return arguments[i];
            }
        }
    }


    function htmlEscape(s) {
        return (s + '').replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/'/g, '&#039;')
            .replace(/"/g, '&quot;')
            .replace(/\n/g, '<br />');
    }


    function stripHtmlEntities(text) {
        return text.replace(/&.*?;/g, '');
    }


    function capitaliseFirstLetter(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }


    // Returns a function, that, as long as it continues to be invoked, will not
    // be triggered. The function will be called after it stops being called for
    // N milliseconds.
    // https://github.com/jashkenas/underscore/blob/1.6.0/underscore.js#L714
    function debounce(func, wait) {
        var timeoutId;
        var args;
        var context;
        var timestamp; // of most recent call
        var later = function () {
            var last = +new Date() - timestamp;
            if (last < wait && last > 0) {
                timeoutId = setTimeout(later, wait - last);
            }
            else {
                timeoutId = null;
                func.apply(context, args);
                if (!timeoutId) {
                    context = args = null;
                }
            }
        };

        return function () {
            context = this;
            args = arguments;
            timestamp = +new Date();
            if (!timeoutId) {
                timeoutId = setTimeout(later, wait);
            }
        };
    }

    ;;

    var ambigDateOfMonthRegex = /^\s*\d{4}-\d\d$/;
    var ambigTimeOrZoneRegex =
        /^\s*\d{4}-(?:(\d\d-\d\d)|(W\d\d$)|(W\d\d-\d)|(\d\d\d))((T| )(\d\d(:\d\d(:\d\d(\.\d+)?)?)?)?)?$/;


    // Creating
    // -------------------------------------------------------------------------------------------------

    // Creates a new moment, similar to the vanilla moment(...) constructor, but with
    // extra features (ambiguous time, enhanced formatting). When gived an existing moment,
    // it will function as a clone (and retain the zone of the moment). Anything else will
    // result in a moment in the local zone.
    fc.moment = function () {
        return makeMoment(arguments);
    };

    // Sames as fc.moment, but forces the resulting moment to be in the UTC timezone.
    fc.moment.utc = function () {
        var mom = makeMoment(arguments, true);

        // Force it into UTC because makeMoment doesn't guarantee it.
        if (mom.hasTime()) { // don't give ambiguously-timed moments a UTC zone
            mom.utc();
        }

        return mom;
    };

    // Same as fc.moment, but when given an ISO8601 string, the timezone offset is preserved.
    // ISO8601 strings with no timezone offset will become ambiguously zoned.
    fc.moment.parseZone = function () {
        return makeMoment(arguments, true, true);
    };

    // Builds an FCMoment from args. When given an existing moment, it clones. When given a native
    // Date, or called with no arguments (the current time), the resulting moment will be local.
    // Anything else needs to be "parsed" (a string or an array), and will be affected by:
    //    parseAsUTC - if there is no zone information, should we parse the input in UTC?
    //    parseZone - if there is zone information, should we force the zone of the moment?
    function makeMoment(args, parseAsUTC, parseZone) {
        var input = args[0];
        var isSingleString = args.length == 1 && typeof input === 'string';
        var isAmbigTime;
        var isAmbigZone;
        var ambigMatch;
        var output; // an object with fields for the new FCMoment object

        if (moment.isMoment(input)) {
            output = moment.apply(null, args); // clone it

            // the ambig properties have not been preserved in the clone, so reassign them
            if (input._ambigTime) {
                output._ambigTime = true;
            }
            if (input._ambigZone) {
                output._ambigZone = true;
            }
        }
        else if (isNativeDate(input) || input === undefined) {
            output = moment.apply(null, args); // will be local
        }
        else { // "parsing" is required
            isAmbigTime = false;
            isAmbigZone = false;

            if (isSingleString) {
                if (ambigDateOfMonthRegex.test(input)) {
                    // accept strings like '2014-05', but convert to the first of the month
                    input += '-01';
                    args = [input]; // for when we pass it on to moment's constructor
                    isAmbigTime = true;
                    isAmbigZone = true;
                }
                else if ((ambigMatch = ambigTimeOrZoneRegex.exec(input))) {
                    isAmbigTime = !ambigMatch[5]; // no time part?
                    isAmbigZone = true;
                }
            }
            else if ($.isArray(input)) {
                // arrays have no timezone information, so assume ambiguous zone
                isAmbigZone = true;
            }
            // otherwise, probably a string with a format

            if (parseAsUTC) {
                output = moment.utc.apply(moment, args);
            }
            else {
                output = moment.apply(null, args);
            }

            if (isAmbigTime) {
                output._ambigTime = true;
                output._ambigZone = true; // ambiguous time always means ambiguous zone
            }
            else if (parseZone) { // let's record the inputted zone somehow
                if (isAmbigZone) {
                    output._ambigZone = true;
                }
                else if (isSingleString) {
                    output.zone(input); // if not a valid zone, will assign UTC
                }
            }
        }

        return new FCMoment(output);
    }

    // Our subclass of Moment.
    // Accepts an object with the internal Moment properties that should be copied over to
    // `this` object (most likely another Moment object). The values in this data must not
    // be referenced by anything else (two moments sharing a Date object for example).
    function FCMoment(internalData) {
        extend(this, internalData);
    }

    // Chain the prototype to Moment's
    FCMoment.prototype = createObject(moment.fn);

    // We need this because Moment's implementation won't create an FCMoment,
    // nor will it copy over the ambig flags.
    FCMoment.prototype.clone = function () {
        return makeMoment([this]);
    };


    // Time-of-day
    // -------------------------------------------------------------------------------------------------

    // GETTER
    // Returns a Duration with the hours/minutes/seconds/ms values of the moment.
    // If the moment has an ambiguous time, a duration of 00:00 will be returned.
    //
    // SETTER
    // You can supply a Duration, a Moment, or a Duration-like argument.
    // When setting the time, and the moment has an ambiguous time, it then becomes unambiguous.
    FCMoment.prototype.time = function (time) {
        if (time == null) { // getter
            return moment.duration({
                hours: this.hours(),
                minutes: this.minutes(),
                seconds: this.seconds(),
                milliseconds: this.milliseconds()
            });
        }
        else { // setter

            delete this._ambigTime; // mark that the moment now has a time

            if (!moment.isDuration(time) && !moment.isMoment(time)) {
                time = moment.duration(time);
            }

            // The day value should cause overflow (so 24 hours becomes 00:00:00 of next day).
            // Only for Duration times, not Moment times.
            var dayHours = 0;
            if (moment.isDuration(time)) {
                dayHours = Math.floor(time.asDays()) * 24;
            }

            // We need to set the individual fields.
            // Can't use startOf('day') then add duration. In case of DST at start of day.
            return this.hours(dayHours + time.hours())
                .minutes(time.minutes())
                .seconds(time.seconds())
                .milliseconds(time.milliseconds());
        }
    };

    // Converts the moment to UTC, stripping out its time-of-day and timezone offset,
    // but preserving its YMD. A moment with a stripped time will display no time
    // nor timezone offset when .format() is called.
    FCMoment.prototype.stripTime = function () {
        var a = this.toArray(); // year,month,date,hours,minutes,seconds as an array

        // set the internal UTC flag
        moment.fn.utc.call(this); // call the original method, because we don't want to affect _ambigZone

        this.year(a[0]) // TODO: find a way to do this in one shot
            .month(a[1])
            .date(a[2])
            .hours(0)
            .minutes(0)
            .seconds(0)
            .milliseconds(0);

        // Mark the time as ambiguous. This needs to happen after the .utc() call, which calls .zone(), which
        // clears all ambig flags. Same concept with the .year/month/date calls in the case of moment-timezone.
        this._ambigTime = true;
        this._ambigZone = true; // if ambiguous time, also ambiguous timezone offset

        return this; // for chaining
    };

    // Returns if the moment has a non-ambiguous time (boolean)
    FCMoment.prototype.hasTime = function () {
        return !this._ambigTime;
    };


    // Timezone
    // -------------------------------------------------------------------------------------------------

    // Converts the moment to UTC, stripping out its timezone offset, but preserving its
    // YMD and time-of-day. A moment with a stripped timezone offset will display no
    // timezone offset when .format() is called.
    FCMoment.prototype.stripZone = function () {
        var a = this.toArray(); // year,month,date,hours,minutes,seconds as an array
        var wasAmbigTime = this._ambigTime;

        moment.fn.utc.call(this); // set the internal UTC flag

        this.year(a[0]) // TODO: find a way to do this in one shot
            .month(a[1])
            .date(a[2])
            .hours(a[3])
            .minutes(a[4])
            .seconds(a[5])
            .milliseconds(a[6]);

        if (wasAmbigTime) {
            // the above call to .utc()/.zone() unfortunately clears the ambig flags, so reassign
            this._ambigTime = true;
        }

        // Mark the zone as ambiguous. This needs to happen after the .utc() call, which calls .zone(), which
        // clears all ambig flags. Same concept with the .year/month/date calls in the case of moment-timezone.
        this._ambigZone = true;

        return this; // for chaining
    };

    // Returns of the moment has a non-ambiguous timezone offset (boolean)
    FCMoment.prototype.hasZone = function () {
        return !this._ambigZone;
    };

    // this method implicitly marks a zone
    FCMoment.prototype.zone = function (tzo) {

        if (tzo != null) {
            // FYI, the delete statements need to be before the .zone() call or else chaos ensues
            // for reasons I don't understand. 
            delete this._ambigTime;
            delete this._ambigZone;
        }

        return moment.fn.zone.apply(this, arguments);
    };

    // this method implicitly marks a zone
    FCMoment.prototype.local = function () {
        var a = this.toArray(); // year,month,date,hours,minutes,seconds as an array
        var wasAmbigZone = this._ambigZone;

        // will happen anyway via .local()/.zone(), but don't want to rely on internal implementation
        delete this._ambigTime;
        delete this._ambigZone;

        moment.fn.local.apply(this, arguments);

        if (wasAmbigZone) {
            // If the moment was ambiguously zoned, the date fields were stored as UTC.
            // We want to preserve these, but in local time.
            this.year(a[0]) // TODO: find a way to do this in one shot
                .month(a[1])
                .date(a[2])
                .hours(a[3])
                .minutes(a[4])
                .seconds(a[5])
                .milliseconds(a[6]);
        }

        return this; // for chaining
    };

    // this method implicitly marks a zone
    FCMoment.prototype.utc = function () {

        // will happen anyway via .local()/.zone(), but don't want to rely on internal implementation
        delete this._ambigTime;
        delete this._ambigZone;

        return moment.fn.utc.apply(this, arguments);
    };


    // Formatting
    // -------------------------------------------------------------------------------------------------

    FCMoment.prototype.format = function () {
        if (arguments[0]) {
            return formatDate(this, arguments[0]); // our extended formatting
        }
        if (this._ambigTime) {
            return momentFormat(this, 'YYYY-MM-DD');
        }
        if (this._ambigZone) {
            return momentFormat(this, 'YYYY-MM-DD[T]HH:mm:ss');
        }
        return momentFormat(this); // default moment original formatting
    };

    FCMoment.prototype.toISOString = function () {
        if (this._ambigTime) {
            return momentFormat(this, 'YYYY-MM-DD');
        }
        if (this._ambigZone) {
            return momentFormat(this, 'YYYY-MM-DD[T]HH:mm:ss');
        }
        return moment.fn.toISOString.apply(this, arguments);
    };


    // Querying
    // -------------------------------------------------------------------------------------------------

    // Is the moment within the specified range? `end` is exclusive.
    FCMoment.prototype.isWithin = function (start, end) {
        var a = commonlyAmbiguate([this, start, end]);
        return a[0] >= a[1] && a[0] < a[2];
    };

    // When isSame is called with units, timezone ambiguity is normalized before the comparison happens.
    // If no units are specified, the two moments must be identically the same, with matching ambig flags.
    FCMoment.prototype.isSame = function (input, units) {
        var a;

        if (units) {
            a = commonlyAmbiguate([this, input], true); // normalize timezones but don't erase times
            return moment.fn.isSame.call(a[0], a[1], units);
        }
        else {
            input = fc.moment.parseZone(input); // normalize input
            return moment.fn.isSame.call(this, input) &&
                Boolean(this._ambigTime) === Boolean(input._ambigTime) &&
                Boolean(this._ambigZone) === Boolean(input._ambigZone);
        }
    };

    // Make these query methods work with ambiguous moments
    $.each([
        'isBefore',
        'isAfter'
    ], function (i, methodName) {
        FCMoment.prototype[methodName] = function (input, units) {
            var a = commonlyAmbiguate([this, input]);
            return moment.fn[methodName].call(a[0], a[1], units);
        };
    });


    // Misc Internals
    // -------------------------------------------------------------------------------------------------

    // given an array of moment-like inputs, return a parallel array w/ moments similarly ambiguated.
    // for example, of one moment has ambig time, but not others, all moments will have their time stripped.
    // set `preserveTime` to `true` to keep times, but only normalize zone ambiguity.
    function commonlyAmbiguate(inputs, preserveTime) {
        var outputs = [];
        var anyAmbigTime = false;
        var anyAmbigZone = false;
        var i;

        for (i = 0; i < inputs.length; i++) {
            outputs.push(fc.moment.parseZone(inputs[i]));
            anyAmbigTime = anyAmbigTime || outputs[i]._ambigTime;
            anyAmbigZone = anyAmbigZone || outputs[i]._ambigZone;
        }

        for (i = 0; i < outputs.length; i++) {
            if (anyAmbigTime && !preserveTime) {
                outputs[i].stripTime();
            }
            else if (anyAmbigZone) {
                outputs[i].stripZone();
            }
        }

        return outputs;
    }

    ;;

    // Single Date Formatting
    // -------------------------------------------------------------------------------------------------


    // call this if you want Moment's original format method to be used
    function momentFormat(mom, formatStr) {
        return moment.fn.format.call(mom, formatStr);
    }


    // Formats `date` with a Moment formatting string, but allow our non-zero areas and
    // additional token.
    function formatDate(date, formatStr) {
        return formatDateWithChunks(date, getFormatStringChunks(formatStr));
    }


    function formatDateWithChunks(date, chunks) {
        var s = '';
        var i;

        for (i = 0; i < chunks.length; i++) {
            s += formatDateWithChunk(date, chunks[i]);
        }

        return s;
    }


    // addition formatting tokens we want recognized
    var tokenOverrides = {
        t: function (date) { // "a" or "p"
            return momentFormat(date, 'a').charAt(0);
        },
        T: function (date) { // "A" or "P"
            return momentFormat(date, 'A').charAt(0);
        }
    };


    function formatDateWithChunk(date, chunk) {
        var token;
        var maybeStr;

        if (typeof chunk === 'string') { // a literal string
            return chunk;
        }
        else if ((token = chunk.token)) { // a token, like "YYYY"
            if (tokenOverrides[token]) {
                return tokenOverrides[token](date); // use our custom token
            }
            return momentFormat(date, token);
        }
        else if (chunk.maybe) { // a grouping of other chunks that must be non-zero
            maybeStr = formatDateWithChunks(date, chunk.maybe);
            if (maybeStr.match(/[1-9]/)) {
                return maybeStr;
            }
        }

        return '';
    }


    // Date Range Formatting
    // -------------------------------------------------------------------------------------------------
    // TODO: make it work with timezone offset

    // Using a formatting string meant for a single date, generate a range string, like
    // "Sep 2 - 9 2013", that intelligently inserts a separator where the dates differ.
    // If the dates are the same as far as the format string is concerned, just return a single
    // rendering of one date, without any separator.
    function formatRange(date1, date2, formatStr, separator, isRTL) {
        var localeData;

        date1 = fc.moment.parseZone(date1);
        date2 = fc.moment.parseZone(date2);

        localeData = (date1.localeData || date1.lang).call(date1); // works with moment-pre-2.8

        // Expand localized format strings, like "LL" -> "MMMM D YYYY"
        formatStr = localeData.longDateFormat(formatStr) || formatStr;
        // BTW, this is not important for `formatDate` because it is impossible to put custom tokens
        // or non-zero areas in Moment's localized format strings.

        separator = separator || ' - ';

        return formatRangeWithChunks(
            date1,
            date2,
            getFormatStringChunks(formatStr),
            separator,
            isRTL
        );
    }
    fc.formatRange = formatRange; // expose


    function formatRangeWithChunks(date1, date2, chunks, separator, isRTL) {
        var chunkStr; // the rendering of the chunk
        var leftI;
        var leftStr = '';
        var rightI;
        var rightStr = '';
        var middleI;
        var middleStr1 = '';
        var middleStr2 = '';
        var middleStr = '';

        // Start at the leftmost side of the formatting string and continue until you hit a token
        // that is not the same between dates.
        for (leftI = 0; leftI < chunks.length; leftI++) {
            chunkStr = formatSimilarChunk(date1, date2, chunks[leftI]);
            if (chunkStr === false) {
                break;
            }
            leftStr += chunkStr;
        }

        // Similarly, start at the rightmost side of the formatting string and move left
        for (rightI = chunks.length - 1; rightI > leftI; rightI--) {
            chunkStr = formatSimilarChunk(date1, date2, chunks[rightI]);
            if (chunkStr === false) {
                break;
            }
            rightStr = chunkStr + rightStr;
        }

        // The area in the middle is different for both of the dates.
        // Collect them distinctly so we can jam them together later.
        for (middleI = leftI; middleI <= rightI; middleI++) {
            middleStr1 += formatDateWithChunk(date1, chunks[middleI]);
            middleStr2 += formatDateWithChunk(date2, chunks[middleI]);
        }

        if (middleStr1 || middleStr2) {
            if (isRTL) {
                middleStr = middleStr2 + separator + middleStr1;
            }
            else {
                middleStr = middleStr1 + separator + middleStr2;
            }
        }

        return leftStr + middleStr + rightStr;
    }


    var similarUnitMap = {
        Y: 'year',
        M: 'month',
        D: 'day', // day of month
        d: 'day', // day of week
        // prevents a separator between anything time-related...
        A: 'second', // AM/PM
        a: 'second', // am/pm
        T: 'second', // A/P
        t: 'second', // a/p
        H: 'second', // hour (24)
        h: 'second', // hour (12)
        m: 'second', // minute
        s: 'second' // second
    };
    // TODO: week maybe?


    // Given a formatting chunk, and given that both dates are similar in the regard the
    // formatting chunk is concerned, format date1 against `chunk`. Otherwise, return `false`.
    function formatSimilarChunk(date1, date2, chunk) {
        var token;
        var unit;

        if (typeof chunk === 'string') { // a literal string
            return chunk;
        }
        else if ((token = chunk.token)) {
            unit = similarUnitMap[token.charAt(0)];
            // are the dates the same for this unit of measurement?
            if (unit && date1.isSame(date2, unit)) {
                return momentFormat(date1, token); // would be the same if we used `date2`
                // BTW, don't support custom tokens
            }
        }

        return false; // the chunk is NOT the same for the two dates
        // BTW, don't support splitting on non-zero areas
    }


    // Chunking Utils
    // -------------------------------------------------------------------------------------------------


    var formatStringChunkCache = {};


    function getFormatStringChunks(formatStr) {
        if (formatStr in formatStringChunkCache) {
            return formatStringChunkCache[formatStr];
        }
        return (formatStringChunkCache[formatStr] = chunkFormatString(formatStr));
    }


    // Break the formatting string into an array of chunks
    function chunkFormatString(formatStr) {
        var chunks = [];
        var chunker = /\[([^\]]*)\]|\(([^\)]*)\)|(LT|(\w)\4*o?)|([^\w\[\(]+)/g; // TODO: more descrimination
        var match;

        while ((match = chunker.exec(formatStr))) {
            if (match[1]) { // a literal string inside [ ... ]
                chunks.push(match[1]);
            }
            else if (match[2]) { // non-zero formatting inside ( ... )
                chunks.push({ maybe: chunkFormatString(match[2]) });
            }
            else if (match[3]) { // a formatting token
                chunks.push({ token: match[3] });
            }
            else if (match[5]) { // an unenclosed literal string
                chunks.push(match[5]);
            }
        }

        return chunks;
    }

    ;;

    /* A rectangular panel that is absolutely positioned over other content
    ------------------------------------------------------------------------------------------------------------------------
    Options:
        - className (string)
        - content (HTML string or jQuery element set)
        - parentEl
        - top
        - left
        - right (the x coord of where the right edge should be. not a "CSS" right)
        - autoHide (boolean)
        - show (callback)
        - hide (callback)
    */

    function Popover(options) {
        this.options = options || {};
    }


    Popover.prototype = {

        isHidden: true,
        options: null,
        el: null, // the container element for the popover. generated by this object
        documentMousedownProxy: null, // document mousedown handler bound to `this`
        margin: 10, // the space required between the popover and the edges of the scroll container


        // Shows the popover on the specified position. Renders it if not already
        show: function () {
            if (this.isHidden) {
                if (!this.el) {
                    this.render();
                }
                this.el.show();
                this.position();
                this.isHidden = false;
                this.trigger('show');
            }
        },


        // Hides the popover, through CSS, but does not remove it from the DOM
        hide: function () {
            if (!this.isHidden) {
                this.el.hide();
                this.isHidden = true;
                this.trigger('hide');
            }
        },


        // Creates `this.el` and renders content inside of it
        render: function () {
            var _this = this;
            var options = this.options;

            this.el = $('<div class="fc-popover"/>')
                .addClass(options.className || '')
                .css({
                    // position initially to the top left to avoid creating scrollbars
                    top: 0,
                    left: 0
                })
                .append(options.content)
                .appendTo(options.parentEl);

            // when a click happens on anything inside with a 'fc-close' className, hide the popover
            this.el.on('click', '.fc-close', function () {
                _this.hide();
            });

            if (options.autoHide) {
                $(document).on('mousedown', this.documentMousedownProxy = $.proxy(this, 'documentMousedown'));
            }
        },


        // Triggered when the user clicks *anywhere* in the document, for the autoHide feature
        documentMousedown: function (ev) {
            // only hide the popover if the click happened outside the popover
            if (this.el && !$(ev.target).closest(this.el).length) {
                this.hide();
            }
        },


        // Hides and unregisters any handlers
        destroy: function () {
            this.hide();

            if (this.el) {
                this.el.remove();
                this.el = null;
            }

            $(document).off('mousedown', this.documentMousedownProxy);
        },


        // Positions the popover optimally, using the top/left/right options
        position: function () {
            var options = this.options;
            var origin = this.el.offsetParent().offset();
            var width = this.el.outerWidth();
            var height = this.el.outerHeight();
            var windowEl = $(window);
            var viewportEl = getScrollParent(this.el);
            var viewportTop;
            var viewportLeft;
            var viewportOffset;
            var top; // the "position" (not "offset") values for the popover
            var left; //

            // compute top and left
            top = options.top || 0;
            if (options.left !== undefined) {
                left = options.left;
            }
            else if (options.right !== undefined) {
                left = options.right - width; // derive the left value from the right value
            }
            else {
                left = 0;
            }

            if (viewportEl.is(window) || viewportEl.is(document)) { // normalize getScrollParent's result
                viewportEl = windowEl;
                viewportTop = 0; // the window is always at the top left
                viewportLeft = 0; // (and .offset() won't work if called here)
            }
            else {
                viewportOffset = viewportEl.offset();
                viewportTop = viewportOffset.top;
                viewportLeft = viewportOffset.left;
            }

            // if the window is scrolled, it causes the visible area to be further down
            viewportTop += windowEl.scrollTop();
            viewportLeft += windowEl.scrollLeft();

            // constrain to the view port. if constrained by two edges, give precedence to top/left
            if (options.viewportConstrain !== false) {
                top = Math.min(top, viewportTop + viewportEl.outerHeight() - height - this.margin);
                top = Math.max(top, viewportTop + this.margin);
                left = Math.min(left, viewportLeft + viewportEl.outerWidth() - width - this.margin);
                left = Math.max(left, viewportLeft + this.margin);
            }

            this.el.css({
                top: top - origin.top,
                left: left - origin.left
            });
        },


        // Triggers a callback. Calls a function in the option hash of the same name.
        // Arguments beyond the first `name` are forwarded on.
        // TODO: better code reuse for this. Repeat code
        trigger: function (name) {
            if (this.options[name]) {
                this.options[name].apply(this, Array.prototype.slice.call(arguments, 1));
            }
        }

    };

    ;;

    /* A "coordinate map" converts pixel coordinates into an associated cell, which has an associated date
    ------------------------------------------------------------------------------------------------------------------------
    Common interface:
    
        CoordMap.prototype = {
            build: function() {},
            getCell: function(x, y) {}
        };
    
    */

    /* Coordinate map for a grid component
    ----------------------------------------------------------------------------------------------------------------------*/

    function GridCoordMap(grid) {
        this.grid = grid;
    }


    GridCoordMap.prototype = {

        grid: null, // reference to the Grid
        rows: null, // the top-to-bottom y coordinates. including the bottom of the last item
        cols: null, // the left-to-right x coordinates. including the right of the last item

        containerEl: null, // container element that all coordinates are constrained to. optionally assigned
        minX: null,
        maxX: null, // exclusive
        minY: null,
        maxY: null, // exclusive


        // Queries the grid for the coordinates of all the cells
        build: function () {
            this.grid.buildCoords(
                this.rows = [],
                this.cols = []
            );
            this.computeBounds();
        },


        // Given a coordinate of the document, gets the associated cell. If no cell is underneath, returns null
        getCell: function (x, y) {
            var cell = null;
            var rows = this.rows;
            var cols = this.cols;
            var r = -1;
            var c = -1;
            var i;

            if (this.inBounds(x, y)) {

                for (i = 0; i < rows.length; i++) {
                    if (y >= rows[i][0] && y < rows[i][1]) {
                        r = i;
                        break;
                    }
                }

                for (i = 0; i < cols.length; i++) {
                    if (x >= cols[i][0] && x < cols[i][1]) {
                        c = i;
                        break;
                    }
                }

                if (r >= 0 && c >= 0) {
                    cell = { row: r, col: c };
                    cell.grid = this.grid;
                    cell.date = this.grid.getCellDate(cell);
                }
            }

            return cell;
        },


        // If there is a containerEl, compute the bounds into min/max values
        computeBounds: function () {
            var containerOffset;

            if (this.containerEl) {
                containerOffset = this.containerEl.offset();
                this.minX = containerOffset.left;
                this.maxX = containerOffset.left + this.containerEl.outerWidth();
                this.minY = containerOffset.top;
                this.maxY = containerOffset.top + this.containerEl.outerHeight();
            }
        },


        // Determines if the given coordinates are in bounds. If no `containerEl`, always true
        inBounds: function (x, y) {
            if (this.containerEl) {
                return x >= this.minX && x < this.maxX && y >= this.minY && y < this.maxY;
            }
            return true;
        }

    };


    /* Coordinate map that is a combination of multiple other coordinate maps
    ----------------------------------------------------------------------------------------------------------------------*/

    function ComboCoordMap(coordMaps) {
        this.coordMaps = coordMaps;
    }


    ComboCoordMap.prototype = {

        coordMaps: null, // an array of CoordMaps


        // Builds all coordMaps
        build: function () {
            var coordMaps = this.coordMaps;
            var i;

            for (i = 0; i < coordMaps.length; i++) {
                coordMaps[i].build();
            }
        },


        // Queries all coordMaps for the cell underneath the given coordinates, returning the first result
        getCell: function (x, y) {
            var coordMaps = this.coordMaps;
            var cell = null;
            var i;

            for (i = 0; i < coordMaps.length && !cell; i++) {
                cell = coordMaps[i].getCell(x, y);
            }

            return cell;
        }

    };

    ;;

    /* Tracks mouse movements over a CoordMap and raises events about which cell the mouse is over.
    ----------------------------------------------------------------------------------------------------------------------*/
    // TODO: implement scrolling

    function DragListener(coordMap, options) {
        this.coordMap = coordMap;
        this.options = options || {};
    }


    DragListener.prototype = {

        coordMap: null,
        options: null,

        isListening: false,
        isDragging: false,

        // the cell/date the mouse was over when listening started
        origCell: null,
        origDate: null,

        // the cell/date the mouse is over
        cell: null,
        date: null,

        // coordinates of the initial mousedown
        mouseX0: null,
        mouseY0: null,

        // handler attached to the document, bound to the DragListener's `this`
        mousemoveProxy: null,
        mouseupProxy: null,

        scrollEl: null,
        scrollBounds: null, // { top, bottom, left, right }
        scrollTopVel: null, // pixels per second
        scrollLeftVel: null, // pixels per second
        scrollIntervalId: null, // ID of setTimeout for scrolling animation loop
        scrollHandlerProxy: null, // this-scoped function for handling when scrollEl is scrolled

        scrollSensitivity: 30, // pixels from edge for scrolling to start
        scrollSpeed: 200, // pixels per second, at maximum speed
        scrollIntervalMs: 50, // millisecond wait between scroll increment


        // Call this when the user does a mousedown. Will probably lead to startListening
        mousedown: function (ev) {
            if (isPrimaryMouseButton(ev)) {

                ev.preventDefault(); // prevents native selection in most browsers

                this.startListening(ev);

                // start the drag immediately if there is no minimum distance for a drag start
                if (!this.options.distance) {
                    this.startDrag(ev);
                }
            }
        },


        // Call this to start tracking mouse movements
        startListening: function (ev) {
            var scrollParent;
            var cell;

            if (!this.isListening) {

                // grab scroll container and attach handler
                if (ev && this.options.scroll) {
                    scrollParent = getScrollParent($(ev.target));
                    if (!scrollParent.is(window) && !scrollParent.is(document)) {
                        this.scrollEl = scrollParent;

                        // scope to `this`, and use `debounce` to make sure rapid calls don't happen
                        this.scrollHandlerProxy = debounce($.proxy(this, 'scrollHandler'), 100);
                        this.scrollEl.on('scroll', this.scrollHandlerProxy);
                    }
                }

                this.computeCoords(); // relies on `scrollEl`

                // get info on the initial cell, date, and coordinates
                if (ev) {
                    cell = this.getCell(ev);
                    this.origCell = cell;
                    this.origDate = cell ? cell.date : null;

                    this.mouseX0 = ev.pageX;
                    this.mouseY0 = ev.pageY;
                }

                $(document)
                    .on('mousemove', this.mousemoveProxy = $.proxy(this, 'mousemove'))
                    .on('mouseup', this.mouseupProxy = $.proxy(this, 'mouseup'))
                    .on('selectstart', this.preventDefault); // prevents native selection in IE<=8

                this.isListening = true;
                this.trigger('listenStart', ev);
            }
        },


        // Recomputes the drag-critical positions of elements
        computeCoords: function () {
            this.coordMap.build();
            this.computeScrollBounds();
        },


        // Called when the user moves the mouse
        mousemove: function (ev) {
            var minDistance;
            var distanceSq; // current distance from mouseX0/mouseY0, squared

            if (!this.isDragging) { // if not already dragging...
                // then start the drag if the minimum distance criteria is met
                minDistance = this.options.distance || 1;
                distanceSq = Math.pow(ev.pageX - this.mouseX0, 2) + Math.pow(ev.pageY - this.mouseY0, 2);
                if (distanceSq >= minDistance * minDistance) { // use pythagorean theorem
                    this.startDrag(ev);
                }
            }

            if (this.isDragging) {
                this.drag(ev); // report a drag, even if this mousemove initiated the drag
            }
        },


        // Call this to initiate a legitimate drag.
        // This function is called internally from this class, but can also be called explicitly from outside
        startDrag: function (ev) {
            var cell;

            if (!this.isListening) { // startDrag must have manually initiated
                this.startListening();
            }

            if (!this.isDragging) {
                this.isDragging = true;
                this.trigger('dragStart', ev);

                // report the initial cell the mouse is over
                cell = this.getCell(ev);
                if (cell) {
                    this.cellOver(cell, true);
                }
            }
        },


        // Called while the mouse is being moved and when we know a legitimate drag is taking place
        drag: function (ev) {
            var cell;

            if (this.isDragging) {
                cell = this.getCell(ev);

                if (!isCellsEqual(cell, this.cell)) { // a different cell than before?
                    if (this.cell) {
                        this.cellOut();
                    }
                    if (cell) {
                        this.cellOver(cell);
                    }
                }

                this.dragScroll(ev); // will possibly cause scrolling
            }
        },


        // Called when a the mouse has just moved over a new cell
        cellOver: function (cell) {
            this.cell = cell;
            this.date = cell.date;
            this.trigger('cellOver', cell, cell.date);
        },


        // Called when the mouse has just moved out of a cell
        cellOut: function () {
            if (this.cell) {
                this.trigger('cellOut', this.cell);
                this.cell = null;
                this.date = null;
            }
        },


        // Called when the user does a mouseup
        mouseup: function (ev) {
            this.stopDrag(ev);
            this.stopListening(ev);
        },


        // Called when the drag is over. Will not cause listening to stop however.
        // A concluding 'cellOut' event will NOT be triggered.
        stopDrag: function (ev) {
            if (this.isDragging) {
                this.stopScrolling();
                this.trigger('dragStop', ev);
                this.isDragging = false;
            }
        },


        // Call this to stop listening to the user's mouse events
        stopListening: function (ev) {
            if (this.isListening) {

                // remove the scroll handler if there is a scrollEl
                if (this.scrollEl) {
                    this.scrollEl.off('scroll', this.scrollHandlerProxy);
                    this.scrollHandlerProxy = null;
                }

                $(document)
                    .off('mousemove', this.mousemoveProxy)
                    .off('mouseup', this.mouseupProxy)
                    .off('selectstart', this.preventDefault);

                this.mousemoveProxy = null;
                this.mouseupProxy = null;

                this.isListening = false;
                this.trigger('listenStop', ev);

                this.origCell = this.cell = null;
                this.origDate = this.date = null;
            }
        },


        // Gets the cell underneath the coordinates for the given mouse event
        getCell: function (ev) {
            return this.coordMap.getCell(ev.pageX, ev.pageY);
        },


        // Triggers a callback. Calls a function in the option hash of the same name.
        // Arguments beyond the first `name` are forwarded on.
        trigger: function (name) {
            if (this.options[name]) {
                this.options[name].apply(this, Array.prototype.slice.call(arguments, 1));
            }
        },


        // Stops a given mouse event from doing it's native browser action. In our case, text selection.
        preventDefault: function (ev) {
            ev.preventDefault();
        },


        /* Scrolling
        ------------------------------------------------------------------------------------------------------------------*/


        // Computes and stores the bounding rectangle of scrollEl
        computeScrollBounds: function () {
            var el = this.scrollEl;
            var offset;

            if (el) {
                offset = el.offset();
                this.scrollBounds = {
                    top: offset.top,
                    left: offset.left,
                    bottom: offset.top + el.outerHeight(),
                    right: offset.left + el.outerWidth()
                };
            }
        },


        // Called when the dragging is in progress and scrolling should be updated
        dragScroll: function (ev) {
            var sensitivity = this.scrollSensitivity;
            var bounds = this.scrollBounds;
            var topCloseness, bottomCloseness;
            var leftCloseness, rightCloseness;
            var topVel = 0;
            var leftVel = 0;

            if (bounds) { // only scroll if scrollEl exists

                // compute closeness to edges. valid range is from 0.0 - 1.0
                topCloseness = (sensitivity - (ev.pageY - bounds.top)) / sensitivity;
                bottomCloseness = (sensitivity - (bounds.bottom - ev.pageY)) / sensitivity;
                leftCloseness = (sensitivity - (ev.pageX - bounds.left)) / sensitivity;
                rightCloseness = (sensitivity - (bounds.right - ev.pageX)) / sensitivity;

                // translate vertical closeness into velocity.
                // mouse must be completely in bounds for velocity to happen.
                if (topCloseness >= 0 && topCloseness <= 1) {
                    topVel = topCloseness * this.scrollSpeed * -1; // negative. for scrolling up
                }
                else if (bottomCloseness >= 0 && bottomCloseness <= 1) {
                    topVel = bottomCloseness * this.scrollSpeed;
                }

                // translate horizontal closeness into velocity
                if (leftCloseness >= 0 && leftCloseness <= 1) {
                    leftVel = leftCloseness * this.scrollSpeed * -1; // negative. for scrolling left
                }
                else if (rightCloseness >= 0 && rightCloseness <= 1) {
                    leftVel = rightCloseness * this.scrollSpeed;
                }
            }

            this.setScrollVel(topVel, leftVel);
        },


        // Sets the speed-of-scrolling for the scrollEl
        setScrollVel: function (topVel, leftVel) {

            this.scrollTopVel = topVel;
            this.scrollLeftVel = leftVel;

            this.constrainScrollVel(); // massages into realistic values

            // if there is non-zero velocity, and an animation loop hasn't already started, then START
            if ((this.scrollTopVel || this.scrollLeftVel) && !this.scrollIntervalId) {
                this.scrollIntervalId = setInterval(
                    $.proxy(this, 'scrollIntervalFunc'), // scope to `this`
                    this.scrollIntervalMs
                );
            }
        },


        // Forces scrollTopVel and scrollLeftVel to be zero if scrolling has already gone all the way
        constrainScrollVel: function () {
            var el = this.scrollEl;

            if (this.scrollTopVel < 0) { // scrolling up?
                if (el.scrollTop() <= 0) { // already scrolled all the way up?
                    this.scrollTopVel = 0;
                }
            }
            else if (this.scrollTopVel > 0) { // scrolling down?
                if (el.scrollTop() + el[0].clientHeight >= el[0].scrollHeight) { // already scrolled all the way down?
                    this.scrollTopVel = 0;
                }
            }

            if (this.scrollLeftVel < 0) { // scrolling left?
                if (el.scrollLeft() <= 0) { // already scrolled all the left?
                    this.scrollLeftVel = 0;
                }
            }
            else if (this.scrollLeftVel > 0) { // scrolling right?
                if (el.scrollLeft() + el[0].clientWidth >= el[0].scrollWidth) { // already scrolled all the way right?
                    this.scrollLeftVel = 0;
                }
            }
        },


        // This function gets called during every iteration of the scrolling animation loop
        scrollIntervalFunc: function () {
            var el = this.scrollEl;
            var frac = this.scrollIntervalMs / 1000; // considering animation frequency, what the vel should be mult'd by

            // change the value of scrollEl's scroll
            if (this.scrollTopVel) {
                el.scrollTop(el.scrollTop() + this.scrollTopVel * frac);
            }
            if (this.scrollLeftVel) {
                el.scrollLeft(el.scrollLeft() + this.scrollLeftVel * frac);
            }

            this.constrainScrollVel(); // since the scroll values changed, recompute the velocities

            // if scrolled all the way, which causes the vels to be zero, stop the animation loop
            if (!this.scrollTopVel && !this.scrollLeftVel) {
                this.stopScrolling();
            }
        },


        // Kills any existing scrolling animation loop
        stopScrolling: function () {
            if (this.scrollIntervalId) {
                clearInterval(this.scrollIntervalId);
                this.scrollIntervalId = null;

                // when all done with scrolling, recompute positions since they probably changed
                this.computeCoords();
            }
        },


        // Get called when the scrollEl is scrolled (NOTE: this is delayed via debounce)
        scrollHandler: function () {
            // recompute all coordinates, but *only* if this is *not* part of our scrolling animation
            if (!this.scrollIntervalId) {
                this.computeCoords();
            }
        }

    };


    // Returns `true` if the cells are identically equal. `false` otherwise.
    // They must have the same row, col, and be from the same grid.
    // Two null values will be considered equal, as two "out of the grid" states are the same.
    function isCellsEqual(cell1, cell2) {

        if (!cell1 && !cell2) {
            return true;
        }

        if (cell1 && cell2) {
            return cell1.grid === cell2.grid &&
                cell1.row === cell2.row &&
                cell1.col === cell2.col;
        }

        return false;
    }

    ;;

    /* Creates a clone of an element and lets it track the mouse as it moves
    ----------------------------------------------------------------------------------------------------------------------*/

    function MouseFollower(sourceEl, options) {
        this.options = options = options || {};
        this.sourceEl = sourceEl;
        this.parentEl = options.parentEl ? $(options.parentEl) : sourceEl.parent(); // default to sourceEl's parent
    }


    MouseFollower.prototype = {

        options: null,

        sourceEl: null, // the element that will be cloned and made to look like it is dragging
        el: null, // the clone of `sourceEl` that will track the mouse
        parentEl: null, // the element that `el` (the clone) will be attached to

        // the initial position of el, relative to the offset parent. made to match the initial offset of sourceEl
        top0: null,
        left0: null,

        // the initial position of the mouse
        mouseY0: null,
        mouseX0: null,

        // the number of pixels the mouse has moved from its initial position
        topDelta: null,
        leftDelta: null,

        mousemoveProxy: null, // document mousemove handler, bound to the MouseFollower's `this`

        isFollowing: false,
        isHidden: false,
        isAnimating: false, // doing the revert animation?


        // Causes the element to start following the mouse
        start: function (ev) {
            if (!this.isFollowing) {
                this.isFollowing = true;

                this.mouseY0 = ev.pageY;
                this.mouseX0 = ev.pageX;
                this.topDelta = 0;
                this.leftDelta = 0;

                if (!this.isHidden) {
                    this.updatePosition();
                }

                $(document).on('mousemove', this.mousemoveProxy = $.proxy(this, 'mousemove'));
            }
        },


        // Causes the element to stop following the mouse. If shouldRevert is true, will animate back to original position.
        // `callback` gets invoked when the animation is complete. If no animation, it is invoked immediately.
        stop: function (shouldRevert, callback) {
            var _this = this;
            var revertDuration = this.options.revertDuration;

            function complete() {
                this.isAnimating = false;
                _this.destroyEl();

                this.top0 = this.left0 = null; // reset state for future updatePosition calls

                if (callback) {
                    callback();
                }
            }

            if (this.isFollowing && !this.isAnimating) { // disallow more than one stop animation at a time
                this.isFollowing = false;

                $(document).off('mousemove', this.mousemoveProxy);

                if (shouldRevert && revertDuration && !this.isHidden) { // do a revert animation?
                    this.isAnimating = true;
                    this.el.animate({
                        top: this.top0,
                        left: this.left0
                    }, {
                        duration: revertDuration,
                        complete: complete
                    });
                }
                else {
                    complete();
                }
            }
        },


        // Gets the tracking element. Create it if necessary
        getEl: function () {
            var el = this.el;

            if (!el) {
                this.sourceEl.width(); // hack to force IE8 to compute correct bounding box
                el = this.el = this.sourceEl.clone()
                    .css({
                        position: 'absolute',
                        visibility: '', // in case original element was hidden (commonly through hideEvents())
                        display: this.isHidden ? 'none' : '', // for when initially hidden
                        margin: 0,
                        right: 'auto', // erase and set width instead
                        bottom: 'auto', // erase and set height instead
                        width: this.sourceEl.width(), // explicit height in case there was a 'right' value
                        height: this.sourceEl.height(), // explicit width in case there was a 'bottom' value
                        opacity: this.options.opacity || '',
                        zIndex: this.options.zIndex
                    })
                    .appendTo(this.parentEl);
            }

            return el;
        },


        // Removes the tracking element if it has already been created
        destroyEl: function () {
            if (this.el) {
                this.el.remove();
                this.el = null;
            }
        },


        // Update the CSS position of the tracking element
        updatePosition: function () {
            var sourceOffset;
            var origin;

            this.getEl(); // ensure this.el

            // make sure origin info was computed
            if (this.top0 === null) {
                this.sourceEl.width(); // hack to force IE8 to compute correct bounding box
                sourceOffset = this.sourceEl.offset();
                origin = this.el.offsetParent().offset();
                this.top0 = sourceOffset.top - origin.top;
                this.left0 = sourceOffset.left - origin.left;
            }

            this.el.css({
                top: this.top0 + this.topDelta,
                left: this.left0 + this.leftDelta
            });
        },


        // Gets called when the user moves the mouse
        mousemove: function (ev) {
            this.topDelta = ev.pageY - this.mouseY0;
            this.leftDelta = ev.pageX - this.mouseX0;

            if (!this.isHidden) {
                this.updatePosition();
            }
        },


        // Temporarily makes the tracking element invisible. Can be called before following starts
        hide: function () {
            if (!this.isHidden) {
                this.isHidden = true;
                if (this.el) {
                    this.el.hide();
                }
            }
        },


        // Show the tracking element after it has been temporarily hidden
        show: function () {
            if (this.isHidden) {
                this.isHidden = false;
                this.updatePosition();
                this.getEl().show();
            }
        }

    };

    ;;

    /* A utility class for rendering <tr> rows.
    ----------------------------------------------------------------------------------------------------------------------*/
    // It leverages methods of the subclass and the View to determine custom rendering behavior for each row "type"
    // (such as highlight rows, day rows, helper rows, etc).

    function RowRenderer(view) {
        this.view = view;
    }


    RowRenderer.prototype = {

        view: null, // a View object
        cellHtml: '<td/>', // plain default HTML used for a cell when no other is available


        // Renders the HTML for a row, leveraging custom cell-HTML-renderers based on the `rowType`.
        // Also applies the "intro" and "outro" cells, which are specified by the subclass and views.
        // `row` is an optional row number.
        rowHtml: function (rowType, row) {
            var view = this.view;
            var renderCell = this.getHtmlRenderer('cell', rowType);
            var cellHtml = '';
            var col;
            var date;

            row = row || 0;

            for (col = 0; col < view.colCnt; col++) {
                date = view.cellToDate(row, col);
                cellHtml += renderCell(row, col, date);
            }

            cellHtml = this.bookendCells(cellHtml, rowType, row); // apply intro and outro

            return '<tr>' + cellHtml + '</tr>';
        },


        // Applies the "intro" and "outro" HTML to the given cells.
        // Intro means the leftmost cell when the calendar is LTR and the rightmost cell when RTL. Vice-versa for outro.
        // `cells` can be an HTML string of <td>'s or a jQuery <tr> element
        // `row` is an optional row number.
        bookendCells: function (cells, rowType, row) {
            var view = this.view;
            var intro = this.getHtmlRenderer('intro', rowType)(row || 0);
            var outro = this.getHtmlRenderer('outro', rowType)(row || 0);
            var isRTL = view.opt('isRTL');
            var prependHtml = isRTL ? outro : intro;
            var appendHtml = isRTL ? intro : outro;

            if (typeof cells === 'string') {
                return prependHtml + cells + appendHtml;
            }
            else { // a jQuery <tr> element
                return cells.prepend(prependHtml).append(appendHtml);
            }
        },


        // Returns an HTML-rendering function given a specific `rendererName` (like cell, intro, or outro) and a specific
        // `rowType` (like day, eventSkeleton, helperSkeleton), which is optional.
        // If a renderer for the specific rowType doesn't exist, it will fall back to a generic renderer.
        // We will query the View object first for any custom rendering functions, then the methods of the subclass.
        getHtmlRenderer: function (rendererName, rowType) {
            var view = this.view;
            var generalName; // like "cellHtml"
            var specificName; // like "dayCellHtml". based on rowType
            var provider; // either the View or the RowRenderer subclass, whichever provided the method
            var renderer;

            generalName = rendererName + 'Html';
            if (rowType) {
                specificName = rowType + capitaliseFirstLetter(rendererName) + 'Html';
            }

            if (specificName && (renderer = view[specificName])) {
                provider = view;
            }
            else if (specificName && (renderer = this[specificName])) {
                provider = this;
            }
            else if ((renderer = view[generalName])) {
                provider = view;
            }
            else if ((renderer = this[generalName])) {
                provider = this;
            }

            if (typeof renderer === 'function') {
                return function (row) {
                    return renderer.apply(provider, arguments) || ''; // use correct `this` and always return a string
                };
            }

            // the rendered can be a plain string as well. if not specified, always an empty string.
            return function () {
                return renderer || '';
            };
        }

    };

    ;;

    /* An abstract class comprised of a "grid" of cells that each represent a specific datetime
    ----------------------------------------------------------------------------------------------------------------------*/

    function Grid(view) {
        RowRenderer.call(this, view); // call the super-constructor
        this.coordMap = new GridCoordMap(this);
    }


    Grid.prototype = createObject(RowRenderer.prototype); // declare the super-class
    $.extend(Grid.prototype, {

        el: null, // the containing element
        coordMap: null, // a GridCoordMap that converts pixel values to datetimes
        cellDuration: null, // a cell's duration. subclasses must assign this ASAP


        // Renders the grid into the `el` element.
        // Subclasses should override and call this super-method when done.
        render: function () {
            this.bindHandlers();
        },


        // Called when the grid's resources need to be cleaned up
        destroy: function () {
            // subclasses can implement
        },


        /* Coordinates & Cells
        ------------------------------------------------------------------------------------------------------------------*/


        // Populates the given empty arrays with the y and x coordinates of the cells
        buildCoords: function (rows, cols) {
            // subclasses must implement
        },


        // Given a cell object, returns the date for that cell
        getCellDate: function (cell) {
            // subclasses must implement
        },


        // Given a cell object, returns the element that represents the cell's whole-day
        getCellDayEl: function (cell) {
            // subclasses must implement
        },


        // Converts a range with an inclusive `start` and an exclusive `end` into an array of segment objects
        rangeToSegs: function (start, end) {
            // subclasses must implement
        },


        /* Handlers
        ------------------------------------------------------------------------------------------------------------------*/


        // Attach handlers to `this.el`, using bubbling to listen to all ancestors.
        // We don't need to undo any of this in a "destroy" method, because the view will simply remove `this.el` from the
        // DOM and jQuery will be smart enough to garbage collect the handlers.
        bindHandlers: function () {
            var _this = this;

            this.el.on('mousedown', function (ev) {
                if (
                    !$(ev.target).is('.fc-event-container *, .fc-more') && // not an an event element, or "more.." link
                    !$(ev.target).closest('.fc-popover').length // not on a popover (like the "more.." events one)
                ) {
                    _this.dayMousedown(ev);
                }
            });

            this.bindSegHandlers(); // attach event-element-related handlers. in Grid.events.js
        },


        // Process a mousedown on an element that represents a day. For day clicking and selecting.
        dayMousedown: function (ev) {
            var _this = this;
            var view = this.view;
            var isSelectable = view.opt('selectable');
            var dates = null; // the inclusive dates of the selection. will be null if no selection
            var start; // the inclusive start of the selection
            var end; // the *exclusive* end of the selection
            var dayEl;

            // this listener tracks a mousedown on a day element, and a subsequent drag.
            // if the drag ends on the same day, it is a 'dayClick'.
            // if 'selectable' is enabled, this listener also detects selections.
            var dragListener = new DragListener(this.coordMap, {
                //distance: 5, // needs more work if we want dayClick to fire correctly
                scroll: view.opt('dragScroll'),
                dragStart: function () {
                    view.unselect(); // since we could be rendering a new selection, we want to clear any old one
                },
                cellOver: function (cell, date) {
                    if (dragListener.origDate) { // click needs to have started on a cell

                        dayEl = _this.getCellDayEl(cell);

                        dates = [date, dragListener.origDate].sort(dateCompare);
                        start = dates[0];
                        end = dates[1].clone().add(_this.cellDuration);

                        if (isSelectable) {
                            _this.renderSelection(start, end);
                        }
                    }
                },
                cellOut: function (cell, date) {
                    dates = null;
                    _this.destroySelection();
                },
                listenStop: function (ev) {
                    if (dates) { // started and ended on a cell?
                        if (dates[0].isSame(dates[1])) {
                            view.trigger('dayClick', dayEl[0], start, ev);
                        }
                        if (isSelectable) {
                            // the selection will already have been rendered. just report it
                            view.reportSelection(start, end, ev);
                        }
                    }
                }
            });

            dragListener.mousedown(ev); // start listening, which will eventually initiate a dragStart
        },


        /* Event Dragging
        ------------------------------------------------------------------------------------------------------------------*/


        // Renders a visual indication of a event being dragged over the given date(s).
        // `end` can be null, as well as `seg`. See View's documentation on renderDrag for more info.
        // A returned value of `true` signals that a mock "helper" event has been rendered.
        renderDrag: function (start, end, seg) {
            // subclasses must implement
        },


        // Unrenders a visual indication of an event being dragged
        destroyDrag: function () {
            // subclasses must implement
        },


        /* Event Resizing
        ------------------------------------------------------------------------------------------------------------------*/


        // Renders a visual indication of an event being resized.
        // `start` and `end` are the updated dates of the event. `seg` is the original segment object involved in the drag.
        renderResize: function (start, end, seg) {
            // subclasses must implement
        },


        // Unrenders a visual indication of an event being resized.
        destroyResize: function () {
            // subclasses must implement
        },


        /* Event Helper
        ------------------------------------------------------------------------------------------------------------------*/


        // Renders a mock event over the given date(s).
        // `end` can be null, in which case the mock event that is rendered will have a null end time.
        // `sourceSeg` is the internal segment object involved in the drag. If null, something external is dragging.
        renderRangeHelper: function (start, end, sourceSeg) {
            var view = this.view;
            var fakeEvent;

            // compute the end time if forced to do so (this is what EventManager does)
            if (!end && view.opt('forceEventDuration')) {
                end = view.calendar.getDefaultEventEnd(!start.hasTime(), start);
            }

            fakeEvent = sourceSeg ? createObject(sourceSeg.event) : {}; // mask the original event object if possible
            fakeEvent.start = start;
            fakeEvent.end = end;
            fakeEvent.allDay = !(start.hasTime() || (end && end.hasTime())); // freshly compute allDay

            // this extra className will be useful for differentiating real events from mock events in CSS
            fakeEvent.className = (fakeEvent.className || []).concat('fc-helper');

            // if something external is being dragged in, don't render a resizer
            if (!sourceSeg) {
                fakeEvent.editable = false;
            }

            this.renderHelper(fakeEvent, sourceSeg); // do the actual rendering
        },


        // Renders a mock event
        renderHelper: function (event, sourceSeg) {
            // subclasses must implement
        },


        // Unrenders a mock event
        destroyHelper: function () {
            // subclasses must implement
        },


        /* Selection
        ------------------------------------------------------------------------------------------------------------------*/


        // Renders a visual indication of a selection. Will highlight by default but can be overridden by subclasses.
        renderSelection: function (start, end) {
            this.renderHighlight(start, end);
        },


        // Unrenders any visual indications of a selection. Will unrender a highlight by default.
        destroySelection: function () {
            this.destroyHighlight();
        },


        /* Highlight
        ------------------------------------------------------------------------------------------------------------------*/


        // Puts visual emphasis on a certain date range
        renderHighlight: function (start, end) {
            // subclasses should implement
        },


        // Removes visual emphasis on a date range
        destroyHighlight: function () {
            // subclasses should implement
        },



        /* Generic rendering utilities for subclasses
        ------------------------------------------------------------------------------------------------------------------*/


        // Renders a day-of-week header row
        headHtml: function () {
            return '' +
                '<div class="fc-row ' + this.view.widgetHeaderClass + '">' +
                    '<table>' +
                        '<thead>' +
                            this.rowHtml('head') + // leverages RowRenderer
                        '</thead>' +
                    '</table>' +
                '</div>';
        },


        // Used by the `headHtml` method, via RowRenderer, for rendering the HTML of a day-of-week header cell
        headCellHtml: function (row, col, date) {
            var view = this.view;
            var calendar = view.calendar;
            var colFormat = view.opt('columnFormat');

            return '' +
                '<th class="fc-day-header ' + view.widgetHeaderClass + ' fc-' + dayIDs[date.day()] + '">' +
                    htmlEscape(calendar.formatDate(date, colFormat)) +
                '</th>';
        },


        // Renders the HTML for a single-day background cell
        bgCellHtml: function (row, col, date) {
            var view = this.view;
            var classes = this.getDayClasses(date);

            classes.unshift('fc-day', view.widgetContentClass);

            return '<td class="' + classes.join(' ') + '" data-date="' + date.format() + '"></td>';
        },


        // Computes HTML classNames for a single-day cell
        getDayClasses: function (date) {
            var view = this.view;
            var today = view.calendar.getNow().stripTime();
            var classes = ['fc-' + dayIDs[date.day()]];

            if (
                view.name === 'month' &&
                date.month() != view.intervalStart.month()
            ) {
                classes.push('fc-other-month');
            }

            if (date.isSame(today, 'day')) {
                classes.push(
                    'fc-today',
                    view.highlightStateClass
                );
            }
            else if (date < today) {
                classes.push('fc-past');
            }
            else {
                classes.push('fc-future');
            }

            return classes;
        }

    });

    ;;

    /* Event-rendering and event-interaction methods for the abstract Grid class
    ----------------------------------------------------------------------------------------------------------------------*/

    $.extend(Grid.prototype, {

        mousedOverSeg: null, // the segment object the user's mouse is over. null if over nothing
        isDraggingSeg: false, // is a segment being dragged? boolean
        isResizingSeg: false, // is a segment being resized? boolean


        // Renders the given events onto the grid
        renderEvents: function (events) {
            // subclasses must implement
        },


        // Retrieves all rendered segment objects in this grid
        getSegs: function () {
            // subclasses must implement
        },


        // Unrenders all events. Subclasses should implement, calling this super-method first.
        destroyEvents: function () {
            this.triggerSegMouseout(); // trigger an eventMouseout if user's mouse is over an event
        },


        // Renders a `el` property for each seg, and only returns segments that successfully rendered
        renderSegs: function (segs, disableResizing) {
            var view = this.view;
            var html = '';
            var renderedSegs = [];
            var i;

            // build a large concatenation of event segment HTML
            for (i = 0; i < segs.length; i++) {
                html += this.renderSegHtml(segs[i], disableResizing);
            }

            // Grab individual elements from the combined HTML string. Use each as the default rendering.
            // Then, compute the 'el' for each segment. An el might be null if the eventRender callback returned false.
            $(html).each(function (i, node) {
                var seg = segs[i];
                var el = view.resolveEventEl(seg.event, $(node));
                if (el) {
                    el.data('fc-seg', seg); // used by handlers
                    seg.el = el;
                    renderedSegs.push(seg);
                }
            });

            return renderedSegs;
        },


        // Generates the HTML for the default rendering of a segment
        renderSegHtml: function (seg, disableResizing) {
            // subclasses must implement
        },


        // Converts an array of event objects into an array of segment objects
        eventsToSegs: function (events, intervalStart, intervalEnd) {
            var _this = this;

            return $.map(events, function (event) {
                return _this.eventToSegs(event, intervalStart, intervalEnd); // $.map flattens all returned arrays together
            });
        },


        // Slices a single event into an array of event segments.
        // When `intervalStart` and `intervalEnd` are specified, intersect the events with that interval.
        // Otherwise, let the subclass decide how it wants to slice the segments over the grid.
        eventToSegs: function (event, intervalStart, intervalEnd) {
            var eventStart = event.start.clone().stripZone(); // normalize
            var eventEnd = this.view.calendar.getEventEnd(event).stripZone(); // compute (if necessary) and normalize
            var segs;
            var i, seg;

            if (intervalStart && intervalEnd) {
                seg = intersectionToSeg(eventStart, eventEnd, intervalStart, intervalEnd);
                segs = seg ? [seg] : [];
            }
            else {
                segs = this.rangeToSegs(eventStart, eventEnd); // defined by the subclass
            }

            // assign extra event-related properties to the segment objects
            for (i = 0; i < segs.length; i++) {
                seg = segs[i];
                seg.event = event;
                seg.eventStartMS = +eventStart;
                seg.eventDurationMS = eventEnd - eventStart;
            }

            return segs;
        },


        /* Handlers
        ------------------------------------------------------------------------------------------------------------------*/


        // Attaches event-element-related handlers to the container element and leverage bubbling
        bindSegHandlers: function () {
            var _this = this;
            var view = this.view;

            $.each(
                {
                    mouseenter: function (seg, ev) {
                        _this.triggerSegMouseover(seg, ev);
                    },
                    mouseleave: function (seg, ev) {
                        _this.triggerSegMouseout(seg, ev);
                    },
                    click: function (seg, ev) {
                        return view.trigger('eventClick', this, seg.event, ev); // can return `false` to cancel
                    },
                    mousedown: function (seg, ev) {
                        if ($(ev.target).is('.fc-resizer') && view.isEventResizable(seg.event)) {
                            _this.segResizeMousedown(seg, ev);
                        }
                        else if (view.isEventDraggable(seg.event)) {
                            _this.segDragMousedown(seg, ev);
                        }
                    }
                },
                function (name, func) {
                    // attach the handler to the container element and only listen for real event elements via bubbling
                    _this.el.on(name, '.fc-event-container > *', function (ev) {
                        var seg = $(this).data('fc-seg'); // grab segment data. put there by View::renderEvents

                        // only call the handlers if there is not a drag/resize in progress
                        if (seg && !_this.isDraggingSeg && !_this.isResizingSeg) {
                            return func.call(this, seg, ev); // `this` will be the event element
                        }
                    });
                }
            );
        },


        // Updates internal state and triggers handlers for when an event element is moused over
        triggerSegMouseover: function (seg, ev) {
            if (!this.mousedOverSeg) {
                this.mousedOverSeg = seg;
                this.view.trigger('eventMouseover', seg.el[0], seg.event, ev);
            }
        },


        // Updates internal state and triggers handlers for when an event element is moused out.
        // Can be given no arguments, in which case it will mouseout the segment that was previously moused over.
        triggerSegMouseout: function (seg, ev) {
            ev = ev || {}; // if given no args, make a mock mouse event

            if (this.mousedOverSeg) {
                seg = seg || this.mousedOverSeg; // if given no args, use the currently moused-over segment
                this.mousedOverSeg = null;
                this.view.trigger('eventMouseout', seg.el[0], seg.event, ev);
            }
        },


        /* Dragging
        ------------------------------------------------------------------------------------------------------------------*/


        // Called when the user does a mousedown on an event, which might lead to dragging.
        // Generic enough to work with any type of Grid.
        segDragMousedown: function (seg, ev) {
            var _this = this;
            var view = this.view;
            var el = seg.el;
            var event = seg.event;
            var newStart, newEnd;

            // A clone of the original element that will move with the mouse
            var mouseFollower = new MouseFollower(seg.el, {
                parentEl: view.el,
                opacity: view.opt('dragOpacity'),
                revertDuration: view.opt('dragRevertDuration'),
                zIndex: 2 // one above the .fc-view
            });

            // Tracks mouse movement over the *view's* coordinate map. Allows dragging and dropping between subcomponents
            // of the view.
            var dragListener = new DragListener(view.coordMap, {
                distance: 5,
                scroll: view.opt('dragScroll'),
                listenStart: function (ev) {
                    mouseFollower.hide(); // don't show until we know this is a real drag
                    mouseFollower.start(ev);
                },
                dragStart: function (ev) {
                    _this.triggerSegMouseout(seg, ev); // ensure a mouseout on the manipulated event has been reported
                    _this.isDraggingSeg = true;
                    view.hideEvent(event); // hide all event segments. our mouseFollower will take over
                    view.trigger('eventDragStart', el[0], event, ev, {}); // last argument is jqui dummy
                },
                cellOver: function (cell, date) {
                    var origDate = seg.cellDate || dragListener.origDate;
                    var res = _this.computeDraggedEventDates(seg, origDate, date);
                    newStart = res.start;
                    newEnd = res.end;

                    if (view.renderDrag(newStart, newEnd, seg)) { // have the view render a visual indication
                        mouseFollower.hide(); // if the view is already using a mock event "helper", hide our own
                    }
                    else {
                        mouseFollower.show();
                    }
                },
                cellOut: function () { // called before mouse moves to a different cell OR moved out of all cells
                    newStart = null;
                    view.destroyDrag(); // unrender whatever was done in view.renderDrag
                    mouseFollower.show(); // show in case we are moving out of all cells
                },
                dragStop: function (ev) {
                    var hasChanged = newStart && !newStart.isSame(event.start);

                    // do revert animation if hasn't changed. calls a callback when finished (whether animation or not)
                    mouseFollower.stop(!hasChanged, function () {
                        _this.isDraggingSeg = false;
                        view.destroyDrag();
                        view.showEvent(event);
                        view.trigger('eventDragStop', el[0], event, ev, {}); // last argument is jqui dummy

                        if (hasChanged) {
                            view.eventDrop(el[0], event, newStart, ev); // will rerender all events...
                        }
                    });
                },
                listenStop: function () {
                    mouseFollower.stop(); // put in listenStop in case there was a mousedown but the drag never started
                }
            });

            dragListener.mousedown(ev); // start listening, which will eventually lead to a dragStart
        },


        // Given a segment, the dates where a drag began and ended, calculates the Event Object's new start and end dates
        computeDraggedEventDates: function (seg, dragStartDate, dropDate) {
            var view = this.view;
            var event = seg.event;
            var start = event.start;
            var end = view.calendar.getEventEnd(event);
            var delta;
            var newStart;
            var newEnd;

            if (dropDate.hasTime() === dragStartDate.hasTime()) {
                delta = dayishDiff(dropDate, dragStartDate);
                newStart = start.clone().add(delta);
                if (event.end === null) { // do we need to compute an end?
                    newEnd = null;
                }
                else {
                    newEnd = end.clone().add(delta);
                }
            }
            else {
                // if switching from day <-> timed, start should be reset to the dropped date, and the end cleared
                newStart = dropDate;
                newEnd = null; // end should be cleared
            }

            return { start: newStart, end: newEnd };
        },


        /* Resizing
        ------------------------------------------------------------------------------------------------------------------*/


        // Called when the user does a mousedown on an event's resizer, which might lead to resizing.
        // Generic enough to work with any type of Grid.
        segResizeMousedown: function (seg, ev) {
            var _this = this;
            var view = this.view;
            var el = seg.el;
            var event = seg.event;
            var start = event.start;
            var end = view.calendar.getEventEnd(event);
            var newEnd = null;
            var dragListener;

            function destroy() { // resets the rendering
                _this.destroyResize();
                view.showEvent(event);
            }

            // Tracks mouse movement over the *grid's* coordinate map
            dragListener = new DragListener(this.coordMap, {
                distance: 5,
                scroll: view.opt('dragScroll'),
                dragStart: function (ev) {
                    _this.triggerSegMouseout(seg, ev); // ensure a mouseout on the manipulated event has been reported
                    _this.isResizingSeg = true;
                    view.trigger('eventResizeStart', el[0], event, ev, {}); // last argument is jqui dummy
                },
                cellOver: function (cell, date) {
                    // compute the new end. don't allow it to go before the event's start
                    if (date.isBefore(start)) { // allows comparing ambig to non-ambig
                        date = start;
                    }
                    newEnd = date.clone().add(_this.cellDuration); // make it an exclusive end

                    if (newEnd.isSame(end)) {
                        newEnd = null;
                        destroy();
                    }
                    else {
                        _this.renderResize(start, newEnd, seg);
                        view.hideEvent(event);
                    }
                },
                cellOut: function () { // called before mouse moves to a different cell OR moved out of all cells
                    newEnd = null;
                    destroy();
                },
                dragStop: function (ev) {
                    _this.isResizingSeg = false;
                    destroy();
                    view.trigger('eventResizeStop', el[0], event, ev, {}); // last argument is jqui dummy

                    if (newEnd) {
                        view.eventResize(el[0], event, newEnd, ev); // will rerender all events...
                    }
                }
            });

            dragListener.mousedown(ev); // start listening, which will eventually lead to a dragStart
        },


        /* Rendering Utils
        ------------------------------------------------------------------------------------------------------------------*/


        // Generic utility for generating the HTML classNames for an event segment's element
        getSegClasses: function (seg, isDraggable, isResizable) {
            var event = seg.event;
            var classes = [
                'fc-event',
                seg.isStart ? 'fc-start' : 'fc-not-start',
                seg.isEnd ? 'fc-end' : 'fc-not-end'
            ].concat(
                event.className,
                event.source ? event.source.className : []
            );

            if (isDraggable) {
                classes.push('fc-draggable');
            }
            if (isResizable) {
                classes.push('fc-resizable');
            }

            return classes;
        },


        // Utility for generating a CSS string with all the event skin-related properties
        getEventSkinCss: function (event) {
            var view = this.view;
            var source = event.source || {};
            var eventColor = event.color;
            var sourceColor = source.color;
            var optionColor = view.opt('eventColor');
            var backgroundColor =
                event.backgroundColor ||
                eventColor ||
                source.backgroundColor ||
                sourceColor ||
                view.opt('eventBackgroundColor') ||
                optionColor;
            var borderColor =
                event.borderColor ||
                eventColor ||
                source.borderColor ||
                sourceColor ||
                view.opt('eventBorderColor') ||
                optionColor;
            var textColor =
                event.textColor ||
                source.textColor ||
                view.opt('eventTextColor');
            var statements = [];
            if (backgroundColor) {
                statements.push('background-color:' + backgroundColor);
            }
            if (borderColor) {
                statements.push('border-color:' + borderColor);
            }
            if (textColor) {
                statements.push('color:' + textColor);
            }
            return statements.join(';');
        }

    });


    /* Event Segment Utilities
    ----------------------------------------------------------------------------------------------------------------------*/


    // A cmp function for determining which segments should take visual priority
    function compareSegs(seg1, seg2) {
        return seg1.eventStartMS - seg2.eventStartMS || // earlier events go first
            seg2.eventDurationMS - seg1.eventDurationMS || // tie? longer events go first
            seg2.event.allDay - seg1.event.allDay || // tie? put all-day events first (booleans cast to 0/1)
            (seg1.event.title || '').localeCompare(seg2.event.title); // tie? alphabetically by title
    }


    ;;

    /* A component that renders a grid of whole-days that runs horizontally. There can be multiple rows, one per week.
    ----------------------------------------------------------------------------------------------------------------------*/

    function DayGrid(view) {
        Grid.call(this, view); // call the super-constructor
    }


    DayGrid.prototype = createObject(Grid.prototype); // declare the super-class
    $.extend(DayGrid.prototype, {

        numbersVisible: false, // should render a row for day/week numbers? manually set by the view
        cellDuration: moment.duration({ days: 1 }), // required for Grid.event.js. Each cell is always a single day
        bottomCoordPadding: 0, // hack for extending the hit area for the last row of the coordinate grid

        rowEls: null, // set of fake row elements
        dayEls: null, // set of whole-day elements comprising the row's background
        helperEls: null, // set of cell skeleton elements for rendering the mock event "helper"
        highlightEls: null, // set of cell skeleton elements for rendering the highlight


        // Renders the rows and columns into the component's `this.el`, which should already be assigned.
        // isRigid determins whether the individual rows should ignore the contents and be a constant height.
        // Relies on the view's colCnt and rowCnt. In the future, this component should probably be self-sufficient.
        render: function (isRigid) {
            var view = this.view;
            var html = '';
            var row;

            for (row = 0; row < view.rowCnt; row++) {
                html += this.dayRowHtml(row, isRigid);
            }
            this.el.html(html);

            this.rowEls = this.el.find('.fc-row');
            this.dayEls = this.el.find('.fc-day');

            // run all the day cells through the dayRender callback
            this.dayEls.each(function (i, node) {
                var date = view.cellToDate(Math.floor(i / view.colCnt), i % view.colCnt);
                view.trigger('dayRender', null, date, $(node));
            });

            Grid.prototype.render.call(this); // call the super-method
        },


        destroy: function () {
            this.destroySegPopover();
        },


        // Generates the HTML for a single row. `row` is the row number.
        dayRowHtml: function (row, isRigid) {
            var view = this.view;
            var classes = ['fc-row', 'fc-week', view.widgetContentClass];

            if (isRigid) {
                classes.push('fc-rigid');
            }

            return '' +
                '<div class="' + classes.join(' ') + '">' +
                    '<div class="fc-bg">' +
                        '<table>' +
                            this.rowHtml('day', row) + // leverages RowRenderer. calls dayCellHtml()
                        '</table>' +
                    '</div>' +
                    '<div class="fc-content-skeleton">' +
                        '<table>' +
                            (this.numbersVisible ?
                                '<thead>' +
                                    this.rowHtml('number', row) + // leverages RowRenderer. View will define render method
                                '</thead>' :
                                ''
                                ) +
                        '</table>' +
                    '</div>' +
                '</div>';
        },


        // Renders the HTML for a whole-day cell. Will eventually end up in the day-row's background.
        // We go through a 'day' row type instead of just doing a 'bg' row type so that the View can do custom rendering
        // specifically for whole-day rows, whereas a 'bg' might also be used for other purposes (TimeGrid bg for example).
        dayCellHtml: function (row, col, date) {
            return this.bgCellHtml(row, col, date);
        },


        /* Coordinates & Cells
        ------------------------------------------------------------------------------------------------------------------*/


        // Populates the empty `rows` and `cols` arrays with coordinates of the cells. For CoordGrid.
        buildCoords: function (rows, cols) {
            var colCnt = this.view.colCnt;
            var e, n, p;

            this.dayEls.slice(0, colCnt).each(function (i, _e) { // iterate the first row of day elements
                e = $(_e);
                n = e.offset().left;
                if (i) {
                    p[1] = n;
                }
                p = [n];
                cols[i] = p;
            });
            p[1] = n + e.outerWidth();

            this.rowEls.each(function (i, _e) {
                e = $(_e);
                n = e.offset().top;
                if (i) {
                    p[1] = n;
                }
                p = [n];
                rows[i] = p;
            });
            p[1] = n + e.outerHeight() + this.bottomCoordPadding; // hack to extend hit area of last row
        },


        // Converts a cell to a date
        getCellDate: function (cell) {
            return this.view.cellToDate(cell); // leverages the View's cell system
        },


        // Gets the whole-day element associated with the cell
        getCellDayEl: function (cell) {
            return this.dayEls.eq(cell.row * this.view.colCnt + cell.col);
        },


        // Converts a range with an inclusive `start` and an exclusive `end` into an array of segment objects
        rangeToSegs: function (start, end) {
            return this.view.rangeToSegments(start, end); // leverages the View's cell system
        },


        /* Event Drag Visualization
        ------------------------------------------------------------------------------------------------------------------*/


        // Renders a visual indication of an event hovering over the given date(s).
        // `end` can be null, as well as `seg`. See View's documentation on renderDrag for more info.
        // A returned value of `true` signals that a mock "helper" event has been rendered.
        renderDrag: function (start, end, seg) {
            var opacity;

            // always render a highlight underneath
            this.renderHighlight(
                start,
                end || this.view.calendar.getDefaultEventEnd(true, start)
            );

            // if a segment from the same calendar but another component is being dragged, render a helper event
            if (seg && !seg.el.closest(this.el).length) {

                this.renderRangeHelper(start, end, seg);

                opacity = this.view.opt('dragOpacity');
                if (opacity !== undefined) {
                    this.helperEls.css('opacity', opacity);
                }

                return true; // a helper has been rendered
            }
        },


        // Unrenders any visual indication of a hovering event
        destroyDrag: function () {
            this.destroyHighlight();
            this.destroyHelper();
        },


        /* Event Resize Visualization
        ------------------------------------------------------------------------------------------------------------------*/


        // Renders a visual indication of an event being resized
        renderResize: function (start, end, seg) {
            this.renderHighlight(start, end);
            this.renderRangeHelper(start, end, seg);
        },


        // Unrenders a visual indication of an event being resized
        destroyResize: function () {
            this.destroyHighlight();
            this.destroyHelper();
        },


        /* Event Helper
        ------------------------------------------------------------------------------------------------------------------*/


        // Renders a mock "helper" event. `sourceSeg` is the associated internal segment object. It can be null.
        renderHelper: function (event, sourceSeg) {
            var helperNodes = [];
            var rowStructs = this.renderEventRows([event]);

            // inject each new event skeleton into each associated row
            this.rowEls.each(function (row, rowNode) {
                var rowEl = $(rowNode); // the .fc-row
                var skeletonEl = $('<div class="fc-helper-skeleton"><table/></div>'); // will be absolutely positioned
                var skeletonTop;

                // If there is an original segment, match the top position. Otherwise, put it at the row's top level
                if (sourceSeg && sourceSeg.row === row) {
                    skeletonTop = sourceSeg.el.position().top;
                }
                else {
                    skeletonTop = rowEl.find('.fc-content-skeleton tbody').position().top;
                }

                skeletonEl.css('top', skeletonTop)
                    .find('table')
                        .append(rowStructs[row].tbodyEl);

                rowEl.append(skeletonEl);
                helperNodes.push(skeletonEl[0]);
            });

            this.helperEls = $(helperNodes); // array -> jQuery set
        },


        // Unrenders any visual indication of a mock helper event
        destroyHelper: function () {
            if (this.helperEls) {
                this.helperEls.remove();
                this.helperEls = null;
            }
        },


        /* Highlighting
        ------------------------------------------------------------------------------------------------------------------*/


        // Renders an emphasis on the given date range. `start` is an inclusive, `end` is exclusive.
        renderHighlight: function (start, end) {
            var segs = this.rangeToSegs(start, end);
            var highlightNodes = [];
            var i, seg;
            var el;

            // build an event skeleton for each row that needs it
            for (i = 0; i < segs.length; i++) {
                seg = segs[i];
                el = $(
                    this.highlightSkeletonHtml(seg.leftCol, seg.rightCol + 1) // make end exclusive
                );
                el.appendTo(this.rowEls[seg.row]);
                highlightNodes.push(el[0]);
            }

            this.highlightEls = $(highlightNodes); // array -> jQuery set
        },


        // Unrenders any visual emphasis on a date range
        destroyHighlight: function () {
            if (this.highlightEls) {
                this.highlightEls.remove();
                this.highlightEls = null;
            }
        },


        // Generates the HTML used to build a single-row "highlight skeleton", a table that frames highlight cells
        highlightSkeletonHtml: function (startCol, endCol) {
            var colCnt = this.view.colCnt;
            var cellHtml = '';

            if (startCol > 0) {
                cellHtml += '<td colspan="' + startCol + '"/>';
            }
            if (endCol > startCol) {
                cellHtml += '<td colspan="' + (endCol - startCol) + '" class="fc-highlight" />';
            }
            if (colCnt > endCol) {
                cellHtml += '<td colspan="' + (colCnt - endCol) + '"/>';
            }

            cellHtml = this.bookendCells(cellHtml, 'highlight');

            return '' +
                '<div class="fc-highlight-skeleton">' +
                    '<table>' +
                        '<tr>' +
                            cellHtml +
                        '</tr>' +
                    '</table>' +
                '</div>';
        }

    });

    ;;

    /* Event-rendering methods for the DayGrid class
    ----------------------------------------------------------------------------------------------------------------------*/

    $.extend(DayGrid.prototype, {

        segs: null,
        rowStructs: null, // an array of objects, each holding information about a row's event-rendering


        // Render the given events onto the Grid and return the rendered segments
        renderEvents: function (events) {
            var rowStructs = this.rowStructs = this.renderEventRows(events);
            var segs = [];

            // append to each row's content skeleton
            this.rowEls.each(function (i, rowNode) {
                $(rowNode).find('.fc-content-skeleton > table').append(
                    rowStructs[i].tbodyEl
                );
                segs.push.apply(segs, rowStructs[i].segs);
            });

            this.segs = segs;
        },


        // Retrieves all segment objects that have been rendered
        getSegs: function () {
            return (this.segs || []).concat(
                this.popoverSegs || [] // segs rendered in the "more" events popover
            );
        },


        // Removes all rendered event elements
        destroyEvents: function () {
            var rowStructs;
            var rowStruct;

            Grid.prototype.destroyEvents.call(this); // call the super-method

            rowStructs = this.rowStructs || [];
            while ((rowStruct = rowStructs.pop())) {
                rowStruct.tbodyEl.remove();
            }

            this.segs = null;
            this.destroySegPopover(); // removes the "more.." events popover
        },


        // Uses the given events array to generate <tbody> elements that should be appended to each row's content skeleton.
        // Returns an array of rowStruct objects (see the bottom of `renderEventRow`).
        renderEventRows: function (events) {
            var segs = this.eventsToSegs(events);
            var rowStructs = [];
            var segRows;
            var row;

            segs = this.renderSegs(segs); // returns a new array with only visible segments
            segRows = this.groupSegRows(segs); // group into nested arrays

            // iterate each row of segment groupings
            for (row = 0; row < segRows.length; row++) {
                rowStructs.push(
                    this.renderEventRow(row, segRows[row])
                );
            }

            return rowStructs;
        },


        // Builds the HTML to be used for the default element for an individual segment
        renderSegHtml: function (seg, disableResizing) {
            var view = this.view;
            var isRTL = view.opt('isRTL');
            var event = seg.event;
            var isDraggable = view.isEventDraggable(event);
            var isResizable = !disableResizing && event.allDay && seg.isEnd && view.isEventResizable(event);
            var classes = this.getSegClasses(seg, isDraggable, isResizable);
            var skinCss = this.getEventSkinCss(event);
            var timeHtml = '';
            var titleHtml;

            classes.unshift('fc-day-grid-event');

            // Only display a timed events time if it is the starting segment
            if (!event.allDay && seg.isStart) {
                timeHtml = '<span class="fc-time">' + htmlEscape(view.getEventTimeText(event)) + '</span>';
            }

            titleHtml =
                '<span class="fc-title">' +
                    (htmlEscape(event.title || '') || '&nbsp;') + // we always want one line of height
                '</span>';

            return '<a class="' + classes.join(' ') + '"' +
                    (event.url ?
                        ' href="' + htmlEscape(event.url) + '"' :
                        ''
                        ) +
                    (skinCss ?
                        ' style="' + skinCss + '"' :
                        ''
                        ) +
                '>' +
                    '<div class="fc-content">' +
                        (isRTL ?
                            titleHtml + ' ' + timeHtml : // put a natural space in between
                            timeHtml + ' ' + titleHtml   //
                            ) +
                    '</div>' +
                    (isResizable ?
                        '<div class="fc-resizer"/>' :
                        ''
                        ) +
                '</a>';
        },


        // Given a row # and an array of segments all in the same row, render a <tbody> element, a skeleton that contains
        // the segments. Returns object with a bunch of internal data about how the render was calculated.
        renderEventRow: function (row, rowSegs) {
            var view = this.view;
            var colCnt = view.colCnt;
            var segLevels = this.buildSegLevels(rowSegs); // group into sub-arrays of levels
            var levelCnt = Math.max(1, segLevels.length); // ensure at least one level
            var tbody = $('<tbody/>');
            var segMatrix = []; // lookup for which segments are rendered into which level+col cells
            var cellMatrix = []; // lookup for all <td> elements of the level+col matrix
            var loneCellMatrix = []; // lookup for <td> elements that only take up a single column
            var i, levelSegs;
            var col;
            var tr;
            var j, seg;
            var td;

            // populates empty cells from the current column (`col`) to `endCol`
            function emptyCellsUntil(endCol) {
                while (col < endCol) {
                    // try to grab a cell from the level above and extend its rowspan. otherwise, create a fresh cell
                    td = (loneCellMatrix[i - 1] || [])[col];
                    if (td) {
                        td.attr(
                            'rowspan',
                            parseInt(td.attr('rowspan') || 1, 10) + 1
                        );
                    }
                    else {
                        td = $('<td/>');
                        tr.append(td);
                    }
                    cellMatrix[i][col] = td;
                    loneCellMatrix[i][col] = td;
                    col++;
                }
            }

            for (i = 0; i < levelCnt; i++) { // iterate through all levels
                levelSegs = segLevels[i];
                col = 0;
                tr = $('<tr/>');

                segMatrix.push([]);
                cellMatrix.push([]);
                loneCellMatrix.push([]);

                // levelCnt might be 1 even though there are no actual levels. protect against this.
                // this single empty row is useful for styling.
                if (levelSegs) {
                    for (j = 0; j < levelSegs.length; j++) { // iterate through segments in level
                        seg = levelSegs[j];

                        emptyCellsUntil(seg.leftCol);

                        // create a container that occupies or more columns. append the event element.
                        td = $('<td class="fc-event-container"/>').append(seg.el);
                        if (seg.leftCol != seg.rightCol) {
                            td.attr('colspan', seg.rightCol - seg.leftCol + 1);
                        }
                        else { // a single-column segment
                            loneCellMatrix[i][col] = td;
                        }

                        while (col <= seg.rightCol) {
                            cellMatrix[i][col] = td;
                            segMatrix[i][col] = seg;
                            col++;
                        }

                        tr.append(td);
                    }
                }

                emptyCellsUntil(colCnt); // finish off the row
                this.bookendCells(tr, 'eventSkeleton');
                tbody.append(tr);
            }

            return { // a "rowStruct"
                row: row, // the row number
                tbodyEl: tbody,
                cellMatrix: cellMatrix,
                segMatrix: segMatrix,
                segLevels: segLevels,
                segs: rowSegs
            };
        },


        // Stacks a flat array of segments, which are all assumed to be in the same row, into subarrays of vertical levels.
        buildSegLevels: function (segs) {
            var levels = [];
            var i, seg;
            var j;

            // Give preference to elements with certain criteria, so they have
            // a chance to be closer to the top.
            segs.sort(compareSegs);

            for (i = 0; i < segs.length; i++) {
                seg = segs[i];

                // loop through levels, starting with the topmost, until the segment doesn't collide with other segments
                for (j = 0; j < levels.length; j++) {
                    if (!isDaySegCollision(seg, levels[j])) {
                        break;
                    }
                }
                // `j` now holds the desired subrow index
                seg.level = j;

                // create new level array if needed and append segment
                (levels[j] || (levels[j] = [])).push(seg);
            }

            // order segments left-to-right. very important if calendar is RTL
            for (j = 0; j < levels.length; j++) {
                levels[j].sort(compareDaySegCols);
            }

            return levels;
        },


        // Given a flat array of segments, return an array of sub-arrays, grouped by each segment's row
        groupSegRows: function (segs) {
            var view = this.view;
            var segRows = [];
            var i;

            for (i = 0; i < view.rowCnt; i++) {
                segRows.push([]);
            }

            for (i = 0; i < segs.length; i++) {
                segRows[segs[i].row].push(segs[i]);
            }

            return segRows;
        }

    });


    // Computes whether two segments' columns collide. They are assumed to be in the same row.
    function isDaySegCollision(seg, otherSegs) {
        var i, otherSeg;

        for (i = 0; i < otherSegs.length; i++) {
            otherSeg = otherSegs[i];

            if (
                otherSeg.leftCol <= seg.rightCol &&
                otherSeg.rightCol >= seg.leftCol
            ) {
                return true;
            }
        }

        return false;
    }


    // A cmp function for determining the leftmost event
    function compareDaySegCols(a, b) {
        return a.leftCol - b.leftCol;
    }

    ;;

    /* Methods relate to limiting the number events for a given day on a DayGrid
    ----------------------------------------------------------------------------------------------------------------------*/

    $.extend(DayGrid.prototype, {


        segPopover: null, // the Popover that holds events that can't fit in a cell. null when not visible
        popoverSegs: null, // an array of segment objects that the segPopover holds. null when not visible


        destroySegPopover: function () {
            if (this.segPopover) {
                this.segPopover.hide(); // will trigger destruction of `segPopover` and `popoverSegs`
            }
        },


        // Limits the number of "levels" (vertically stacking layers of events) for each row of the grid.
        // `levelLimit` can be false (don't limit), a number, or true (should be computed).
        limitRows: function (levelLimit) {
            var rowStructs = this.rowStructs || [];
            var row; // row #
            var rowLevelLimit;

            for (row = 0; row < rowStructs.length; row++) {
                this.unlimitRow(row);

                if (!levelLimit) {
                    rowLevelLimit = false;
                }
                else if (typeof levelLimit === 'number') {
                    rowLevelLimit = levelLimit;
                }
                else {
                    rowLevelLimit = this.computeRowLevelLimit(row);
                }

                if (rowLevelLimit !== false) {
                    this.limitRow(row, rowLevelLimit);
                }
            }
        },


        // Computes the number of levels a row will accomodate without going outside its bounds.
        // Assumes the row is "rigid" (maintains a constant height regardless of what is inside).
        // `row` is the row number.
        computeRowLevelLimit: function (row) {
            var rowEl = this.rowEls.eq(row); // the containing "fake" row div
            var rowHeight = rowEl.height(); // TODO: cache somehow?
            var trEls = this.rowStructs[row].tbodyEl.children();
            var i, trEl;

            // Reveal one level <tr> at a time and stop when we find one out of bounds
            for (i = 0; i < trEls.length; i++) {
                trEl = trEls.eq(i).removeClass('fc-limited'); // get and reveal
                if (trEl.position().top + trEl.outerHeight() > rowHeight) {
                    return i;
                }
            }

            return false; // should not limit at all
        },


        // Limits the given grid row to the maximum number of levels and injects "more" links if necessary.
        // `row` is the row number.
        // `levelLimit` is a number for the maximum (inclusive) number of levels allowed.
        limitRow: function (row, levelLimit) {
            var _this = this;
            var view = this.view;
            var rowStruct = this.rowStructs[row];
            var moreNodes = []; // array of "more" <a> links and <td> DOM nodes
            var col = 0; // col #
            var cell;
            var levelSegs; // array of segment objects in the last allowable level, ordered left-to-right
            var cellMatrix; // a matrix (by level, then column) of all <td> jQuery elements in the row
            var limitedNodes; // array of temporarily hidden level <tr> and segment <td> DOM nodes
            var i, seg;
            var segsBelow; // array of segment objects below `seg` in the current `col`
            var totalSegsBelow; // total number of segments below `seg` in any of the columns `seg` occupies
            var colSegsBelow; // array of segment arrays, below seg, one for each column (offset from segs's first column)
            var td, rowspan;
            var segMoreNodes; // array of "more" <td> cells that will stand-in for the current seg's cell
            var j;
            var moreTd, moreWrap, moreLink;

            // Iterates through empty level cells and places "more" links inside if need be
            function emptyCellsUntil(endCol) { // goes from current `col` to `endCol`
                while (col < endCol) {
                    cell = { row: row, col: col };
                    segsBelow = _this.getCellSegs(cell, levelLimit);
                    if (segsBelow.length) {
                        td = cellMatrix[levelLimit - 1][col];
                        moreLink = _this.renderMoreLink(cell, segsBelow);
                        moreWrap = $('<div/>').append(moreLink);
                        td.append(moreWrap);
                        moreNodes.push(moreWrap[0]);
                    }
                    col++;
                }
            }

            if (levelLimit && levelLimit < rowStruct.segLevels.length) { // is it actually over the limit?
                levelSegs = rowStruct.segLevels[levelLimit - 1];
                cellMatrix = rowStruct.cellMatrix;

                limitedNodes = rowStruct.tbodyEl.children().slice(levelLimit) // get level <tr> elements past the limit
                    .addClass('fc-limited').get(); // hide elements and get a simple DOM-nodes array

                // iterate though segments in the last allowable level
                for (i = 0; i < levelSegs.length; i++) {
                    seg = levelSegs[i];
                    emptyCellsUntil(seg.leftCol); // process empty cells before the segment

                    // determine *all* segments below `seg` that occupy the same columns
                    colSegsBelow = [];
                    totalSegsBelow = 0;
                    while (col <= seg.rightCol) {
                        cell = { row: row, col: col };
                        segsBelow = this.getCellSegs(cell, levelLimit);
                        colSegsBelow.push(segsBelow);
                        totalSegsBelow += segsBelow.length;
                        col++;
                    }

                    if (totalSegsBelow) { // do we need to replace this segment with one or many "more" links?
                        td = cellMatrix[levelLimit - 1][seg.leftCol]; // the segment's parent cell
                        rowspan = td.attr('rowspan') || 1;
                        segMoreNodes = [];

                        // make a replacement <td> for each column the segment occupies. will be one for each colspan
                        for (j = 0; j < colSegsBelow.length; j++) {
                            moreTd = $('<td class="fc-more-cell"/>').attr('rowspan', rowspan);
                            segsBelow = colSegsBelow[j];
                            cell = { row: row, col: seg.leftCol + j };
                            moreLink = this.renderMoreLink(cell, [seg].concat(segsBelow)); // count seg as hidden too
                            moreWrap = $('<div/>').append(moreLink);
                            moreTd.append(moreWrap);
                            segMoreNodes.push(moreTd[0]);
                            moreNodes.push(moreTd[0]);
                        }

                        td.addClass('fc-limited').after($(segMoreNodes)); // hide original <td> and inject replacements
                        limitedNodes.push(td[0]);
                    }
                }

                emptyCellsUntil(view.colCnt); // finish off the level
                rowStruct.moreEls = $(moreNodes); // for easy undoing later
                rowStruct.limitedEls = $(limitedNodes); // for easy undoing later
            }
        },


        // Reveals all levels and removes all "more"-related elements for a grid's row.
        // `row` is a row number.
        unlimitRow: function (row) {
            var rowStruct = this.rowStructs[row];

            if (rowStruct.moreEls) {
                rowStruct.moreEls.remove();
                rowStruct.moreEls = null;
            }

            if (rowStruct.limitedEls) {
                rowStruct.limitedEls.removeClass('fc-limited');
                rowStruct.limitedEls = null;
            }
        },


        // Renders an <a> element that represents hidden event element for a cell.
        // Responsible for attaching click handler as well.
        renderMoreLink: function (cell, hiddenSegs) {
            var _this = this;
            var view = this.view;

            return $('<a class="fc-more"/>')
                .text(
                    this.getMoreLinkText(hiddenSegs.length)
                )
                .on('click', function (ev) {
                    var clickOption = view.opt('eventLimitClick');
                    var date = view.cellToDate(cell);
                    var moreEl = $(this);
                    var dayEl = _this.getCellDayEl(cell);
                    var allSegs = _this.getCellSegs(cell);

                    // rescope the segments to be within the cell's date
                    var reslicedAllSegs = _this.resliceDaySegs(allSegs, date);
                    var reslicedHiddenSegs = _this.resliceDaySegs(hiddenSegs, date);

                    if (typeof clickOption === 'function') {
                        // the returned value can be an atomic option
                        clickOption = view.trigger('eventLimitClick', null, {
                            date: date,
                            dayEl: dayEl,
                            moreEl: moreEl,
                            segs: reslicedAllSegs,
                            hiddenSegs: reslicedHiddenSegs
                        }, ev);
                    }

                    if (clickOption === 'popover') {
                        _this.showSegPopover(date, cell, moreEl, reslicedAllSegs);
                    }
                    else if (typeof clickOption === 'string') { // a view name
                        view.calendar.zoomTo(date, clickOption);
                    }
                });
        },


        // Reveals the popover that displays all events within a cell
        showSegPopover: function (date, cell, moreLink, segs) {
            var _this = this;
            var view = this.view;
            var moreWrap = moreLink.parent(); // the <div> wrapper around the <a>
            var topEl; // the element we want to match the top coordinate of
            var options;

            if (view.rowCnt == 1) {
                topEl = this.view.el; // will cause the popover to cover any sort of header
            }
            else {
                topEl = this.rowEls.eq(cell.row); // will align with top of row
            }

            options = {
                className: 'fc-more-popover',
                content: this.renderSegPopoverContent(date, segs),
                parentEl: this.el,
                top: topEl.offset().top,
                autoHide: true, // when the user clicks elsewhere, hide the popover
                viewportConstrain: view.opt('popoverViewportConstrain'),
                hide: function () {
                    // destroy everything when the popover is hidden
                    _this.segPopover.destroy();
                    _this.segPopover = null;
                    _this.popoverSegs = null;
                }
            };

            // Determine horizontal coordinate.
            // We use the moreWrap instead of the <td> to avoid border confusion.
            if (view.opt('isRTL')) {
                options.right = moreWrap.offset().left + moreWrap.outerWidth() + 1; // +1 to be over cell border
            }
            else {
                options.left = moreWrap.offset().left - 1; // -1 to be over cell border
            }

            this.segPopover = new Popover(options);
            this.segPopover.show();
        },


        // Builds the inner DOM contents of the segment popover
        renderSegPopoverContent: function (date, segs) {
            var view = this.view;
            var isTheme = view.opt('theme');
            var title = date.format(view.opt('dayPopoverFormat'));
            var content = $(
                '<div class="fc-header ' + view.widgetHeaderClass + '">' +
                    '<span class="fc-close ' +
                        (isTheme ? 'ui-icon ui-icon-closethick' : 'fc-icon fc-icon-x') +
                    '"></span>' +
                    '<span class="fc-title">' +
                        htmlEscape(title) +
                    '</span>' +
                    '<div class="fc-clear"/>' +
                '</div>' +
                '<div class="fc-body ' + view.widgetContentClass + '">' +
                    '<div class="fc-event-container"></div>' +
                '</div>'
            );
            var segContainer = content.find('.fc-event-container');
            var i;

            // render each seg's `el` and only return the visible segs
            segs = this.renderSegs(segs, true); // disableResizing=true
            this.popoverSegs = segs;

            for (i = 0; i < segs.length; i++) {

                // because segments in the popover are not part of a grid coordinate system, provide a hint to any
                // grids that want to do drag-n-drop about which cell it came from
                segs[i].cellDate = date;

                segContainer.append(segs[i].el);
            }

            return content;
        },


        // Given the events within an array of segment objects, reslice them to be in a single day
        resliceDaySegs: function (segs, dayDate) {
            var events = $.map(segs, function (seg) {
                return seg.event;
            });
            var dayStart = dayDate.clone().stripTime();
            var dayEnd = dayStart.clone().add(1, 'days');

            return this.eventsToSegs(events, dayStart, dayEnd);
        },


        // Generates the text that should be inside a "more" link, given the number of events it represents
        getMoreLinkText: function (num) {
            var view = this.view;
            var opt = view.opt('eventLimitText');

            if (typeof opt === 'function') {
                return opt(num);
            }
            else {
                return '+' + num + ' ' + opt;
            }
        },


        // Returns segments within a given cell.
        // If `startLevel` is specified, returns only events including and below that level. Otherwise returns all segs.
        getCellSegs: function (cell, startLevel) {
            var segMatrix = this.rowStructs[cell.row].segMatrix;
            var level = startLevel || 0;
            var segs = [];
            var seg;

            while (level < segMatrix.length) {
                seg = segMatrix[level][cell.col];
                if (seg) {
                    segs.push(seg);
                }
                level++;
            }

            return segs;
        }

    });

    ;;

    /* A component that renders one or more columns of vertical time slots
    ----------------------------------------------------------------------------------------------------------------------*/

    function TimeGrid(view) {
        Grid.call(this, view); // call the super-constructor
    }


    TimeGrid.prototype = createObject(Grid.prototype); // define the super-class
    $.extend(TimeGrid.prototype, {

        slotDuration: null, // duration of a "slot", a distinct time segment on given day, visualized by lines
        snapDuration: null, // granularity of time for dragging and selecting

        minTime: null, // Duration object that denotes the first visible time of any given day
        maxTime: null, // Duration object that denotes the exclusive visible end time of any given day

        dayEls: null, // cells elements in the day-row background
        slatEls: null, // elements running horizontally across all columns

        slatTops: null, // an array of top positions, relative to the container. last item holds bottom of last slot

        highlightEl: null, // cell skeleton element for rendering the highlight
        helperEl: null, // cell skeleton element for rendering the mock event "helper"


        // Renders the time grid into `this.el`, which should already be assigned.
        // Relies on the view's colCnt. In the future, this component should probably be self-sufficient.
        render: function () {
            this.processOptions();

            this.el.html(this.renderHtml());

            this.dayEls = this.el.find('.fc-day');
            this.slatEls = this.el.find('.fc-slats tr');

            this.computeSlatTops();

            Grid.prototype.render.call(this); // call the super-method
        },


        // Renders the basic HTML skeleton for the grid
        renderHtml: function () {
            return '' +
                '<div class="fc-bg">' +
                    '<table>' +
                        this.rowHtml('slotBg') + // leverages RowRenderer, which will call slotBgCellHtml
                    '</table>' +
                '</div>' +
                '<div class="fc-slats">' +
                    '<table>' +
                        this.slatRowHtml() +
                    '</table>' +
                '</div>';
        },


        // Renders the HTML for a vertical background cell behind the slots.
        // This method is distinct from 'bg' because we wanted a new `rowType` so the View could customize the rendering.
        slotBgCellHtml: function (row, col, date) {
            return this.bgCellHtml(row, col, date);
        },


        // Generates the HTML for the horizontal "slats" that run width-wise. Has a time axis on a side. Depends on RTL.
        slatRowHtml: function () {
            var view = this.view;
            var calendar = view.calendar;
            var isRTL = view.opt('isRTL');
            var html = '';
            var slotNormal = this.slotDuration.asMinutes() % 15 === 0;
            var slotTime = moment.duration(+this.minTime); // wish there was .clone() for durations
            var slotDate; // will be on the view's first day, but we only care about its time
            var minutes;
            var axisHtml;

            // Calculate the time for each slot
            while (slotTime < this.maxTime) {
                slotDate = view.start.clone().time(slotTime); // will be in UTC but that's good. to avoid DST issues
                minutes = slotDate.minutes();

                axisHtml =
                    '<td class="fc-axis fc-time ' + view.widgetContentClass + '" ' + view.axisStyleAttr() + '>' +
                        ((!slotNormal || !minutes) ? // if irregular slot duration, or on the hour, then display the time
                            '<span>' + // for matchCellWidths
                                htmlEscape(calendar.formatDate(slotDate, view.opt('axisFormat'))) +
                            '</span>' :
                            ''
                            ) +
                    '</td>';

                html +=
                    '<tr ' + (!minutes ? '' : 'class="fc-minor"') + '>' +
                        (!isRTL ? axisHtml : '') +
                        '<td class="' + view.widgetContentClass + '"/>' +
                        (isRTL ? axisHtml : '') +
                    "</tr>";

                slotTime.add(this.slotDuration);
            }

            return html;
        },


        // Parses various options into properties of this object
        processOptions: function () {
            var view = this.view;
            var slotDuration = view.opt('slotDuration');
            var snapDuration = view.opt('snapDuration');

            slotDuration = moment.duration(slotDuration);
            snapDuration = snapDuration ? moment.duration(snapDuration) : slotDuration;

            this.slotDuration = slotDuration;
            this.snapDuration = snapDuration;
            this.cellDuration = snapDuration; // important to assign this for Grid.events.js

            this.minTime = moment.duration(view.opt('minTime'));
            this.maxTime = moment.duration(view.opt('maxTime'));
        },


        // Slices up a date range into a segment for each column
        rangeToSegs: function (rangeStart, rangeEnd) {
            var view = this.view;
            var segs = [];
            var seg;
            var col;
            var cellDate;
            var colStart, colEnd;

            // normalize
            rangeStart = rangeStart.clone().stripZone();
            rangeEnd = rangeEnd.clone().stripZone();

            for (col = 0; col < view.colCnt; col++) {
                cellDate = view.cellToDate(0, col); // use the View's cell system for this
                colStart = cellDate.clone().time(this.minTime);
                colEnd = cellDate.clone().time(this.maxTime);
                seg = intersectionToSeg(rangeStart, rangeEnd, colStart, colEnd);
                if (seg) {
                    seg.col = col;
                    segs.push(seg);
                }
            }

            return segs;
        },


        /* Coordinates
        ------------------------------------------------------------------------------------------------------------------*/


        // Called when there is a window resize/zoom and we need to recalculate coordinates for the grid
        resize: function () {
            this.computeSlatTops();
            this.updateSegVerticals();
        },


        // Populates the given empty `rows` and `cols` arrays with offset positions of the "snap" cells.
        // "Snap" cells are different the slots because they might have finer granularity.
        buildCoords: function (rows, cols) {
            var colCnt = this.view.colCnt;
            var originTop = this.el.offset().top;
            var snapTime = moment.duration(+this.minTime);
            var p = null;
            var e, n;

            this.dayEls.slice(0, colCnt).each(function (i, _e) {
                e = $(_e);
                n = e.offset().left;
                if (p) {
                    p[1] = n;
                }
                p = [n];
                cols[i] = p;
            });
            p[1] = n + e.outerWidth();

            p = null;
            while (snapTime < this.maxTime) {
                n = originTop + this.computeTimeTop(snapTime);
                if (p) {
                    p[1] = n;
                }
                p = [n];
                rows.push(p);
                snapTime.add(this.snapDuration);
            }
            p[1] = originTop + this.computeTimeTop(snapTime); // the position of the exclusive end
        },


        // Gets the datetime for the given slot cell
        getCellDate: function (cell) {
            var view = this.view;
            var calendar = view.calendar;

            return calendar.rezoneDate( // since we are adding a time, it needs to be in the calendar's timezone
                view.cellToDate(0, cell.col) // View's coord system only accounts for start-of-day for column
                    .time(this.minTime + this.snapDuration * cell.row)
            );
        },


        // Gets the element that represents the whole-day the cell resides on
        getCellDayEl: function (cell) {
            return this.dayEls.eq(cell.col);
        },


        // Computes the top coordinate, relative to the bounds of the grid, of the given date.
        // A `startOfDayDate` must be given for avoiding ambiguity over how to treat midnight.
        computeDateTop: function (date, startOfDayDate) {
            return this.computeTimeTop(
                moment.duration(
                    date.clone().stripZone() - startOfDayDate.clone().stripTime()
                )
            );
        },


        // Computes the top coordinate, relative to the bounds of the grid, of the given time (a Duration).
        computeTimeTop: function (time) {
            var slatCoverage = (time - this.minTime) / this.slotDuration; // floating-point value of # of slots covered
            var slatIndex;
            var slatRemainder;
            var slatTop;
            var slatBottom;

            // constrain. because minTime/maxTime might be customized
            slatCoverage = Math.max(0, slatCoverage);
            slatCoverage = Math.min(this.slatEls.length, slatCoverage);

            slatIndex = Math.floor(slatCoverage); // an integer index of the furthest whole slot
            slatRemainder = slatCoverage - slatIndex;
            slatTop = this.slatTops[slatIndex]; // the top position of the furthest whole slot

            if (slatRemainder) { // time spans part-way into the slot
                slatBottom = this.slatTops[slatIndex + 1];
                return slatTop + (slatBottom - slatTop) * slatRemainder; // part-way between slots
            }
            else {
                return slatTop;
            }
        },


        // Queries each `slatEl` for its position relative to the grid's container and stores it in `slatTops`.
        // Includes the the bottom of the last slat as the last item in the array.
        computeSlatTops: function () {
            var tops = [];
            var top;

            this.slatEls.each(function (i, node) {
                top = $(node).position().top;
                tops.push(top);
            });

            tops.push(top + this.slatEls.last().outerHeight()); // bottom of the last slat

            this.slatTops = tops;
        },


        /* Event Drag Visualization
        ------------------------------------------------------------------------------------------------------------------*/


        // Renders a visual indication of an event being dragged over the specified date(s).
        // `end` and `seg` can be null. See View's documentation on renderDrag for more info.
        renderDrag: function (start, end, seg) {
            var opacity;

            if (seg) { // if there is event information for this drag, render a helper event
                this.renderRangeHelper(start, end, seg);

                opacity = this.view.opt('dragOpacity');
                if (opacity !== undefined) {
                    this.helperEl.css('opacity', opacity);
                }

                return true; // signal that a helper has been rendered
            }
            else {
                // otherwise, just render a highlight
                this.renderHighlight(
                    start,
                    end || this.view.calendar.getDefaultEventEnd(false, start)
                );
            }
        },


        // Unrenders any visual indication of an event being dragged
        destroyDrag: function () {
            this.destroyHelper();
            this.destroyHighlight();
        },


        /* Event Resize Visualization
        ------------------------------------------------------------------------------------------------------------------*/


        // Renders a visual indication of an event being resized
        renderResize: function (start, end, seg) {
            this.renderRangeHelper(start, end, seg);
        },


        // Unrenders any visual indication of an event being resized
        destroyResize: function () {
            this.destroyHelper();
        },


        /* Event Helper
        ------------------------------------------------------------------------------------------------------------------*/


        // Renders a mock "helper" event. `sourceSeg` is the original segment object and might be null (an external drag)
        renderHelper: function (event, sourceSeg) {
            var res = this.renderEventTable([event]);
            var tableEl = res.tableEl;
            var segs = res.segs;
            var i, seg;
            var sourceEl;

            // Try to make the segment that is in the same row as sourceSeg look the same
            for (i = 0; i < segs.length; i++) {
                seg = segs[i];
                if (sourceSeg && sourceSeg.col === seg.col) {
                    sourceEl = sourceSeg.el;
                    seg.el.css({
                        left: sourceEl.css('left'),
                        right: sourceEl.css('right'),
                        'margin-left': sourceEl.css('margin-left'),
                        'margin-right': sourceEl.css('margin-right')
                    });
                }
            }

            this.helperEl = $('<div class="fc-helper-skeleton"/>')
                .append(tableEl)
                    .appendTo(this.el);
        },


        // Unrenders any mock helper event
        destroyHelper: function () {
            if (this.helperEl) {
                this.helperEl.remove();
                this.helperEl = null;
            }
        },


        /* Selection
        ------------------------------------------------------------------------------------------------------------------*/


        // Renders a visual indication of a selection. Overrides the default, which was to simply render a highlight.
        renderSelection: function (start, end) {
            if (this.view.opt('selectHelper')) { // this setting signals that a mock helper event should be rendered
                this.renderRangeHelper(start, end);
            }
            else {
                this.renderHighlight(start, end);
            }
        },


        // Unrenders any visual indication of a selection
        destroySelection: function () {
            this.destroyHelper();
            this.destroyHighlight();
        },


        /* Highlight
        ------------------------------------------------------------------------------------------------------------------*/


        // Renders an emphasis on the given date range. `start` is inclusive. `end` is exclusive.
        renderHighlight: function (start, end) {
            this.highlightEl = $(
                this.highlightSkeletonHtml(start, end)
            ).appendTo(this.el);
        },


        // Unrenders the emphasis on a date range
        destroyHighlight: function () {
            if (this.highlightEl) {
                this.highlightEl.remove();
                this.highlightEl = null;
            }
        },


        // Generates HTML for a table element with containers in each column, responsible for absolutely positioning the
        // highlight elements to cover the highlighted slots.
        highlightSkeletonHtml: function (start, end) {
            var view = this.view;
            var segs = this.rangeToSegs(start, end);
            var cellHtml = '';
            var col = 0;
            var i, seg;
            var dayDate;
            var top, bottom;

            for (i = 0; i < segs.length; i++) { // loop through the segments. one per column
                seg = segs[i];

                // need empty cells beforehand?
                if (col < seg.col) {
                    cellHtml += '<td colspan="' + (seg.col - col) + '"/>';
                    col = seg.col;
                }

                // compute vertical position
                dayDate = view.cellToDate(0, col);
                top = this.computeDateTop(seg.start, dayDate);
                bottom = this.computeDateTop(seg.end, dayDate); // the y position of the bottom edge

                // generate the cell HTML. bottom becomes negative because it needs to be a CSS value relative to the
                // bottom edge of the zero-height container.
                cellHtml +=
                    '<td>' +
                        '<div class="fc-highlight-container">' +
                            '<div class="fc-highlight" style="top:' + top + 'px;bottom:-' + bottom + 'px"/>' +
                        '</div>' +
                    '</td>';

                col++;
            }

            // need empty cells after the last segment?
            if (col < view.colCnt) {
                cellHtml += '<td colspan="' + (view.colCnt - col) + '"/>';
            }

            cellHtml = this.bookendCells(cellHtml, 'highlight');

            return '' +
                '<div class="fc-highlight-skeleton">' +
                    '<table>' +
                        '<tr>' +
                            cellHtml +
                        '</tr>' +
                    '</table>' +
                '</div>';
        }

    });

    ;;

    /* Event-rendering methods for the TimeGrid class
    ----------------------------------------------------------------------------------------------------------------------*/

    $.extend(TimeGrid.prototype, {

        segs: null, // segment objects rendered in the component. null of events haven't been rendered yet
        eventSkeletonEl: null, // has cells with event-containers, which contain absolutely positioned event elements


        // Renders the events onto the grid and returns an array of segments that have been rendered
        renderEvents: function (events) {
            var res = this.renderEventTable(events);

            this.eventSkeletonEl = $('<div class="fc-content-skeleton"/>').append(res.tableEl);
            this.el.append(this.eventSkeletonEl);

            this.segs = res.segs;
        },


        // Retrieves rendered segment objects
        getSegs: function () {
            return this.segs || [];
        },


        // Removes all event segment elements from the view
        destroyEvents: function () {
            Grid.prototype.destroyEvents.call(this); // call the super-method

            if (this.eventSkeletonEl) {
                this.eventSkeletonEl.remove();
                this.eventSkeletonEl = null;
            }

            this.segs = null;
        },


        // Renders and returns the <table> portion of the event-skeleton.
        // Returns an object with properties 'tbodyEl' and 'segs'.
        renderEventTable: function (events) {
            var tableEl = $('<table><tr/></table>');
            var trEl = tableEl.find('tr');
            var segs = this.eventsToSegs(events);
            var segCols;
            var i, seg;
            var col, colSegs;
            var containerEl;

            segs = this.renderSegs(segs); // returns only the visible segs
            segCols = this.groupSegCols(segs); // group into sub-arrays, and assigns 'col' to each seg

            this.computeSegVerticals(segs); // compute and assign top/bottom

            for (col = 0; col < segCols.length; col++) { // iterate each column grouping
                colSegs = segCols[col];
                placeSlotSegs(colSegs); // compute horizontal coordinates, z-index's, and reorder the array

                containerEl = $('<div class="fc-event-container"/>');

                // assign positioning CSS and insert into container
                for (i = 0; i < colSegs.length; i++) {
                    seg = colSegs[i];
                    seg.el.css(this.generateSegPositionCss(seg));

                    // if the height is short, add a className for alternate styling
                    if (seg.bottom - seg.top < 30) {
                        seg.el.addClass('fc-short');
                    }

                    containerEl.append(seg.el);
                }

                trEl.append($('<td/>').append(containerEl));
            }

            this.bookendCells(trEl, 'eventSkeleton');

            return {
                tableEl: tableEl,
                segs: segs
            };
        },


        // Refreshes the CSS top/bottom coordinates for each segment element. Probably after a window resize/zoom.
        updateSegVerticals: function () {
            var segs = this.segs;
            var i;

            if (segs) {
                this.computeSegVerticals(segs);

                for (i = 0; i < segs.length; i++) {
                    segs[i].el.css(
                        this.generateSegVerticalCss(segs[i])
                    );
                }
            }
        },


        // For each segment in an array, computes and assigns its top and bottom properties
        computeSegVerticals: function (segs) {
            var i, seg;

            for (i = 0; i < segs.length; i++) {
                seg = segs[i];
                seg.top = this.computeDateTop(seg.start, seg.start);
                seg.bottom = this.computeDateTop(seg.end, seg.start);
            }
        },


        // Renders the HTML for a single event segment's default rendering
        renderSegHtml: function (seg, disableResizing) {
            var view = this.view;
            var event = seg.event;
            var isDraggable = view.isEventDraggable(event);
            var isResizable = !disableResizing && seg.isEnd && view.isEventResizable(event);
            var classes = this.getSegClasses(seg, isDraggable, isResizable);
            var skinCss = this.getEventSkinCss(event);
            var timeText;
            var fullTimeText; // more verbose time text. for the print stylesheet
            var startTimeText; // just the start time text

            classes.unshift('fc-time-grid-event');

            if (view.isMultiDayEvent(event)) { // if the event appears to span more than one day...
                // Don't display time text on segments that run entirely through a day.
                // That would appear as midnight-midnight and would look dumb.
                // Otherwise, display the time text for the *segment's* times (like 6pm-midnight or midnight-10am)
                if (seg.isStart || seg.isEnd) {
                    timeText = view.getEventTimeText(seg.start, seg.end);
                    fullTimeText = view.getEventTimeText(seg.start, seg.end, 'LT');
                    startTimeText = view.getEventTimeText(seg.start, null);
                }
            } else {
                // Display the normal time text for the *event's* times
                timeText = view.getEventTimeText(event);
                fullTimeText = view.getEventTimeText(event, 'LT');
                startTimeText = view.getEventTimeText(event.start, null);
            }

            return '<a class="' + classes.join(' ') + '"' +
                (event.url ?
                    ' href="' + htmlEscape(event.url) + '"' :
                    ''
                    ) +
                (skinCss ?
                    ' style="' + skinCss + '"' :
                    ''
                    ) +
                '>' +
                    '<div class="fc-content">' +
                        (timeText ?
                            '<div class="fc-time"' +
                            ' data-start="' + htmlEscape(startTimeText) + '"' +
                            ' data-full="' + htmlEscape(fullTimeText) + '"' +
                            '>' +
                                '<span>' + htmlEscape(timeText) + '</span>' +
                            '</div>' :
                            ''
                            ) +
                        (event.title ?
                            '<div class="fc-title">' +
                                htmlEscape(event.title) +
                            '</div>' :
                            ''
                            ) +
                    '</div>' +
                    '<div class="fc-bg"/>' +
                    (isResizable ?
                        '<div class="fc-resizer"/>' :
                        ''
                        ) +
                '</a>';
        },


        // Generates an object with CSS properties/values that should be applied to an event segment element.
        // Contains important positioning-related properties that should be applied to any event element, customized or not.
        generateSegPositionCss: function (seg) {
            var view = this.view;
            var isRTL = view.opt('isRTL');
            var shouldOverlap = view.opt('slotEventOverlap');
            var backwardCoord = seg.backwardCoord; // the left side if LTR. the right side if RTL. floating-point
            var forwardCoord = seg.forwardCoord; // the right side if LTR. the left side if RTL. floating-point
            var props = this.generateSegVerticalCss(seg); // get top/bottom first
            var left; // amount of space from left edge, a fraction of the total width
            var right; // amount of space from right edge, a fraction of the total width

            if (shouldOverlap) {
                // double the width, but don't go beyond the maximum forward coordinate (1.0)
                forwardCoord = Math.min(1, backwardCoord + (forwardCoord - backwardCoord) * 2);
            }

            if (isRTL) {
                left = 1 - forwardCoord;
                right = backwardCoord;
            }
            else {
                left = backwardCoord;
                right = 1 - forwardCoord;
            }

            props.zIndex = seg.level + 1; // convert from 0-base to 1-based
            props.left = left * 100 + '%';
            props.right = right * 100 + '%';

            if (shouldOverlap && seg.forwardPressure) {
                // add padding to the edge so that forward stacked events don't cover the resizer's icon
                props[isRTL ? 'marginLeft' : 'marginRight'] = 10 * 2; // 10 is a guesstimate of the icon's width 
            }

            return props;
        },


        // Generates an object with CSS properties for the top/bottom coordinates of a segment element
        generateSegVerticalCss: function (seg) {
            return {
                top: seg.top,
                bottom: -seg.bottom // flipped because needs to be space beyond bottom edge of event container
            };
        },


        // Given a flat array of segments, return an array of sub-arrays, grouped by each segment's col
        groupSegCols: function (segs) {
            var view = this.view;
            var segCols = [];
            var i;

            for (i = 0; i < view.colCnt; i++) {
                segCols.push([]);
            }

            for (i = 0; i < segs.length; i++) {
                segCols[segs[i].col].push(segs[i]);
            }

            return segCols;
        }

    });


    // Given an array of segments that are all in the same column, sets the backwardCoord and forwardCoord on each.
    // Also reorders the given array by date!
    function placeSlotSegs(segs) {
        var levels;
        var level0;
        var i;

        segs.sort(compareSegs); // order by date
        levels = buildSlotSegLevels(segs);
        computeForwardSlotSegs(levels);

        if ((level0 = levels[0])) {

            for (i = 0; i < level0.length; i++) {
                computeSlotSegPressures(level0[i]);
            }

            for (i = 0; i < level0.length; i++) {
                computeSlotSegCoords(level0[i], 0, 0);
            }
        }
    }


    // Builds an array of segments "levels". The first level will be the leftmost tier of segments if the calendar is
    // left-to-right, or the rightmost if the calendar is right-to-left. Assumes the segments are already ordered by date.
    function buildSlotSegLevels(segs) {
        var levels = [];
        var i, seg;
        var j;

        for (i = 0; i < segs.length; i++) {
            seg = segs[i];

            // go through all the levels and stop on the first level where there are no collisions
            for (j = 0; j < levels.length; j++) {
                if (!computeSlotSegCollisions(seg, levels[j]).length) {
                    break;
                }
            }

            seg.level = j;

            (levels[j] || (levels[j] = [])).push(seg);
        }

        return levels;
    }


    // For every segment, figure out the other segments that are in subsequent
    // levels that also occupy the same vertical space. Accumulate in seg.forwardSegs
    function computeForwardSlotSegs(levels) {
        var i, level;
        var j, seg;
        var k;

        for (i = 0; i < levels.length; i++) {
            level = levels[i];

            for (j = 0; j < level.length; j++) {
                seg = level[j];

                seg.forwardSegs = [];
                for (k = i + 1; k < levels.length; k++) {
                    computeSlotSegCollisions(seg, levels[k], seg.forwardSegs);
                }
            }
        }
    }


    // Figure out which path forward (via seg.forwardSegs) results in the longest path until
    // the furthest edge is reached. The number of segments in this path will be seg.forwardPressure
    function computeSlotSegPressures(seg) {
        var forwardSegs = seg.forwardSegs;
        var forwardPressure = 0;
        var i, forwardSeg;

        if (seg.forwardPressure === undefined) { // not already computed

            for (i = 0; i < forwardSegs.length; i++) {
                forwardSeg = forwardSegs[i];

                // figure out the child's maximum forward path
                computeSlotSegPressures(forwardSeg);

                // either use the existing maximum, or use the child's forward pressure
                // plus one (for the forwardSeg itself)
                forwardPressure = Math.max(
                    forwardPressure,
                    1 + forwardSeg.forwardPressure
                );
            }

            seg.forwardPressure = forwardPressure;
        }
    }


    // Calculate seg.forwardCoord and seg.backwardCoord for the segment, where both values range
    // from 0 to 1. If the calendar is left-to-right, the seg.backwardCoord maps to "left" and
    // seg.forwardCoord maps to "right" (via percentage). Vice-versa if the calendar is right-to-left.
    //
    // The segment might be part of a "series", which means consecutive segments with the same pressure
    // who's width is unknown until an edge has been hit. `seriesBackwardPressure` is the number of
    // segments behind this one in the current series, and `seriesBackwardCoord` is the starting
    // coordinate of the first segment in the series.
    function computeSlotSegCoords(seg, seriesBackwardPressure, seriesBackwardCoord) {
        var forwardSegs = seg.forwardSegs;
        var i;

        if (seg.forwardCoord === undefined) { // not already computed

            if (!forwardSegs.length) {

                // if there are no forward segments, this segment should butt up against the edge
                seg.forwardCoord = 1;
            }
            else {

                // sort highest pressure first
                forwardSegs.sort(compareForwardSlotSegs);

                // this segment's forwardCoord will be calculated from the backwardCoord of the
                // highest-pressure forward segment.
                computeSlotSegCoords(forwardSegs[0], seriesBackwardPressure + 1, seriesBackwardCoord);
                seg.forwardCoord = forwardSegs[0].backwardCoord;
            }

            // calculate the backwardCoord from the forwardCoord. consider the series
            seg.backwardCoord = seg.forwardCoord -
                (seg.forwardCoord - seriesBackwardCoord) / // available width for series
                (seriesBackwardPressure + 1); // # of segments in the series

            // use this segment's coordinates to computed the coordinates of the less-pressurized
            // forward segments
            for (i = 0; i < forwardSegs.length; i++) {
                computeSlotSegCoords(forwardSegs[i], 0, seg.forwardCoord);
            }
        }
    }


    // Find all the segments in `otherSegs` that vertically collide with `seg`.
    // Append into an optionally-supplied `results` array and return.
    function computeSlotSegCollisions(seg, otherSegs, results) {
        results = results || [];

        for (var i = 0; i < otherSegs.length; i++) {
            if (isSlotSegCollision(seg, otherSegs[i])) {
                results.push(otherSegs[i]);
            }
        }

        return results;
    }


    // Do these segments occupy the same vertical space?
    function isSlotSegCollision(seg1, seg2) {
        return seg1.bottom > seg2.top && seg1.top < seg2.bottom;
    }


    // A cmp function for determining which forward segment to rely on more when computing coordinates.
    function compareForwardSlotSegs(seg1, seg2) {
        // put higher-pressure first
        return seg2.forwardPressure - seg1.forwardPressure ||
            // put segments that are closer to initial edge first (and favor ones with no coords yet)
            (seg1.backwardCoord || 0) - (seg2.backwardCoord || 0) ||
            // do normal sorting...
            compareSegs(seg1, seg2);
    }

    ;;

    /* An abstract class from which other views inherit from
    ----------------------------------------------------------------------------------------------------------------------*/
    // Newer methods should be written as prototype methods, not in the monster `View` function at the bottom.

    View.prototype = {

        calendar: null, // owner Calendar object
        coordMap: null, // a CoordMap object for converting pixel regions to dates
        el: null, // the view's containing element. set by Calendar

        // important Moments
        start: null, // the date of the very first cell
        end: null, // the date after the very last cell
        intervalStart: null, // the start of the interval of time the view represents (1st of month for month view)
        intervalEnd: null, // the exclusive end of the interval of time the view represents

        // used for cell-to-date and date-to-cell calculations
        rowCnt: null, // # of weeks
        colCnt: null, // # of days displayed in a week

        isSelected: false, // boolean whether cells are user-selected or not

        // subclasses can optionally use a scroll container
        scrollerEl: null, // the element that will most likely scroll when content is too tall
        scrollTop: null, // cached vertical scroll value

        // classNames styled by jqui themes
        widgetHeaderClass: null,
        widgetContentClass: null,
        highlightStateClass: null,

        // document handlers, bound to `this` object
        documentMousedownProxy: null,
        documentDragStartProxy: null,


        // Serves as a "constructor" to suppliment the monster `View` constructor below
        init: function () {
            var tm = this.opt('theme') ? 'ui' : 'fc';

            this.widgetHeaderClass = tm + '-widget-header';
            this.widgetContentClass = tm + '-widget-content';
            this.highlightStateClass = tm + '-state-highlight';

            // save references to `this`-bound handlers
            this.documentMousedownProxy = $.proxy(this, 'documentMousedown');
            this.documentDragStartProxy = $.proxy(this, 'documentDragStart');
        },


        // Renders the view inside an already-defined `this.el`.
        // Subclasses should override this and then call the super method afterwards.
        render: function () {
            this.updateSize();
            this.trigger('viewRender', this, this, this.el);

            // attach handlers to document. do it here to allow for destroy/rerender
            $(document)
                .on('mousedown', this.documentMousedownProxy)
                .on('dragstart', this.documentDragStartProxy); // jqui drag
        },


        // Clears all view rendering, event elements, and unregisters handlers
        destroy: function () {
            this.unselect();
            this.trigger('viewDestroy', this, this, this.el);
            this.destroyEvents();
            this.el.empty(); // removes inner contents but leaves the element intact

            $(document)
                .off('mousedown', this.documentMousedownProxy)
                .off('dragstart', this.documentDragStartProxy);
        },


        // Used to determine what happens when the users clicks next/prev. Given -1 for prev, 1 for next.
        // Should apply the delta to `date` (a Moment) and return it.
        incrementDate: function (date, delta) {
            // subclasses should implement
        },


        /* Dimensions
        ------------------------------------------------------------------------------------------------------------------*/


        // Refreshes anything dependant upon sizing of the container element of the grid
        updateSize: function (isResize) {
            if (isResize) {
                this.recordScroll();
            }
            this.updateHeight();
            this.updateWidth();
        },


        // Refreshes the horizontal dimensions of the calendar
        updateWidth: function () {
            // subclasses should implement
        },


        // Refreshes the vertical dimensions of the calendar
        updateHeight: function () {
            var calendar = this.calendar; // we poll the calendar for height information

            this.setHeight(
                calendar.getSuggestedViewHeight(),
                calendar.isHeightAuto()
            );
        },


        // Updates the vertical dimensions of the calendar to the specified height.
        // if `isAuto` is set to true, height becomes merely a suggestion and the view should use its "natural" height.
        setHeight: function (height, isAuto) {
            // subclasses should implement
        },


        // Given the total height of the view, return the number of pixels that should be used for the scroller.
        // Utility for subclasses.
        computeScrollerHeight: function (totalHeight) {
            var both = this.el.add(this.scrollerEl);
            var otherHeight; // cumulative height of everything that is not the scrollerEl in the view (header+borders)

            // fuckin IE8/9/10/11 sometimes returns 0 for dimensions. this weird hack was the only thing that worked
            both.css({
                position: 'relative', // cause a reflow, which will force fresh dimension recalculation
                left: -1 // ensure reflow in case the el was already relative. negative is less likely to cause new scroll
            });
            otherHeight = this.el.outerHeight() - this.scrollerEl.height(); // grab the dimensions
            both.css({ position: '', left: '' }); // undo hack

            return totalHeight - otherHeight;
        },


        // Called for remembering the current scroll value of the scroller.
        // Should be called before there is a destructive operation (like removing DOM elements) that might inadvertently
        // change the scroll of the container.
        recordScroll: function () {
            if (this.scrollerEl) {
                this.scrollTop = this.scrollerEl.scrollTop();
            }
        },


        // Set the scroll value of the scroller to the previously recorded value.
        // Should be called after we know the view's dimensions have been restored following some type of destructive
        // operation (like temporarily removing DOM elements).
        restoreScroll: function () {
            if (this.scrollTop !== null) {
                this.scrollerEl.scrollTop(this.scrollTop);
            }
        },


        /* Events
        ------------------------------------------------------------------------------------------------------------------*/


        // Renders the events onto the view.
        // Should be overriden by subclasses. Subclasses should call the super-method afterwards.
        renderEvents: function (events) {
            this.segEach(function (seg) {
                this.trigger('eventAfterRender', seg.event, seg.event, seg.el);
            });
            this.trigger('eventAfterAllRender');
        },


        // Removes event elements from the view.
        // Should be overridden by subclasses. Should call this super-method FIRST, then subclass DOM destruction.
        destroyEvents: function () {
            this.segEach(function (seg) {
                this.trigger('eventDestroy', seg.event, seg.event, seg.el);
            });
        },


        // Given an event and the default element used for rendering, returns the element that should actually be used.
        // Basically runs events and elements through the eventRender hook.
        resolveEventEl: function (event, el) {
            var custom = this.trigger('eventRender', event, event, el);

            if (custom === false) { // means don't render at all
                el = null;
            }
            else if (custom && custom !== true) {
                el = $(custom);
            }

            return el;
        },


        // Hides all rendered event segments linked to the given event
        showEvent: function (event) {
            this.segEach(function (seg) {
                seg.el.css('visibility', '');
            }, event);
        },


        // Shows all rendered event segments linked to the given event
        hideEvent: function (event) {
            this.segEach(function (seg) {
                seg.el.css('visibility', 'hidden');
            }, event);
        },


        // Iterates through event segments. Goes through all by default.
        // If the optional `event` argument is specified, only iterates through segments linked to that event.
        // The `this` value of the callback function will be the view.
        segEach: function (func, event) {
            var segs = this.getSegs();
            var i;

            for (i = 0; i < segs.length; i++) {
                if (!event || segs[i].event._id === event._id) {
                    func.call(this, segs[i]);
                }
            }
        },


        // Retrieves all the rendered segment objects for the view
        getSegs: function () {
            // subclasses must implement
        },


        /* Event Drag Visualization
        ------------------------------------------------------------------------------------------------------------------*/


        // Renders a visual indication of an event hovering over the specified date.
        // `end` is a Moment and might be null.
        // `seg` might be null. if specified, it is the segment object of the event being dragged.
        //       otherwise, an external event from outside the calendar is being dragged.
        renderDrag: function (start, end, seg) {
            // subclasses should implement
        },


        // Unrenders a visual indication of event hovering
        destroyDrag: function () {
            // subclasses should implement
        },


        // Handler for accepting externally dragged events being dropped in the view.
        // Gets called when jqui's 'dragstart' is fired.
        documentDragStart: function (ev, ui) {
            var _this = this;
            var dropDate = null;
            var dragListener;

            if (this.opt('droppable')) { // only listen if this setting is on

                // listener that tracks mouse movement over date-associated pixel regions
                dragListener = new DragListener(this.coordMap, {
                    cellOver: function (cell, date) {
                        dropDate = date;
                        _this.renderDrag(date);
                    },
                    cellOut: function () {
                        dropDate = null;
                        _this.destroyDrag();
                    }
                });

                // gets called, only once, when jqui drag is finished
                $(document).one('dragstop', function (ev, ui) {
                    _this.destroyDrag();
                    if (dropDate) {
                        _this.trigger('drop', ev.target, dropDate, ev, ui);
                    }
                });

                dragListener.startDrag(ev); // start listening immediately
            }
        },


        /* Selection
        ------------------------------------------------------------------------------------------------------------------*/


        // Selects a date range on the view. `start` and `end` are both Moments.
        // `ev` is the native mouse event that begin the interaction.
        select: function (start, end, ev) {
            this.unselect(ev);
            this.renderSelection(start, end);
            this.reportSelection(start, end, ev);
        },


        // Renders a visual indication of the selection
        renderSelection: function (start, end) {
            // subclasses should implement
        },


        // Called when a new selection is made. Updates internal state and triggers handlers.
        reportSelection: function (start, end, ev) {
            this.isSelected = true;
            this.trigger('select', null, start, end, ev);
        },


        // Undoes a selection. updates in the internal state and triggers handlers.
        // `ev` is the native mouse event that began the interaction.
        unselect: function (ev) {
            if (this.isSelected) {
                this.isSelected = false;
                this.destroySelection();
                this.trigger('unselect', null, ev);
            }
        },


        // Unrenders a visual indication of selection
        destroySelection: function () {
            // subclasses should implement
        },


        // Handler for unselecting when the user clicks something and the 'unselectAuto' setting is on
        documentMousedown: function (ev) {
            var ignore;

            // is there a selection, and has the user made a proper left click?
            if (this.isSelected && this.opt('unselectAuto') && isPrimaryMouseButton(ev)) {

                // only unselect if the clicked element is not identical to or inside of an 'unselectCancel' element
                ignore = this.opt('unselectCancel');
                if (!ignore || !$(ev.target).closest(ignore).length) {
                    this.unselect(ev);
                }
            }
        }

    };


    // We are mixing JavaScript OOP design patterns here by putting methods and member variables in the closed scope of the
    // constructor. Going forward, methods should be part of the prototype.
    function View(calendar) {
        var t = this;

        // exports
        t.calendar = calendar;
        t.opt = opt;
        t.trigger = trigger;
        t.isEventDraggable = isEventDraggable;
        t.isEventResizable = isEventResizable;
        t.eventDrop = eventDrop;
        t.eventResize = eventResize;

        // imports
        var reportEventChange = calendar.reportEventChange;

        // locals
        var options = calendar.options;
        var nextDayThreshold = moment.duration(options.nextDayThreshold);


        t.init(); // the "constructor" that concerns the prototype methods


        function opt(name) {
            var v = options[name];
            if ($.isPlainObject(v) && !isForcedAtomicOption(name)) {
                return smartProperty(v, t.name);
            }
            return v;
        }


        function trigger(name, thisObj) {
            return calendar.trigger.apply(
                calendar,
                [name, thisObj || t].concat(Array.prototype.slice.call(arguments, 2), [t])
            );
        }



        /* Event Editable Boolean Calculations
        ------------------------------------------------------------------------------*/


        function isEventDraggable(event) {
            var source = event.source || {};

            return firstDefined(
                event.startEditable,
                source.startEditable,
                opt('eventStartEditable'),
                event.editable,
                source.editable,
                opt('editable')
            );
        }


        function isEventResizable(event) {
            var source = event.source || {};

            return firstDefined(
                event.durationEditable,
                source.durationEditable,
                opt('eventDurationEditable'),
                event.editable,
                source.editable,
                opt('editable')
            );
        }



        /* Event Elements
        ------------------------------------------------------------------------------*/


        // Compute the text that should be displayed on an event's element.
        // Based off the settings of the view. Possible signatures:
        //   .getEventTimeText(event, formatStr)
        //   .getEventTimeText(startMoment, endMoment, formatStr)
        //   .getEventTimeText(startMoment, null, formatStr)
        // `timeFormat` is used but the `formatStr` argument can be used to override.
        t.getEventTimeText = function (event, formatStr) {
            var start;
            var end;

            if (typeof event === 'object' && typeof formatStr === 'object') {
                // first two arguments are actually moments (or null). shift arguments.
                start = event;
                end = formatStr;
                formatStr = arguments[2];
            }
            else {
                // otherwise, an event object was the first argument
                start = event.start;
                end = event.end;
            }

            formatStr = formatStr || opt('timeFormat');

            if (end && opt('displayEventEnd')) {
                return calendar.formatRange(start, end, formatStr);
            }
            else {
                return calendar.formatDate(start, formatStr);
            }
        };



        /* Event Modification Reporting
        ---------------------------------------------------------------------------------*/


        function eventDrop(el, event, newStart, ev) {
            var mutateResult = calendar.mutateEvent(event, newStart, null);

            trigger(
                'eventDrop',
                el,
                event,
                mutateResult.dateDelta,
                function () {
                    mutateResult.undo();
                    reportEventChange();
                },
                ev,
                {} // jqui dummy
            );

            reportEventChange();
        }


        function eventResize(el, event, newEnd, ev) {
            var mutateResult = calendar.mutateEvent(event, null, newEnd);

            trigger(
                'eventResize',
                el,
                event,
                mutateResult.durationDelta,
                function () {
                    mutateResult.undo();
                    reportEventChange();
                },
                ev,
                {} // jqui dummy
            );

            reportEventChange();
        }


        // ====================================================================================================
        // Utilities for day "cells"
        // ====================================================================================================
        // The "basic" views are completely made up of day cells.
        // The "agenda" views have day cells at the top "all day" slot.
        // This was the obvious common place to put these utilities, but they should be abstracted out into
        // a more meaningful class (like DayEventRenderer).
        // ====================================================================================================


        // For determining how a given "cell" translates into a "date":
        //
        // 1. Convert the "cell" (row and column) into a "cell offset" (the # of the cell, cronologically from the first).
        //    Keep in mind that column indices are inverted with isRTL. This is taken into account.
        //
        // 2. Convert the "cell offset" to a "day offset" (the # of days since the first visible day in the view).
        //
        // 3. Convert the "day offset" into a "date" (a Moment).
        //
        // The reverse transformation happens when transforming a date into a cell.


        // exports
        t.isHiddenDay = isHiddenDay;
        t.skipHiddenDays = skipHiddenDays;
        t.getCellsPerWeek = getCellsPerWeek;
        t.dateToCell = dateToCell;
        t.dateToDayOffset = dateToDayOffset;
        t.dayOffsetToCellOffset = dayOffsetToCellOffset;
        t.cellOffsetToCell = cellOffsetToCell;
        t.cellToDate = cellToDate;
        t.cellToCellOffset = cellToCellOffset;
        t.cellOffsetToDayOffset = cellOffsetToDayOffset;
        t.dayOffsetToDate = dayOffsetToDate;
        t.rangeToSegments = rangeToSegments;
        t.isMultiDayEvent = isMultiDayEvent;


        // internals
        var hiddenDays = opt('hiddenDays') || []; // array of day-of-week indices that are hidden
        var isHiddenDayHash = []; // is the day-of-week hidden? (hash with day-of-week-index -> bool)
        var cellsPerWeek;
        var dayToCellMap = []; // hash from dayIndex -> cellIndex, for one week
        var cellToDayMap = []; // hash from cellIndex -> dayIndex, for one week
        var isRTL = opt('isRTL');


        // initialize important internal variables
        (function () {

            if (opt('weekends') === false) {
                hiddenDays.push(0, 6); // 0=sunday, 6=saturday
            }

            // Loop through a hypothetical week and determine which
            // days-of-week are hidden. Record in both hashes (one is the reverse of the other).
            for (var dayIndex = 0, cellIndex = 0; dayIndex < 7; dayIndex++) {
                dayToCellMap[dayIndex] = cellIndex;
                isHiddenDayHash[dayIndex] = $.inArray(dayIndex, hiddenDays) != -1;
                if (!isHiddenDayHash[dayIndex]) {
                    cellToDayMap[cellIndex] = dayIndex;
                    cellIndex++;
                }
            }

            cellsPerWeek = cellIndex;
            if (!cellsPerWeek) {
                throw 'invalid hiddenDays'; // all days were hidden? bad.
            }

        })();


        // Is the current day hidden?
        // `day` is a day-of-week index (0-6), or a Moment
        function isHiddenDay(day) {
            if (moment.isMoment(day)) {
                day = day.day();
            }
            return isHiddenDayHash[day];
        }


        function getCellsPerWeek() {
            return cellsPerWeek;
        }


        // Incrementing the current day until it is no longer a hidden day, returning a copy.
        // If the initial value of `date` is not a hidden day, don't do anything.
        // Pass `isExclusive` as `true` if you are dealing with an end date.
        // `inc` defaults to `1` (increment one day forward each time)
        function skipHiddenDays(date, inc, isExclusive) {
            var out = date.clone();
            inc = inc || 1;
            while (
                isHiddenDayHash[(out.day() + (isExclusive ? inc : 0) + 7) % 7]
            ) {
                out.add(inc, 'days');
            }
            return out;
        }


        //
        // TRANSFORMATIONS: cell -> cell offset -> day offset -> date
        //

        // cell -> date (combines all transformations)
        // Possible arguments:
        // - row, col
        // - { row:#, col: # }
        function cellToDate() {
            var cellOffset = cellToCellOffset.apply(null, arguments);
            var dayOffset = cellOffsetToDayOffset(cellOffset);
            var date = dayOffsetToDate(dayOffset);
            return date;
        }

        // cell -> cell offset
        // Possible arguments:
        // - row, col
        // - { row:#, col:# }
        function cellToCellOffset(row, col) {
            var colCnt = t.colCnt;

            // rtl variables. wish we could pre-populate these. but where?
            var dis = isRTL ? -1 : 1;
            var dit = isRTL ? colCnt - 1 : 0;

            if (typeof row == 'object') {
                col = row.col;
                row = row.row;
            }
            var cellOffset = row * colCnt + (col * dis + dit); // column, adjusted for RTL (dis & dit)

            return cellOffset;
        }

        // cell offset -> day offset
        function cellOffsetToDayOffset(cellOffset) {
            var day0 = t.start.day(); // first date's day of week
            cellOffset += dayToCellMap[day0]; // normlize cellOffset to beginning-of-week
            return Math.floor(cellOffset / cellsPerWeek) * 7 + // # of days from full weeks
                cellToDayMap[ // # of days from partial last week
                    (cellOffset % cellsPerWeek + cellsPerWeek) % cellsPerWeek // crazy math to handle negative cellOffsets
            ] -
                day0; // adjustment for beginning-of-week normalization
        }

        // day offset -> date
        function dayOffsetToDate(dayOffset) {
            return t.start.clone().add(dayOffset, 'days');
        }


        //
        // TRANSFORMATIONS: date -> day offset -> cell offset -> cell
        //

        // date -> cell (combines all transformations)
        function dateToCell(date) {
            var dayOffset = dateToDayOffset(date);
            var cellOffset = dayOffsetToCellOffset(dayOffset);
            var cell = cellOffsetToCell(cellOffset);
            return cell;
        }

        // date -> day offset
        function dateToDayOffset(date) {
            return date.clone().stripTime().diff(t.start, 'days');
        }

        // day offset -> cell offset
        function dayOffsetToCellOffset(dayOffset) {
            var day0 = t.start.day(); // first date's day of week
            dayOffset += day0; // normalize dayOffset to beginning-of-week
            return Math.floor(dayOffset / 7) * cellsPerWeek + // # of cells from full weeks
                dayToCellMap[ // # of cells from partial last week
                    (dayOffset % 7 + 7) % 7 // crazy math to handle negative dayOffsets
            ] -
                dayToCellMap[day0]; // adjustment for beginning-of-week normalization
        }

        // cell offset -> cell (object with row & col keys)
        function cellOffsetToCell(cellOffset) {
            var colCnt = t.colCnt;

            // rtl variables. wish we could pre-populate these. but where?
            var dis = isRTL ? -1 : 1;
            var dit = isRTL ? colCnt - 1 : 0;

            var row = Math.floor(cellOffset / colCnt);
            var col = ((cellOffset % colCnt + colCnt) % colCnt) * dis + dit; // column, adjusted for RTL (dis & dit)
            return {
                row: row,
                col: col
            };
        }


        //
        // Converts a date range into an array of segment objects.
        // "Segments" are horizontal stretches of time, sliced up by row.
        // A segment object has the following properties:
        // - row
        // - cols
        // - isStart
        // - isEnd
        //
        function rangeToSegments(start, end) {

            var rowCnt = t.rowCnt;
            var colCnt = t.colCnt;
            var segments = []; // array of segments to return

            // day offset for given date range
            var dayRange = computeDayRange(start, end); // convert to a whole-day range
            var rangeDayOffsetStart = dateToDayOffset(dayRange.start);
            var rangeDayOffsetEnd = dateToDayOffset(dayRange.end); // an exclusive value

            // first and last cell offset for the given date range
            // "last" implies inclusivity
            var rangeCellOffsetFirst = dayOffsetToCellOffset(rangeDayOffsetStart);
            var rangeCellOffsetLast = dayOffsetToCellOffset(rangeDayOffsetEnd) - 1;

            // loop through all the rows in the view
            for (var row = 0; row < rowCnt; row++) {

                // first and last cell offset for the row
                var rowCellOffsetFirst = row * colCnt;
                var rowCellOffsetLast = rowCellOffsetFirst + colCnt - 1;

                // get the segment's cell offsets by constraining the range's cell offsets to the bounds of the row
                var segmentCellOffsetFirst = Math.max(rangeCellOffsetFirst, rowCellOffsetFirst);
                var segmentCellOffsetLast = Math.min(rangeCellOffsetLast, rowCellOffsetLast);

                // make sure segment's offsets are valid and in view
                if (segmentCellOffsetFirst <= segmentCellOffsetLast) {

                    // translate to cells
                    var segmentCellFirst = cellOffsetToCell(segmentCellOffsetFirst);
                    var segmentCellLast = cellOffsetToCell(segmentCellOffsetLast);

                    // view might be RTL, so order by leftmost column
                    var cols = [segmentCellFirst.col, segmentCellLast.col].sort();

                    // Determine if segment's first/last cell is the beginning/end of the date range.
                    // We need to compare "day offset" because "cell offsets" are often ambiguous and
                    // can translate to multiple days, and an edge case reveals itself when we the
                    // range's first cell is hidden (we don't want isStart to be true).
                    var isStart = cellOffsetToDayOffset(segmentCellOffsetFirst) == rangeDayOffsetStart;
                    var isEnd = cellOffsetToDayOffset(segmentCellOffsetLast) + 1 == rangeDayOffsetEnd;
                    // +1 for comparing exclusively

                    segments.push({
                        row: row,
                        leftCol: cols[0],
                        rightCol: cols[1],
                        isStart: isStart,
                        isEnd: isEnd
                    });
                }
            }

            return segments;
        }


        // Returns the date range of the full days the given range visually appears to occupy.
        // Returns object with properties `start` (moment) and `end` (moment, exclusive end).
        function computeDayRange(start, end) {
            var startDay = start.clone().stripTime(); // the beginning of the day the range starts
            var endDay;
            var endTimeMS;

            if (end) {
                endDay = end.clone().stripTime(); // the beginning of the day the range exclusively ends
                endTimeMS = +end.time(); // # of milliseconds into `endDay`

                // If the end time is actually inclusively part of the next day and is equal to or
                // beyond the next day threshold, adjust the end to be the exclusive end of `endDay`.
                // Otherwise, leaving it as inclusive will cause it to exclude `endDay`.
                if (endTimeMS && endTimeMS >= nextDayThreshold) {
                    endDay.add(1, 'days');
                }
            }

            // If no end was specified, or if it is within `startDay` but not past nextDayThreshold,
            // assign the default duration of one day.
            if (!end || endDay <= startDay) {
                endDay = startDay.clone().add(1, 'days');
            }

            return { start: startDay, end: endDay };
        }


        // Does the given event visually appear to occupy more than one day?
        function isMultiDayEvent(event) {
            var range = computeDayRange(event.start, event.end);

            return range.end.diff(range.start, 'days') > 1;
        }

    }

    ;;

    /* An abstract class for the "basic" views, as well as month view. Renders one or more rows of day cells.
    ----------------------------------------------------------------------------------------------------------------------*/
    // It is a manager for a DayGrid subcomponent, which does most of the heavy lifting.
    // It is responsible for managing width/height.

    function BasicView(calendar) {
        View.call(this, calendar); // call the super-constructor
        this.dayGrid = new DayGrid(this);
        this.coordMap = this.dayGrid.coordMap; // the view's date-to-cell mapping is identical to the subcomponent's
    }


    BasicView.prototype = createObject(View.prototype); // define the super-class
    $.extend(BasicView.prototype, {

        dayGrid: null, // the main subcomponent that does most of the heavy lifting

        dayNumbersVisible: false, // display day numbers on each day cell?
        weekNumbersVisible: false, // display week numbers along the side?

        weekNumberWidth: null, // width of all the week-number cells running down the side

        headRowEl: null, // the fake row element of the day-of-week header


        // Renders the view into `this.el`, which should already be assigned.
        // rowCnt, colCnt, and dayNumbersVisible have been calculated by a subclass and passed here.
        render: function (rowCnt, colCnt, dayNumbersVisible) {

            // needed for cell-to-date and date-to-cell calculations in View
            this.rowCnt = rowCnt;
            this.colCnt = colCnt;

            this.dayNumbersVisible = dayNumbersVisible;
            this.weekNumbersVisible = this.opt('weekNumbers');
            this.dayGrid.numbersVisible = this.dayNumbersVisible || this.weekNumbersVisible;

            this.el.addClass('fc-basic-view').html(this.renderHtml());

            this.headRowEl = this.el.find('thead .fc-row');

            this.scrollerEl = this.el.find('.fc-day-grid-container');
            this.dayGrid.coordMap.containerEl = this.scrollerEl; // constrain clicks/etc to the dimensions of the scroller

            this.dayGrid.el = this.el.find('.fc-day-grid');
            this.dayGrid.render(this.hasRigidRows());

            View.prototype.render.call(this); // call the super-method
        },


        // Make subcomponents ready for cleanup
        destroy: function () {
            this.dayGrid.destroy();
            View.prototype.destroy.call(this); // call the super-method
        },


        // Builds the HTML skeleton for the view.
        // The day-grid component will render inside of a container defined by this HTML.
        renderHtml: function () {
            return '' +
                '<table>' +
                    '<thead>' +
                        '<tr>' +
                            '<td class="' + this.widgetHeaderClass + '">' +
                                this.dayGrid.headHtml() + // render the day-of-week headers
                            '</td>' +
                        '</tr>' +
                    '</thead>' +
                    '<tbody>' +
                        '<tr>' +
                            '<td class="' + this.widgetContentClass + '">' +
                                '<div class="fc-day-grid-container">' +
                                    '<div class="fc-day-grid"/>' +
                                '</div>' +
                            '</td>' +
                        '</tr>' +
                    '</tbody>' +
                '</table>';
        },


        // Generates the HTML that will go before the day-of week header cells.
        // Queried by the DayGrid subcomponent when generating rows. Ordering depends on isRTL.
        headIntroHtml: function () {
            if (this.weekNumbersVisible) {
                return '' +
                    '<th class="fc-week-number ' + this.widgetHeaderClass + '" ' + this.weekNumberStyleAttr() + '>' +
                        '<span>' + // needed for matchCellWidths
                            htmlEscape(this.opt('weekNumberTitle')) +
                        '</span>' +
                    '</th>';
            }
        },


        // Generates the HTML that will go before content-skeleton cells that display the day/week numbers.
        // Queried by the DayGrid subcomponent. Ordering depends on isRTL.
        numberIntroHtml: function (row) {
            if (this.weekNumbersVisible) {
                return '' +
                    '<td class="fc-week-number" ' + this.weekNumberStyleAttr() + '>' +
                        '<span>' + // needed for matchCellWidths
                            this.calendar.calculateWeekNumber(this.cellToDate(row, 0)) +
                        '</span>' +
                    '</td>';
            }
        },


        // Generates the HTML that goes before the day bg cells for each day-row.
        // Queried by the DayGrid subcomponent. Ordering depends on isRTL.
        dayIntroHtml: function () {
            if (this.weekNumbersVisible) {
                return '<td class="fc-week-number ' + this.widgetContentClass + '" ' +
                    this.weekNumberStyleAttr() + '></td>';
            }
        },


        // Generates the HTML that goes before every other type of row generated by DayGrid. Ordering depends on isRTL.
        // Affects helper-skeleton and highlight-skeleton rows.
        introHtml: function () {
            if (this.weekNumbersVisible) {
                return '<td class="fc-week-number" ' + this.weekNumberStyleAttr() + '></td>';
            }
        },


        // Generates the HTML for the <td>s of the "number" row in the DayGrid's content skeleton.
        // The number row will only exist if either day numbers or week numbers are turned on.
        numberCellHtml: function (row, col, date) {
            var classes;

            if (!this.dayNumbersVisible) { // if there are week numbers but not day numbers
                return '<td/>'; //  will create an empty space above events :(
            }

            classes = this.dayGrid.getDayClasses(date);
            classes.unshift('fc-day-number');

            return '' +
                '<td class="' + classes.join(' ') + '" data-date="' + date.format() + '">' +
                    date.date() +
                '</td>';
        },


        // Generates an HTML attribute string for setting the width of the week number column, if it is known
        weekNumberStyleAttr: function () {
            if (this.weekNumberWidth !== null) {
                return 'style="width:' + this.weekNumberWidth + 'px"';
            }
            return '';
        },


        // Determines whether each row should have a constant height
        hasRigidRows: function () {
            var eventLimit = this.opt('eventLimit');
            return eventLimit && typeof eventLimit !== 'number';
        },


        /* Dimensions
        ------------------------------------------------------------------------------------------------------------------*/


        // Refreshes the horizontal dimensions of the view
        updateWidth: function () {
            if (this.weekNumbersVisible) {
                // Make sure all week number cells running down the side have the same width.
                // Record the width for cells created later.
                this.weekNumberWidth = matchCellWidths(
                    this.el.find('.fc-week-number')
                );
            }
        },


        // Adjusts the vertical dimensions of the view to the specified values
        setHeight: function (totalHeight, isAuto) {
            var eventLimit = this.opt('eventLimit');
            var scrollerHeight;

            // reset all heights to be natural
            unsetScroller(this.scrollerEl);
            uncompensateScroll(this.headRowEl);

            this.dayGrid.destroySegPopover(); // kill the "more" popover if displayed

            // is the event limit a constant level number?
            if (eventLimit && typeof eventLimit === 'number') {
                this.dayGrid.limitRows(eventLimit); // limit the levels first so the height can redistribute after
            }

            scrollerHeight = this.computeScrollerHeight(totalHeight);
            this.setGridHeight(scrollerHeight, isAuto);

            // is the event limit dynamically calculated?
            if (eventLimit && typeof eventLimit !== 'number') {
                this.dayGrid.limitRows(eventLimit); // limit the levels after the grid's row heights have been set
            }

            if (!isAuto && setPotentialScroller(this.scrollerEl, scrollerHeight)) { // using scrollbars?

                compensateScroll(this.headRowEl, getScrollbarWidths(this.scrollerEl));

                // doing the scrollbar compensation might have created text overflow which created more height. redo
                scrollerHeight = this.computeScrollerHeight(totalHeight);
                this.scrollerEl.height(scrollerHeight);

                this.restoreScroll();
            }
        },


        // Sets the height of just the DayGrid component in this view
        setGridHeight: function (height, isAuto) {
            if (isAuto) {
                undistributeHeight(this.dayGrid.rowEls); // let the rows be their natural height with no expanding
            }
            else {
                distributeHeight(this.dayGrid.rowEls, height, true); // true = compensate for height-hogging rows
            }
        },


        /* Events
        ------------------------------------------------------------------------------------------------------------------*/


        // Renders the given events onto the view and populates the segments array
        renderEvents: function (events) {
            this.dayGrid.renderEvents(events);

            this.updateHeight(); // must compensate for events that overflow the row

            View.prototype.renderEvents.call(this, events); // call the super-method
        },


        // Retrieves all segment objects that are rendered in the view
        getSegs: function () {
            return this.dayGrid.getSegs();
        },


        // Unrenders all event elements and clears internal segment data
        destroyEvents: function () {
            View.prototype.destroyEvents.call(this); // do this before dayGrid's segs have been cleared

            this.recordScroll(); // removing events will reduce height and mess with the scroll, so record beforehand
            this.dayGrid.destroyEvents();

            // we DON'T need to call updateHeight() because:
            // A) a renderEvents() call always happens after this, which will eventually call updateHeight()
            // B) in IE8, this causes a flash whenever events are rerendered
        },


        /* Event Dragging
        ------------------------------------------------------------------------------------------------------------------*/


        // Renders a visual indication of an event being dragged over the view.
        // A returned value of `true` signals that a mock "helper" event has been rendered.
        renderDrag: function (start, end, seg) {
            return this.dayGrid.renderDrag(start, end, seg);
        },


        // Unrenders the visual indication of an event being dragged over the view
        destroyDrag: function () {
            this.dayGrid.destroyDrag();
        },


        /* Selection
        ------------------------------------------------------------------------------------------------------------------*/


        // Renders a visual indication of a selection
        renderSelection: function (start, end) {
            this.dayGrid.renderSelection(start, end);
        },


        // Unrenders a visual indications of a selection
        destroySelection: function () {
            this.dayGrid.destroySelection();
        }

    });

    ;;

    /* A month view with day cells running in rows (one-per-week) and columns
    ----------------------------------------------------------------------------------------------------------------------*/

    setDefaults({
        fixedWeekCount: true
    });

    fcViews.month = MonthView; // register the view

    function MonthView(calendar) {
        BasicView.call(this, calendar); // call the super-constructor
    }


    MonthView.prototype = createObject(BasicView.prototype); // define the super-class
    $.extend(MonthView.prototype, {

        name: 'month',


        incrementDate: function (date, delta) {
            return date.clone().stripTime().add(delta, 'months').startOf('month');
        },


        render: function (date) {
            var rowCnt;

            this.intervalStart = date.clone().stripTime().startOf('month');
            this.intervalEnd = this.intervalStart.clone().add(1, 'months');

            this.start = this.intervalStart.clone();
            this.start = this.skipHiddenDays(this.start); // move past the first week if no visible days
            this.start.startOf('week');
            this.start = this.skipHiddenDays(this.start); // move past the first invisible days of the week

            this.end = this.intervalEnd.clone();
            this.end = this.skipHiddenDays(this.end, -1, true); // move in from the last week if no visible days
            this.end.add((7 - this.end.weekday()) % 7, 'days'); // move to end of week if not already
            this.end = this.skipHiddenDays(this.end, -1, true); // move in from the last invisible days of the week

            rowCnt = Math.ceil( // need to ceil in case there are hidden days
                this.end.diff(this.start, 'weeks', true) // returnfloat=true
            );
            if (this.isFixedWeeks()) {
                this.end.add(6 - rowCnt, 'weeks');
                rowCnt = 6;
            }

            this.title = this.calendar.formatDate(this.intervalStart, this.opt('titleFormat'));

            BasicView.prototype.render.call(this, rowCnt, this.getCellsPerWeek(), true); // call the super-method
        },


        // Overrides the default BasicView behavior to have special multi-week auto-height logic
        setGridHeight: function (height, isAuto) {

            isAuto = isAuto || this.opt('weekMode') === 'variable'; // LEGACY: weekMode is deprecated

            // if auto, make the height of each row the height that it would be if there were 6 weeks
            if (isAuto) {
                height *= this.rowCnt / 6;
            }

            distributeHeight(this.dayGrid.rowEls, height, !isAuto); // if auto, don't compensate for height-hogging rows
        },


        isFixedWeeks: function () {
            var weekMode = this.opt('weekMode'); // LEGACY: weekMode is deprecated
            if (weekMode) {
                return weekMode === 'fixed'; // if any other type of weekMode, assume NOT fixed
            }

            return this.opt('fixedWeekCount');
        }

    });

    ;;

    /* A week view with simple day cells running horizontally
    ----------------------------------------------------------------------------------------------------------------------*/
    // TODO: a WeekView mixin for calculating dates and titles

    fcViews.basicWeek = BasicWeekView; // register this view

    function BasicWeekView(calendar) {
        BasicView.call(this, calendar); // call the super-constructor
    }


    BasicWeekView.prototype = createObject(BasicView.prototype); // define the super-class
    $.extend(BasicWeekView.prototype, {

        name: 'basicWeek',


        incrementDate: function (date, delta) {
            return date.clone().stripTime().add(delta, 'weeks').startOf('week');
        },


        render: function (date) {

            this.intervalStart = date.clone().stripTime().startOf('week');
            this.intervalEnd = this.intervalStart.clone().add(1, 'weeks');

            this.start = this.skipHiddenDays(this.intervalStart);
            this.end = this.skipHiddenDays(this.intervalEnd, -1, true);

            this.title = this.calendar.formatRange(
                this.start,
                this.end.clone().subtract(1), // make inclusive by subtracting 1 ms
                this.opt('titleFormat'),
                ' \u2014 ' // emphasized dash
            );

            BasicView.prototype.render.call(this, 1, this.getCellsPerWeek(), false); // call the super-method
        }

    });
    ;;

    /* A view with a single simple day cell
    ----------------------------------------------------------------------------------------------------------------------*/

    fcViews.basicDay = BasicDayView; // register this view

    function BasicDayView(calendar) {
        BasicView.call(this, calendar); // call the super-constructor
    }


    BasicDayView.prototype = createObject(BasicView.prototype); // define the super-class
    $.extend(BasicDayView.prototype, {

        name: 'basicDay',


        incrementDate: function (date, delta) {
            var out = date.clone().stripTime().add(delta, 'days');
            out = this.skipHiddenDays(out, delta < 0 ? -1 : 1);
            return out;
        },


        render: function (date) {

            this.start = this.intervalStart = date.clone().stripTime();
            this.end = this.intervalEnd = this.start.clone().add(1, 'days');

            this.title = this.calendar.formatDate(this.start, this.opt('titleFormat'));

            BasicView.prototype.render.call(this, 1, 1, false); // call the super-method
        }

    });
    ;;

    /* An abstract class for all agenda-related views. Displays one more columns with time slots running vertically.
    ----------------------------------------------------------------------------------------------------------------------*/
    // Is a manager for the TimeGrid subcomponent and possibly the DayGrid subcomponent (if allDaySlot is on).
    // Responsible for managing width/height.

    setDefaults({
        allDaySlot: true,
        allDayText: 'all-day',

        scrollTime: '06:00:00',

        slotDuration: '00:30:00',

        axisFormat: generateAgendaAxisFormat,
        timeFormat: {
            agenda: generateAgendaTimeFormat
        },

        minTime: '00:00:00',
        maxTime: '24:00:00',
        slotEventOverlap: true
    });

    var AGENDA_ALL_DAY_EVENT_LIMIT = 5;


    function generateAgendaAxisFormat(options, langData) {
        return langData.longDateFormat('LT')
            .replace(':mm', '(:mm)')
            .replace(/(\Wmm)$/, '($1)') // like above, but for foreign langs
            .replace(/\s*a$/i, 'a'); // convert AM/PM/am/pm to lowercase. remove any spaces beforehand
    }


    function generateAgendaTimeFormat(options, langData) {
        return langData.longDateFormat('LT')
            .replace(/\s*a$/i, ''); // remove trailing AM/PM
    }


    function AgendaView(calendar) {
        View.call(this, calendar); // call the super-constructor

        this.timeGrid = new TimeGrid(this);

        if (this.opt('allDaySlot')) { // should we display the "all-day" area?
            this.dayGrid = new DayGrid(this); // the all-day subcomponent of this view

            // the coordinate grid will be a combination of both subcomponents' grids
            this.coordMap = new ComboCoordMap([
                this.dayGrid.coordMap,
                this.timeGrid.coordMap
            ]);
        }
        else {
            this.coordMap = this.timeGrid.coordMap;
        }
    }


    AgendaView.prototype = createObject(View.prototype); // define the super-class
    $.extend(AgendaView.prototype, {

        timeGrid: null, // the main time-grid subcomponent of this view
        dayGrid: null, // the "all-day" subcomponent. if all-day is turned off, this will be null

        axisWidth: null, // the width of the time axis running down the side

        noScrollRowEls: null, // set of fake row elements that must compensate when scrollerEl has scrollbars

        // when the time-grid isn't tall enough to occupy the given height, we render an <hr> underneath
        bottomRuleEl: null,
        bottomRuleHeight: null,


        /* Rendering
        ------------------------------------------------------------------------------------------------------------------*/


        // Renders the view into `this.el`, which has already been assigned.
        // `colCnt` has been calculated by a subclass and passed here.
        render: function (colCnt) {

            // needed for cell-to-date and date-to-cell calculations in View
            this.rowCnt = 1;
            this.colCnt = colCnt;

            this.el.addClass('fc-agenda-view').html(this.renderHtml());

            // the element that wraps the time-grid that will probably scroll
            this.scrollerEl = this.el.find('.fc-time-grid-container');
            this.timeGrid.coordMap.containerEl = this.scrollerEl; // don't accept clicks/etc outside of this

            this.timeGrid.el = this.el.find('.fc-time-grid');
            this.timeGrid.render();

            // the <hr> that sometimes displays under the time-grid
            this.bottomRuleEl = $('<hr class="' + this.widgetHeaderClass + '"/>')
                .appendTo(this.timeGrid.el); // inject it into the time-grid

            if (this.dayGrid) {
                this.dayGrid.el = this.el.find('.fc-day-grid');
                this.dayGrid.render();

                // have the day-grid extend it's coordinate area over the <hr> dividing the two grids
                this.dayGrid.bottomCoordPadding = this.dayGrid.el.next('hr').outerHeight();
            }

            this.noScrollRowEls = this.el.find('.fc-row:not(.fc-scroller *)'); // fake rows not within the scroller

            View.prototype.render.call(this); // call the super-method

            this.resetScroll(); // do this after sizes have been set
        },


        // Make subcomponents ready for cleanup
        destroy: function () {
            this.timeGrid.destroy();
            if (this.dayGrid) {
                this.dayGrid.destroy();
            }
            View.prototype.destroy.call(this); // call the super-method
        },


        // Builds the HTML skeleton for the view.
        // The day-grid and time-grid components will render inside containers defined by this HTML.
        renderHtml: function () {
            return '' +
                '<table>' +
                    '<thead>' +
                        '<tr>' +
                            '<td class="' + this.widgetHeaderClass + '">' +
                                this.timeGrid.headHtml() + // render the day-of-week headers
                            '</td>' +
                        '</tr>' +
                    '</thead>' +
                    '<tbody>' +
                        '<tr>' +
                            '<td class="' + this.widgetContentClass + '">' +
                                (this.dayGrid ?
                                    '<div class="fc-day-grid"/>' +
                                    '<hr class="' + this.widgetHeaderClass + '"/>' :
                                    ''
                                    ) +
                                '<div class="fc-time-grid-container">' +
                                    '<div class="fc-time-grid"/>' +
                                '</div>' +
                            '</td>' +
                        '</tr>' +
                    '</tbody>' +
                '</table>';
        },


        // Generates the HTML that will go before the day-of week header cells.
        // Queried by the TimeGrid subcomponent when generating rows. Ordering depends on isRTL.
        headIntroHtml: function () {
            var date;
            var weekNumber;
            var weekTitle;
            var weekText;

            if (this.opt('weekNumbers')) {
                date = this.cellToDate(0, 0);
                weekNumber = this.calendar.calculateWeekNumber(date);
                weekTitle = this.opt('weekNumberTitle');

                if (this.opt('isRTL')) {
                    weekText = weekNumber + weekTitle;
                }
                else {
                    weekText = weekTitle + weekNumber;
                }

                return '' +
                    '<th class="fc-axis fc-week-number ' + this.widgetHeaderClass + '" ' + this.axisStyleAttr() + '>' +
                        '<span>' + // needed for matchCellWidths
                            htmlEscape(weekText) +
                        '</span>' +
                    '</th>';
            }
            else {
                return '<th class="fc-axis ' + this.widgetHeaderClass + '" ' + this.axisStyleAttr() + '></th>';
            }
        },


        // Generates the HTML that goes before the all-day cells.
        // Queried by the DayGrid subcomponent when generating rows. Ordering depends on isRTL.
        dayIntroHtml: function () {
            return '' +
                '<td class="fc-axis ' + this.widgetContentClass + '" ' + this.axisStyleAttr() + '>' +
                    '<span>' + // needed for matchCellWidths
                        (this.opt('allDayHtml') || htmlEscape(this.opt('allDayText'))) +
                    '</span>' +
                '</td>';
        },


        // Generates the HTML that goes before the bg of the TimeGrid slot area. Long vertical column.
        slotBgIntroHtml: function () {
            return '<td class="fc-axis ' + this.widgetContentClass + '" ' + this.axisStyleAttr() + '></td>';
        },


        // Generates the HTML that goes before all other types of cells.
        // Affects content-skeleton, helper-skeleton, highlight-skeleton for both the time-grid and day-grid.
        // Queried by the TimeGrid and DayGrid subcomponents when generating rows. Ordering depends on isRTL.
        introHtml: function () {
            return '<td class="fc-axis" ' + this.axisStyleAttr() + '></td>';
        },


        // Generates an HTML attribute string for setting the width of the axis, if it is known
        axisStyleAttr: function () {
            if (this.axisWidth !== null) {
                return 'style="width:' + this.axisWidth + 'px"';
            }
            return '';
        },


        /* Dimensions
        ------------------------------------------------------------------------------------------------------------------*/

        updateSize: function (isResize) {
            if (isResize) {
                this.timeGrid.resize();
            }
            View.prototype.updateSize.call(this, isResize);
        },


        // Refreshes the horizontal dimensions of the view
        updateWidth: function () {
            // make all axis cells line up, and record the width so newly created axis cells will have it
            this.axisWidth = matchCellWidths(this.el.find('.fc-axis'));
        },


        // Adjusts the vertical dimensions of the view to the specified values
        setHeight: function (totalHeight, isAuto) {
            var eventLimit;
            var scrollerHeight;

            if (this.bottomRuleHeight === null) {
                // calculate the height of the rule the very first time
                this.bottomRuleHeight = this.bottomRuleEl.outerHeight();
            }
            this.bottomRuleEl.hide(); // .show() will be called later if this <hr> is necessary

            // reset all dimensions back to the original state
            this.scrollerEl.css('overflow', '');
            unsetScroller(this.scrollerEl);
            uncompensateScroll(this.noScrollRowEls);

            // limit number of events in the all-day area
            if (this.dayGrid) {
                this.dayGrid.destroySegPopover(); // kill the "more" popover if displayed

                eventLimit = this.opt('eventLimit');
                if (eventLimit && typeof eventLimit !== 'number') {
                    eventLimit = AGENDA_ALL_DAY_EVENT_LIMIT; // make sure "auto" goes to a real number
                }
                if (eventLimit) {
                    this.dayGrid.limitRows(eventLimit);
                }
            }

            if (!isAuto) { // should we force dimensions of the scroll container, or let the contents be natural height?

                scrollerHeight = this.computeScrollerHeight(totalHeight);
                if (setPotentialScroller(this.scrollerEl, scrollerHeight)) { // using scrollbars?

                    // make the all-day and header rows lines up
                    compensateScroll(this.noScrollRowEls, getScrollbarWidths(this.scrollerEl));

                    // the scrollbar compensation might have changed text flow, which might affect height, so recalculate
                    // and reapply the desired height to the scroller.
                    scrollerHeight = this.computeScrollerHeight(totalHeight);
                    this.scrollerEl.height(scrollerHeight);

                    this.restoreScroll();
                }
                else { // no scrollbars
                    // still, force a height and display the bottom rule (marks the end of day)
                    this.scrollerEl.height(scrollerHeight).css('overflow', 'hidden'); // in case <hr> goes outside
                    this.bottomRuleEl.show();
                }
            }
        },


        // Sets the scroll value of the scroller to the intial pre-configured state prior to allowing the user to change it.
        resetScroll: function () {
            var _this = this;
            var scrollTime = moment.duration(this.opt('scrollTime'));
            var top = this.timeGrid.computeTimeTop(scrollTime);

            // zoom can give weird floating-point values. rather scroll a little bit further
            top = Math.ceil(top);

            if (top) {
                top++; // to overcome top border that slots beyond the first have. looks better
            }

            function scroll() {
                _this.scrollerEl.scrollTop(top);
            }

            scroll();
            setTimeout(scroll, 0); // overrides any previous scroll state made by the browser
        },


        /* Events
        ------------------------------------------------------------------------------------------------------------------*/


        // Renders events onto the view and populates the View's segment array
        renderEvents: function (events) {
            var dayEvents = [];
            var timedEvents = [];
            var daySegs = [];
            var timedSegs;
            var i;

            // separate the events into all-day and timed
            for (i = 0; i < events.length; i++) {
                if (events[i].allDay) {
                    dayEvents.push(events[i]);
                }
                else {
                    timedEvents.push(events[i]);
                }
            }

            // render the events in the subcomponents
            timedSegs = this.timeGrid.renderEvents(timedEvents);
            if (this.dayGrid) {
                daySegs = this.dayGrid.renderEvents(dayEvents);
            }

            // the all-day area is flexible and might have a lot of events, so shift the height
            this.updateHeight();

            View.prototype.renderEvents.call(this, events); // call the super-method
        },


        // Retrieves all segment objects that are rendered in the view
        getSegs: function () {
            return this.timeGrid.getSegs().concat(
                this.dayGrid ? this.dayGrid.getSegs() : []
            );
        },


        // Unrenders all event elements and clears internal segment data
        destroyEvents: function () {
            View.prototype.destroyEvents.call(this); // do this before the grids' segs have been cleared

            // if destroyEvents is being called as part of an event rerender, renderEvents will be called shortly
            // after, so remember what the scroll value was so we can restore it.
            this.recordScroll();

            // destroy the events in the subcomponents
            this.timeGrid.destroyEvents();
            if (this.dayGrid) {
                this.dayGrid.destroyEvents();
            }

            // we DON'T need to call updateHeight() because:
            // A) a renderEvents() call always happens after this, which will eventually call updateHeight()
            // B) in IE8, this causes a flash whenever events are rerendered
        },


        /* Event Dragging
        ------------------------------------------------------------------------------------------------------------------*/


        // Renders a visual indication of an event being dragged over the view.
        // A returned value of `true` signals that a mock "helper" event has been rendered.
        renderDrag: function (start, end, seg) {
            if (start.hasTime()) {
                return this.timeGrid.renderDrag(start, end, seg);
            }
            else if (this.dayGrid) {
                return this.dayGrid.renderDrag(start, end, seg);
            }
        },


        // Unrenders a visual indications of an event being dragged over the view
        destroyDrag: function () {
            this.timeGrid.destroyDrag();
            if (this.dayGrid) {
                this.dayGrid.destroyDrag();
            }
        },


        /* Selection
        ------------------------------------------------------------------------------------------------------------------*/


        // Renders a visual indication of a selection
        renderSelection: function (start, end) {
            if (start.hasTime() || end.hasTime()) {
                this.timeGrid.renderSelection(start, end);
            }
            else if (this.dayGrid) {
                this.dayGrid.renderSelection(start, end);
            }
        },


        // Unrenders a visual indications of a selection
        destroySelection: function () {
            this.timeGrid.destroySelection();
            if (this.dayGrid) {
                this.dayGrid.destroySelection();
            }
        }

    });

    ;;

    /* A week view with an all-day cell area at the top, and a time grid below
    ----------------------------------------------------------------------------------------------------------------------*/
    // TODO: a WeekView mixin for calculating dates and titles

    fcViews.agendaWeek = AgendaWeekView; // register the view

    function AgendaWeekView(calendar) {
        AgendaView.call(this, calendar); // call the super-constructor
    }


    AgendaWeekView.prototype = createObject(AgendaView.prototype); // define the super-class
    $.extend(AgendaWeekView.prototype, {

        name: 'agendaWeek',


        incrementDate: function (date, delta) {
            return date.clone().stripTime().add(delta, 'weeks').startOf('week');
        },


        render: function (date) {

            this.intervalStart = date.clone().stripTime().startOf('week');
            this.intervalEnd = this.intervalStart.clone().add(1, 'weeks');

            this.start = this.skipHiddenDays(this.intervalStart);
            this.end = this.skipHiddenDays(this.intervalEnd, -1, true);

            this.title = this.calendar.formatRange(
                this.start,
                this.end.clone().subtract(1), // make inclusive by subtracting 1 ms
                this.opt('titleFormat'),
                ' \u2014 ' // emphasized dash
            );

            AgendaView.prototype.render.call(this, this.getCellsPerWeek()); // call the super-method
        }

    });

    ;;

    /* A day view with an all-day cell area at the top, and a time grid below
    ----------------------------------------------------------------------------------------------------------------------*/

    fcViews.agendaDay = AgendaDayView; // register the view

    function AgendaDayView(calendar) {
        AgendaView.call(this, calendar); // call the super-constructor
    }


    AgendaDayView.prototype = createObject(AgendaView.prototype); // define the super-class
    $.extend(AgendaDayView.prototype, {

        name: 'agendaDay',


        incrementDate: function (date, delta) {
            var out = date.clone().stripTime().add(delta, 'days');
            out = this.skipHiddenDays(out, delta < 0 ? -1 : 1);
            return out;
        },


        render: function (date) {

            this.start = this.intervalStart = date.clone().stripTime();
            this.end = this.intervalEnd = this.start.clone().add(1, 'days');

            this.title = this.calendar.formatDate(this.start, this.opt('titleFormat'));

            AgendaView.prototype.render.call(this, 1); // call the super-method
        }

    });

    ;;

});

/*!
 * FullCalendar v2.1.1
 * Docs & License: http://arshaw.com/fullcalendar/
 * (c) 2013 Adam Shaw
 */
(function (t) { "function" == typeof define && define.amd ? define(["jquery", "moment"], t) : t(jQuery, moment) })(function (t, e) {
    function i(t, e) { return e.longDateFormat("LT").replace(":mm", "(:mm)").replace(/(\Wmm)$/, "($1)").replace(/\s*a$/i, "t") } function n(t, e) { var i = e.longDateFormat("L"); return i = i.replace(/^Y+[^\w\s]*|[^\w\s]*Y+$/g, ""), t.isRTL ? i += " ddd" : i = "ddd " + i, i } function r(t) { o(De, t) } function o(e) { function i(i, n) { t.isPlainObject(n) && t.isPlainObject(e[i]) && !s(i) ? e[i] = o({}, e[i], n) : void 0 !== n && (e[i] = n) } for (var n = 1; arguments.length > n; n++) t.each(arguments[n], i); return e } function s(t) { return /(Time|Duration)$/.test(t) } function l(i, n) { function r(t) { var i = e.localeData || e.langData; return i.call(e, t) || i.call(e, "en") } function s(t) { ie ? h() && (p(), f(t)) : l() } function l() { ne = K.theme ? "ui" : "fc", i.addClass("fc"), K.isRTL ? i.addClass("fc-rtl") : i.addClass("fc-ltr"), K.theme ? i.addClass("ui-widget") : i.addClass("fc-unthemed"), ie = t("<div class='fc-view-container'/>").prependTo(i), te = new a(q, K), ee = te.render(), ee && i.prepend(ee), u(K.defaultView), K.handleWindowResize && (se = L(v, K.windowResizeDelay), t(window).resize(se)) } function d() { re && re.destroy(), te.destroy(), ie.remove(), i.removeClass("fc fc-ltr fc-rtl fc-unthemed ui-widget"), t(window).unbind("resize", se) } function h() { return i.is(":visible") } function u(t) { f(0, t) } function f(e, i) { he++, re && i && re.name !== i && (te.deactivateButton(re.name), I(), re.start && re.destroy(), re.el.remove(), re = null), !re && i && (re = new xe[i](q), re.el = t("<div class='fc-view fc-" + i + "-view' />").appendTo(ie), te.activateButton(i)), re && (e && (le = re.incrementDate(le, e)), re.start && !e && le.isWithin(re.intervalStart, re.intervalEnd) || h() && (I(), re.start && re.destroy(), re.render(le), Z(), C(), x(), b())), Z(), he-- } function g(t) { return h() ? (t && m(), he++, re.updateSize(!0), he--, !0) : void 0 } function p() { h() && m() } function m() { oe = "number" == typeof K.contentHeight ? K.contentHeight : "number" == typeof K.height ? K.height - (ee ? ee.outerHeight(!0) : 0) : Math.round(ie.width() / Math.max(K.aspectRatio, .5)) } function v(t) { !he && t.target === window && re.start && g(!0) && re.trigger("windowResize", de) } function y() { E(), S() } function w() { h() && (I(), re.destroyEvents(), re.renderEvents(ue), Z()) } function E() { I(), re.destroyEvents(), Z() } function b() { !K.lazyFetching || ae(re.start, re.end) ? S() : w() } function S() { ce(re.start, re.end) } function D(t) { ue = t, w() } function T() { w() } function C() { te.updateTitle(re.title) } function x() { var t = q.getNow(); t.isWithin(re.intervalStart, re.intervalEnd) ? te.disableButton("today") : te.enableButton("today") } function k(t, e) { t = q.moment(t), e = e ? q.moment(e) : t.hasTime() ? t.clone().add(q.defaultTimedEventDuration) : t.clone().add(q.defaultAllDayEventDuration), re.select(t, e) } function M() { re && re.unselect() } function R() { f(-1) } function P() { f(1) } function G() { le.add(-1, "years"), f() } function N() { le.add(1, "years"), f() } function Y() { le = q.getNow(), f() } function A(t) { le = q.moment(t), f() } function _(t) { le.add(e.duration(t)), f() } function O(t, e) { var i, n; e && void 0 !== xe[e] || (e = e || "day", i = te.getViewsWithButtons().join(" "), n = i.match(RegExp("\\w+" + z(e))), n || (n = i.match(/\w+Day/)), e = n ? n[0] : "agendaDay"), le = t, u(e) } function F() { return le.clone() } function I() { ie.css({ width: "100%", height: ie.height(), overflow: "hidden" }) } function Z() { ie.css({ width: "", height: "", overflow: "" }) } function B() { return q } function j() { return re } function X(t, e) { return void 0 === e ? K[t] : (("height" == t || "contentHeight" == t || "aspectRatio" == t) && (K[t] = e, g(!0)), void 0) } function $(t, e) { return K[t] ? K[t].apply(e || de, Array.prototype.slice.call(arguments, 2)) : void 0 } var q = this; n = n || {}; var U, K = o({}, De, n); U = K.lang in Te ? Te[K.lang] : Te[De.lang], U && (K = o({}, De, U, n)), K.isRTL && (K = o({}, De, Ce, U || {}, n)), q.options = K, q.render = s, q.destroy = d, q.refetchEvents = y, q.reportEvents = D, q.reportEventChange = T, q.rerenderEvents = w, q.changeView = u, q.select = k, q.unselect = M, q.prev = R, q.next = P, q.prevYear = G, q.nextYear = N, q.today = Y, q.gotoDate = A, q.incrementDate = _, q.zoomTo = O, q.getDate = F, q.getCalendar = B, q.getView = j, q.option = X, q.trigger = $; var Q = H(r(K.lang)); if (K.monthNames && (Q._months = K.monthNames), K.monthNamesShort && (Q._monthsShort = K.monthNamesShort), K.dayNames && (Q._weekdays = K.dayNames), K.dayNamesShort && (Q._weekdaysShort = K.dayNamesShort), null != K.firstDay) { var J = H(Q._week); J.dow = K.firstDay, Q._week = J } q.defaultAllDayEventDuration = e.duration(K.defaultAllDayEventDuration), q.defaultTimedEventDuration = e.duration(K.defaultTimedEventDuration), q.moment = function () { var t; return "local" === K.timezone ? (t = He.moment.apply(null, arguments), t.hasTime() && t.local()) : t = "UTC" === K.timezone ? He.moment.utc.apply(null, arguments) : He.moment.parseZone.apply(null, arguments), "_locale" in t ? t._locale = Q : t._lang = Q, t }, q.getIsAmbigTimezone = function () { return "local" !== K.timezone && "UTC" !== K.timezone }, q.rezoneDate = function (t) { return q.moment(t.toArray()) }, q.getNow = function () { var t = K.now; return "function" == typeof t && (t = t()), q.moment(t) }, q.calculateWeekNumber = function (t) { var e = K.weekNumberCalculation; return "function" == typeof e ? e(t) : "local" === e ? t.week() : "ISO" === e.toUpperCase() ? t.isoWeek() : void 0 }, q.getEventEnd = function (t) { return t.end ? t.end.clone() : q.getDefaultEventEnd(t.allDay, t.start) }, q.getDefaultEventEnd = function (t, e) { var i = e.clone(); return t ? i.stripTime().add(q.defaultAllDayEventDuration) : i.add(q.defaultTimedEventDuration), q.getIsAmbigTimezone() && i.stripZone(), i }, q.formatRange = function (t, e, i) { return "function" == typeof i && (i = i.call(q, K, Q)), W(t, e, i, null, K.isRTL) }, q.formatDate = function (t, e) { return "function" == typeof e && (e = e.call(q, K, Q)), V(t, e) }, c.call(q, K); var te, ee, ie, ne, re, oe, se, le, ae = q.isFetchNeeded, ce = q.fetchEvents, de = i[0], he = 0, ue = []; le = null != K.defaultDate ? q.moment(K.defaultDate) : q.getNow(), q.getSuggestedViewHeight = function () { return void 0 === oe && p(), oe }, q.isHeightAuto = function () { return "auto" === K.contentHeight || "auto" === K.height } } function a(e, i) { function n() { var e = i.header; return f = i.theme ? "ui" : "fc", e ? g = t("<div class='fc-toolbar'/>").append(o("left")).append(o("right")).append(o("center")).append('<div class="fc-clear"/>') : void 0 } function r() { g.remove() } function o(n) { var r = t('<div class="fc-' + n + '"/>'), o = i.header[n]; return o && t.each(o.split(" "), function () { var n, o = t(), s = !0; t.each(this.split(","), function (n, r) { var l, a, c, d, h, u, g, m; "title" == r ? (o = o.add(t("<h2>&nbsp;</h2>")), s = !1) : (e[r] ? l = function () { e[r]() } : xe[r] && (l = function () { e.changeView(r) }, p.push(r)), l && (a = S(i.themeButtonIcons, r), c = S(i.buttonIcons, r), d = S(i.defaultButtonText, r), h = S(i.buttonText, r), u = h ? R(h) : a && i.theme ? "<span class='ui-icon ui-icon-" + a + "'></span>" : c && !i.theme ? "<span class='fc-icon fc-icon-" + c + "'></span>" : R(d || r), g = ["fc-" + r + "-button", f + "-button", f + "-state-default"], m = t('<button type="button" class="' + g.join(" ") + '">' + u + "</button>").click(function () { m.hasClass(f + "-state-disabled") || (l(), (m.hasClass(f + "-state-active") || m.hasClass(f + "-state-disabled")) && m.removeClass(f + "-state-hover")) }).mousedown(function () { m.not("." + f + "-state-active").not("." + f + "-state-disabled").addClass(f + "-state-down") }).mouseup(function () { m.removeClass(f + "-state-down") }).hover(function () { m.not("." + f + "-state-active").not("." + f + "-state-disabled").addClass(f + "-state-hover") }, function () { m.removeClass(f + "-state-hover").removeClass(f + "-state-down") }), o = o.add(m))) }), s && o.first().addClass(f + "-corner-left").end().last().addClass(f + "-corner-right").end(), o.length > 1 ? (n = t("<div/>"), s && n.addClass("fc-button-group"), n.append(o), r.append(n)) : r.append(o) }), r } function s(t) { g.find("h2").text(t) } function l(t) { g.find(".fc-" + t + "-button").addClass(f + "-state-active") } function a(t) { g.find(".fc-" + t + "-button").removeClass(f + "-state-active") } function c(t) { g.find(".fc-" + t + "-button").attr("disabled", "disabled").addClass(f + "-state-disabled") } function d(t) { g.find(".fc-" + t + "-button").removeAttr("disabled").removeClass(f + "-state-disabled") } function h() { return p } var u = this; u.render = n, u.destroy = r, u.updateTitle = s, u.activateButton = l, u.deactivateButton = a, u.disableButton = c, u.enableButton = d, u.getViewsWithButtons = h; var f, g = t(), p = [] } function c(e) { function i(t, e) { return !T || t.clone().stripZone() < T.clone().stripZone() || e.clone().stripZone() > C.clone().stripZone() } function n(t, e) { T = t, C = e, A = []; var i = ++G, n = L.length; N = n; for (var o = 0; n > o; o++) r(L[o], i) } function r(e, i) { o(e, function (n) { var r, o, s = t.isArray(e.events); if (i == G) { if (n) for (r = 0; n.length > r; r++) o = n[r], s || (o = w(o, e)), o && A.push(o); N--, N || R(A) } }) } function o(i, n) { var r, s, l = He.sourceFetchers; for (r = 0; l.length > r; r++) { if (s = l[r].call(S, i, T.clone(), C.clone(), e.timezone, n), s === !0) return; if ("object" == typeof s) return o(s, n), void 0 } var a = i.events; if (a) t.isFunction(a) ? (v(), a.call(S, T.clone(), C.clone(), e.timezone, function (t) { n(t), y() })) : t.isArray(a) ? n(a) : n(); else { var c = i.url; if (c) { var d, h = i.success, u = i.error, f = i.complete; d = t.isFunction(i.data) ? i.data() : i.data; var g = t.extend({}, d || {}), p = M(i.startParam, e.startParam), m = M(i.endParam, e.endParam), w = M(i.timezoneParam, e.timezoneParam); p && (g[p] = T.format()), m && (g[m] = C.format()), e.timezone && "local" != e.timezone && (g[w] = e.timezone), v(), t.ajax(t.extend({}, ke, i, { data: g, success: function (e) { e = e || []; var i = k(h, this, arguments); t.isArray(i) && (e = i), n(e) }, error: function () { k(u, this, arguments), n() }, complete: function () { k(f, this, arguments), y() } })) } else n() } } function s(t) { var e = l(t); e && (L.push(e), N++, r(e, G)) } function l(e) { var i, n, r = He.sourceNormalizers; if (t.isFunction(e) || t.isArray(e) ? i = { events: e } : "string" == typeof e ? i = { url: e } : "object" == typeof e && (i = t.extend({}, e)), i) { for (i.className ? "string" == typeof i.className && (i.className = i.className.split(/\s+/)) : i.className = [], t.isArray(i.events) && (i.origArray = i.events, i.events = t.map(i.events, function (t) { return w(t, i) })), n = 0; r.length > n; n++) r[n].call(S, i); return i } } function a(e) { L = t.grep(L, function (t) { return !c(t, e) }), A = t.grep(A, function (t) { return !c(t.source, e) }), R(A) } function c(t, e) { return t && e && h(t) == h(e) } function h(t) { return ("object" == typeof t ? t.origArray || t.url || t.events : null) || t } function u(t) { t.start = S.moment(t.start), t.end && (t.end = S.moment(t.end)), E(t), f(t), R(A) } function f(t) { var e, i, n, r; for (e = 0; A.length > e; e++) if (i = A[e], i._id == t._id && i !== t) for (n = 0; V.length > n; n++) r = V[n], void 0 !== t[r] && (i[r] = t[r]) } function g(t, e) { var i = w(t); i && (i.source || (e && (z.events.push(i), i.source = z), A.push(i)), R(A)) } function p(e) { var i, n; for (null == e ? e = function () { return !0 } : t.isFunction(e) || (i = e + "", e = function (t) { return t._id == i }), A = t.grep(A, e, !0), n = 0; L.length > n; n++) t.isArray(L[n].events) && (L[n].events = t.grep(L[n].events, e, !0)); R(A) } function m(e) { return t.isFunction(e) ? t.grep(A, e) : null != e ? (e += "", t.grep(A, function (t) { return t._id == e })) : A } function v() { Y++ || H("loading", null, !0, x()) } function y() { --Y || H("loading", null, !1, x()) } function w(i, n) { var r, o, s, l, a = {}; return e.eventDataTransform && (i = e.eventDataTransform(i)), n && n.eventDataTransform && (i = n.eventDataTransform(i)), r = S.moment(i.start || i.date), r.isValid() && (o = null, !i.end || (o = S.moment(i.end), o.isValid())) ? (s = i.allDay, void 0 === s && (l = M(n ? n.allDayDefault : void 0, e.allDayDefault), s = void 0 !== l ? l : !(r.hasTime() || o && o.hasTime())), s ? (r.hasTime() && r.stripTime(), o && o.hasTime() && o.stripTime()) : (r.hasTime() || (r = S.rezoneDate(r)), o && !o.hasTime() && (o = S.rezoneDate(o))), t.extend(a, i), n && (a.source = n), a._id = i._id || (void 0 === i.id ? "_fc" + Me++ : i.id + ""), a.className = i.className ? "string" == typeof i.className ? i.className.split(/\s+/) : i.className : [], a.allDay = s, a.start = r, a.end = o, e.forceEventDuration && !a.end && (a.end = P(a)), d(a), a) : void 0 } function E(t, e, i) { var n, r, o, s, l = t._allDay, a = t._start, c = t._end, d = !1; return e || i || (e = t.start, i = t.end), n = t.allDay != l ? t.allDay : !(e || i).hasTime(), n && (e && (e = e.clone().stripTime()), i && (i = i.clone().stripTime())), e && (r = n ? D(e, a.clone().stripTime()) : D(e, a)), n != l ? d = !0 : i && (o = D(i || S.getDefaultEventEnd(n, e || a), e || a).subtract(D(c || S.getDefaultEventEnd(l, a), a))), s = b(m(t._id), d, n, r, o), { dateDelta: r, durationDelta: o, undo: s } } function b(i, n, r, o, s) { var l = S.getIsAmbigTimezone(), a = []; return t.each(i, function (t, i) { var c = i._allDay, h = i._start, u = i._end, f = null != r ? r : c, g = h.clone(), p = !n && u ? u.clone() : null; f ? (g.stripTime(), p && p.stripTime()) : (g.hasTime() || (g = S.rezoneDate(g)), p && !p.hasTime() && (p = S.rezoneDate(p))), p || !e.forceEventDuration && !+s || (p = S.getDefaultEventEnd(f, g)), g.add(o), p && p.add(o).add(s), l && (+o || +s) && (g.stripZone(), p && p.stripZone()), i.allDay = f, i.start = g, i.end = p, d(i), a.push(function () { i.allDay = c, i.start = h, i.end = u, d(i) }) }), function () { for (var t = 0; a.length > t; t++) a[t]() } } var S = this; S.isFetchNeeded = i, S.fetchEvents = n, S.addEventSource = s, S.removeEventSource = a, S.updateEvent = u, S.renderEvent = g, S.removeEvents = p, S.clientEvents = m, S.mutateEvent = E; var T, C, H = S.trigger, x = S.getView, R = S.reportEvents, P = S.getEventEnd, z = { events: [] }, L = [z], G = 0, N = 0, Y = 0, A = []; t.each((e.events ? [e.events] : []).concat(e.eventSources || []), function (t, e) { var i = l(e); i && L.push(i) }); var V = ["title", "url", "allDay", "className", "editable", "color", "backgroundColor", "borderColor", "textColor"] } function d(t) { t._allDay = t.allDay, t._start = t.start.clone(), t._end = t.end ? t.end.clone() : null } function h(t, e) { e.left && t.css({ "border-left-width": 1, "margin-left": e.left - 1 }), e.right && t.css({ "border-right-width": 1, "margin-right": e.right - 1 }) } function u(t) { t.css({ "margin-left": "", "margin-right": "", "border-left-width": "", "border-right-width": "" }) } function f(e, i, n) { var r = Math.floor(i / e.length), o = Math.floor(i - r * (e.length - 1)), s = [], l = [], a = [], c = 0; g(e), e.each(function (i, n) { var d = i === e.length - 1 ? o : r, h = t(n).outerHeight(!0); d > h ? (s.push(n), l.push(h), a.push(t(n).height())) : c += h }), n && (i -= c, r = Math.floor(i / s.length), o = Math.floor(i - r * (s.length - 1))), t(s).each(function (e, i) { var n = e === s.length - 1 ? o : r, c = l[e], d = a[e], h = n - (c - d); n > c && t(i).height(h) }) } function g(t) { t.height("") } function p(e) { var i = 0; return e.find("> *").each(function (e, n) { var r = t(n).outerWidth(); r > i && (i = r) }), i++, e.width(i), i } function m(t, e) { return t.height(e).addClass("fc-scroller"), t[0].scrollHeight - 1 > t[0].clientHeight ? !0 : (v(t), !1) } function v(t) { t.height("").removeClass("fc-scroller") } function y(e) { var i = e.css("position"), n = e.parents().filter(function () { var e = t(this); return /(auto|scroll)/.test(e.css("overflow") + e.css("overflow-y") + e.css("overflow-x")) }).eq(0); return "fixed" !== i && n.length ? n : t(e[0].ownerDocument || document) } function w(t) { var e = t.offset().left, i = e + t.width(), n = t.children(), r = n.offset().left, o = r + n.outerWidth(); return { left: r - e, right: i - o } } function E(t) { return 1 == t.which && !t.ctrlKey } function b(t, e, i, n) { var r, o, s, l; return e > i && n > t ? (t >= i ? (r = t.clone(), s = !0) : (r = i.clone(), s = !1), n >= e ? (o = e.clone(), l = !0) : (o = n.clone(), l = !1), { start: r, end: o, isStart: s, isEnd: l }) : void 0 } function S(t, e) { if (t = t || {}, void 0 !== t[e]) return t[e]; for (var i, n = e.split(/(?=[A-Z])/), r = n.length - 1; r >= 0; r--) if (i = t[n[r].toLowerCase()], void 0 !== i) return i; return t["default"] } function D(t, i) { return e.duration({ days: t.clone().stripTime().diff(i.clone().stripTime(), "days"), ms: t.time() - i.time() }) } function T(t) { return "[object Date]" === Object.prototype.toString.call(t) || t instanceof Date } function C(t, e) { return t - e } function H(t) { var e = function () { }; return e.prototype = t, new e } function x(t, e) { for (var i in e) e.hasOwnProperty(i) && (t[i] = e[i]) } function k(e, i, n) { if (t.isFunction(e) && (e = [e]), e) { var r, o; for (r = 0; e.length > r; r++) o = e[r].apply(i, n) || o; return o } } function M() { for (var t = 0; arguments.length > t; t++) if (void 0 !== arguments[t]) return arguments[t] } function R(t) { return (t + "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, "&#039;").replace(/"/g, "&quot;").replace(/\n/g, "<br />") } function P(t) { return t.replace(/&.*?;/g, "") } function z(t) { return t.charAt(0).toUpperCase() + t.slice(1) } function L(t, e) { var i, n, r, o, s = function () { var l = +new Date - o; e > l && l > 0 ? i = setTimeout(s, e - l) : (i = null, t.apply(r, n), i || (r = n = null)) }; return function () { r = this, n = arguments, o = +new Date, i || (i = setTimeout(s, e)) } } function G(i, n, r) { var o, s, l, a, c = i[0], d = 1 == i.length && "string" == typeof c; return e.isMoment(c) ? (a = e.apply(null, i), c._ambigTime && (a._ambigTime = !0), c._ambigZone && (a._ambigZone = !0)) : T(c) || void 0 === c ? a = e.apply(null, i) : (o = !1, s = !1, d ? Pe.test(c) ? (c += "-01", i = [c], o = !0, s = !0) : (l = ze.exec(c)) && (o = !l[5], s = !0) : t.isArray(c) && (s = !0), a = n ? e.utc.apply(e, i) : e.apply(null, i), o ? (a._ambigTime = !0, a._ambigZone = !0) : r && (s ? a._ambigZone = !0 : d && a.zone(c))), new N(a) } function N(t) { x(this, t) } function Y(t, e) { var i, n = [], r = !1, o = !1; for (i = 0; t.length > i; i++) n.push(He.moment.parseZone(t[i])), r = r || n[i]._ambigTime, o = o || n[i]._ambigZone; for (i = 0; n.length > i; i++) r && !e ? n[i].stripTime() : o && n[i].stripZone(); return n } function A(t, i) { return e.fn.format.call(t, i) } function V(t, e) { return _(t, Z(e)) } function _(t, e) { var i, n = ""; for (i = 0; e.length > i; i++) n += O(t, e[i]); return n } function O(t, e) { var i, n; return "string" == typeof e ? e : (i = e.token) ? Le[i] ? Le[i](t) : A(t, i) : e.maybe && (n = _(t, e.maybe), n.match(/[1-9]/)) ? n : "" } function W(t, e, i, n, r) { var o; return t = He.moment.parseZone(t), e = He.moment.parseZone(e), o = (t.localeData || t.lang).call(t), i = o.longDateFormat(i) || i, n = n || " - ", F(t, e, Z(i), n, r) } function F(t, e, i, n, r) { var o, s, l, a, c = "", d = "", h = "", u = "", f = ""; for (s = 0; i.length > s && (o = I(t, e, i[s]), o !== !1) ; s++) c += o; for (l = i.length - 1; l > s && (o = I(t, e, i[l]), o !== !1) ; l--) d = o + d; for (a = s; l >= a; a++) h += O(t, i[a]), u += O(e, i[a]); return (h || u) && (f = r ? u + n + h : h + n + u), c + f + d } function I(t, e, i) { var n, r; return "string" == typeof i ? i : (n = i.token) && (r = Ge[n.charAt(0)], r && t.isSame(e, r)) ? A(t, n) : !1 } function Z(t) { return t in Ne ? Ne[t] : Ne[t] = B(t) } function B(t) { for (var e, i = [], n = /\[([^\]]*)\]|\(([^\)]*)\)|(LT|(\w)\4*o?)|([^\w\[\(]+)/g; e = n.exec(t) ;) e[1] ? i.push(e[1]) : e[2] ? i.push({ maybe: B(e[2]) }) : e[3] ? i.push({ token: e[3] }) : e[5] && i.push(e[5]); return i } function j(t) { this.options = t || {} } function X(t) { this.grid = t } function $(t) { this.coordMaps = t } function q(t, e) { this.coordMap = t, this.options = e || {} } function U(t, e) { return t || e ? t && e ? t.grid === e.grid && t.row === e.row && t.col === e.col : !1 : !0 } function K(e, i) { this.options = i = i || {}, this.sourceEl = e, this.parentEl = i.parentEl ? t(i.parentEl) : e.parent() } function Q(t) { this.view = t } function J(t) { Q.call(this, t), this.coordMap = new X(this) } function te(t, e) { return t.eventStartMS - e.eventStartMS || e.eventDurationMS - t.eventDurationMS || e.event.allDay - t.event.allDay || (t.event.title || "").localeCompare(e.event.title) } function ee(t) { J.call(this, t) } function ie(t, e) { var i, n; for (i = 0; e.length > i; i++) if (n = e[i], n.leftCol <= t.rightCol && n.rightCol >= t.leftCol) return !0; return !1 } function ne(t, e) { return t.leftCol - e.leftCol } function re(t) { J.call(this, t) } function oe(t) { var e, i, n; if (t.sort(te), e = se(t), le(e), i = e[0]) { for (n = 0; i.length > n; n++) ae(i[n]); for (n = 0; i.length > n; n++) ce(i[n], 0, 0) } } function se(t) { var e, i, n, r = []; for (e = 0; t.length > e; e++) { for (i = t[e], n = 0; r.length > n && de(i, r[n]).length; n++); i.level = n, (r[n] || (r[n] = [])).push(i) } return r } function le(t) { var e, i, n, r, o; for (e = 0; t.length > e; e++) for (i = t[e], n = 0; i.length > n; n++) for (r = i[n], r.forwardSegs = [], o = e + 1; t.length > o; o++) de(r, t[o], r.forwardSegs) } function ae(t) { var e, i, n = t.forwardSegs, r = 0; if (void 0 === t.forwardPressure) { for (e = 0; n.length > e; e++) i = n[e], ae(i), r = Math.max(r, 1 + i.forwardPressure); t.forwardPressure = r } } function ce(t, e, i) { var n, r = t.forwardSegs; if (void 0 === t.forwardCoord) for (r.length ? (r.sort(ue), ce(r[0], e + 1, i), t.forwardCoord = r[0].backwardCoord) : t.forwardCoord = 1, t.backwardCoord = t.forwardCoord - (t.forwardCoord - i) / (e + 1), n = 0; r.length > n; n++) ce(r[n], 0, t.forwardCoord) } function de(t, e, i) { i = i || []; for (var n = 0; e.length > n; n++) he(t, e[n]) && i.push(e[n]); return i } function he(t, e) { return t.bottom > e.top && t.top < e.bottom } function ue(t, e) { return e.forwardPressure - t.forwardPressure || (t.backwardCoord || 0) - (e.backwardCoord || 0) || te(t, e) } function fe(i) { function n(e) { var i = x[e]; return t.isPlainObject(i) && !s(e) ? S(i, C.name) : i } function r(t, e) { return i.trigger.apply(i, [t, e || C].concat(Array.prototype.slice.call(arguments, 2), [C])) } function o(t) { var e = t.source || {}; return M(t.startEditable, e.startEditable, n("eventStartEditable"), t.editable, e.editable, n("editable")) } function l(t) { var e = t.source || {}; return M(t.durationEditable, e.durationEditable, n("eventDurationEditable"), t.editable, e.editable, n("editable")) } function a(t, e, n, o) { var s = i.mutateEvent(e, n, null); r("eventDrop", t, e, s.dateDelta, function () { s.undo(), H() }, o, {}), H() } function c(t, e, n, o) { var s = i.mutateEvent(e, null, n); r("eventResize", t, e, s.durationDelta, function () { s.undo(), H() }, o, {}), H() } function d(t) { return e.isMoment(t) && (t = t.day()), z[t] } function h() { return R } function u(t, e, i) { var n = t.clone(); for (e = e || 1; z[(n.day() + (i ? e : 0) + 7) % 7];) n.add(e, "days"); return n } function f() { var t = g.apply(null, arguments), e = p(t), i = m(e); return i } function g(t, e) { var i = C.colCnt, n = N ? -1 : 1, r = N ? i - 1 : 0; "object" == typeof t && (e = t.col, t = t.row); var o = t * i + (e * n + r); return o } function p(t) { var e = C.start.day(); return t += L[e], 7 * Math.floor(t / R) + G[(t % R + R) % R] - e } function m(t) { return C.start.clone().add(t, "days") } function v(t) { var e = y(t), i = w(e), n = E(i); return n } function y(t) { return t.clone().stripTime().diff(C.start, "days") } function w(t) { var e = C.start.day(); return t += e, Math.floor(t / 7) * R + L[(t % 7 + 7) % 7] - L[e] } function E(t) { var e = C.colCnt, i = N ? -1 : 1, n = N ? e - 1 : 0, r = Math.floor(t / e), o = (t % e + e) % e * i + n; return { row: r, col: o } } function b(t, e) { for (var i = C.rowCnt, n = C.colCnt, r = [], o = D(t, e), s = y(o.start), l = y(o.end), a = w(s), c = w(l) - 1, d = 0; i > d; d++) { var h = d * n, u = h + n - 1, f = Math.max(a, h), g = Math.min(c, u); if (g >= f) { var m = E(f), v = E(g), b = [m.col, v.col].sort(), S = p(f) == s, T = p(g) + 1 == l; r.push({ row: d, leftCol: b[0], rightCol: b[1], isStart: S, isEnd: T }) } } return r } function D(t, e) { var i, n, r = t.clone().stripTime(); return e && (i = e.clone().stripTime(), n = +e.time(), n && n >= k && i.add(1, "days")), (!e || r >= i) && (i = r.clone().add(1, "days")), { start: r, end: i } } function T(t) { var e = D(t.start, t.end); return e.end.diff(e.start, "days") > 1 } var C = this; C.calendar = i, C.opt = n, C.trigger = r, C.isEventDraggable = o, C.isEventResizable = l, C.eventDrop = a, C.eventResize = c; var H = i.reportEventChange, x = i.options, k = e.duration(x.nextDayThreshold); C.init(), C.getEventTimeText = function (t, e) { var r, o; return "object" == typeof t && "object" == typeof e ? (r = t, o = e, e = arguments[2]) : (r = t.start, o = t.end), e = e || n("timeFormat"), o && n("displayEventEnd") ? i.formatRange(r, o, e) : i.formatDate(r, e) }, C.isHiddenDay = d, C.skipHiddenDays = u, C.getCellsPerWeek = h, C.dateToCell = v, C.dateToDayOffset = y, C.dayOffsetToCellOffset = w, C.cellOffsetToCell = E, C.cellToDate = f, C.cellToCellOffset = g, C.cellOffsetToDayOffset = p, C.dayOffsetToDate = m, C.rangeToSegments = b, C.isMultiDayEvent = T; var R, P = n("hiddenDays") || [], z = [], L = [], G = [], N = n("isRTL"); (function () { n("weekends") === !1 && P.push(0, 6); for (var e = 0, i = 0; 7 > e; e++) L[e] = i, z[e] = -1 != t.inArray(e, P), z[e] || (G[i] = e, i++); if (R = i, !R) throw "invalid hiddenDays" })() } function ge(t) { fe.call(this, t), this.dayGrid = new ee(this), this.coordMap = this.dayGrid.coordMap } function pe(t) { ge.call(this, t) } function me(t) { ge.call(this, t) } function ve(t) { ge.call(this, t) } function ye(t, e) { return e.longDateFormat("LT").replace(":mm", "(:mm)").replace(/(\Wmm)$/, "($1)").replace(/\s*a$/i, "a") } function we(t, e) { return e.longDateFormat("LT").replace(/\s*a$/i, "") } function Ee(t) { fe.call(this, t), this.timeGrid = new re(this), this.opt("allDaySlot") ? (this.dayGrid = new ee(this), this.coordMap = new $([this.dayGrid.coordMap, this.timeGrid.coordMap])) : this.coordMap = this.timeGrid.coordMap } function be(t) { Ee.call(this, t) } function Se(t) { Ee.call(this, t) } var De = { lang: "en", defaultTimedEventDuration: "02:00:00", defaultAllDayEventDuration: { days: 1 }, forceEventDuration: !1, nextDayThreshold: "09:00:00", defaultView: "month", aspectRatio: 1.35, header: { left: "title", center: "", right: "today prev,next" }, weekends: !0, weekNumbers: !1, weekNumberTitle: "W", weekNumberCalculation: "local", lazyFetching: !0, startParam: "start", endParam: "end", timezoneParam: "timezone", timezone: !1, titleFormat: { month: "MMMM YYYY", week: "ll", day: "LL" }, columnFormat: { month: "ddd", week: n, day: "dddd" }, timeFormat: { "default": i }, displayEventEnd: { month: !1, basicWeek: !1, "default": !0 }, isRTL: !1, defaultButtonText: { prev: "prev", next: "next", prevYear: "prev year", nextYear: "next year", today: "today", month: "month", week: "week", day: "day" }, buttonIcons: { prev: "left-single-arrow", next: "right-single-arrow", prevYear: "left-double-arrow", nextYear: "right-double-arrow" }, theme: !1, themeButtonIcons: { prev: "circle-triangle-w", next: "circle-triangle-e", prevYear: "seek-prev", nextYear: "seek-next" }, dragOpacity: .75, dragRevertDuration: 500, dragScroll: !0, unselectAuto: !0, dropAccept: "*", eventLimit: !1, eventLimitText: "more", eventLimitClick: "popover", dayPopoverFormat: "LL", handleWindowResize: !0, windowResizeDelay: 200 }, Te = { en: { columnFormat: { week: "ddd M/D" }, dayPopoverFormat: "dddd, MMMM D" } }, Ce = { header: { left: "next,prev today", center: "", right: "title" }, buttonIcons: { prev: "right-single-arrow", next: "left-single-arrow", prevYear: "right-double-arrow", nextYear: "left-double-arrow" }, themeButtonIcons: { prev: "circle-triangle-e", next: "circle-triangle-w", nextYear: "seek-prev", prevYear: "seek-next" } }, He = t.fullCalendar = { version: "2.1.1" }, xe = He.views = {}; t.fn.fullCalendar = function (e) { var i = Array.prototype.slice.call(arguments, 1), n = this; return this.each(function (r, o) { var s, a = t(o), c = a.data("fullCalendar"); "string" == typeof e ? c && t.isFunction(c[e]) && (s = c[e].apply(c, i), r || (n = s), "destroy" === e && a.removeData("fullCalendar")) : c || (c = new l(a, e), a.data("fullCalendar", c), c.render()) }), n }, He.langs = Te, He.datepickerLang = function (e, i, n) { var r = Te[e]; r || (r = Te[e] = {}), o(r, { isRTL: n.isRTL, weekNumberTitle: n.weekHeader, titleFormat: { month: n.showMonthAfterYear ? "YYYY[" + n.yearSuffix + "] MMMM" : "MMMM YYYY[" + n.yearSuffix + "]" }, defaultButtonText: { prev: P(n.prevText), next: P(n.nextText), today: P(n.currentText) } }), t.datepicker && (t.datepicker.regional[i] = t.datepicker.regional[e] = n, t.datepicker.regional.en = t.datepicker.regional[""], t.datepicker.setDefaults(n)) }, He.lang = function (t, e) { var i; e && (i = Te[t], i || (i = Te[t] = {}), o(i, e || {})), De.lang = t }, He.sourceNormalizers = [], He.sourceFetchers = []; var ke = { dataType: "json", cache: !1 }, Me = 1, Re = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]; He.applyAll = k; var Pe = /^\s*\d{4}-\d\d$/, ze = /^\s*\d{4}-(?:(\d\d-\d\d)|(W\d\d$)|(W\d\d-\d)|(\d\d\d))((T| )(\d\d(:\d\d(:\d\d(\.\d+)?)?)?)?)?$/; He.moment = function () { return G(arguments) }, He.moment.utc = function () { var t = G(arguments, !0); return t.hasTime() && t.utc(), t }, He.moment.parseZone = function () { return G(arguments, !0, !0) }, N.prototype = H(e.fn), N.prototype.clone = function () { return G([this]) }, N.prototype.time = function (t) { if (null == t) return e.duration({ hours: this.hours(), minutes: this.minutes(), seconds: this.seconds(), milliseconds: this.milliseconds() }); delete this._ambigTime, e.isDuration(t) || e.isMoment(t) || (t = e.duration(t)); var i = 0; return e.isDuration(t) && (i = 24 * Math.floor(t.asDays())), this.hours(i + t.hours()).minutes(t.minutes()).seconds(t.seconds()).milliseconds(t.milliseconds()) }, N.prototype.stripTime = function () { var t = this.toArray(); return e.fn.utc.call(this), this.year(t[0]).month(t[1]).date(t[2]).hours(0).minutes(0).seconds(0).milliseconds(0), this._ambigTime = !0, this._ambigZone = !0, this }, N.prototype.hasTime = function () { return !this._ambigTime }, N.prototype.stripZone = function () { var t = this.toArray(), i = this._ambigTime; return e.fn.utc.call(this), this.year(t[0]).month(t[1]).date(t[2]).hours(t[3]).minutes(t[4]).seconds(t[5]).milliseconds(t[6]), i && (this._ambigTime = !0), this._ambigZone = !0, this }, N.prototype.hasZone = function () { return !this._ambigZone }, N.prototype.zone = function (t) { return null != t && (delete this._ambigTime, delete this._ambigZone), e.fn.zone.apply(this, arguments) }, N.prototype.local = function () { var t = this.toArray(), i = this._ambigZone; return delete this._ambigTime, delete this._ambigZone, e.fn.local.apply(this, arguments), i && this.year(t[0]).month(t[1]).date(t[2]).hours(t[3]).minutes(t[4]).seconds(t[5]).milliseconds(t[6]), this }, N.prototype.utc = function () { return delete this._ambigTime, delete this._ambigZone, e.fn.utc.apply(this, arguments) }, N.prototype.format = function () { return arguments[0] ? V(this, arguments[0]) : this._ambigTime ? A(this, "YYYY-MM-DD") : this._ambigZone ? A(this, "YYYY-MM-DD[T]HH:mm:ss") : A(this) }, N.prototype.toISOString = function () { return this._ambigTime ? A(this, "YYYY-MM-DD") : this._ambigZone ? A(this, "YYYY-MM-DD[T]HH:mm:ss") : e.fn.toISOString.apply(this, arguments) }, N.prototype.isWithin = function (t, e) { var i = Y([this, t, e]); return i[0] >= i[1] && i[0] < i[2] }, N.prototype.isSame = function (t, i) { var n; return i ? (n = Y([this, t], !0), e.fn.isSame.call(n[0], n[1], i)) : (t = He.moment.parseZone(t), e.fn.isSame.call(this, t) && Boolean(this._ambigTime) === Boolean(t._ambigTime) && Boolean(this._ambigZone) === Boolean(t._ambigZone)) }, t.each(["isBefore", "isAfter"], function (t, i) { N.prototype[i] = function (t, n) { var r = Y([this, t]); return e.fn[i].call(r[0], r[1], n) } }); var Le = { t: function (t) { return A(t, "a").charAt(0) }, T: function (t) { return A(t, "A").charAt(0) } }; He.formatRange = W; var Ge = { Y: "year", M: "month", D: "day", d: "day", A: "second", a: "second", T: "second", t: "second", H: "second", h: "second", m: "second", s: "second" }, Ne = {}; j.prototype = { isHidden: !0, options: null, el: null, documentMousedownProxy: null, margin: 10, show: function () { this.isHidden && (this.el || this.render(), this.el.show(), this.position(), this.isHidden = !1, this.trigger("show")) }, hide: function () { this.isHidden || (this.el.hide(), this.isHidden = !0, this.trigger("hide")) }, render: function () { var e = this, i = this.options; this.el = t('<div class="fc-popover"/>').addClass(i.className || "").css({ top: 0, left: 0 }).append(i.content).appendTo(i.parentEl), this.el.on("click", ".fc-close", function () { e.hide() }), i.autoHide && t(document).on("mousedown", this.documentMousedownProxy = t.proxy(this, "documentMousedown")) }, documentMousedown: function (e) { this.el && !t(e.target).closest(this.el).length && this.hide() }, destroy: function () { this.hide(), this.el && (this.el.remove(), this.el = null), t(document).off("mousedown", this.documentMousedownProxy) }, position: function () { var e, i, n, r, o, s = this.options, l = this.el.offsetParent().offset(), a = this.el.outerWidth(), c = this.el.outerHeight(), d = t(window), h = y(this.el); r = s.top || 0, o = void 0 !== s.left ? s.left : void 0 !== s.right ? s.right - a : 0, h.is(window) || h.is(document) ? (h = d, e = 0, i = 0) : (n = h.offset(), e = n.top, i = n.left), e += d.scrollTop(), i += d.scrollLeft(), s.viewportConstrain !== !1 && (r = Math.min(r, e + h.outerHeight() - c - this.margin), r = Math.max(r, e + this.margin), o = Math.min(o, i + h.outerWidth() - a - this.margin), o = Math.max(o, i + this.margin)), this.el.css({ top: r - l.top, left: o - l.left }) }, trigger: function (t) { this.options[t] && this.options[t].apply(this, Array.prototype.slice.call(arguments, 1)) } }, X.prototype = { grid: null, rows: null, cols: null, containerEl: null, minX: null, maxX: null, minY: null, maxY: null, build: function () { this.grid.buildCoords(this.rows = [], this.cols = []), this.computeBounds() }, getCell: function (t, e) { var i, n = null, r = this.rows, o = this.cols, s = -1, l = -1; if (this.inBounds(t, e)) { for (i = 0; r.length > i; i++) if (e >= r[i][0] && r[i][1] > e) { s = i; break } for (i = 0; o.length > i; i++) if (t >= o[i][0] && o[i][1] > t) { l = i; break } s >= 0 && l >= 0 && (n = { row: s, col: l }, n.grid = this.grid, n.date = this.grid.getCellDate(n)) } return n }, computeBounds: function () { var t; this.containerEl && (t = this.containerEl.offset(), this.minX = t.left, this.maxX = t.left + this.containerEl.outerWidth(), this.minY = t.top, this.maxY = t.top + this.containerEl.outerHeight()) }, inBounds: function (t, e) { return this.containerEl ? t >= this.minX && this.maxX > t && e >= this.minY && this.maxY > e : !0 } }, $.prototype = { coordMaps: null, build: function () { var t, e = this.coordMaps; for (t = 0; e.length > t; t++) e[t].build() }, getCell: function (t, e) { var i, n = this.coordMaps, r = null; for (i = 0; n.length > i && !r; i++) r = n[i].getCell(t, e); return r } }, q.prototype = {
        coordMap: null, options: null, isListening: !1, isDragging: !1, origCell: null, origDate: null, cell: null, date: null, mouseX0: null, mouseY0: null, mousemoveProxy: null, mouseupProxy: null, scrollEl: null, scrollBounds: null, scrollTopVel: null, scrollLeftVel: null, scrollIntervalId: null, scrollHandlerProxy: null, scrollSensitivity: 30, scrollSpeed: 200, scrollIntervalMs: 50, mousedown: function (t) { E(t) && (t.preventDefault(), this.startListening(t), this.options.distance || this.startDrag(t)) }, startListening: function (e) { var i, n; this.isListening || (e && this.options.scroll && (i = y(t(e.target)), i.is(window) || i.is(document) || (this.scrollEl = i, this.scrollHandlerProxy = L(t.proxy(this, "scrollHandler"), 100), this.scrollEl.on("scroll", this.scrollHandlerProxy))), this.computeCoords(), e && (n = this.getCell(e), this.origCell = n, this.origDate = n ? n.date : null, this.mouseX0 = e.pageX, this.mouseY0 = e.pageY), t(document).on("mousemove", this.mousemoveProxy = t.proxy(this, "mousemove")).on("mouseup", this.mouseupProxy = t.proxy(this, "mouseup")).on("selectstart", this.preventDefault), this.isListening = !0, this.trigger("listenStart", e)) }, computeCoords: function () { this.coordMap.build(), this.computeScrollBounds() }, mousemove: function (t) { var e, i; this.isDragging || (e = this.options.distance || 1, i = Math.pow(t.pageX - this.mouseX0, 2) + Math.pow(t.pageY - this.mouseY0, 2), i >= e * e && this.startDrag(t)), this.isDragging && this.drag(t) }, startDrag: function (t) {
            var e; this.isListening || this.startListening(), this.isDragging || (this.isDragging = !0, this.trigger("dragStart", t), e = this.getCell(t), e && this.cellOver(e, !0))
        }, drag: function (t) { var e; this.isDragging && (e = this.getCell(t), U(e, this.cell) || (this.cell && this.cellOut(), e && this.cellOver(e)), this.dragScroll(t)) }, cellOver: function (t) { this.cell = t, this.date = t.date, this.trigger("cellOver", t, t.date) }, cellOut: function () { this.cell && (this.trigger("cellOut", this.cell), this.cell = null, this.date = null) }, mouseup: function (t) { this.stopDrag(t), this.stopListening(t) }, stopDrag: function (t) { this.isDragging && (this.stopScrolling(), this.trigger("dragStop", t), this.isDragging = !1) }, stopListening: function (e) { this.isListening && (this.scrollEl && (this.scrollEl.off("scroll", this.scrollHandlerProxy), this.scrollHandlerProxy = null), t(document).off("mousemove", this.mousemoveProxy).off("mouseup", this.mouseupProxy).off("selectstart", this.preventDefault), this.mousemoveProxy = null, this.mouseupProxy = null, this.isListening = !1, this.trigger("listenStop", e), this.origCell = this.cell = null, this.origDate = this.date = null) }, getCell: function (t) { return this.coordMap.getCell(t.pageX, t.pageY) }, trigger: function (t) { this.options[t] && this.options[t].apply(this, Array.prototype.slice.call(arguments, 1)) }, preventDefault: function (t) { t.preventDefault() }, computeScrollBounds: function () { var t, e = this.scrollEl; e && (t = e.offset(), this.scrollBounds = { top: t.top, left: t.left, bottom: t.top + e.outerHeight(), right: t.left + e.outerWidth() }) }, dragScroll: function (t) { var e, i, n, r, o = this.scrollSensitivity, s = this.scrollBounds, l = 0, a = 0; s && (e = (o - (t.pageY - s.top)) / o, i = (o - (s.bottom - t.pageY)) / o, n = (o - (t.pageX - s.left)) / o, r = (o - (s.right - t.pageX)) / o, e >= 0 && 1 >= e ? l = -1 * e * this.scrollSpeed : i >= 0 && 1 >= i && (l = i * this.scrollSpeed), n >= 0 && 1 >= n ? a = -1 * n * this.scrollSpeed : r >= 0 && 1 >= r && (a = r * this.scrollSpeed)), this.setScrollVel(l, a) }, setScrollVel: function (e, i) { this.scrollTopVel = e, this.scrollLeftVel = i, this.constrainScrollVel(), !this.scrollTopVel && !this.scrollLeftVel || this.scrollIntervalId || (this.scrollIntervalId = setInterval(t.proxy(this, "scrollIntervalFunc"), this.scrollIntervalMs)) }, constrainScrollVel: function () { var t = this.scrollEl; 0 > this.scrollTopVel ? 0 >= t.scrollTop() && (this.scrollTopVel = 0) : this.scrollTopVel > 0 && t.scrollTop() + t[0].clientHeight >= t[0].scrollHeight && (this.scrollTopVel = 0), 0 > this.scrollLeftVel ? 0 >= t.scrollLeft() && (this.scrollLeftVel = 0) : this.scrollLeftVel > 0 && t.scrollLeft() + t[0].clientWidth >= t[0].scrollWidth && (this.scrollLeftVel = 0) }, scrollIntervalFunc: function () { var t = this.scrollEl, e = this.scrollIntervalMs / 1e3; this.scrollTopVel && t.scrollTop(t.scrollTop() + this.scrollTopVel * e), this.scrollLeftVel && t.scrollLeft(t.scrollLeft() + this.scrollLeftVel * e), this.constrainScrollVel(), this.scrollTopVel || this.scrollLeftVel || this.stopScrolling() }, stopScrolling: function () { this.scrollIntervalId && (clearInterval(this.scrollIntervalId), this.scrollIntervalId = null, this.computeCoords()) }, scrollHandler: function () { this.scrollIntervalId || this.computeCoords() }
    }, K.prototype = { options: null, sourceEl: null, el: null, parentEl: null, top0: null, left0: null, mouseY0: null, mouseX0: null, topDelta: null, leftDelta: null, mousemoveProxy: null, isFollowing: !1, isHidden: !1, isAnimating: !1, start: function (e) { this.isFollowing || (this.isFollowing = !0, this.mouseY0 = e.pageY, this.mouseX0 = e.pageX, this.topDelta = 0, this.leftDelta = 0, this.isHidden || this.updatePosition(), t(document).on("mousemove", this.mousemoveProxy = t.proxy(this, "mousemove"))) }, stop: function (e, i) { function n() { this.isAnimating = !1, r.destroyEl(), this.top0 = this.left0 = null, i && i() } var r = this, o = this.options.revertDuration; this.isFollowing && !this.isAnimating && (this.isFollowing = !1, t(document).off("mousemove", this.mousemoveProxy), e && o && !this.isHidden ? (this.isAnimating = !0, this.el.animate({ top: this.top0, left: this.left0 }, { duration: o, complete: n })) : n()) }, getEl: function () { var t = this.el; return t || (this.sourceEl.width(), t = this.el = this.sourceEl.clone().css({ position: "absolute", visibility: "", display: this.isHidden ? "none" : "", margin: 0, right: "auto", bottom: "auto", width: this.sourceEl.width(), height: this.sourceEl.height(), opacity: this.options.opacity || "", zIndex: this.options.zIndex }).appendTo(this.parentEl)), t }, destroyEl: function () { this.el && (this.el.remove(), this.el = null) }, updatePosition: function () { var t, e; this.getEl(), null === this.top0 && (this.sourceEl.width(), t = this.sourceEl.offset(), e = this.el.offsetParent().offset(), this.top0 = t.top - e.top, this.left0 = t.left - e.left), this.el.css({ top: this.top0 + this.topDelta, left: this.left0 + this.leftDelta }) }, mousemove: function (t) { this.topDelta = t.pageY - this.mouseY0, this.leftDelta = t.pageX - this.mouseX0, this.isHidden || this.updatePosition() }, hide: function () { this.isHidden || (this.isHidden = !0, this.el && this.el.hide()) }, show: function () { this.isHidden && (this.isHidden = !1, this.updatePosition(), this.getEl().show()) } }, Q.prototype = { view: null, cellHtml: "<td/>", rowHtml: function (t, e) { var i, n, r = this.view, o = this.getHtmlRenderer("cell", t), s = ""; for (e = e || 0, i = 0; r.colCnt > i; i++) n = r.cellToDate(e, i), s += o(e, i, n); return s = this.bookendCells(s, t, e), "<tr>" + s + "</tr>" }, bookendCells: function (t, e, i) { var n = this.view, r = this.getHtmlRenderer("intro", e)(i || 0), o = this.getHtmlRenderer("outro", e)(i || 0), s = n.opt("isRTL"), l = s ? o : r, a = s ? r : o; return "string" == typeof t ? l + t + a : t.prepend(l).append(a) }, getHtmlRenderer: function (t, e) { var i, n, r, o, s = this.view; return i = t + "Html", e && (n = e + z(t) + "Html"), n && (o = s[n]) ? r = s : n && (o = this[n]) ? r = this : (o = s[i]) ? r = s : (o = this[i]) && (r = this), "function" == typeof o ? function () { return o.apply(r, arguments) || "" } : function () { return o || "" } } }, J.prototype = H(Q.prototype), t.extend(J.prototype, { el: null, coordMap: null, cellDuration: null, render: function () { this.bindHandlers() }, destroy: function () { }, buildCoords: function () { }, getCellDate: function () { }, getCellDayEl: function () { }, rangeToSegs: function () { }, bindHandlers: function () { var e = this; this.el.on("mousedown", function (i) { t(i.target).is(".fc-event-container *, .fc-more") || t(i.target).closest(".fc-popover").length || e.dayMousedown(i) }), this.bindSegHandlers() }, dayMousedown: function (t) { var e, i, n, r = this, o = this.view, s = o.opt("selectable"), l = null, a = new q(this.coordMap, { scroll: o.opt("dragScroll"), dragStart: function () { o.unselect() }, cellOver: function (t, o) { a.origDate && (n = r.getCellDayEl(t), l = [o, a.origDate].sort(C), e = l[0], i = l[1].clone().add(r.cellDuration), s && r.renderSelection(e, i)) }, cellOut: function () { l = null, r.destroySelection() }, listenStop: function (t) { l && (l[0].isSame(l[1]) && o.trigger("dayClick", n[0], e, t), s && o.reportSelection(e, i, t)) } }); a.mousedown(t) }, renderDrag: function () { }, destroyDrag: function () { }, renderResize: function () { }, destroyResize: function () { }, renderRangeHelper: function (t, e, i) { var n, r = this.view; !e && r.opt("forceEventDuration") && (e = r.calendar.getDefaultEventEnd(!t.hasTime(), t)), n = i ? H(i.event) : {}, n.start = t, n.end = e, n.allDay = !(t.hasTime() || e && e.hasTime()), n.className = (n.className || []).concat("fc-helper"), i || (n.editable = !1), this.renderHelper(n, i) }, renderHelper: function () { }, destroyHelper: function () { }, renderSelection: function (t, e) { this.renderHighlight(t, e) }, destroySelection: function () { this.destroyHighlight() }, renderHighlight: function () { }, destroyHighlight: function () { }, headHtml: function () { return '<div class="fc-row ' + this.view.widgetHeaderClass + '">' + "<table>" + "<thead>" + this.rowHtml("head") + "</thead>" + "</table>" + "</div>" }, headCellHtml: function (t, e, i) { var n = this.view, r = n.calendar, o = n.opt("columnFormat"); return '<th class="fc-day-header ' + n.widgetHeaderClass + " fc-" + Re[i.day()] + '">' + R(r.formatDate(i, o)) + "</th>" }, bgCellHtml: function (t, e, i) { var n = this.view, r = this.getDayClasses(i); return r.unshift("fc-day", n.widgetContentClass), '<td class="' + r.join(" ") + '" data-date="' + i.format() + '"></td>' }, getDayClasses: function (t) { var e = this.view, i = e.calendar.getNow().stripTime(), n = ["fc-" + Re[t.day()]]; return "month" === e.name && t.month() != e.intervalStart.month() && n.push("fc-other-month"), t.isSame(i, "day") ? n.push("fc-today", e.highlightStateClass) : i > t ? n.push("fc-past") : n.push("fc-future"), n } }), t.extend(J.prototype, { mousedOverSeg: null, isDraggingSeg: !1, isResizingSeg: !1, renderEvents: function () { }, getSegs: function () { }, destroyEvents: function () { this.triggerSegMouseout() }, renderSegs: function (e, i) { var n, r = this.view, o = "", s = []; for (n = 0; e.length > n; n++) o += this.renderSegHtml(e[n], i); return t(o).each(function (i, n) { var o = e[i], l = r.resolveEventEl(o.event, t(n)); l && (l.data("fc-seg", o), o.el = l, s.push(o)) }), s }, renderSegHtml: function () { }, eventsToSegs: function (e, i, n) { var r = this; return t.map(e, function (t) { return r.eventToSegs(t, i, n) }) }, eventToSegs: function (t, e, i) { var n, r, o, s = t.start.clone().stripZone(), l = this.view.calendar.getEventEnd(t).stripZone(); for (e && i ? (o = b(s, l, e, i), n = o ? [o] : []) : n = this.rangeToSegs(s, l), r = 0; n.length > r; r++) o = n[r], o.event = t, o.eventStartMS = +s, o.eventDurationMS = l - s; return n }, bindSegHandlers: function () { var e = this, i = this.view; t.each({ mouseenter: function (t, i) { e.triggerSegMouseover(t, i) }, mouseleave: function (t, i) { e.triggerSegMouseout(t, i) }, click: function (t, e) { return i.trigger("eventClick", this, t.event, e) }, mousedown: function (n, r) { t(r.target).is(".fc-resizer") && i.isEventResizable(n.event) ? e.segResizeMousedown(n, r) : i.isEventDraggable(n.event) && e.segDragMousedown(n, r) } }, function (i, n) { e.el.on(i, ".fc-event-container > *", function (i) { var r = t(this).data("fc-seg"); return !r || e.isDraggingSeg || e.isResizingSeg ? void 0 : n.call(this, r, i) }) }) }, triggerSegMouseover: function (t, e) { this.mousedOverSeg || (this.mousedOverSeg = t, this.view.trigger("eventMouseover", t.el[0], t.event, e)) }, triggerSegMouseout: function (t, e) { e = e || {}, this.mousedOverSeg && (t = t || this.mousedOverSeg, this.mousedOverSeg = null, this.view.trigger("eventMouseout", t.el[0], t.event, e)) }, segDragMousedown: function (t, e) { var i, n, r = this, o = this.view, s = t.el, l = t.event, a = new K(t.el, { parentEl: o.el, opacity: o.opt("dragOpacity"), revertDuration: o.opt("dragRevertDuration"), zIndex: 2 }), c = new q(o.coordMap, { distance: 5, scroll: o.opt("dragScroll"), listenStart: function (t) { a.hide(), a.start(t) }, dragStart: function (e) { r.triggerSegMouseout(t, e), r.isDraggingSeg = !0, o.hideEvent(l), o.trigger("eventDragStart", s[0], l, e, {}) }, cellOver: function (e, s) { var l = t.cellDate || c.origDate, d = r.computeDraggedEventDates(t, l, s); i = d.start, n = d.end, o.renderDrag(i, n, t) ? a.hide() : a.show() }, cellOut: function () { i = null, o.destroyDrag(), a.show() }, dragStop: function (t) { var e = i && !i.isSame(l.start); a.stop(!e, function () { r.isDraggingSeg = !1, o.destroyDrag(), o.showEvent(l), o.trigger("eventDragStop", s[0], l, t, {}), e && o.eventDrop(s[0], l, i, t) }) }, listenStop: function () { a.stop() } }); c.mousedown(e) }, computeDraggedEventDates: function (t, e, i) { var n, r, o, s = this.view, l = t.event, a = l.start, c = s.calendar.getEventEnd(l); return i.hasTime() === e.hasTime() ? (n = D(i, e), r = a.clone().add(n), o = null === l.end ? null : c.clone().add(n)) : (r = i, o = null), { start: r, end: o } }, segResizeMousedown: function (t, e) { function i() { r.destroyResize(), o.showEvent(l) } var n, r = this, o = this.view, s = t.el, l = t.event, a = l.start, c = o.calendar.getEventEnd(l), d = null; n = new q(this.coordMap, { distance: 5, scroll: o.opt("dragScroll"), dragStart: function (e) { r.triggerSegMouseout(t, e), r.isResizingSeg = !0, o.trigger("eventResizeStart", s[0], l, e, {}) }, cellOver: function (e, n) { n.isBefore(a) && (n = a), d = n.clone().add(r.cellDuration), d.isSame(c) ? (d = null, i()) : (r.renderResize(a, d, t), o.hideEvent(l)) }, cellOut: function () { d = null, i() }, dragStop: function (t) { r.isResizingSeg = !1, i(), o.trigger("eventResizeStop", s[0], l, t, {}), d && o.eventResize(s[0], l, d, t) } }), n.mousedown(e) }, getSegClasses: function (t, e, i) { var n = t.event, r = ["fc-event", t.isStart ? "fc-start" : "fc-not-start", t.isEnd ? "fc-end" : "fc-not-end"].concat(n.className, n.source ? n.source.className : []); return e && r.push("fc-draggable"), i && r.push("fc-resizable"), r }, getEventSkinCss: function (t) { var e = this.view, i = t.source || {}, n = t.color, r = i.color, o = e.opt("eventColor"), s = t.backgroundColor || n || i.backgroundColor || r || e.opt("eventBackgroundColor") || o, l = t.borderColor || n || i.borderColor || r || e.opt("eventBorderColor") || o, a = t.textColor || i.textColor || e.opt("eventTextColor"), c = []; return s && c.push("background-color:" + s), l && c.push("border-color:" + l), a && c.push("color:" + a), c.join(";") } }), ee.prototype = H(J.prototype), t.extend(ee.prototype, { numbersVisible: !1, cellDuration: e.duration({ days: 1 }), bottomCoordPadding: 0, rowEls: null, dayEls: null, helperEls: null, highlightEls: null, render: function (e) { var i, n = this.view, r = ""; for (i = 0; n.rowCnt > i; i++) r += this.dayRowHtml(i, e); this.el.html(r), this.rowEls = this.el.find(".fc-row"), this.dayEls = this.el.find(".fc-day"), this.dayEls.each(function (e, i) { var r = n.cellToDate(Math.floor(e / n.colCnt), e % n.colCnt); n.trigger("dayRender", null, r, t(i)) }), J.prototype.render.call(this) }, destroy: function () { this.destroySegPopover() }, dayRowHtml: function (t, e) { var i = this.view, n = ["fc-row", "fc-week", i.widgetContentClass]; return e && n.push("fc-rigid"), '<div class="' + n.join(" ") + '">' + '<div class="fc-bg">' + "<table>" + this.rowHtml("day", t) + "</table>" + "</div>" + '<div class="fc-content-skeleton">' + "<table>" + (this.numbersVisible ? "<thead>" + this.rowHtml("number", t) + "</thead>" : "") + "</table>" + "</div>" + "</div>" }, dayCellHtml: function (t, e, i) { return this.bgCellHtml(t, e, i) }, buildCoords: function (e, i) { var n, r, o, s = this.view.colCnt; this.dayEls.slice(0, s).each(function (e, s) { n = t(s), r = n.offset().left, e && (o[1] = r), o = [r], i[e] = o }), o[1] = r + n.outerWidth(), this.rowEls.each(function (i, s) { n = t(s), r = n.offset().top, i && (o[1] = r), o = [r], e[i] = o }), o[1] = r + n.outerHeight() + this.bottomCoordPadding }, getCellDate: function (t) { return this.view.cellToDate(t) }, getCellDayEl: function (t) { return this.dayEls.eq(t.row * this.view.colCnt + t.col) }, rangeToSegs: function (t, e) { return this.view.rangeToSegments(t, e) }, renderDrag: function (t, e, i) { var n; return this.renderHighlight(t, e || this.view.calendar.getDefaultEventEnd(!0, t)), i && !i.el.closest(this.el).length ? (this.renderRangeHelper(t, e, i), n = this.view.opt("dragOpacity"), void 0 !== n && this.helperEls.css("opacity", n), !0) : void 0 }, destroyDrag: function () { this.destroyHighlight(), this.destroyHelper() }, renderResize: function (t, e, i) { this.renderHighlight(t, e), this.renderRangeHelper(t, e, i) }, destroyResize: function () { this.destroyHighlight(), this.destroyHelper() }, renderHelper: function (e, i) { var n = [], r = this.renderEventRows([e]); this.rowEls.each(function (e, o) { var s, l = t(o), a = t('<div class="fc-helper-skeleton"><table/></div>'); s = i && i.row === e ? i.el.position().top : l.find(".fc-content-skeleton tbody").position().top, a.css("top", s).find("table").append(r[e].tbodyEl), l.append(a), n.push(a[0]) }), this.helperEls = t(n) }, destroyHelper: function () { this.helperEls && (this.helperEls.remove(), this.helperEls = null) }, renderHighlight: function (e, i) { var n, r, o, s = this.rangeToSegs(e, i), l = []; for (n = 0; s.length > n; n++) r = s[n], o = t(this.highlightSkeletonHtml(r.leftCol, r.rightCol + 1)), o.appendTo(this.rowEls[r.row]), l.push(o[0]); this.highlightEls = t(l) }, destroyHighlight: function () { this.highlightEls && (this.highlightEls.remove(), this.highlightEls = null) }, highlightSkeletonHtml: function (t, e) { var i = this.view.colCnt, n = ""; return t > 0 && (n += '<td colspan="' + t + '"/>'), e > t && (n += '<td colspan="' + (e - t) + '" class="fc-highlight" />'), i > e && (n += '<td colspan="' + (i - e) + '"/>'), n = this.bookendCells(n, "highlight"), '<div class="fc-highlight-skeleton"><table><tr>' + n + "</tr>" + "</table>" + "</div>" } }), t.extend(ee.prototype, { segs: null, rowStructs: null, renderEvents: function (e) { var i = this.rowStructs = this.renderEventRows(e), n = []; this.rowEls.each(function (e, r) { t(r).find(".fc-content-skeleton > table").append(i[e].tbodyEl), n.push.apply(n, i[e].segs) }), this.segs = n }, getSegs: function () { return (this.segs || []).concat(this.popoverSegs || []) }, destroyEvents: function () { var t, e; for (J.prototype.destroyEvents.call(this), t = this.rowStructs || []; e = t.pop() ;) e.tbodyEl.remove(); this.segs = null, this.destroySegPopover() }, renderEventRows: function (t) { var e, i, n = this.eventsToSegs(t), r = []; for (n = this.renderSegs(n), e = this.groupSegRows(n), i = 0; e.length > i; i++) r.push(this.renderEventRow(i, e[i])); return r }, renderSegHtml: function (t, e) { var i, n = this.view, r = n.opt("isRTL"), o = t.event, s = n.isEventDraggable(o), l = !e && o.allDay && t.isEnd && n.isEventResizable(o), a = this.getSegClasses(t, s, l), c = this.getEventSkinCss(o), d = ""; return a.unshift("fc-day-grid-event"), !o.allDay && t.isStart && (d = '<span class="fc-time">' + R(n.getEventTimeText(o)) + "</span>"), i = '<span class="fc-title">' + (R(o.title || "") || "&nbsp;") + "</span>", '<a class="' + a.join(" ") + '"' + (o.url ? ' href="' + R(o.url) + '"' : "") + (c ? ' style="' + c + '"' : "") + ">" + '<div class="fc-content">' + (r ? i + " " + d : d + " " + i) + "</div>" + (l ? '<div class="fc-resizer"/>' : "") + "</a>" }, renderEventRow: function (e, i) { function n(e) { for (; e > s;) d = (y[r - 1] || [])[s], d ? d.attr("rowspan", parseInt(d.attr("rowspan") || 1, 10) + 1) : (d = t("<td/>"), l.append(d)), v[r][s] = d, y[r][s] = d, s++ } var r, o, s, l, a, c, d, h = this.view, u = h.colCnt, f = this.buildSegLevels(i), g = Math.max(1, f.length), p = t("<tbody/>"), m = [], v = [], y = []; for (r = 0; g > r; r++) { if (o = f[r], s = 0, l = t("<tr/>"), m.push([]), v.push([]), y.push([]), o) for (a = 0; o.length > a; a++) { for (c = o[a], n(c.leftCol), d = t('<td class="fc-event-container"/>').append(c.el), c.leftCol != c.rightCol ? d.attr("colspan", c.rightCol - c.leftCol + 1) : y[r][s] = d; c.rightCol >= s;) v[r][s] = d, m[r][s] = c, s++; l.append(d) } n(u), this.bookendCells(l, "eventSkeleton"), p.append(l) } return { row: e, tbodyEl: p, cellMatrix: v, segMatrix: m, segLevels: f, segs: i } }, buildSegLevels: function (t) { var e, i, n, r = []; for (t.sort(te), e = 0; t.length > e; e++) { for (i = t[e], n = 0; r.length > n && ie(i, r[n]) ; n++); i.level = n, (r[n] || (r[n] = [])).push(i) } for (n = 0; r.length > n; n++) r[n].sort(ne); return r }, groupSegRows: function (t) { var e, i = this.view, n = []; for (e = 0; i.rowCnt > e; e++) n.push([]); for (e = 0; t.length > e; e++) n[t[e].row].push(t[e]); return n } }), t.extend(ee.prototype, { segPopover: null, popoverSegs: null, destroySegPopover: function () { this.segPopover && this.segPopover.hide() }, limitRows: function (t) { var e, i, n = this.rowStructs || []; for (e = 0; n.length > e; e++) this.unlimitRow(e), i = t ? "number" == typeof t ? t : this.computeRowLevelLimit(e) : !1, i !== !1 && this.limitRow(e, i) }, computeRowLevelLimit: function (t) { var e, i, n = this.rowEls.eq(t), r = n.height(), o = this.rowStructs[t].tbodyEl.children(); for (e = 0; o.length > e; e++) if (i = o.eq(e).removeClass("fc-limited"), i.position().top + i.outerHeight() > r) return e; return !1 }, limitRow: function (e, i) { function n(n) { for (; n > T;) r = { row: e, col: T }, d = E.getCellSegs(r, i), d.length && (f = s[i - 1][T], w = E.renderMoreLink(r, d), y = t("<div/>").append(w), f.append(y), D.push(y[0])), T++ } var r, o, s, l, a, c, d, h, u, f, g, p, m, v, y, w, E = this, b = this.view, S = this.rowStructs[e], D = [], T = 0; if (i && S.segLevels.length > i) { for (o = S.segLevels[i - 1], s = S.cellMatrix, l = S.tbodyEl.children().slice(i).addClass("fc-limited").get(), a = 0; o.length > a; a++) { for (c = o[a], n(c.leftCol), u = [], h = 0; c.rightCol >= T;) r = { row: e, col: T }, d = this.getCellSegs(r, i), u.push(d), h += d.length, T++; if (h) { for (f = s[i - 1][c.leftCol], g = f.attr("rowspan") || 1, p = [], m = 0; u.length > m; m++) v = t('<td class="fc-more-cell"/>').attr("rowspan", g), d = u[m], r = { row: e, col: c.leftCol + m }, w = this.renderMoreLink(r, [c].concat(d)), y = t("<div/>").append(w), v.append(y), p.push(v[0]), D.push(v[0]); f.addClass("fc-limited").after(t(p)), l.push(f[0]) } } n(b.colCnt), S.moreEls = t(D), S.limitedEls = t(l) } }, unlimitRow: function (t) { var e = this.rowStructs[t]; e.moreEls && (e.moreEls.remove(), e.moreEls = null), e.limitedEls && (e.limitedEls.removeClass("fc-limited"), e.limitedEls = null) }, renderMoreLink: function (e, i) { var n = this, r = this.view; return t('<a class="fc-more"/>').text(this.getMoreLinkText(i.length)).on("click", function (o) { var s = r.opt("eventLimitClick"), l = r.cellToDate(e), a = t(this), c = n.getCellDayEl(e), d = n.getCellSegs(e), h = n.resliceDaySegs(d, l), u = n.resliceDaySegs(i, l); "function" == typeof s && (s = r.trigger("eventLimitClick", null, { date: l, dayEl: c, moreEl: a, segs: h, hiddenSegs: u }, o)), "popover" === s ? n.showSegPopover(l, e, a, h) : "string" == typeof s && r.calendar.zoomTo(l, s) }) }, showSegPopover: function (t, e, i, n) { var r, o, s = this, l = this.view, a = i.parent(); r = 1 == l.rowCnt ? this.view.el : this.rowEls.eq(e.row), o = { className: "fc-more-popover", content: this.renderSegPopoverContent(t, n), parentEl: this.el, top: r.offset().top, autoHide: !0, viewportConstrain: l.opt("popoverViewportConstrain"), hide: function () { s.segPopover.destroy(), s.segPopover = null, s.popoverSegs = null } }, l.opt("isRTL") ? o.right = a.offset().left + a.outerWidth() + 1 : o.left = a.offset().left - 1, this.segPopover = new j(o), this.segPopover.show() }, renderSegPopoverContent: function (e, i) { var n, r = this.view, o = r.opt("theme"), s = e.format(r.opt("dayPopoverFormat")), l = t('<div class="fc-header ' + r.widgetHeaderClass + '">' + '<span class="fc-close ' + (o ? "ui-icon ui-icon-closethick" : "fc-icon fc-icon-x") + '"></span>' + '<span class="fc-title">' + R(s) + "</span>" + '<div class="fc-clear"/>' + "</div>" + '<div class="fc-body ' + r.widgetContentClass + '">' + '<div class="fc-event-container"></div>' + "</div>"), a = l.find(".fc-event-container"); for (i = this.renderSegs(i, !0), this.popoverSegs = i, n = 0; i.length > n; n++) i[n].cellDate = e, a.append(i[n].el); return l }, resliceDaySegs: function (e, i) { var n = t.map(e, function (t) { return t.event }), r = i.clone().stripTime(), o = r.clone().add(1, "days"); return this.eventsToSegs(n, r, o) }, getMoreLinkText: function (t) { var e = this.view, i = e.opt("eventLimitText"); return "function" == typeof i ? i(t) : "+" + t + " " + i }, getCellSegs: function (t, e) { for (var i, n = this.rowStructs[t.row].segMatrix, r = e || 0, o = []; n.length > r;) i = n[r][t.col], i && o.push(i), r++; return o } }), re.prototype = H(J.prototype), t.extend(re.prototype, { slotDuration: null, snapDuration: null, minTime: null, maxTime: null, dayEls: null, slatEls: null, slatTops: null, highlightEl: null, helperEl: null, render: function () { this.processOptions(), this.el.html(this.renderHtml()), this.dayEls = this.el.find(".fc-day"), this.slatEls = this.el.find(".fc-slats tr"), this.computeSlatTops(), J.prototype.render.call(this) }, renderHtml: function () { return '<div class="fc-bg"><table>' + this.rowHtml("slotBg") + "</table>" + "</div>" + '<div class="fc-slats">' + "<table>" + this.slatRowHtml() + "</table>" + "</div>" }, slotBgCellHtml: function (t, e, i) { return this.bgCellHtml(t, e, i) }, slatRowHtml: function () { for (var t, i, n, r = this.view, o = r.calendar, s = r.opt("isRTL"), l = "", a = 0 === this.slotDuration.asMinutes() % 15, c = e.duration(+this.minTime) ; this.maxTime > c;) t = r.start.clone().time(c), i = t.minutes(), n = '<td class="fc-axis fc-time ' + r.widgetContentClass + '" ' + r.axisStyleAttr() + ">" + (a && i ? "" : "<span>" + R(o.formatDate(t, r.opt("axisFormat"))) + "</span>") + "</td>", l += "<tr " + (i ? 'class="fc-minor"' : "") + ">" + (s ? "" : n) + '<td class="' + r.widgetContentClass + '"/>' + (s ? n : "") + "</tr>", c.add(this.slotDuration); return l }, processOptions: function () { var t = this.view, i = t.opt("slotDuration"), n = t.opt("snapDuration"); i = e.duration(i), n = n ? e.duration(n) : i, this.slotDuration = i, this.snapDuration = n, this.cellDuration = n, this.minTime = e.duration(t.opt("minTime")), this.maxTime = e.duration(t.opt("maxTime")) }, rangeToSegs: function (t, e) { var i, n, r, o, s, l = this.view, a = []; for (t = t.clone().stripZone(), e = e.clone().stripZone(), n = 0; l.colCnt > n; n++) r = l.cellToDate(0, n), o = r.clone().time(this.minTime), s = r.clone().time(this.maxTime), i = b(t, e, o, s), i && (i.col = n, a.push(i)); return a }, resize: function () { this.computeSlatTops(), this.updateSegVerticals() }, buildCoords: function (i, n) { var r, o, s = this.view.colCnt, l = this.el.offset().top, a = e.duration(+this.minTime), c = null; for (this.dayEls.slice(0, s).each(function (e, i) { r = t(i), o = r.offset().left, c && (c[1] = o), c = [o], n[e] = c }), c[1] = o + r.outerWidth(), c = null; this.maxTime > a;) o = l + this.computeTimeTop(a), c && (c[1] = o), c = [o], i.push(c), a.add(this.snapDuration); c[1] = l + this.computeTimeTop(a) }, getCellDate: function (t) { var e = this.view, i = e.calendar; return i.rezoneDate(e.cellToDate(0, t.col).time(this.minTime + this.snapDuration * t.row)) }, getCellDayEl: function (t) { return this.dayEls.eq(t.col) }, computeDateTop: function (t, i) { return this.computeTimeTop(e.duration(t.clone().stripZone() - i.clone().stripTime())) }, computeTimeTop: function (t) { var e, i, n, r, o = (t - this.minTime) / this.slotDuration; return o = Math.max(0, o), o = Math.min(this.slatEls.length, o), e = Math.floor(o), i = o - e, n = this.slatTops[e], i ? (r = this.slatTops[e + 1], n + (r - n) * i) : n }, computeSlatTops: function () { var e, i = []; this.slatEls.each(function (n, r) { e = t(r).position().top, i.push(e) }), i.push(e + this.slatEls.last().outerHeight()), this.slatTops = i }, renderDrag: function (t, e, i) { var n; return i ? (this.renderRangeHelper(t, e, i), n = this.view.opt("dragOpacity"), void 0 !== n && this.helperEl.css("opacity", n), !0) : (this.renderHighlight(t, e || this.view.calendar.getDefaultEventEnd(!1, t)), void 0) }, destroyDrag: function () { this.destroyHelper(), this.destroyHighlight() }, renderResize: function (t, e, i) { this.renderRangeHelper(t, e, i) }, destroyResize: function () { this.destroyHelper() }, renderHelper: function (e, i) { var n, r, o, s = this.renderEventTable([e]), l = s.tableEl, a = s.segs; for (n = 0; a.length > n; n++) r = a[n], i && i.col === r.col && (o = i.el, r.el.css({ left: o.css("left"), right: o.css("right"), "margin-left": o.css("margin-left"), "margin-right": o.css("margin-right") })); this.helperEl = t('<div class="fc-helper-skeleton"/>').append(l).appendTo(this.el) }, destroyHelper: function () { this.helperEl && (this.helperEl.remove(), this.helperEl = null) }, renderSelection: function (t, e) { this.view.opt("selectHelper") ? this.renderRangeHelper(t, e) : this.renderHighlight(t, e) }, destroySelection: function () { this.destroyHelper(), this.destroyHighlight() }, renderHighlight: function (e, i) { this.highlightEl = t(this.highlightSkeletonHtml(e, i)).appendTo(this.el) }, destroyHighlight: function () { this.highlightEl && (this.highlightEl.remove(), this.highlightEl = null) }, highlightSkeletonHtml: function (t, e) { var i, n, r, o, s, l = this.view, a = this.rangeToSegs(t, e), c = "", d = 0; for (i = 0; a.length > i; i++) n = a[i], n.col > d && (c += '<td colspan="' + (n.col - d) + '"/>', d = n.col), r = l.cellToDate(0, d), o = this.computeDateTop(n.start, r), s = this.computeDateTop(n.end, r), c += '<td><div class="fc-highlight-container"><div class="fc-highlight" style="top:' + o + "px;bottom:-" + s + 'px"/>' + "</div>" + "</td>", d++; return l.colCnt > d && (c += '<td colspan="' + (l.colCnt - d) + '"/>'), c = this.bookendCells(c, "highlight"), '<div class="fc-highlight-skeleton"><table><tr>' + c + "</tr>" + "</table>" + "</div>" } }), t.extend(re.prototype, { segs: null, eventSkeletonEl: null, renderEvents: function (e) { var i = this.renderEventTable(e); this.eventSkeletonEl = t('<div class="fc-content-skeleton"/>').append(i.tableEl), this.el.append(this.eventSkeletonEl), this.segs = i.segs }, getSegs: function () { return this.segs || [] }, destroyEvents: function () { J.prototype.destroyEvents.call(this), this.eventSkeletonEl && (this.eventSkeletonEl.remove(), this.eventSkeletonEl = null), this.segs = null }, renderEventTable: function (e) { var i, n, r, o, s, l, a = t("<table><tr/></table>"), c = a.find("tr"), d = this.eventsToSegs(e); for (d = this.renderSegs(d), i = this.groupSegCols(d), this.computeSegVerticals(d), o = 0; i.length > o; o++) { for (s = i[o], oe(s), l = t('<div class="fc-event-container"/>'), n = 0; s.length > n; n++) r = s[n], r.el.css(this.generateSegPositionCss(r)), 30 > r.bottom - r.top && r.el.addClass("fc-short"), l.append(r.el); c.append(t("<td/>").append(l)) } return this.bookendCells(c, "eventSkeleton"), { tableEl: a, segs: d } }, updateSegVerticals: function () { var t, e = this.segs; if (e) for (this.computeSegVerticals(e), t = 0; e.length > t; t++) e[t].el.css(this.generateSegVerticalCss(e[t])) }, computeSegVerticals: function (t) { var e, i; for (e = 0; t.length > e; e++) i = t[e], i.top = this.computeDateTop(i.start, i.start), i.bottom = this.computeDateTop(i.end, i.start) }, renderSegHtml: function (t, e) { var i, n, r, o = this.view, s = t.event, l = o.isEventDraggable(s), a = !e && t.isEnd && o.isEventResizable(s), c = this.getSegClasses(t, l, a), d = this.getEventSkinCss(s); return c.unshift("fc-time-grid-event"), o.isMultiDayEvent(s) ? (t.isStart || t.isEnd) && (i = o.getEventTimeText(t.start, t.end), n = o.getEventTimeText(t.start, t.end, "LT"), r = o.getEventTimeText(t.start, null)) : (i = o.getEventTimeText(s), n = o.getEventTimeText(s, "LT"), r = o.getEventTimeText(s.start, null)), '<a class="' + c.join(" ") + '"' + (s.url ? ' href="' + R(s.url) + '"' : "") + (d ? ' style="' + d + '"' : "") + ">" + '<div class="fc-content">' + (i ? '<div class="fc-time" data-start="' + R(r) + '"' + ' data-full="' + R(n) + '"' + ">" + "<span>" + R(i) + "</span>" + "</div>" : "") + (s.title ? '<div class="fc-title">' + R(s.title) + "</div>" : "") + "</div>" + '<div class="fc-bg"/>' + (a ? '<div class="fc-resizer"/>' : "") + "</a>" }, generateSegPositionCss: function (t) { var e, i, n = this.view, r = n.opt("isRTL"), o = n.opt("slotEventOverlap"), s = t.backwardCoord, l = t.forwardCoord, a = this.generateSegVerticalCss(t); return o && (l = Math.min(1, s + 2 * (l - s))), r ? (e = 1 - l, i = s) : (e = s, i = 1 - l), a.zIndex = t.level + 1, a.left = 100 * e + "%", a.right = 100 * i + "%", o && t.forwardPressure && (a[r ? "marginLeft" : "marginRight"] = 20), a }, generateSegVerticalCss: function (t) { return { top: t.top, bottom: -t.bottom } }, groupSegCols: function (t) { var e, i = this.view, n = []; for (e = 0; i.colCnt > e; e++) n.push([]); for (e = 0; t.length > e; e++) n[t[e].col].push(t[e]); return n } }), fe.prototype = { calendar: null, coordMap: null, el: null, start: null, end: null, intervalStart: null, intervalEnd: null, rowCnt: null, colCnt: null, isSelected: !1, scrollerEl: null, scrollTop: null, widgetHeaderClass: null, widgetContentClass: null, highlightStateClass: null, documentMousedownProxy: null, documentDragStartProxy: null, init: function () { var e = this.opt("theme") ? "ui" : "fc"; this.widgetHeaderClass = e + "-widget-header", this.widgetContentClass = e + "-widget-content", this.highlightStateClass = e + "-state-highlight", this.documentMousedownProxy = t.proxy(this, "documentMousedown"), this.documentDragStartProxy = t.proxy(this, "documentDragStart") }, render: function () { this.updateSize(), this.trigger("viewRender", this, this, this.el), t(document).on("mousedown", this.documentMousedownProxy).on("dragstart", this.documentDragStartProxy) }, destroy: function () { this.unselect(), this.trigger("viewDestroy", this, this, this.el), this.destroyEvents(), this.el.empty(), t(document).off("mousedown", this.documentMousedownProxy).off("dragstart", this.documentDragStartProxy) }, incrementDate: function () { }, updateSize: function (t) { t && this.recordScroll(), this.updateHeight(), this.updateWidth() }, updateWidth: function () { }, updateHeight: function () { var t = this.calendar; this.setHeight(t.getSuggestedViewHeight(), t.isHeightAuto()) }, setHeight: function () { }, computeScrollerHeight: function (t) { var e, i = this.el.add(this.scrollerEl); return i.css({ position: "relative", left: -1 }), e = this.el.outerHeight() - this.scrollerEl.height(), i.css({ position: "", left: "" }), t - e }, recordScroll: function () { this.scrollerEl && (this.scrollTop = this.scrollerEl.scrollTop()) }, restoreScroll: function () { null !== this.scrollTop && this.scrollerEl.scrollTop(this.scrollTop) }, renderEvents: function () { this.segEach(function (t) { this.trigger("eventAfterRender", t.event, t.event, t.el) }), this.trigger("eventAfterAllRender") }, destroyEvents: function () { this.segEach(function (t) { this.trigger("eventDestroy", t.event, t.event, t.el) }) }, resolveEventEl: function (e, i) { var n = this.trigger("eventRender", e, e, i); return n === !1 ? i = null : n && n !== !0 && (i = t(n)), i }, showEvent: function (t) { this.segEach(function (t) { t.el.css("visibility", "") }, t) }, hideEvent: function (t) { this.segEach(function (t) { t.el.css("visibility", "hidden") }, t) }, segEach: function (t, e) { var i, n = this.getSegs(); for (i = 0; n.length > i; i++) e && n[i].event._id !== e._id || t.call(this, n[i]) }, getSegs: function () { }, renderDrag: function () { }, destroyDrag: function () { }, documentDragStart: function (e) { var i, n = this, r = null; this.opt("droppable") && (i = new q(this.coordMap, { cellOver: function (t, e) { r = e, n.renderDrag(e) }, cellOut: function () { r = null, n.destroyDrag() } }), t(document).one("dragstop", function (t, e) { n.destroyDrag(), r && n.trigger("drop", t.target, r, t, e) }), i.startDrag(e)) }, select: function (t, e, i) { this.unselect(i), this.renderSelection(t, e), this.reportSelection(t, e, i) }, renderSelection: function () { }, reportSelection: function (t, e, i) { this.isSelected = !0, this.trigger("select", null, t, e, i) }, unselect: function (t) { this.isSelected && (this.isSelected = !1, this.destroySelection(), this.trigger("unselect", null, t)) }, destroySelection: function () { }, documentMousedown: function (e) { var i; this.isSelected && this.opt("unselectAuto") && E(e) && (i = this.opt("unselectCancel"), i && t(e.target).closest(i).length || this.unselect(e)) } }, ge.prototype = H(fe.prototype), t.extend(ge.prototype, {
        dayGrid: null, dayNumbersVisible: !1, weekNumbersVisible: !1, weekNumberWidth: null, headRowEl: null, render: function (t, e, i) { this.rowCnt = t, this.colCnt = e, this.dayNumbersVisible = i, this.weekNumbersVisible = this.opt("weekNumbers"), this.dayGrid.numbersVisible = this.dayNumbersVisible || this.weekNumbersVisible, this.el.addClass("fc-basic-view").html(this.renderHtml()), this.headRowEl = this.el.find("thead .fc-row"), this.scrollerEl = this.el.find(".fc-day-grid-container"), this.dayGrid.coordMap.containerEl = this.scrollerEl, this.dayGrid.el = this.el.find(".fc-day-grid"), this.dayGrid.render(this.hasRigidRows()), fe.prototype.render.call(this) }, destroy: function () { this.dayGrid.destroy(), fe.prototype.destroy.call(this) }, renderHtml: function () {
            return '<table><thead><tr><td class="' + this.widgetHeaderClass + '">' + this.dayGrid.headHtml() + "</td>" + "</tr>" + "</thead>" + "<tbody>" + "<tr>" + '<td class="' + this.widgetContentClass + '">' + '<div class="fc-day-grid-container">' + '<div class="fc-day-grid"/>' + "</div>" + "</td>" + "</tr>" + "</tbody>" + "</table>"
        }, headIntroHtml: function () { return this.weekNumbersVisible ? '<th class="fc-week-number ' + this.widgetHeaderClass + '" ' + this.weekNumberStyleAttr() + ">" + "<span>" + R(this.opt("weekNumberTitle")) + "</span>" + "</th>" : void 0 }, numberIntroHtml: function (t) { return this.weekNumbersVisible ? '<td class="fc-week-number" ' + this.weekNumberStyleAttr() + ">" + "<span>" + this.calendar.calculateWeekNumber(this.cellToDate(t, 0)) + "</span>" + "</td>" : void 0 }, dayIntroHtml: function () { return this.weekNumbersVisible ? '<td class="fc-week-number ' + this.widgetContentClass + '" ' + this.weekNumberStyleAttr() + "></td>" : void 0 }, introHtml: function () { return this.weekNumbersVisible ? '<td class="fc-week-number" ' + this.weekNumberStyleAttr() + "></td>" : void 0 }, numberCellHtml: function (t, e, i) { var n; return this.dayNumbersVisible ? (n = this.dayGrid.getDayClasses(i), n.unshift("fc-day-number"), '<td class="' + n.join(" ") + '" data-date="' + i.format() + '">' + i.date() + "</td>") : "<td/>" }, weekNumberStyleAttr: function () { return null !== this.weekNumberWidth ? 'style="width:' + this.weekNumberWidth + 'px"' : "" }, hasRigidRows: function () { var t = this.opt("eventLimit"); return t && "number" != typeof t }, updateWidth: function () { this.weekNumbersVisible && (this.weekNumberWidth = p(this.el.find(".fc-week-number"))) }, setHeight: function (t, e) { var i, n = this.opt("eventLimit"); v(this.scrollerEl), u(this.headRowEl), this.dayGrid.destroySegPopover(), n && "number" == typeof n && this.dayGrid.limitRows(n), i = this.computeScrollerHeight(t), this.setGridHeight(i, e), n && "number" != typeof n && this.dayGrid.limitRows(n), !e && m(this.scrollerEl, i) && (h(this.headRowEl, w(this.scrollerEl)), i = this.computeScrollerHeight(t), this.scrollerEl.height(i), this.restoreScroll()) }, setGridHeight: function (t, e) { e ? g(this.dayGrid.rowEls) : f(this.dayGrid.rowEls, t, !0) }, renderEvents: function (t) { this.dayGrid.renderEvents(t), this.updateHeight(), fe.prototype.renderEvents.call(this, t) }, getSegs: function () { return this.dayGrid.getSegs() }, destroyEvents: function () { fe.prototype.destroyEvents.call(this), this.recordScroll(), this.dayGrid.destroyEvents() }, renderDrag: function (t, e, i) { return this.dayGrid.renderDrag(t, e, i) }, destroyDrag: function () { this.dayGrid.destroyDrag() }, renderSelection: function (t, e) { this.dayGrid.renderSelection(t, e) }, destroySelection: function () { this.dayGrid.destroySelection() }
    }), r({ fixedWeekCount: !0 }), xe.month = pe, pe.prototype = H(ge.prototype), t.extend(pe.prototype, { name: "month", incrementDate: function (t, e) { return t.clone().stripTime().add(e, "months").startOf("month") }, render: function (t) { var e; this.intervalStart = t.clone().stripTime().startOf("month"), this.intervalEnd = this.intervalStart.clone().add(1, "months"), this.start = this.intervalStart.clone(), this.start = this.skipHiddenDays(this.start), this.start.startOf("week"), this.start = this.skipHiddenDays(this.start), this.end = this.intervalEnd.clone(), this.end = this.skipHiddenDays(this.end, -1, !0), this.end.add((7 - this.end.weekday()) % 7, "days"), this.end = this.skipHiddenDays(this.end, -1, !0), e = Math.ceil(this.end.diff(this.start, "weeks", !0)), this.isFixedWeeks() && (this.end.add(6 - e, "weeks"), e = 6), this.title = this.calendar.formatDate(this.intervalStart, this.opt("titleFormat")), ge.prototype.render.call(this, e, this.getCellsPerWeek(), !0) }, setGridHeight: function (t, e) { e = e || "variable" === this.opt("weekMode"), e && (t *= this.rowCnt / 6), f(this.dayGrid.rowEls, t, !e) }, isFixedWeeks: function () { var t = this.opt("weekMode"); return t ? "fixed" === t : this.opt("fixedWeekCount") } }), xe.basicWeek = me, me.prototype = H(ge.prototype), t.extend(me.prototype, { name: "basicWeek", incrementDate: function (t, e) { return t.clone().stripTime().add(e, "weeks").startOf("week") }, render: function (t) { this.intervalStart = t.clone().stripTime().startOf("week"), this.intervalEnd = this.intervalStart.clone().add(1, "weeks"), this.start = this.skipHiddenDays(this.intervalStart), this.end = this.skipHiddenDays(this.intervalEnd, -1, !0), this.title = this.calendar.formatRange(this.start, this.end.clone().subtract(1), this.opt("titleFormat"), " — "), ge.prototype.render.call(this, 1, this.getCellsPerWeek(), !1) } }), xe.basicDay = ve, ve.prototype = H(ge.prototype), t.extend(ve.prototype, { name: "basicDay", incrementDate: function (t, e) { var i = t.clone().stripTime().add(e, "days"); return i = this.skipHiddenDays(i, 0 > e ? -1 : 1) }, render: function (t) { this.start = this.intervalStart = t.clone().stripTime(), this.end = this.intervalEnd = this.start.clone().add(1, "days"), this.title = this.calendar.formatDate(this.start, this.opt("titleFormat")), ge.prototype.render.call(this, 1, 1, !1) } }), r({ allDaySlot: !0, allDayText: "all-day", scrollTime: "06:00:00", slotDuration: "00:30:00", axisFormat: ye, timeFormat: { agenda: we }, minTime: "00:00:00", maxTime: "24:00:00", slotEventOverlap: !0 }); var Ye = 5; Ee.prototype = H(fe.prototype), t.extend(Ee.prototype, { timeGrid: null, dayGrid: null, axisWidth: null, noScrollRowEls: null, bottomRuleEl: null, bottomRuleHeight: null, render: function (e) { this.rowCnt = 1, this.colCnt = e, this.el.addClass("fc-agenda-view").html(this.renderHtml()), this.scrollerEl = this.el.find(".fc-time-grid-container"), this.timeGrid.coordMap.containerEl = this.scrollerEl, this.timeGrid.el = this.el.find(".fc-time-grid"), this.timeGrid.render(), this.bottomRuleEl = t('<hr class="' + this.widgetHeaderClass + '"/>').appendTo(this.timeGrid.el), this.dayGrid && (this.dayGrid.el = this.el.find(".fc-day-grid"), this.dayGrid.render(), this.dayGrid.bottomCoordPadding = this.dayGrid.el.next("hr").outerHeight()), this.noScrollRowEls = this.el.find(".fc-row:not(.fc-scroller *)"), fe.prototype.render.call(this), this.resetScroll() }, destroy: function () { this.timeGrid.destroy(), this.dayGrid && this.dayGrid.destroy(), fe.prototype.destroy.call(this) }, renderHtml: function () { return '<table><thead><tr><td class="' + this.widgetHeaderClass + '">' + this.timeGrid.headHtml() + "</td>" + "</tr>" + "</thead>" + "<tbody>" + "<tr>" + '<td class="' + this.widgetContentClass + '">' + (this.dayGrid ? '<div class="fc-day-grid"/><hr class="' + this.widgetHeaderClass + '"/>' : "") + '<div class="fc-time-grid-container">' + '<div class="fc-time-grid"/>' + "</div>" + "</td>" + "</tr>" + "</tbody>" + "</table>" }, headIntroHtml: function () { var t, e, i, n; return this.opt("weekNumbers") ? (t = this.cellToDate(0, 0), e = this.calendar.calculateWeekNumber(t), i = this.opt("weekNumberTitle"), n = this.opt("isRTL") ? e + i : i + e, '<th class="fc-axis fc-week-number ' + this.widgetHeaderClass + '" ' + this.axisStyleAttr() + ">" + "<span>" + R(n) + "</span>" + "</th>") : '<th class="fc-axis ' + this.widgetHeaderClass + '" ' + this.axisStyleAttr() + "></th>" }, dayIntroHtml: function () { return '<td class="fc-axis ' + this.widgetContentClass + '" ' + this.axisStyleAttr() + ">" + "<span>" + (this.opt("allDayHtml") || R(this.opt("allDayText"))) + "</span>" + "</td>" }, slotBgIntroHtml: function () { return '<td class="fc-axis ' + this.widgetContentClass + '" ' + this.axisStyleAttr() + "></td>" }, introHtml: function () { return '<td class="fc-axis" ' + this.axisStyleAttr() + "></td>" }, axisStyleAttr: function () { return null !== this.axisWidth ? 'style="width:' + this.axisWidth + 'px"' : "" }, updateSize: function (t) { t && this.timeGrid.resize(), fe.prototype.updateSize.call(this, t) }, updateWidth: function () { this.axisWidth = p(this.el.find(".fc-axis")) }, setHeight: function (t, e) { var i, n; null === this.bottomRuleHeight && (this.bottomRuleHeight = this.bottomRuleEl.outerHeight()), this.bottomRuleEl.hide(), this.scrollerEl.css("overflow", ""), v(this.scrollerEl), u(this.noScrollRowEls), this.dayGrid && (this.dayGrid.destroySegPopover(), i = this.opt("eventLimit"), i && "number" != typeof i && (i = Ye), i && this.dayGrid.limitRows(i)), e || (n = this.computeScrollerHeight(t), m(this.scrollerEl, n) ? (h(this.noScrollRowEls, w(this.scrollerEl)), n = this.computeScrollerHeight(t), this.scrollerEl.height(n), this.restoreScroll()) : (this.scrollerEl.height(n).css("overflow", "hidden"), this.bottomRuleEl.show())) }, resetScroll: function () { function t() { i.scrollerEl.scrollTop(r) } var i = this, n = e.duration(this.opt("scrollTime")), r = this.timeGrid.computeTimeTop(n); r = Math.ceil(r), r && r++, t(), setTimeout(t, 0) }, renderEvents: function (t) { var e, i, n = [], r = [], o = []; for (i = 0; t.length > i; i++) t[i].allDay ? n.push(t[i]) : r.push(t[i]); e = this.timeGrid.renderEvents(r), this.dayGrid && (o = this.dayGrid.renderEvents(n)), this.updateHeight(), fe.prototype.renderEvents.call(this, t) }, getSegs: function () { return this.timeGrid.getSegs().concat(this.dayGrid ? this.dayGrid.getSegs() : []) }, destroyEvents: function () { fe.prototype.destroyEvents.call(this), this.recordScroll(), this.timeGrid.destroyEvents(), this.dayGrid && this.dayGrid.destroyEvents() }, renderDrag: function (t, e, i) { return t.hasTime() ? this.timeGrid.renderDrag(t, e, i) : this.dayGrid ? this.dayGrid.renderDrag(t, e, i) : void 0 }, destroyDrag: function () { this.timeGrid.destroyDrag(), this.dayGrid && this.dayGrid.destroyDrag() }, renderSelection: function (t, e) { t.hasTime() || e.hasTime() ? this.timeGrid.renderSelection(t, e) : this.dayGrid && this.dayGrid.renderSelection(t, e) }, destroySelection: function () { this.timeGrid.destroySelection(), this.dayGrid && this.dayGrid.destroySelection() } }), xe.agendaWeek = be, be.prototype = H(Ee.prototype), t.extend(be.prototype, { name: "agendaWeek", incrementDate: function (t, e) { return t.clone().stripTime().add(e, "weeks").startOf("week") }, render: function (t) { this.intervalStart = t.clone().stripTime().startOf("week"), this.intervalEnd = this.intervalStart.clone().add(1, "weeks"), this.start = this.skipHiddenDays(this.intervalStart), this.end = this.skipHiddenDays(this.intervalEnd, -1, !0), this.title = this.calendar.formatRange(this.start, this.end.clone().subtract(1), this.opt("titleFormat"), " — "), Ee.prototype.render.call(this, this.getCellsPerWeek()) } }), xe.agendaDay = Se, Se.prototype = H(Ee.prototype), t.extend(Se.prototype, { name: "agendaDay", incrementDate: function (t, e) { var i = t.clone().stripTime().add(e, "days"); return i = this.skipHiddenDays(i, 0 > e ? -1 : 1) }, render: function (t) { this.start = this.intervalStart = t.clone().stripTime(), this.end = this.intervalEnd = this.start.clone().add(1, "days"), this.title = this.calendar.formatDate(this.start, this.opt("titleFormat")), Ee.prototype.render.call(this, 1) } })
});

/*!
 * FullCalendar v2.1.1 Google Calendar Plugin
 * Docs & License: http://arshaw.com/fullcalendar/
 * (c) 2013 Adam Shaw
 */

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    }
    else {
        factory(jQuery);
    }
})(function ($) {


    var fc = $.fullCalendar;
    var applyAll = fc.applyAll;


    fc.sourceNormalizers.push(function (sourceOptions) {
        if (sourceOptions.dataType == 'gcal' ||
            sourceOptions.dataType === undefined &&
            (sourceOptions.url || '').match(/^(http|https):\/\/www.google.com\/calendar\/feeds\//)) {
            sourceOptions.dataType = 'gcal';
            if (sourceOptions.editable === undefined) {
                sourceOptions.editable = false;
            }
        }
    });


    fc.sourceFetchers.push(function (sourceOptions, start, end, timezone) {
        if (sourceOptions.dataType == 'gcal') {
            return transformOptions(sourceOptions, start, end, timezone);
        }
    });


    function transformOptions(sourceOptions, start, end, timezone) {

        var success = sourceOptions.success;
        var data = $.extend({}, sourceOptions.data || {}, {
            singleevents: true,
            'max-results': 9999
        });

        return $.extend({}, sourceOptions, {
            url: sourceOptions.url.replace(/\/basic$/, '/full') + '?alt=json-in-script&callback=?',
            dataType: 'jsonp',
            data: data,
            timezoneParam: 'ctz',
            startParam: 'start-min',
            endParam: 'start-max',
            success: function (data) {
                var events = [];
                if (data.feed.entry) {
                    $.each(data.feed.entry, function (i, entry) {

                        var url;
                        $.each(entry.link, function (i, link) {
                            if (link.type == 'text/html') {
                                url = link.href;
                                if (timezone && timezone != 'local') {
                                    url += (url.indexOf('?') == -1 ? '?' : '&') + 'ctz=' + encodeURIComponent(timezone);
                                }
                            }
                        });

                        events.push({
                            id: entry.gCal$uid.value,
                            title: entry.title.$t,
                            start: entry.gd$when[0].startTime,
                            end: entry.gd$when[0].endTime,
                            url: url,
                            location: entry.gd$where[0].valueString,
                            description: entry.content.$t
                        });

                    });
                }
                var args = [events].concat(Array.prototype.slice.call(arguments, 1));
                var res = applyAll(success, this, args);
                if ($.isArray(res)) {
                    return res;
                }
                return events;
            }
        });

    }


    // legacy
    fc.gcalFeed = function (url, sourceOptions) {
        return $.extend({}, sourceOptions, { url: url, dataType: 'gcal' });
    };


});


(function (e) { "function" == typeof define && define.amd ? define(["jquery", "moment"], e) : e(jQuery, moment) })(function (e, t) {
    (function () { (t.defineLocale || t.lang).call(t, "ar-ma", { months: "يناير_فبراير_مارس_أبريل_ماي_يونيو_يوليوز_غشت_شتنبر_أكتوبر_نونبر_دجنبر".split("_"), monthsShort: "يناير_فبراير_مارس_أبريل_ماي_يونيو_يوليوز_غشت_شتنبر_أكتوبر_نونبر_دجنبر".split("_"), weekdays: "الأحد_الإتنين_الثلاثاء_الأربعاء_الخميس_الجمعة_السبت".split("_"), weekdaysShort: "احد_اتنين_ثلاثاء_اربعاء_خميس_جمعة_سبت".split("_"), weekdaysMin: "ح_ن_ث_ر_خ_ج_س".split("_"), longDateFormat: { LT: "HH:mm", L: "DD/MM/YYYY", LL: "D MMMM YYYY", LLL: "D MMMM YYYY LT", LLLL: "dddd D MMMM YYYY LT" }, calendar: { sameDay: "[اليوم على الساعة] LT", nextDay: "[غدا على الساعة] LT", nextWeek: "dddd [على الساعة] LT", lastDay: "[أمس على الساعة] LT", lastWeek: "dddd [على الساعة] LT", sameElse: "L" }, relativeTime: { future: "في %s", past: "منذ %s", s: "ثوان", m: "دقيقة", mm: "%d دقائق", h: "ساعة", hh: "%d ساعات", d: "يوم", dd: "%d أيام", M: "شهر", MM: "%d أشهر", y: "سنة", yy: "%d سنوات" }, week: { dow: 6, doy: 12 } }), e.fullCalendar.datepickerLang("ar-ma", "ar", { closeText: "إغلاق", prevText: "&#x3C;السابق", nextText: "التالي&#x3E;", currentText: "اليوم", monthNames: ["كانون الثاني", "شباط", "آذار", "نيسان", "مايو", "حزيران", "تموز", "آب", "أيلول", "تشرين الأول", "تشرين الثاني", "كانون الأول"], monthNamesShort: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"], dayNames: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"], dayNamesShort: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"], dayNamesMin: ["ح", "ن", "ث", "ر", "خ", "ج", "س"], weekHeader: "أسبوع", dateFormat: "dd/mm/yy", firstDay: 6, isRTL: !0, showMonthAfterYear: !1, yearSuffix: "" }), e.fullCalendar.lang("ar-ma", { defaultButtonText: { month: "شهر", week: "أسبوع", day: "يوم", list: "أجندة" }, allDayText: "اليوم كله", eventLimitText: "أخرى" }) })(), function () { var a = { 1: "١", 2: "٢", 3: "٣", 4: "٤", 5: "٥", 6: "٦", 7: "٧", 8: "٨", 9: "٩", 0: "٠" }, n = { "١": "1", "٢": "2", "٣": "3", "٤": "4", "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9", "٠": "0" }; (t.defineLocale || t.lang).call(t, "ar-sa", { months: "يناير_فبراير_مارس_أبريل_مايو_يونيو_يوليو_أغسطس_سبتمبر_أكتوبر_نوفمبر_ديسمبر".split("_"), monthsShort: "يناير_فبراير_مارس_أبريل_مايو_يونيو_يوليو_أغسطس_سبتمبر_أكتوبر_نوفمبر_ديسمبر".split("_"), weekdays: "الأحد_الإثنين_الثلاثاء_الأربعاء_الخميس_الجمعة_السبت".split("_"), weekdaysShort: "أحد_إثنين_ثلاثاء_أربعاء_خميس_جمعة_سبت".split("_"), weekdaysMin: "ح_ن_ث_ر_خ_ج_س".split("_"), longDateFormat: { LT: "HH:mm", L: "DD/MM/YYYY", LL: "D MMMM YYYY", LLL: "D MMMM YYYY LT", LLLL: "dddd D MMMM YYYY LT" }, meridiem: function (e) { return 12 > e ? "ص" : "م" }, calendar: { sameDay: "[اليوم على الساعة] LT", nextDay: "[غدا على الساعة] LT", nextWeek: "dddd [على الساعة] LT", lastDay: "[أمس على الساعة] LT", lastWeek: "dddd [على الساعة] LT", sameElse: "L" }, relativeTime: { future: "في %s", past: "منذ %s", s: "ثوان", m: "دقيقة", mm: "%d دقائق", h: "ساعة", hh: "%d ساعات", d: "يوم", dd: "%d أيام", M: "شهر", MM: "%d أشهر", y: "سنة", yy: "%d سنوات" }, preparse: function (e) { return e.replace(/[۰-۹]/g, function (e) { return n[e] }).replace(/،/g, ",") }, postformat: function (e) { return e.replace(/\d/g, function (e) { return a[e] }).replace(/,/g, "،") }, week: { dow: 6, doy: 12 } }), e.fullCalendar.datepickerLang("ar-sa", "ar", { closeText: "إغلاق", prevText: "&#x3C;السابق", nextText: "التالي&#x3E;", currentText: "اليوم", monthNames: ["كانون الثاني", "شباط", "آذار", "نيسان", "مايو", "حزيران", "تموز", "آب", "أيلول", "تشرين الأول", "تشرين الثاني", "كانون الأول"], monthNamesShort: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"], dayNames: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"], dayNamesShort: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"], dayNamesMin: ["ح", "ن", "ث", "ر", "خ", "ج", "س"], weekHeader: "أسبوع", dateFormat: "dd/mm/yy", firstDay: 6, isRTL: !0, showMonthAfterYear: !1, yearSuffix: "" }), e.fullCalendar.lang("ar-sa", { defaultButtonText: { month: "شهر", week: "أسبوع", day: "يوم", list: "أجندة" }, allDayText: "اليوم كله", eventLimitText: "أخرى" }) }(), function () { var a = { 1: "١", 2: "٢", 3: "٣", 4: "٤", 5: "٥", 6: "٦", 7: "٧", 8: "٨", 9: "٩", 0: "٠" }, n = { "١": "1", "٢": "2", "٣": "3", "٤": "4", "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9", "٠": "0" }; (t.defineLocale || t.lang).call(t, "ar", { months: "يناير/ كانون الثاني_فبراير/ شباط_مارس/ آذار_أبريل/ نيسان_مايو/ أيار_يونيو/ حزيران_يوليو/ تموز_أغسطس/ آب_سبتمبر/ أيلول_أكتوبر/ تشرين الأول_نوفمبر/ تشرين الثاني_ديسمبر/ كانون الأول".split("_"), monthsShort: "يناير/ كانون الثاني_فبراير/ شباط_مارس/ آذار_أبريل/ نيسان_مايو/ أيار_يونيو/ حزيران_يوليو/ تموز_أغسطس/ آب_سبتمبر/ أيلول_أكتوبر/ تشرين الأول_نوفمبر/ تشرين الثاني_ديسمبر/ كانون الأول".split("_"), weekdays: "الأحد_الإثنين_الثلاثاء_الأربعاء_الخميس_الجمعة_السبت".split("_"), weekdaysShort: "أحد_إثنين_ثلاثاء_أربعاء_خميس_جمعة_سبت".split("_"), weekdaysMin: "ح_ن_ث_ر_خ_ج_س".split("_"), longDateFormat: { LT: "HH:mm", L: "DD/MM/YYYY", LL: "D MMMM YYYY", LLL: "D MMMM YYYY LT", LLLL: "dddd D MMMM YYYY LT" }, meridiem: function (e) { return 12 > e ? "ص" : "م" }, calendar: { sameDay: "[اليوم على الساعة] LT", nextDay: "[غدا على الساعة] LT", nextWeek: "dddd [على الساعة] LT", lastDay: "[أمس على الساعة] LT", lastWeek: "dddd [على الساعة] LT", sameElse: "L" }, relativeTime: { future: "في %s", past: "منذ %s", s: "ثوان", m: "دقيقة", mm: "%d دقائق", h: "ساعة", hh: "%d ساعات", d: "يوم", dd: "%d أيام", M: "شهر", MM: "%d أشهر", y: "سنة", yy: "%d سنوات" }, preparse: function (e) { return e.replace(/[۰-۹]/g, function (e) { return n[e] }).replace(/،/g, ",") }, postformat: function (e) { return e.replace(/\d/g, function (e) { return a[e] }).replace(/,/g, "،") }, week: { dow: 6, doy: 12 } }), e.fullCalendar.datepickerLang("ar", "ar", { closeText: "إغلاق", prevText: "&#x3C;السابق", nextText: "التالي&#x3E;", currentText: "اليوم", monthNames: ["كانون الثاني", "شباط", "آذار", "نيسان", "مايو", "حزيران", "تموز", "آب", "أيلول", "تشرين الأول", "تشرين الثاني", "كانون الأول"], monthNamesShort: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"], dayNames: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"], dayNamesShort: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"], dayNamesMin: ["ح", "ن", "ث", "ر", "خ", "ج", "س"], weekHeader: "أسبوع", dateFormat: "dd/mm/yy", firstDay: 6, isRTL: !0, showMonthAfterYear: !1, yearSuffix: "" }), e.fullCalendar.lang("ar", { defaultButtonText: { month: "شهر", week: "أسبوع", day: "يوم", list: "أجندة" }, allDayText: "اليوم كله", eventLimitText: "أخرى" }) }(), function () { (t.defineLocale || t.lang).call(t, "bg", { months: "януари_февруари_март_април_май_юни_юли_август_септември_октомври_ноември_декември".split("_"), monthsShort: "янр_фев_мар_апр_май_юни_юли_авг_сеп_окт_ное_дек".split("_"), weekdays: "неделя_понеделник_вторник_сряда_четвъртък_петък_събота".split("_"), weekdaysShort: "нед_пон_вто_сря_чет_пет_съб".split("_"), weekdaysMin: "нд_пн_вт_ср_чт_пт_сб".split("_"), longDateFormat: { LT: "H:mm", L: "D.MM.YYYY", LL: "D MMMM YYYY", LLL: "D MMMM YYYY LT", LLLL: "dddd, D MMMM YYYY LT" }, calendar: { sameDay: "[Днес в] LT", nextDay: "[Утре в] LT", nextWeek: "dddd [в] LT", lastDay: "[Вчера в] LT", lastWeek: function () { switch (this.day()) { case 0: case 3: case 6: return "[В изминалата] dddd [в] LT"; case 1: case 2: case 4: case 5: return "[В изминалия] dddd [в] LT" } }, sameElse: "L" }, relativeTime: { future: "след %s", past: "преди %s", s: "няколко секунди", m: "минута", mm: "%d минути", h: "час", hh: "%d часа", d: "ден", dd: "%d дни", M: "месец", MM: "%d месеца", y: "година", yy: "%d години" }, ordinal: function (e) { var t = e % 10, a = e % 100; return 0 === e ? e + "-ев" : 0 === a ? e + "-ен" : a > 10 && 20 > a ? e + "-ти" : 1 === t ? e + "-ви" : 2 === t ? e + "-ри" : 7 === t || 8 === t ? e + "-ми" : e + "-ти" }, week: { dow: 1, doy: 7 } }), e.fullCalendar.datepickerLang("bg", "bg", { closeText: "затвори", prevText: "&#x3C;назад", nextText: "напред&#x3E;", nextBigText: "&#x3E;&#x3E;", currentText: "днес", monthNames: ["Януари", "Февруари", "Март", "Април", "Май", "Юни", "Юли", "Август", "Септември", "Октомври", "Ноември", "Декември"], monthNamesShort: ["Яну", "Фев", "Мар", "Апр", "Май", "Юни", "Юли", "Авг", "Сеп", "Окт", "Нов", "Дек"], dayNames: ["Неделя", "Понеделник", "Вторник", "Сряда", "Четвъртък", "Петък", "Събота"], dayNamesShort: ["Нед", "Пон", "Вто", "Сря", "Чет", "Пет", "Съб"], dayNamesMin: ["Не", "По", "Вт", "Ср", "Че", "Пе", "Съ"], weekHeader: "Wk", dateFormat: "dd.mm.yy", firstDay: 1, isRTL: !1, showMonthAfterYear: !1, yearSuffix: "" }), e.fullCalendar.lang("bg", { defaultButtonText: { month: "Месец", week: "Седмица", day: "Ден", list: "График" }, allDayText: "Цял ден", eventLimitText: function (e) { return "+още " + e } }) }(), function () { (t.defineLocale || t.lang).call(t, "ca", { months: "gener_febrer_març_abril_maig_juny_juliol_agost_setembre_octubre_novembre_desembre".split("_"), monthsShort: "gen._febr._mar._abr._mai._jun._jul._ag._set._oct._nov._des.".split("_"), weekdays: "diumenge_dilluns_dimarts_dimecres_dijous_divendres_dissabte".split("_"), weekdaysShort: "dg._dl._dt._dc._dj._dv._ds.".split("_"), weekdaysMin: "Dg_Dl_Dt_Dc_Dj_Dv_Ds".split("_"), longDateFormat: { LT: "H:mm", L: "DD/MM/YYYY", LL: "D MMMM YYYY", LLL: "D MMMM YYYY LT", LLLL: "dddd D MMMM YYYY LT" }, calendar: { sameDay: function () { return "[avui a " + (1 !== this.hours() ? "les" : "la") + "] LT" }, nextDay: function () { return "[demà a " + (1 !== this.hours() ? "les" : "la") + "] LT" }, nextWeek: function () { return "dddd [a " + (1 !== this.hours() ? "les" : "la") + "] LT" }, lastDay: function () { return "[ahir a " + (1 !== this.hours() ? "les" : "la") + "] LT" }, lastWeek: function () { return "[el] dddd [passat a " + (1 !== this.hours() ? "les" : "la") + "] LT" }, sameElse: "L" }, relativeTime: { future: "en %s", past: "fa %s", s: "uns segons", m: "un minut", mm: "%d minuts", h: "una hora", hh: "%d hores", d: "un dia", dd: "%d dies", M: "un mes", MM: "%d mesos", y: "un any", yy: "%d anys" }, ordinal: "%dº", week: { dow: 1, doy: 4 } }), e.fullCalendar.datepickerLang("ca", "ca", { closeText: "Tanca", prevText: "Anterior", nextText: "Següent", currentText: "Avui", monthNames: ["gener", "febrer", "març", "abril", "maig", "juny", "juliol", "agost", "setembre", "octubre", "novembre", "desembre"], monthNamesShort: ["gen", "feb", "març", "abr", "maig", "juny", "jul", "ag", "set", "oct", "nov", "des"], dayNames: ["diumenge", "dilluns", "dimarts", "dimecres", "dijous", "divendres", "dissabte"], dayNamesShort: ["dg", "dl", "dt", "dc", "dj", "dv", "ds"], dayNamesMin: ["dg", "dl", "dt", "dc", "dj", "dv", "ds"], weekHeader: "Set", dateFormat: "dd/mm/yy", firstDay: 1, isRTL: !1, showMonthAfterYear: !1, yearSuffix: "" }), e.fullCalendar.lang("ca", { defaultButtonText: { month: "Mes", week: "Setmana", day: "Dia", list: "Agenda" }, allDayText: "Tot el dia", eventLimitText: "més" }) }(), function () { function a(e) { return e > 1 && 5 > e && 1 !== ~~(e / 10) } function n(e, t, n, r) { var i = e + " "; switch (n) { case "s": return t || r ? "pár sekund" : "pár sekundami"; case "m": return t ? "minuta" : r ? "minutu" : "minutou"; case "mm": return t || r ? i + (a(e) ? "minuty" : "minut") : i + "minutami"; case "h": return t ? "hodina" : r ? "hodinu" : "hodinou"; case "hh": return t || r ? i + (a(e) ? "hodiny" : "hodin") : i + "hodinami"; case "d": return t || r ? "den" : "dnem"; case "dd": return t || r ? i + (a(e) ? "dny" : "dní") : i + "dny"; case "M": return t || r ? "měsíc" : "měsícem"; case "MM": return t || r ? i + (a(e) ? "měsíce" : "měsíců") : i + "měsíci"; case "y": return t || r ? "rok" : "rokem"; case "yy": return t || r ? i + (a(e) ? "roky" : "let") : i + "lety" } } var r = "leden_únor_březen_duben_květen_červen_červenec_srpen_září_říjen_listopad_prosinec".split("_"), i = "led_úno_bře_dub_kvě_čvn_čvc_srp_zář_říj_lis_pro".split("_"); (t.defineLocale || t.lang).call(t, "cs", { months: r, monthsShort: i, monthsParse: function (e, t) { var a, n = []; for (a = 0; 12 > a; a++) n[a] = RegExp("^" + e[a] + "$|^" + t[a] + "$", "i"); return n }(r, i), weekdays: "neděle_pondělí_úterý_středa_čtvrtek_pátek_sobota".split("_"), weekdaysShort: "ne_po_út_st_čt_pá_so".split("_"), weekdaysMin: "ne_po_út_st_čt_pá_so".split("_"), longDateFormat: { LT: "H.mm", L: "DD. MM. YYYY", LL: "D. MMMM YYYY", LLL: "D. MMMM YYYY LT", LLLL: "dddd D. MMMM YYYY LT" }, calendar: { sameDay: "[dnes v] LT", nextDay: "[zítra v] LT", nextWeek: function () { switch (this.day()) { case 0: return "[v neděli v] LT"; case 1: case 2: return "[v] dddd [v] LT"; case 3: return "[ve středu v] LT"; case 4: return "[ve čtvrtek v] LT"; case 5: return "[v pátek v] LT"; case 6: return "[v sobotu v] LT" } }, lastDay: "[včera v] LT", lastWeek: function () { switch (this.day()) { case 0: return "[minulou neděli v] LT"; case 1: case 2: return "[minulé] dddd [v] LT"; case 3: return "[minulou středu v] LT"; case 4: case 5: return "[minulý] dddd [v] LT"; case 6: return "[minulou sobotu v] LT" } }, sameElse: "L" }, relativeTime: { future: "za %s", past: "před %s", s: n, m: n, mm: n, h: n, hh: n, d: n, dd: n, M: n, MM: n, y: n, yy: n }, ordinal: "%d.", week: { dow: 1, doy: 4 } }), e.fullCalendar.datepickerLang("cs", "cs", { closeText: "Zavřít", prevText: "&#x3C;Dříve", nextText: "Později&#x3E;", currentText: "Nyní", monthNames: ["leden", "únor", "březen", "duben", "květen", "červen", "červenec", "srpen", "září", "říjen", "listopad", "prosinec"], monthNamesShort: ["led", "úno", "bře", "dub", "kvě", "čer", "čvc", "srp", "zář", "říj", "lis", "pro"], dayNames: ["neděle", "pondělí", "úterý", "středa", "čtvrtek", "pátek", "sobota"], dayNamesShort: ["ne", "po", "út", "st", "čt", "pá", "so"], dayNamesMin: ["ne", "po", "út", "st", "čt", "pá", "so"], weekHeader: "Týd", dateFormat: "dd.mm.yy", firstDay: 1, isRTL: !1, showMonthAfterYear: !1, yearSuffix: "" }), e.fullCalendar.lang("cs", { defaultButtonText: { month: "Měsíc", week: "Týden", day: "Den", list: "Agenda" }, allDayText: "Celý den", eventLimitText: function (e) { return "+další: " + e } }) }(), function () { (t.defineLocale || t.lang).call(t, "da", { months: "januar_februar_marts_april_maj_juni_juli_august_september_oktober_november_december".split("_"), monthsShort: "jan_feb_mar_apr_maj_jun_jul_aug_sep_okt_nov_dec".split("_"), weekdays: "søndag_mandag_tirsdag_onsdag_torsdag_fredag_lørdag".split("_"), weekdaysShort: "søn_man_tir_ons_tor_fre_lør".split("_"), weekdaysMin: "sø_ma_ti_on_to_fr_lø".split("_"), longDateFormat: { LT: "HH:mm", L: "DD/MM/YYYY", LL: "D. MMMM YYYY", LLL: "D. MMMM YYYY LT", LLLL: "dddd [d.] D. MMMM YYYY LT" }, calendar: { sameDay: "[I dag kl.] LT", nextDay: "[I morgen kl.] LT", nextWeek: "dddd [kl.] LT", lastDay: "[I går kl.] LT", lastWeek: "[sidste] dddd [kl] LT", sameElse: "L" }, relativeTime: { future: "om %s", past: "%s siden", s: "få sekunder", m: "et minut", mm: "%d minutter", h: "en time", hh: "%d timer", d: "en dag", dd: "%d dage", M: "en måned", MM: "%d måneder", y: "et år", yy: "%d år" }, ordinal: "%d.", week: { dow: 1, doy: 4 } }), e.fullCalendar.datepickerLang("da", "da", { closeText: "Luk", prevText: "&#x3C;Forrige", nextText: "Næste&#x3E;", currentText: "Idag", monthNames: ["Januar", "Februar", "Marts", "April", "Maj", "Juni", "Juli", "August", "September", "Oktober", "November", "December"], monthNamesShort: ["Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"], dayNames: ["Søndag", "Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag"], dayNamesShort: ["Søn", "Man", "Tir", "Ons", "Tor", "Fre", "Lør"], dayNamesMin: ["Sø", "Ma", "Ti", "On", "To", "Fr", "Lø"], weekHeader: "Uge", dateFormat: "dd-mm-yy", firstDay: 1, isRTL: !1, showMonthAfterYear: !1, yearSuffix: "" }), e.fullCalendar.lang("da", { defaultButtonText: { month: "Måned", week: "Uge", day: "Dag", list: "Agenda" }, allDayText: "Hele dagen", eventLimitText: "flere" }) }(), function () { function a(e, t, a) { var n = { m: ["eine Minute", "einer Minute"], h: ["eine Stunde", "einer Stunde"], d: ["ein Tag", "einem Tag"], dd: [e + " Tage", e + " Tagen"], M: ["ein Monat", "einem Monat"], MM: [e + " Monate", e + " Monaten"], y: ["ein Jahr", "einem Jahr"], yy: [e + " Jahre", e + " Jahren"] }; return t ? n[a][0] : n[a][1] } (t.defineLocale || t.lang).call(t, "de-at", { months: "Jänner_Februar_März_April_Mai_Juni_Juli_August_September_Oktober_November_Dezember".split("_"), monthsShort: "Jän._Febr._Mrz._Apr._Mai_Jun._Jul._Aug._Sept._Okt._Nov._Dez.".split("_"), weekdays: "Sonntag_Montag_Dienstag_Mittwoch_Donnerstag_Freitag_Samstag".split("_"), weekdaysShort: "So._Mo._Di._Mi._Do._Fr._Sa.".split("_"), weekdaysMin: "So_Mo_Di_Mi_Do_Fr_Sa".split("_"), longDateFormat: { LT: "HH:mm [Uhr]", L: "DD.MM.YYYY", LL: "D. MMMM YYYY", LLL: "D. MMMM YYYY LT", LLLL: "dddd, D. MMMM YYYY LT" }, calendar: { sameDay: "[Heute um] LT", sameElse: "L", nextDay: "[Morgen um] LT", nextWeek: "dddd [um] LT", lastDay: "[Gestern um] LT", lastWeek: "[letzten] dddd [um] LT" }, relativeTime: { future: "in %s", past: "vor %s", s: "ein paar Sekunden", m: a, mm: "%d Minuten", h: a, hh: "%d Stunden", d: a, dd: a, M: a, MM: a, y: a, yy: a }, ordinal: "%d.", week: { dow: 1, doy: 4 } }), e.fullCalendar.datepickerLang("de-at", "de", { closeText: "Schließen", prevText: "&#x3C;Zurück", nextText: "Vor&#x3E;", currentText: "Heute", monthNames: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"], monthNamesShort: ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"], dayNames: ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"], dayNamesShort: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"], dayNamesMin: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"], weekHeader: "KW", dateFormat: "dd.mm.yy", firstDay: 1, isRTL: !1, showMonthAfterYear: !1, yearSuffix: "" }), e.fullCalendar.lang("de-at", { defaultButtonText: { month: "Monat", week: "Woche", day: "Tag", list: "Terminübersicht" }, allDayText: "Ganztägig", eventLimitText: function (e) { return "+ weitere " + e } }) }(), function () { function a(e, t, a) { var n = { m: ["eine Minute", "einer Minute"], h: ["eine Stunde", "einer Stunde"], d: ["ein Tag", "einem Tag"], dd: [e + " Tage", e + " Tagen"], M: ["ein Monat", "einem Monat"], MM: [e + " Monate", e + " Monaten"], y: ["ein Jahr", "einem Jahr"], yy: [e + " Jahre", e + " Jahren"] }; return t ? n[a][0] : n[a][1] } (t.defineLocale || t.lang).call(t, "de", { months: "Januar_Februar_März_April_Mai_Juni_Juli_August_September_Oktober_November_Dezember".split("_"), monthsShort: "Jan._Febr._Mrz._Apr._Mai_Jun._Jul._Aug._Sept._Okt._Nov._Dez.".split("_"), weekdays: "Sonntag_Montag_Dienstag_Mittwoch_Donnerstag_Freitag_Samstag".split("_"), weekdaysShort: "So._Mo._Di._Mi._Do._Fr._Sa.".split("_"), weekdaysMin: "So_Mo_Di_Mi_Do_Fr_Sa".split("_"), longDateFormat: { LT: "HH:mm [Uhr]", L: "DD.MM.YYYY", LL: "D. MMMM YYYY", LLL: "D. MMMM YYYY LT", LLLL: "dddd, D. MMMM YYYY LT" }, calendar: { sameDay: "[Heute um] LT", sameElse: "L", nextDay: "[Morgen um] LT", nextWeek: "dddd [um] LT", lastDay: "[Gestern um] LT", lastWeek: "[letzten] dddd [um] LT" }, relativeTime: { future: "in %s", past: "vor %s", s: "ein paar Sekunden", m: a, mm: "%d Minuten", h: a, hh: "%d Stunden", d: a, dd: a, M: a, MM: a, y: a, yy: a }, ordinal: "%d.", week: { dow: 1, doy: 4 } }), e.fullCalendar.datepickerLang("de", "de", { closeText: "Schließen", prevText: "&#x3C;Zurück", nextText: "Vor&#x3E;", currentText: "Heute", monthNames: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"], monthNamesShort: ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"], dayNames: ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"], dayNamesShort: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"], dayNamesMin: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"], weekHeader: "KW", dateFormat: "dd.mm.yy", firstDay: 1, isRTL: !1, showMonthAfterYear: !1, yearSuffix: "" }), e.fullCalendar.lang("de", { defaultButtonText: { month: "Monat", week: "Woche", day: "Tag", list: "Terminübersicht" }, allDayText: "Ganztägig", eventLimitText: function (e) { return "+ weitere " + e } }) }(), function () { (t.defineLocale || t.lang).call(t, "el", { monthsNominativeEl: "Ιανουάριος_Φεβρουάριος_Μάρτιος_Απρίλιος_Μάιος_Ιούνιος_Ιούλιος_Αύγουστος_Σεπτέμβριος_Οκτώβριος_Νοέμβριος_Δεκέμβριος".split("_"), monthsGenitiveEl: "Ιανουαρίου_Φεβρουαρίου_Μαρτίου_Απριλίου_Μαΐου_Ιουνίου_Ιουλίου_Αυγούστου_Σεπτεμβρίου_Οκτωβρίου_Νοεμβρίου_Δεκεμβρίου".split("_"), months: function (e, t) { return /D/.test(t.substring(0, t.indexOf("MMMM"))) ? this._monthsGenitiveEl[e.month()] : this._monthsNominativeEl[e.month()] }, monthsShort: "Ιαν_Φεβ_Μαρ_Απρ_Μαϊ_Ιουν_Ιουλ_Αυγ_Σεπ_Οκτ_Νοε_Δεκ".split("_"), weekdays: "Κυριακή_Δευτέρα_Τρίτη_Τετάρτη_Πέμπτη_Παρασκευή_Σάββατο".split("_"), weekdaysShort: "Κυρ_Δευ_Τρι_Τετ_Πεμ_Παρ_Σαβ".split("_"), weekdaysMin: "Κυ_Δε_Τρ_Τε_Πε_Πα_Σα".split("_"), meridiem: function (e, t, a) { return e > 11 ? a ? "μμ" : "ΜΜ" : a ? "πμ" : "ΠΜ" }, longDateFormat: { LT: "h:mm A", L: "DD/MM/YYYY", LL: "D MMMM YYYY", LLL: "D MMMM YYYY LT", LLLL: "dddd, D MMMM YYYY LT" }, calendarEl: { sameDay: "[Σήμερα {}] LT", nextDay: "[Αύριο {}] LT", nextWeek: "dddd [{}] LT", lastDay: "[Χθες {}] LT", lastWeek: function () { switch (this.day()) { case 6: return "[το προηγούμενο] dddd [{}] LT"; default: return "[την προηγούμενη] dddd [{}] LT" } }, sameElse: "L" }, calendar: function (e, t) { var a = this._calendarEl[e], n = t && t.hours(); return "function" == typeof a && (a = a.apply(t)), a.replace("{}", 1 === n % 12 ? "στη" : "στις") }, relativeTime: { future: "σε %s", past: "%s πριν", s: "δευτερόλεπτα", m: "ένα λεπτό", mm: "%d λεπτά", h: "μία ώρα", hh: "%d ώρες", d: "μία μέρα", dd: "%d μέρες", M: "ένας μήνας", MM: "%d μήνες", y: "ένας χρόνος", yy: "%d χρόνια" }, ordinal: function (e) { return e + "η" }, week: { dow: 1, doy: 4 } }), e.fullCalendar.datepickerLang("el", "el", { closeText: "Κλείσιμο", prevText: "Προηγούμενος", nextText: "Επόμενος", currentText: "Τρέχων Μήνας", monthNames: ["Ιανουάριος", "Φεβρουάριος", "Μάρτιος", "Απρίλιος", "Μάιος", "Ιούνιος", "Ιούλιος", "Αύγουστος", "Σεπτέμβριος", "Οκτώβριος", "Νοέμβριος", "Δεκέμβριος"], monthNamesShort: ["Ιαν", "Φεβ", "Μαρ", "Απρ", "Μαι", "Ιουν", "Ιουλ", "Αυγ", "Σεπ", "Οκτ", "Νοε", "Δεκ"], dayNames: ["Κυριακή", "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο"], dayNamesShort: ["Κυρ", "Δευ", "Τρι", "Τετ", "Πεμ", "Παρ", "Σαβ"], dayNamesMin: ["Κυ", "Δε", "Τρ", "Τε", "Πε", "Πα", "Σα"], weekHeader: "Εβδ", dateFormat: "dd/mm/yy", firstDay: 1, isRTL: !1, showMonthAfterYear: !1, yearSuffix: "" }), e.fullCalendar.lang("el", { defaultButtonText: { month: "Μήνας", week: "Εβδομάδα", day: "Ημέρα", list: "Ατζέντα" }, allDayText: "Ολοήμερο", eventLimitText: "περισσότερα" }) }(), function () { (t.defineLocale || t.lang).call(t, "en-au", { months: "January_February_March_April_May_June_July_August_September_October_November_December".split("_"), monthsShort: "Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"), weekdays: "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"), weekdaysShort: "Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"), weekdaysMin: "Su_Mo_Tu_We_Th_Fr_Sa".split("_"), longDateFormat: { LT: "h:mm A", L: "DD/MM/YYYY", LL: "D MMMM YYYY", LLL: "D MMMM YYYY LT", LLLL: "dddd, D MMMM YYYY LT" }, calendar: { sameDay: "[Today at] LT", nextDay: "[Tomorrow at] LT", nextWeek: "dddd [at] LT", lastDay: "[Yesterday at] LT", lastWeek: "[Last] dddd [at] LT", sameElse: "L" }, relativeTime: { future: "in %s", past: "%s ago", s: "a few seconds", m: "a minute", mm: "%d minutes", h: "an hour", hh: "%d hours", d: "a day", dd: "%d days", M: "a month", MM: "%d months", y: "a year", yy: "%d years" }, ordinal: function (e) { var t = e % 10, a = 1 === ~~(e % 100 / 10) ? "th" : 1 === t ? "st" : 2 === t ? "nd" : 3 === t ? "rd" : "th"; return e + a }, week: { dow: 1, doy: 4 } }), e.fullCalendar.datepickerLang("en-au", "en-AU", { closeText: "Done", prevText: "Prev", nextText: "Next", currentText: "Today", monthNames: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], monthNamesShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], dayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], dayNamesShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], dayNamesMin: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"], weekHeader: "Wk", dateFormat: "dd/mm/yy", firstDay: 1, isRTL: !1, showMonthAfterYear: !1, yearSuffix: "" }), e.fullCalendar.lang("en-au") }(), function () { (t.defineLocale || t.lang).call(t, "en-ca", { months: "January_February_March_April_May_June_July_August_September_October_November_December".split("_"), monthsShort: "Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"), weekdays: "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"), weekdaysShort: "Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"), weekdaysMin: "Su_Mo_Tu_We_Th_Fr_Sa".split("_"), longDateFormat: { LT: "h:mm A", L: "YYYY-MM-DD", LL: "D MMMM, YYYY", LLL: "D MMMM, YYYY LT", LLLL: "dddd, D MMMM, YYYY LT" }, calendar: { sameDay: "[Today at] LT", nextDay: "[Tomorrow at] LT", nextWeek: "dddd [at] LT", lastDay: "[Yesterday at] LT", lastWeek: "[Last] dddd [at] LT", sameElse: "L" }, relativeTime: { future: "in %s", past: "%s ago", s: "a few seconds", m: "a minute", mm: "%d minutes", h: "an hour", hh: "%d hours", d: "a day", dd: "%d days", M: "a month", MM: "%d months", y: "a year", yy: "%d years" }, ordinal: function (e) { var t = e % 10, a = 1 === ~~(e % 100 / 10) ? "th" : 1 === t ? "st" : 2 === t ? "nd" : 3 === t ? "rd" : "th"; return e + a } }), e.fullCalendar.lang("en-ca") }(), function () { (t.defineLocale || t.lang).call(t, "en-gb", { months: "January_February_March_April_May_June_July_August_September_October_November_December".split("_"), monthsShort: "Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"), weekdays: "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"), weekdaysShort: "Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"), weekdaysMin: "Su_Mo_Tu_We_Th_Fr_Sa".split("_"), longDateFormat: { LT: "HH:mm", L: "DD/MM/YYYY", LL: "D MMMM YYYY", LLL: "D MMMM YYYY LT", LLLL: "dddd, D MMMM YYYY LT" }, calendar: { sameDay: "[Today at] LT", nextDay: "[Tomorrow at] LT", nextWeek: "dddd [at] LT", lastDay: "[Yesterday at] LT", lastWeek: "[Last] dddd [at] LT", sameElse: "L" }, relativeTime: { future: "in %s", past: "%s ago", s: "a few seconds", m: "a minute", mm: "%d minutes", h: "an hour", hh: "%d hours", d: "a day", dd: "%d days", M: "a month", MM: "%d months", y: "a year", yy: "%d years" }, ordinal: function (e) { var t = e % 10, a = 1 === ~~(e % 100 / 10) ? "th" : 1 === t ? "st" : 2 === t ? "nd" : 3 === t ? "rd" : "th"; return e + a }, week: { dow: 1, doy: 4 } }), e.fullCalendar.datepickerLang("en-gb", "en-GB", { closeText: "Done", prevText: "Prev", nextText: "Next", currentText: "Today", monthNames: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], monthNamesShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], dayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], dayNamesShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], dayNamesMin: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"], weekHeader: "Wk", dateFormat: "dd/mm/yy", firstDay: 1, isRTL: !1, showMonthAfterYear: !1, yearSuffix: "" }), e.fullCalendar.lang("en-gb", { columnFormat: { week: "ddd D/M" } }) }(), function () { var a = "ene._feb._mar._abr._may._jun._jul._ago._sep._oct._nov._dic.".split("_"), n = "ene_feb_mar_abr_may_jun_jul_ago_sep_oct_nov_dic".split("_"); (t.defineLocale || t.lang).call(t, "es", { months: "enero_febrero_marzo_abril_mayo_junio_julio_agosto_septiembre_octubre_noviembre_diciembre".split("_"), monthsShort: function (e, t) { return /-MMM-/.test(t) ? n[e.month()] : a[e.month()] }, weekdays: "domingo_lunes_martes_miércoles_jueves_viernes_sábado".split("_"), weekdaysShort: "dom._lun._mar._mié._jue._vie._sáb.".split("_"), weekdaysMin: "Do_Lu_Ma_Mi_Ju_Vi_Sá".split("_"), longDateFormat: { LT: "H:mm", L: "DD/MM/YYYY", LL: "D [de] MMMM [del] YYYY", LLL: "D [de] MMMM [del] YYYY LT", LLLL: "dddd, D [de] MMMM [del] YYYY LT" }, calendar: { sameDay: function () { return "[hoy a la" + (1 !== this.hours() ? "s" : "") + "] LT" }, nextDay: function () { return "[mañana a la" + (1 !== this.hours() ? "s" : "") + "] LT" }, nextWeek: function () { return "dddd [a la" + (1 !== this.hours() ? "s" : "") + "] LT" }, lastDay: function () { return "[ayer a la" + (1 !== this.hours() ? "s" : "") + "] LT" }, lastWeek: function () { return "[el] dddd [pasado a la" + (1 !== this.hours() ? "s" : "") + "] LT" }, sameElse: "L" }, relativeTime: { future: "en %s", past: "hace %s", s: "unos segundos", m: "un minuto", mm: "%d minutos", h: "una hora", hh: "%d horas", d: "un día", dd: "%d días", M: "un mes", MM: "%d meses", y: "un año", yy: "%d años" }, ordinal: "%dº", week: { dow: 1, doy: 4 } }), e.fullCalendar.datepickerLang("es", "es", { closeText: "Cerrar", prevText: "&#x3C;Ant", nextText: "Sig&#x3E;", currentText: "Hoy", monthNames: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"], monthNamesShort: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"], dayNames: ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"], dayNamesShort: ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"], dayNamesMin: ["D", "L", "M", "X", "J", "V", "S"], weekHeader: "Sm", dateFormat: "dd/mm/yy", firstDay: 1, isRTL: !1, showMonthAfterYear: !1, yearSuffix: "" }), e.fullCalendar.lang("es", { defaultButtonText: { month: "Mes", week: "Semana", day: "Día", list: "Agenda" }, allDayHtml: "Todo<br/>el día", eventLimitText: "más" }) }(), function () { var a = { 1: "۱", 2: "۲", 3: "۳", 4: "۴", 5: "۵", 6: "۶", 7: "۷", 8: "۸", 9: "۹", 0: "۰" }, n = { "۱": "1", "۲": "2", "۳": "3", "۴": "4", "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9", "۰": "0" }; (t.defineLocale || t.lang).call(t, "fa", { months: "ژانویه_فوریه_مارس_آوریل_مه_ژوئن_ژوئیه_اوت_سپتامبر_اکتبر_نوامبر_دسامبر".split("_"), monthsShort: "ژانویه_فوریه_مارس_آوریل_مه_ژوئن_ژوئیه_اوت_سپتامبر_اکتبر_نوامبر_دسامبر".split("_"), weekdays: "یک‌شنبه_دوشنبه_سه‌شنبه_چهارشنبه_پنج‌شنبه_جمعه_شنبه".split("_"), weekdaysShort: "یک‌شنبه_دوشنبه_سه‌شنبه_چهارشنبه_پنج‌شنبه_جمعه_شنبه".split("_"), weekdaysMin: "ی_د_س_چ_پ_ج_ش".split("_"), longDateFormat: { LT: "HH:mm", L: "DD/MM/YYYY", LL: "D MMMM YYYY", LLL: "D MMMM YYYY LT", LLLL: "dddd, D MMMM YYYY LT" }, meridiem: function (e) { return 12 > e ? "قبل از ظهر" : "بعد از ظهر" }, calendar: { sameDay: "[امروز ساعت] LT", nextDay: "[فردا ساعت] LT", nextWeek: "dddd [ساعت] LT", lastDay: "[دیروز ساعت] LT", lastWeek: "dddd [پیش] [ساعت] LT", sameElse: "L" }, relativeTime: { future: "در %s", past: "%s پیش", s: "چندین ثانیه", m: "یک دقیقه", mm: "%d دقیقه", h: "یک ساعت", hh: "%d ساعت", d: "یک روز", dd: "%d روز", M: "یک ماه", MM: "%d ماه", y: "یک سال", yy: "%d سال" }, preparse: function (e) { return e.replace(/[۰-۹]/g, function (e) { return n[e] }).replace(/،/g, ",") }, postformat: function (e) { return e.replace(/\d/g, function (e) { return a[e] }).replace(/,/g, "،") }, ordinal: "%dم", week: { dow: 6, doy: 12 } }), e.fullCalendar.datepickerLang("fa", "fa", { closeText: "بستن", prevText: "&#x3C;قبلی", nextText: "بعدی&#x3E;", currentText: "امروز", monthNames: ["فروردين", "ارديبهشت", "خرداد", "تير", "مرداد", "شهريور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"], monthNamesShort: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"], dayNames: ["يکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"], dayNamesShort: ["ی", "د", "س", "چ", "پ", "ج", "ش"], dayNamesMin: ["ی", "د", "س", "چ", "پ", "ج", "ش"], weekHeader: "هف", dateFormat: "yy/mm/dd", firstDay: 6, isRTL: !0, showMonthAfterYear: !1, yearSuffix: "" }), e.fullCalendar.lang("fa", { defaultButtonText: { month: "ماه", week: "هفته", day: "روز", list: "برنامه" }, allDayText: "تمام روز", eventLimitText: function (e) { return "بیش از " + e } }) }(), function () { function a(e, t, a, r) { var i = ""; switch (a) { case "s": return r ? "muutaman sekunnin" : "muutama sekunti"; case "m": return r ? "minuutin" : "minuutti"; case "mm": i = r ? "minuutin" : "minuuttia"; break; case "h": return r ? "tunnin" : "tunti"; case "hh": i = r ? "tunnin" : "tuntia"; break; case "d": return r ? "päivän" : "päivä"; case "dd": i = r ? "päivän" : "päivää"; break; case "M": return r ? "kuukauden" : "kuukausi"; case "MM": i = r ? "kuukauden" : "kuukautta"; break; case "y": return r ? "vuoden" : "vuosi"; case "yy": i = r ? "vuoden" : "vuotta" } return i = n(e, r) + " " + i } function n(e, t) { return 10 > e ? t ? i[e] : r[e] : e } var r = "nolla yksi kaksi kolme neljä viisi kuusi seitsemän kahdeksan yhdeksän".split(" "), i = ["nolla", "yhden", "kahden", "kolmen", "neljän", "viiden", "kuuden", r[7], r[8], r[9]]; (t.defineLocale || t.lang).call(t, "fi", { months: "tammikuu_helmikuu_maaliskuu_huhtikuu_toukokuu_kesäkuu_heinäkuu_elokuu_syyskuu_lokakuu_marraskuu_joulukuu".split("_"), monthsShort: "tammi_helmi_maalis_huhti_touko_kesä_heinä_elo_syys_loka_marras_joulu".split("_"), weekdays: "sunnuntai_maanantai_tiistai_keskiviikko_torstai_perjantai_lauantai".split("_"), weekdaysShort: "su_ma_ti_ke_to_pe_la".split("_"), weekdaysMin: "su_ma_ti_ke_to_pe_la".split("_"), longDateFormat: { LT: "HH.mm", L: "DD.MM.YYYY", LL: "Do MMMM[ta] YYYY", LLL: "Do MMMM[ta] YYYY, [klo] LT", LLLL: "dddd, Do MMMM[ta] YYYY, [klo] LT", l: "D.M.YYYY", ll: "Do MMM YYYY", lll: "Do MMM YYYY, [klo] LT", llll: "ddd, Do MMM YYYY, [klo] LT" }, calendar: { sameDay: "[tänään] [klo] LT", nextDay: "[huomenna] [klo] LT", nextWeek: "dddd [klo] LT", lastDay: "[eilen] [klo] LT", lastWeek: "[viime] dddd[na] [klo] LT", sameElse: "L" }, relativeTime: { future: "%s päästä", past: "%s sitten", s: a, m: a, mm: a, h: a, hh: a, d: a, dd: a, M: a, MM: a, y: a, yy: a }, ordinal: "%d.", week: { dow: 1, doy: 4 } }), e.fullCalendar.datepickerLang("fi", "fi", { closeText: "Sulje", prevText: "&#xAB;Edellinen", nextText: "Seuraava&#xBB;", currentText: "Tänään", monthNames: ["Tammikuu", "Helmikuu", "Maaliskuu", "Huhtikuu", "Toukokuu", "Kesäkuu", "Heinäkuu", "Elokuu", "Syyskuu", "Lokakuu", "Marraskuu", "Joulukuu"], monthNamesShort: ["Tammi", "Helmi", "Maalis", "Huhti", "Touko", "Kesä", "Heinä", "Elo", "Syys", "Loka", "Marras", "Joulu"], dayNamesShort: ["Su", "Ma", "Ti", "Ke", "To", "Pe", "La"], dayNames: ["Sunnuntai", "Maanantai", "Tiistai", "Keskiviikko", "Torstai", "Perjantai", "Lauantai"], dayNamesMin: ["Su", "Ma", "Ti", "Ke", "To", "Pe", "La"], weekHeader: "Vk", dateFormat: "d.m.yy", firstDay: 1, isRTL: !1, showMonthAfterYear: !1, yearSuffix: "" }), e.fullCalendar.lang("fi", { defaultButtonText: { month: "Kuukausi", week: "Viikko", day: "Päivä", list: "Tapahtumat" }, allDayText: "Koko päivä", eventLimitText: "lisää" }) }(), function () {
        (t.defineLocale || t.lang).call(t, "fr-ca", {
            months: "janvier_février_mars_avril_mai_juin_juillet_août_septembre_octobre_novembre_décembre".split("_"), monthsShort: "janv._févr._mars_avr._mai_juin_juil._août_sept._oct._nov._déc.".split("_"), weekdays: "dimanche_lundi_mardi_mercredi_jeudi_vendredi_samedi".split("_"), weekdaysShort: "dim._lun._mar._mer._jeu._ven._sam.".split("_"), weekdaysMin: "Di_Lu_Ma_Me_Je_Ve_Sa".split("_"), longDateFormat: { LT: "HH:mm", L: "YYYY-MM-DD", LL: "D MMMM YYYY", LLL: "D MMMM YYYY LT", LLLL: "dddd D MMMM YYYY LT" }, calendar: { sameDay: "[Aujourd'hui à] LT", nextDay: "[Demain à] LT", nextWeek: "dddd [à] LT", lastDay: "[Hier à] LT", lastWeek: "dddd [dernier à] LT", sameElse: "L" }, relativeTime: { future: "dans %s", past: "il y a %s", s: "quelques secondes", m: "une minute", mm: "%d minutes", h: "une heure", hh: "%d heures", d: "un jour", dd: "%d jours", M: "un mois", MM: "%d mois", y: "un an", yy: "%d ans" }, ordinal: function (e) {
                return e + (1 === e ? "er" : "")
            }
        }), e.fullCalendar.datepickerLang("fr-ca", "fr-CA", { closeText: "Fermer", prevText: "Précédent", nextText: "Suivant", currentText: "Aujourd'hui", monthNames: ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"], monthNamesShort: ["janv.", "févr.", "mars", "avril", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."], dayNames: ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"], dayNamesShort: ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."], dayNamesMin: ["D", "L", "M", "M", "J", "V", "S"], weekHeader: "Sem.", dateFormat: "yy-mm-dd", firstDay: 0, isRTL: !1, showMonthAfterYear: !1, yearSuffix: "" }), e.fullCalendar.lang("fr-ca", { defaultButtonText: { month: "Mois", week: "Semaine", day: "Jour", list: "Mon planning" }, allDayHtml: "Toute la<br/>journée", eventLimitText: "en plus" })
    }(), function () { (t.defineLocale || t.lang).call(t, "fr", { months: "janvier_février_mars_avril_mai_juin_juillet_août_septembre_octobre_novembre_décembre".split("_"), monthsShort: "janv._févr._mars_avr._mai_juin_juil._août_sept._oct._nov._déc.".split("_"), weekdays: "dimanche_lundi_mardi_mercredi_jeudi_vendredi_samedi".split("_"), weekdaysShort: "dim._lun._mar._mer._jeu._ven._sam.".split("_"), weekdaysMin: "Di_Lu_Ma_Me_Je_Ve_Sa".split("_"), longDateFormat: { LT: "HH:mm", L: "DD/MM/YYYY", LL: "D MMMM YYYY", LLL: "D MMMM YYYY LT", LLLL: "dddd D MMMM YYYY LT" }, calendar: { sameDay: "[Aujourd'hui à] LT", nextDay: "[Demain à] LT", nextWeek: "dddd [à] LT", lastDay: "[Hier à] LT", lastWeek: "dddd [dernier à] LT", sameElse: "L" }, relativeTime: { future: "dans %s", past: "il y a %s", s: "quelques secondes", m: "une minute", mm: "%d minutes", h: "une heure", hh: "%d heures", d: "un jour", dd: "%d jours", M: "un mois", MM: "%d mois", y: "un an", yy: "%d ans" }, ordinal: function (e) { return e + (1 === e ? "er" : "") }, week: { dow: 1, doy: 4 } }), e.fullCalendar.datepickerLang("fr", "fr", { closeText: "Fermer", prevText: "Précédent", nextText: "Suivant", currentText: "Aujourd'hui", monthNames: ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"], monthNamesShort: ["janv.", "févr.", "mars", "avril", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."], dayNames: ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"], dayNamesShort: ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."], dayNamesMin: ["D", "L", "M", "M", "J", "V", "S"], weekHeader: "Sem.", dateFormat: "dd/mm/yy", firstDay: 1, isRTL: !1, showMonthAfterYear: !1, yearSuffix: "" }), e.fullCalendar.lang("fr", { defaultButtonText: { month: "Mois", week: "Semaine", day: "Jour", list: "Mon planning" }, allDayHtml: "Toute la<br/>journée", eventLimitText: "en plus" }) }(), function () { var a = { 1: "१", 2: "२", 3: "३", 4: "४", 5: "५", 6: "६", 7: "७", 8: "८", 9: "९", 0: "०" }, n = { "१": "1", "२": "2", "३": "3", "४": "4", "५": "5", "६": "6", "७": "7", "८": "8", "९": "9", "०": "0" }; (t.defineLocale || t.lang).call(t, "hi", { months: "जनवरी_फ़रवरी_मार्च_अप्रैल_मई_जून_जुलाई_अगस्त_सितम्बर_अक्टूबर_नवम्बर_दिसम्बर".split("_"), monthsShort: "जन._फ़र._मार्च_अप्रै._मई_जून_जुल._अग._सित._अक्टू._नव._दिस.".split("_"), weekdays: "रविवार_सोमवार_मंगलवार_बुधवार_गुरूवार_शुक्रवार_शनिवार".split("_"), weekdaysShort: "रवि_सोम_मंगल_बुध_गुरू_शुक्र_शनि".split("_"), weekdaysMin: "र_सो_मं_बु_गु_शु_श".split("_"), longDateFormat: { LT: "A h:mm बजे", L: "DD/MM/YYYY", LL: "D MMMM YYYY", LLL: "D MMMM YYYY, LT", LLLL: "dddd, D MMMM YYYY, LT" }, calendar: { sameDay: "[आज] LT", nextDay: "[कल] LT", nextWeek: "dddd, LT", lastDay: "[कल] LT", lastWeek: "[पिछले] dddd, LT", sameElse: "L" }, relativeTime: { future: "%s में", past: "%s पहले", s: "कुछ ही क्षण", m: "एक मिनट", mm: "%d मिनट", h: "एक घंटा", hh: "%d घंटे", d: "एक दिन", dd: "%d दिन", M: "एक महीने", MM: "%d महीने", y: "एक वर्ष", yy: "%d वर्ष" }, preparse: function (e) { return e.replace(/[१२३४५६७८९०]/g, function (e) { return n[e] }) }, postformat: function (e) { return e.replace(/\d/g, function (e) { return a[e] }) }, meridiem: function (e) { return 4 > e ? "रात" : 10 > e ? "सुबह" : 17 > e ? "दोपहर" : 20 > e ? "शाम" : "रात" }, week: { dow: 0, doy: 6 } }), e.fullCalendar.datepickerLang("hi", "hi", { closeText: "बंद", prevText: "पिछला", nextText: "अगला", currentText: "आज", monthNames: ["जनवरी ", "फरवरी", "मार्च", "अप्रेल", "मई", "जून", "जूलाई", "अगस्त ", "सितम्बर", "अक्टूबर", "नवम्बर", "दिसम्बर"], monthNamesShort: ["जन", "फर", "मार्च", "अप्रेल", "मई", "जून", "जूलाई", "अग", "सित", "अक्ट", "नव", "दि"], dayNames: ["रविवार", "सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार"], dayNamesShort: ["रवि", "सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि"], dayNamesMin: ["रवि", "सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि"], weekHeader: "हफ्ता", dateFormat: "dd/mm/yy", firstDay: 1, isRTL: !1, showMonthAfterYear: !1, yearSuffix: "" }), e.fullCalendar.lang("hi", { defaultButtonText: { month: "महीना", week: "सप्ताह", day: "दिन", list: "कार्यसूची" }, allDayText: "सभी दिन", eventLimitText: function (e) { return "+अधिक " + e } }) }(), function () { function a(e, t, a) { var n = e + " "; switch (a) { case "m": return t ? "jedna minuta" : "jedne minute"; case "mm": return n += 1 === e ? "minuta" : 2 === e || 3 === e || 4 === e ? "minute" : "minuta"; case "h": return t ? "jedan sat" : "jednog sata"; case "hh": return n += 1 === e ? "sat" : 2 === e || 3 === e || 4 === e ? "sata" : "sati"; case "dd": return n += 1 === e ? "dan" : "dana"; case "MM": return n += 1 === e ? "mjesec" : 2 === e || 3 === e || 4 === e ? "mjeseca" : "mjeseci"; case "yy": return n += 1 === e ? "godina" : 2 === e || 3 === e || 4 === e ? "godine" : "godina" } } (t.defineLocale || t.lang).call(t, "hr", { months: "sječanj_veljača_ožujak_travanj_svibanj_lipanj_srpanj_kolovoz_rujan_listopad_studeni_prosinac".split("_"), monthsShort: "sje._vel._ožu._tra._svi._lip._srp._kol._ruj._lis._stu._pro.".split("_"), weekdays: "nedjelja_ponedjeljak_utorak_srijeda_četvrtak_petak_subota".split("_"), weekdaysShort: "ned._pon._uto._sri._čet._pet._sub.".split("_"), weekdaysMin: "ne_po_ut_sr_če_pe_su".split("_"), longDateFormat: { LT: "H:mm", L: "DD. MM. YYYY", LL: "D. MMMM YYYY", LLL: "D. MMMM YYYY LT", LLLL: "dddd, D. MMMM YYYY LT" }, calendar: { sameDay: "[danas u] LT", nextDay: "[sutra u] LT", nextWeek: function () { switch (this.day()) { case 0: return "[u] [nedjelju] [u] LT"; case 3: return "[u] [srijedu] [u] LT"; case 6: return "[u] [subotu] [u] LT"; case 1: case 2: case 4: case 5: return "[u] dddd [u] LT" } }, lastDay: "[jučer u] LT", lastWeek: function () { switch (this.day()) { case 0: case 3: return "[prošlu] dddd [u] LT"; case 6: return "[prošle] [subote] [u] LT"; case 1: case 2: case 4: case 5: return "[prošli] dddd [u] LT" } }, sameElse: "L" }, relativeTime: { future: "za %s", past: "prije %s", s: "par sekundi", m: a, mm: a, h: a, hh: a, d: "dan", dd: a, M: "mjesec", MM: a, y: "godinu", yy: a }, ordinal: "%d.", week: { dow: 1, doy: 7 } }), e.fullCalendar.datepickerLang("hr", "hr", { closeText: "Zatvori", prevText: "&#x3C;", nextText: "&#x3E;", currentText: "Danas", monthNames: ["Siječanj", "Veljača", "Ožujak", "Travanj", "Svibanj", "Lipanj", "Srpanj", "Kolovoz", "Rujan", "Listopad", "Studeni", "Prosinac"], monthNamesShort: ["Sij", "Velj", "Ožu", "Tra", "Svi", "Lip", "Srp", "Kol", "Ruj", "Lis", "Stu", "Pro"], dayNames: ["Nedjelja", "Ponedjeljak", "Utorak", "Srijeda", "Četvrtak", "Petak", "Subota"], dayNamesShort: ["Ned", "Pon", "Uto", "Sri", "Čet", "Pet", "Sub"], dayNamesMin: ["Ne", "Po", "Ut", "Sr", "Če", "Pe", "Su"], weekHeader: "Tje", dateFormat: "dd.mm.yy.", firstDay: 1, isRTL: !1, showMonthAfterYear: !1, yearSuffix: "" }), e.fullCalendar.lang("hr", { defaultButtonText: { month: "Mjesec", week: "Tjedan", day: "Dan", list: "Raspored" }, allDayText: "Cijeli dan", eventLimitText: function (e) { return "+ još " + e } }) }(), function () { function a(e, t, a, n) { var r = e; switch (a) { case "s": return n || t ? "néhány másodperc" : "néhány másodperce"; case "m": return "egy" + (n || t ? " perc" : " perce"); case "mm": return r + (n || t ? " perc" : " perce"); case "h": return "egy" + (n || t ? " óra" : " órája"); case "hh": return r + (n || t ? " óra" : " órája"); case "d": return "egy" + (n || t ? " nap" : " napja"); case "dd": return r + (n || t ? " nap" : " napja"); case "M": return "egy" + (n || t ? " hónap" : " hónapja"); case "MM": return r + (n || t ? " hónap" : " hónapja"); case "y": return "egy" + (n || t ? " év" : " éve"); case "yy": return r + (n || t ? " év" : " éve") } return "" } function n(e) { return (e ? "" : "[múlt] ") + "[" + r[this.day()] + "] LT[-kor]" } var r = "vasárnap hétfőn kedden szerdán csütörtökön pénteken szombaton".split(" "); (t.defineLocale || t.lang).call(t, "hu", { months: "január_február_március_április_május_június_július_augusztus_szeptember_október_november_december".split("_"), monthsShort: "jan_feb_márc_ápr_máj_jún_júl_aug_szept_okt_nov_dec".split("_"), weekdays: "vasárnap_hétfő_kedd_szerda_csütörtök_péntek_szombat".split("_"), weekdaysShort: "vas_hét_kedd_sze_csüt_pén_szo".split("_"), weekdaysMin: "v_h_k_sze_cs_p_szo".split("_"), longDateFormat: { LT: "H:mm", L: "YYYY.MM.DD.", LL: "YYYY. MMMM D.", LLL: "YYYY. MMMM D., LT", LLLL: "YYYY. MMMM D., dddd LT" }, meridiem: function (e, t, a) { return 12 > e ? a === !0 ? "de" : "DE" : a === !0 ? "du" : "DU" }, calendar: { sameDay: "[ma] LT[-kor]", nextDay: "[holnap] LT[-kor]", nextWeek: function () { return n.call(this, !0) }, lastDay: "[tegnap] LT[-kor]", lastWeek: function () { return n.call(this, !1) }, sameElse: "L" }, relativeTime: { future: "%s múlva", past: "%s", s: a, m: a, mm: a, h: a, hh: a, d: a, dd: a, M: a, MM: a, y: a, yy: a }, ordinal: "%d.", week: { dow: 1, doy: 7 } }), e.fullCalendar.datepickerLang("hu", "hu", { closeText: "bezár", prevText: "vissza", nextText: "előre", currentText: "ma", monthNames: ["Január", "Február", "Március", "Április", "Május", "Június", "Július", "Augusztus", "Szeptember", "Október", "November", "December"], monthNamesShort: ["Jan", "Feb", "Már", "Ápr", "Máj", "Jún", "Júl", "Aug", "Szep", "Okt", "Nov", "Dec"], dayNames: ["Vasárnap", "Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat"], dayNamesShort: ["Vas", "Hét", "Ked", "Sze", "Csü", "Pén", "Szo"], dayNamesMin: ["V", "H", "K", "Sze", "Cs", "P", "Szo"], weekHeader: "Hét", dateFormat: "yy.mm.dd.", firstDay: 1, isRTL: !1, showMonthAfterYear: !0, yearSuffix: "" }), e.fullCalendar.lang("hu", { defaultButtonText: { month: "Hónap", week: "Hét", day: "Nap", list: "Napló" }, allDayText: "Egész nap", eventLimitText: "további" }) }(), function () { (t.defineLocale || t.lang).call(t, "id", { months: "Januari_Februari_Maret_April_Mei_Juni_Juli_Agustus_September_Oktober_November_Desember".split("_"), monthsShort: "Jan_Feb_Mar_Apr_Mei_Jun_Jul_Ags_Sep_Okt_Nov_Des".split("_"), weekdays: "Minggu_Senin_Selasa_Rabu_Kamis_Jumat_Sabtu".split("_"), weekdaysShort: "Min_Sen_Sel_Rab_Kam_Jum_Sab".split("_"), weekdaysMin: "Mg_Sn_Sl_Rb_Km_Jm_Sb".split("_"), longDateFormat: { LT: "HH.mm", L: "DD/MM/YYYY", LL: "D MMMM YYYY", LLL: "D MMMM YYYY [pukul] LT", LLLL: "dddd, D MMMM YYYY [pukul] LT" }, meridiem: function (e) { return 11 > e ? "pagi" : 15 > e ? "siang" : 19 > e ? "sore" : "malam" }, calendar: { sameDay: "[Hari ini pukul] LT", nextDay: "[Besok pukul] LT", nextWeek: "dddd [pukul] LT", lastDay: "[Kemarin pukul] LT", lastWeek: "dddd [lalu pukul] LT", sameElse: "L" }, relativeTime: { future: "dalam %s", past: "%s yang lalu", s: "beberapa detik", m: "semenit", mm: "%d menit", h: "sejam", hh: "%d jam", d: "sehari", dd: "%d hari", M: "sebulan", MM: "%d bulan", y: "setahun", yy: "%d tahun" }, week: { dow: 1, doy: 7 } }), e.fullCalendar.datepickerLang("id", "id", { closeText: "Tutup", prevText: "&#x3C;mundur", nextText: "maju&#x3E;", currentText: "hari ini", monthNames: ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "Nopember", "Desember"], monthNamesShort: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agus", "Sep", "Okt", "Nop", "Des"], dayNames: ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"], dayNamesShort: ["Min", "Sen", "Sel", "Rab", "kam", "Jum", "Sab"], dayNamesMin: ["Mg", "Sn", "Sl", "Rb", "Km", "jm", "Sb"], weekHeader: "Mg", dateFormat: "dd/mm/yy", firstDay: 0, isRTL: !1, showMonthAfterYear: !1, yearSuffix: "" }), e.fullCalendar.lang("id", { defaultButtonText: { month: "Bulan", week: "Minggu", day: "Hari", list: "Agenda" }, allDayHtml: "Sehari<br/>penuh", eventLimitText: "lebih" }) }(), function () { function a(e) { return 11 === e % 100 ? !0 : 1 === e % 10 ? !1 : !0 } function n(e, t, n, r) { var i = e + " "; switch (n) { case "s": return t || r ? "nokkrar sekúndur" : "nokkrum sekúndum"; case "m": return t ? "mínúta" : "mínútu"; case "mm": return a(e) ? i + (t || r ? "mínútur" : "mínútum") : t ? i + "mínúta" : i + "mínútu"; case "hh": return a(e) ? i + (t || r ? "klukkustundir" : "klukkustundum") : i + "klukkustund"; case "d": return t ? "dagur" : r ? "dag" : "degi"; case "dd": return a(e) ? t ? i + "dagar" : i + (r ? "daga" : "dögum") : t ? i + "dagur" : i + (r ? "dag" : "degi"); case "M": return t ? "mánuður" : r ? "mánuð" : "mánuði"; case "MM": return a(e) ? t ? i + "mánuðir" : i + (r ? "mánuði" : "mánuðum") : t ? i + "mánuður" : i + (r ? "mánuð" : "mánuði"); case "y": return t || r ? "ár" : "ári"; case "yy": return a(e) ? i + (t || r ? "ár" : "árum") : i + (t || r ? "ár" : "ári") } } (t.defineLocale || t.lang).call(t, "is", { months: "janúar_febrúar_mars_apríl_maí_júní_júlí_ágúst_september_október_nóvember_desember".split("_"), monthsShort: "jan_feb_mar_apr_maí_jún_júl_ágú_sep_okt_nóv_des".split("_"), weekdays: "sunnudagur_mánudagur_þriðjudagur_miðvikudagur_fimmtudagur_föstudagur_laugardagur".split("_"), weekdaysShort: "sun_mán_þri_mið_fim_fös_lau".split("_"), weekdaysMin: "Su_Má_Þr_Mi_Fi_Fö_La".split("_"), longDateFormat: { LT: "H:mm", L: "DD/MM/YYYY", LL: "D. MMMM YYYY", LLL: "D. MMMM YYYY [kl.] LT", LLLL: "dddd, D. MMMM YYYY [kl.] LT" }, calendar: { sameDay: "[í dag kl.] LT", nextDay: "[á morgun kl.] LT", nextWeek: "dddd [kl.] LT", lastDay: "[í gær kl.] LT", lastWeek: "[síðasta] dddd [kl.] LT", sameElse: "L" }, relativeTime: { future: "eftir %s", past: "fyrir %s síðan", s: n, m: n, mm: n, h: "klukkustund", hh: n, d: n, dd: n, M: n, MM: n, y: n, yy: n }, ordinal: "%d.", week: { dow: 1, doy: 4 } }), e.fullCalendar.datepickerLang("is", "is", { closeText: "Loka", prevText: "&#x3C; Fyrri", nextText: "Næsti &#x3E;", currentText: "Í dag", monthNames: ["Janúar", "Febrúar", "Mars", "Apríl", "Maí", "Júní", "Júlí", "Ágúst", "September", "Október", "Nóvember", "Desember"], monthNamesShort: ["Jan", "Feb", "Mar", "Apr", "Maí", "Jún", "Júl", "Ágú", "Sep", "Okt", "Nóv", "Des"], dayNames: ["Sunnudagur", "Mánudagur", "Þriðjudagur", "Miðvikudagur", "Fimmtudagur", "Föstudagur", "Laugardagur"], dayNamesShort: ["Sun", "Mán", "Þri", "Mið", "Fim", "Fös", "Lau"], dayNamesMin: ["Su", "Má", "Þr", "Mi", "Fi", "Fö", "La"], weekHeader: "Vika", dateFormat: "dd.mm.yy", firstDay: 0, isRTL: !1, showMonthAfterYear: !1, yearSuffix: "" }), e.fullCalendar.lang("is", { defaultButtonText: { month: "Mánuður", week: "Vika", day: "Dagur", list: "Dagskrá" }, allDayHtml: "Allan<br/>daginn", eventLimitText: "meira" }) }(), function () { (t.defineLocale || t.lang).call(t, "it", { months: "gennaio_febbraio_marzo_aprile_maggio_giugno_luglio_agosto_settembre_ottobre_novembre_dicembre".split("_"), monthsShort: "gen_feb_mar_apr_mag_giu_lug_ago_set_ott_nov_dic".split("_"), weekdays: "Domenica_Lunedì_Martedì_Mercoledì_Giovedì_Venerdì_Sabato".split("_"), weekdaysShort: "Dom_Lun_Mar_Mer_Gio_Ven_Sab".split("_"), weekdaysMin: "D_L_Ma_Me_G_V_S".split("_"), longDateFormat: { LT: "HH:mm", L: "DD/MM/YYYY", LL: "D MMMM YYYY", LLL: "D MMMM YYYY LT", LLLL: "dddd, D MMMM YYYY LT" }, calendar: { sameDay: "[Oggi alle] LT", nextDay: "[Domani alle] LT", nextWeek: "dddd [alle] LT", lastDay: "[Ieri alle] LT", lastWeek: "[lo scorso] dddd [alle] LT", sameElse: "L" }, relativeTime: { future: function (e) { return (/^[0-9].+$/.test(e) ? "tra" : "in") + " " + e }, past: "%s fa", s: "alcuni secondi", m: "un minuto", mm: "%d minuti", h: "un'ora", hh: "%d ore", d: "un giorno", dd: "%d giorni", M: "un mese", MM: "%d mesi", y: "un anno", yy: "%d anni" }, ordinal: "%dº", week: { dow: 1, doy: 4 } }), e.fullCalendar.datepickerLang("it", "it", { closeText: "Chiudi", prevText: "&#x3C;Prec", nextText: "Succ&#x3E;", currentText: "Oggi", monthNames: ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"], monthNamesShort: ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"], dayNames: ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"], dayNamesShort: ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"], dayNamesMin: ["Do", "Lu", "Ma", "Me", "Gi", "Ve", "Sa"], weekHeader: "Sm", dateFormat: "dd/mm/yy", firstDay: 1, isRTL: !1, showMonthAfterYear: !1, yearSuffix: "" }), e.fullCalendar.lang("it", { defaultButtonText: { month: "Mese", week: "Settimana", day: "Giorno", list: "Agenda" }, allDayHtml: "Tutto il<br/>giorno", eventLimitText: function (e) { return "+altri " + e } }) }(), function () { (t.defineLocale || t.lang).call(t, "ja", { months: "1月_2月_3月_4月_5月_6月_7月_8月_9月_10月_11月_12月".split("_"), monthsShort: "1月_2月_3月_4月_5月_6月_7月_8月_9月_10月_11月_12月".split("_"), weekdays: "日曜日_月曜日_火曜日_水曜日_木曜日_金曜日_土曜日".split("_"), weekdaysShort: "日_月_火_水_木_金_土".split("_"), weekdaysMin: "日_月_火_水_木_金_土".split("_"), longDateFormat: { LT: "Ah時m分", L: "YYYY/MM/DD", LL: "YYYY年M月D日", LLL: "YYYY年M月D日LT", LLLL: "YYYY年M月D日LT dddd" }, meridiem: function (e) { return 12 > e ? "午前" : "午後" }, calendar: { sameDay: "[今日] LT", nextDay: "[明日] LT", nextWeek: "[来週]dddd LT", lastDay: "[昨日] LT", lastWeek: "[前週]dddd LT", sameElse: "L" }, relativeTime: { future: "%s後", past: "%s前", s: "数秒", m: "1分", mm: "%d分", h: "1時間", hh: "%d時間", d: "1日", dd: "%d日", M: "1ヶ月", MM: "%dヶ月", y: "1年", yy: "%d年" } }), e.fullCalendar.datepickerLang("ja", "ja", { closeText: "閉じる", prevText: "&#x3C;前", nextText: "次&#x3E;", currentText: "今日", monthNames: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"], monthNamesShort: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"], dayNames: ["日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"], dayNamesShort: ["日", "月", "火", "水", "木", "金", "土"], dayNamesMin: ["日", "月", "火", "水", "木", "金", "土"], weekHeader: "週", dateFormat: "yy/mm/dd", firstDay: 0, isRTL: !1, showMonthAfterYear: !0, yearSuffix: "年" }), e.fullCalendar.lang("ja", { defaultButtonText: { month: "月", week: "週", day: "日", list: "予定リスト" }, allDayText: "終日", eventLimitText: function (e) { return "他 " + e + " 件" } }) }(), function () { (t.defineLocale || t.lang).call(t, "ko", { months: "1월_2월_3월_4월_5월_6월_7월_8월_9월_10월_11월_12월".split("_"), monthsShort: "1월_2월_3월_4월_5월_6월_7월_8월_9월_10월_11월_12월".split("_"), weekdays: "일요일_월요일_화요일_수요일_목요일_금요일_토요일".split("_"), weekdaysShort: "일_월_화_수_목_금_토".split("_"), weekdaysMin: "일_월_화_수_목_금_토".split("_"), longDateFormat: { LT: "A h시 mm분", L: "YYYY.MM.DD", LL: "YYYY년 MMMM D일", LLL: "YYYY년 MMMM D일 LT", LLLL: "YYYY년 MMMM D일 dddd LT" }, meridiem: function (e) { return 12 > e ? "오전" : "오후" }, calendar: { sameDay: "오늘 LT", nextDay: "내일 LT", nextWeek: "dddd LT", lastDay: "어제 LT", lastWeek: "지난주 dddd LT", sameElse: "L" }, relativeTime: { future: "%s 후", past: "%s 전", s: "몇초", ss: "%d초", m: "일분", mm: "%d분", h: "한시간", hh: "%d시간", d: "하루", dd: "%d일", M: "한달", MM: "%d달", y: "일년", yy: "%d년" }, ordinal: "%d일", meridiemParse: /(오전|오후)/, isPM: function (e) { return "오후" === e } }), e.fullCalendar.datepickerLang("ko", "ko", { closeText: "닫기", prevText: "이전달", nextText: "다음달", currentText: "오늘", monthNames: ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"], monthNamesShort: ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"], dayNames: ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"], dayNamesShort: ["일", "월", "화", "수", "목", "금", "토"], dayNamesMin: ["일", "월", "화", "수", "목", "금", "토"], weekHeader: "Wk", dateFormat: "yy-mm-dd", firstDay: 0, isRTL: !1, showMonthAfterYear: !0, yearSuffix: "년" }), e.fullCalendar.lang("ko", { defaultButtonText: { month: "월", week: "주", day: "일", list: "일정목록" }, allDayText: "종일", eventLimitText: "개" }) }(), function () { function a(e, t, a, n) { return t ? "kelios sekundės" : n ? "kelių sekundžių" : "kelias sekundes" } function n(e, t, a, n) { return t ? i(a)[0] : n ? i(a)[1] : i(a)[2] } function r(e) { return 0 === e % 10 || e > 10 && 20 > e } function i(e) { return d[e].split("_") } function s(e, t, a, s) { var o = e + " "; return 1 === e ? o + n(e, t, a[0], s) : t ? o + (r(e) ? i(a)[1] : i(a)[0]) : s ? o + i(a)[1] : o + (r(e) ? i(a)[1] : i(a)[2]) } function o(e, t) { var a = -1 === t.indexOf("dddd HH:mm"), n = l[e.day()]; return a ? n : n.substring(0, n.length - 2) + "į" } var d = { m: "minutė_minutės_minutę", mm: "minutės_minučių_minutes", h: "valanda_valandos_valandą", hh: "valandos_valandų_valandas", d: "diena_dienos_dieną", dd: "dienos_dienų_dienas", M: "mėnuo_mėnesio_mėnesį", MM: "mėnesiai_mėnesių_mėnesius", y: "metai_metų_metus", yy: "metai_metų_metus" }, l = "sekmadienis_pirmadienis_antradienis_trečiadienis_ketvirtadienis_penktadienis_šeštadienis".split("_"); (t.defineLocale || t.lang).call(t, "lt", { months: "sausio_vasario_kovo_balandžio_gegužės_birželio_liepos_rugpjūčio_rugsėjo_spalio_lapkričio_gruodžio".split("_"), monthsShort: "sau_vas_kov_bal_geg_bir_lie_rgp_rgs_spa_lap_grd".split("_"), weekdays: o, weekdaysShort: "Sek_Pir_Ant_Tre_Ket_Pen_Šeš".split("_"), weekdaysMin: "S_P_A_T_K_Pn_Š".split("_"), longDateFormat: { LT: "HH:mm", L: "YYYY-MM-DD", LL: "YYYY [m.] MMMM D [d.]", LLL: "YYYY [m.] MMMM D [d.], LT [val.]", LLLL: "YYYY [m.] MMMM D [d.], dddd, LT [val.]", l: "YYYY-MM-DD", ll: "YYYY [m.] MMMM D [d.]", lll: "YYYY [m.] MMMM D [d.], LT [val.]", llll: "YYYY [m.] MMMM D [d.], ddd, LT [val.]" }, calendar: { sameDay: "[Šiandien] LT", nextDay: "[Rytoj] LT", nextWeek: "dddd LT", lastDay: "[Vakar] LT", lastWeek: "[Praėjusį] dddd LT", sameElse: "L" }, relativeTime: { future: "po %s", past: "prieš %s", s: a, m: n, mm: s, h: n, hh: s, d: n, dd: s, M: n, MM: s, y: n, yy: s }, ordinal: function (e) { return e + "-oji" }, week: { dow: 1, doy: 4 } }), e.fullCalendar.datepickerLang("lt", "lt", { closeText: "Uždaryti", prevText: "&#x3C;Atgal", nextText: "Pirmyn&#x3E;", currentText: "Šiandien", monthNames: ["Sausis", "Vasaris", "Kovas", "Balandis", "Gegužė", "Birželis", "Liepa", "Rugpjūtis", "Rugsėjis", "Spalis", "Lapkritis", "Gruodis"], monthNamesShort: ["Sau", "Vas", "Kov", "Bal", "Geg", "Bir", "Lie", "Rugp", "Rugs", "Spa", "Lap", "Gru"], dayNames: ["sekmadienis", "pirmadienis", "antradienis", "trečiadienis", "ketvirtadienis", "penktadienis", "šeštadienis"], dayNamesShort: ["sek", "pir", "ant", "tre", "ket", "pen", "šeš"], dayNamesMin: ["Se", "Pr", "An", "Tr", "Ke", "Pe", "Še"], weekHeader: "SAV", dateFormat: "yy-mm-dd", firstDay: 1, isRTL: !1, showMonthAfterYear: !0, yearSuffix: "" }), e.fullCalendar.lang("lt", { defaultButtonText: { month: "Mėnuo", week: "Savaitė", day: "Diena", list: "Darbotvarkė" }, allDayText: "Visą dieną", eventLimitText: "daugiau" }) }(), function () { function a(e, t, a) { var n = e.split("_"); return a ? 1 === t % 10 && 11 !== t ? n[2] : n[3] : 1 === t % 10 && 11 !== t ? n[0] : n[1] } function n(e, t, n) { return e + " " + a(r[n], e, t) } var r = { mm: "minūti_minūtes_minūte_minūtes", hh: "stundu_stundas_stunda_stundas", dd: "dienu_dienas_diena_dienas", MM: "mēnesi_mēnešus_mēnesis_mēneši", yy: "gadu_gadus_gads_gadi" }; (t.defineLocale || t.lang).call(t, "lv", { months: "janvāris_februāris_marts_aprīlis_maijs_jūnijs_jūlijs_augusts_septembris_oktobris_novembris_decembris".split("_"), monthsShort: "jan_feb_mar_apr_mai_jūn_jūl_aug_sep_okt_nov_dec".split("_"), weekdays: "svētdiena_pirmdiena_otrdiena_trešdiena_ceturtdiena_piektdiena_sestdiena".split("_"), weekdaysShort: "Sv_P_O_T_C_Pk_S".split("_"), weekdaysMin: "Sv_P_O_T_C_Pk_S".split("_"), longDateFormat: { LT: "HH:mm", L: "DD.MM.YYYY", LL: "YYYY. [gada] D. MMMM", LLL: "YYYY. [gada] D. MMMM, LT", LLLL: "YYYY. [gada] D. MMMM, dddd, LT" }, calendar: { sameDay: "[Šodien pulksten] LT", nextDay: "[Rīt pulksten] LT", nextWeek: "dddd [pulksten] LT", lastDay: "[Vakar pulksten] LT", lastWeek: "[Pagājušā] dddd [pulksten] LT", sameElse: "L" }, relativeTime: { future: "%s vēlāk", past: "%s agrāk", s: "dažas sekundes", m: "minūti", mm: n, h: "stundu", hh: n, d: "dienu", dd: n, M: "mēnesi", MM: n, y: "gadu", yy: n }, ordinal: "%d.", week: { dow: 1, doy: 4 } }), e.fullCalendar.datepickerLang("lv", "lv", { closeText: "Aizvērt", prevText: "Iepr.", nextText: "Nāk.", currentText: "Šodien", monthNames: ["Janvāris", "Februāris", "Marts", "Aprīlis", "Maijs", "Jūnijs", "Jūlijs", "Augusts", "Septembris", "Oktobris", "Novembris", "Decembris"], monthNamesShort: ["Jan", "Feb", "Mar", "Apr", "Mai", "Jūn", "Jūl", "Aug", "Sep", "Okt", "Nov", "Dec"], dayNames: ["svētdiena", "pirmdiena", "otrdiena", "trešdiena", "ceturtdiena", "piektdiena", "sestdiena"], dayNamesShort: ["svt", "prm", "otr", "tre", "ctr", "pkt", "sst"], dayNamesMin: ["Sv", "Pr", "Ot", "Tr", "Ct", "Pk", "Ss"], weekHeader: "Ned.", dateFormat: "dd.mm.yy", firstDay: 1, isRTL: !1, showMonthAfterYear: !1, yearSuffix: "" }), e.fullCalendar.lang("lv", { defaultButtonText: { month: "Mēnesis", week: "Nedēļa", day: "Diena", list: "Dienas kārtība" }, allDayText: "Visu dienu", eventLimitText: function (e) { return "+vēl " + e } }) }(), function () { var a = "jan._feb._mrt._apr._mei_jun._jul._aug._sep._okt._nov._dec.".split("_"), n = "jan_feb_mrt_apr_mei_jun_jul_aug_sep_okt_nov_dec".split("_"); (t.defineLocale || t.lang).call(t, "nl", { months: "januari_februari_maart_april_mei_juni_juli_augustus_september_oktober_november_december".split("_"), monthsShort: function (e, t) { return /-MMM-/.test(t) ? n[e.month()] : a[e.month()] }, weekdays: "zondag_maandag_dinsdag_woensdag_donderdag_vrijdag_zaterdag".split("_"), weekdaysShort: "zo._ma._di._wo._do._vr._za.".split("_"), weekdaysMin: "Zo_Ma_Di_Wo_Do_Vr_Za".split("_"), longDateFormat: { LT: "HH:mm", L: "DD-MM-YYYY", LL: "D MMMM YYYY", LLL: "D MMMM YYYY LT", LLLL: "dddd D MMMM YYYY LT" }, calendar: { sameDay: "[vandaag om] LT", nextDay: "[morgen om] LT", nextWeek: "dddd [om] LT", lastDay: "[gisteren om] LT", lastWeek: "[afgelopen] dddd [om] LT", sameElse: "L" }, relativeTime: { future: "over %s", past: "%s geleden", s: "een paar seconden", m: "één minuut", mm: "%d minuten", h: "één uur", hh: "%d uur", d: "één dag", dd: "%d dagen", M: "één maand", MM: "%d maanden", y: "één jaar", yy: "%d jaar" }, ordinal: function (e) { return e + (1 === e || 8 === e || e >= 20 ? "ste" : "de") }, week: { dow: 1, doy: 4 } }), e.fullCalendar.datepickerLang("nl", "nl", { closeText: "Sluiten", prevText: "←", nextText: "→", currentText: "Vandaag", monthNames: ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"], monthNamesShort: ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"], dayNames: ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"], dayNamesShort: ["zon", "maa", "din", "woe", "don", "vri", "zat"], dayNamesMin: ["zo", "ma", "di", "wo", "do", "vr", "za"], weekHeader: "Wk", dateFormat: "dd-mm-yy", firstDay: 1, isRTL: !1, showMonthAfterYear: !1, yearSuffix: "" }), e.fullCalendar.lang("nl", { defaultButtonText: { month: "Maand", week: "Week", day: "Dag", list: "Agenda" }, allDayText: "Hele dag", eventLimitText: "extra" }) }(), function () { function a(e) { return 5 > e % 10 && e % 10 > 1 && 1 !== ~~(e / 10) % 10 } function n(e, t, n) { var r = e + " "; switch (n) { case "m": return t ? "minuta" : "minutę"; case "mm": return r + (a(e) ? "minuty" : "minut"); case "h": return t ? "godzina" : "godzinę"; case "hh": return r + (a(e) ? "godziny" : "godzin"); case "MM": return r + (a(e) ? "miesiące" : "miesięcy"); case "yy": return r + (a(e) ? "lata" : "lat") } } var r = "styczeń_luty_marzec_kwiecień_maj_czerwiec_lipiec_sierpień_wrzesień_październik_listopad_grudzień".split("_"), i = "stycznia_lutego_marca_kwietnia_maja_czerwca_lipca_sierpnia_września_października_listopada_grudnia".split("_"); (t.defineLocale || t.lang).call(t, "pl", { months: function (e, t) { return /D MMMM/.test(t) ? i[e.month()] : r[e.month()] }, monthsShort: "sty_lut_mar_kwi_maj_cze_lip_sie_wrz_paź_lis_gru".split("_"), weekdays: "niedziela_poniedziałek_wtorek_środa_czwartek_piątek_sobota".split("_"), weekdaysShort: "nie_pon_wt_śr_czw_pt_sb".split("_"), weekdaysMin: "N_Pn_Wt_Śr_Cz_Pt_So".split("_"), longDateFormat: { LT: "HH:mm", L: "DD.MM.YYYY", LL: "D MMMM YYYY", LLL: "D MMMM YYYY LT", LLLL: "dddd, D MMMM YYYY LT" }, calendar: { sameDay: "[Dziś o] LT", nextDay: "[Jutro o] LT", nextWeek: "[W] dddd [o] LT", lastDay: "[Wczoraj o] LT", lastWeek: function () { switch (this.day()) { case 0: return "[W zeszłą niedzielę o] LT"; case 3: return "[W zeszłą środę o] LT"; case 6: return "[W zeszłą sobotę o] LT"; default: return "[W zeszły] dddd [o] LT" } }, sameElse: "L" }, relativeTime: { future: "za %s", past: "%s temu", s: "kilka sekund", m: n, mm: n, h: n, hh: n, d: "1 dzień", dd: "%d dni", M: "miesiąc", MM: n, y: "rok", yy: n }, ordinal: "%d.", week: { dow: 1, doy: 4 } }), e.fullCalendar.datepickerLang("pl", "pl", { closeText: "Zamknij", prevText: "&#x3C;Poprzedni", nextText: "Następny&#x3E;", currentText: "Dziś", monthNames: ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"], monthNamesShort: ["Sty", "Lu", "Mar", "Kw", "Maj", "Cze", "Lip", "Sie", "Wrz", "Pa", "Lis", "Gru"], dayNames: ["Niedziela", "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota"], dayNamesShort: ["Nie", "Pn", "Wt", "Śr", "Czw", "Pt", "So"], dayNamesMin: ["N", "Pn", "Wt", "Śr", "Cz", "Pt", "So"], weekHeader: "Tydz", dateFormat: "dd.mm.yy", firstDay: 1, isRTL: !1, showMonthAfterYear: !1, yearSuffix: "" }), e.fullCalendar.lang("pl", { defaultButtonText: { month: "Miesiąc", week: "Tydzień", day: "Dzień", list: "Plan dnia" }, allDayText: "Cały dzień", eventLimitText: "więcej" }) }(), function () { (t.defineLocale || t.lang).call(t, "pt-br", { months: "janeiro_fevereiro_março_abril_maio_junho_julho_agosto_setembro_outubro_novembro_dezembro".split("_"), monthsShort: "jan_fev_mar_abr_mai_jun_jul_ago_set_out_nov_dez".split("_"), weekdays: "domingo_segunda-feira_terça-feira_quarta-feira_quinta-feira_sexta-feira_sábado".split("_"), weekdaysShort: "dom_seg_ter_qua_qui_sex_sáb".split("_"), weekdaysMin: "dom_2ª_3ª_4ª_5ª_6ª_sáb".split("_"), longDateFormat: { LT: "HH:mm", L: "DD/MM/YYYY", LL: "D [de] MMMM [de] YYYY", LLL: "D [de] MMMM [de] YYYY [às] LT", LLLL: "dddd, D [de] MMMM [de] YYYY [às] LT" }, calendar: { sameDay: "[Hoje às] LT", nextDay: "[Amanhã às] LT", nextWeek: "dddd [às] LT", lastDay: "[Ontem às] LT", lastWeek: function () { return 0 === this.day() || 6 === this.day() ? "[Último] dddd [às] LT" : "[Última] dddd [às] LT" }, sameElse: "L" }, relativeTime: { future: "em %s", past: "%s atrás", s: "segundos", m: "um minuto", mm: "%d minutos", h: "uma hora", hh: "%d horas", d: "um dia", dd: "%d dias", M: "um mês", MM: "%d meses", y: "um ano", yy: "%d anos" }, ordinal: "%dº" }), e.fullCalendar.datepickerLang("pt-br", "pt-BR", { closeText: "Fechar", prevText: "&#x3C;Anterior", nextText: "Próximo&#x3E;", currentText: "Hoje", monthNames: ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"], monthNamesShort: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"], dayNames: ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"], dayNamesShort: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"], dayNamesMin: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"], weekHeader: "Sm", dateFormat: "dd/mm/yy", firstDay: 0, isRTL: !1, showMonthAfterYear: !1, yearSuffix: "" }), e.fullCalendar.lang("pt-br", { defaultButtonText: { month: "Mês", week: "Semana", day: "Dia", list: "Compromissos" }, allDayText: "dia inteiro", eventLimitText: function (e) { return "mais +" + e } }) }(), function () { (t.defineLocale || t.lang).call(t, "pt", { months: "janeiro_fevereiro_março_abril_maio_junho_julho_agosto_setembro_outubro_novembro_dezembro".split("_"), monthsShort: "jan_fev_mar_abr_mai_jun_jul_ago_set_out_nov_dez".split("_"), weekdays: "domingo_segunda-feira_terça-feira_quarta-feira_quinta-feira_sexta-feira_sábado".split("_"), weekdaysShort: "dom_seg_ter_qua_qui_sex_sáb".split("_"), weekdaysMin: "dom_2ª_3ª_4ª_5ª_6ª_sáb".split("_"), longDateFormat: { LT: "HH:mm", L: "DD/MM/YYYY", LL: "D [de] MMMM [de] YYYY", LLL: "D [de] MMMM [de] YYYY LT", LLLL: "dddd, D [de] MMMM [de] YYYY LT" }, calendar: { sameDay: "[Hoje às] LT", nextDay: "[Amanhã às] LT", nextWeek: "dddd [às] LT", lastDay: "[Ontem às] LT", lastWeek: function () { return 0 === this.day() || 6 === this.day() ? "[Último] dddd [às] LT" : "[Última] dddd [às] LT" }, sameElse: "L" }, relativeTime: { future: "em %s", past: "há %s", s: "segundos", m: "um minuto", mm: "%d minutos", h: "uma hora", hh: "%d horas", d: "um dia", dd: "%d dias", M: "um mês", MM: "%d meses", y: "um ano", yy: "%d anos" }, ordinal: "%dº", week: { dow: 1, doy: 4 } }), e.fullCalendar.datepickerLang("pt", "pt", { closeText: "Fechar", prevText: "Anterior", nextText: "Seguinte", currentText: "Hoje", monthNames: ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"], monthNamesShort: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"], dayNames: ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"], dayNamesShort: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"], dayNamesMin: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"], weekHeader: "Sem", dateFormat: "dd/mm/yy", firstDay: 0, isRTL: !1, showMonthAfterYear: !1, yearSuffix: "" }), e.fullCalendar.lang("pt", { defaultButtonText: { month: "Mês", week: "Semana", day: "Dia", list: "Agenda" }, allDayText: "Todo o dia", eventLimitText: "mais" }) }(), function () {
        function a(e, t, a) { var n = { mm: "minute", hh: "ore", dd: "zile", MM: "luni", yy: "ani" }, r = " "; return (e % 100 >= 20 || e >= 100 && 0 === e % 100) && (r = " de "), e + r + n[a] } (t.defineLocale || t.lang).call(t, "ro", { months: "ianuarie_februarie_martie_aprilie_mai_iunie_iulie_august_septembrie_octombrie_noiembrie_decembrie".split("_"), monthsShort: "ian._febr._mart._apr._mai_iun._iul._aug._sept._oct._nov._dec.".split("_"), weekdays: "duminică_luni_marți_miercuri_joi_vineri_sâmbătă".split("_"), weekdaysShort: "Dum_Lun_Mar_Mie_Joi_Vin_Sâm".split("_"), weekdaysMin: "Du_Lu_Ma_Mi_Jo_Vi_Sâ".split("_"), longDateFormat: { LT: "H:mm", L: "DD.MM.YYYY", LL: "D MMMM YYYY", LLL: "D MMMM YYYY H:mm", LLLL: "dddd, D MMMM YYYY H:mm" }, calendar: { sameDay: "[azi la] LT", nextDay: "[mâine la] LT", nextWeek: "dddd [la] LT", lastDay: "[ieri la] LT", lastWeek: "[fosta] dddd [la] LT", sameElse: "L" }, relativeTime: { future: "peste %s", past: "%s în urmă", s: "câteva secunde", m: "un minut", mm: a, h: "o oră", hh: a, d: "o zi", dd: a, M: "o lună", MM: a, y: "un an", yy: a }, week: { dow: 1, doy: 7 } }), e.fullCalendar.datepickerLang("ro", "ro", { closeText: "Închide", prevText: "&#xAB; Luna precedentă", nextText: "Luna următoare &#xBB;", currentText: "Azi", monthNames: ["Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie", "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"], monthNamesShort: ["Ian", "Feb", "Mar", "Apr", "Mai", "Iun", "Iul", "Aug", "Sep", "Oct", "Nov", "Dec"], dayNames: ["Duminică", "Luni", "Marţi", "Miercuri", "Joi", "Vineri", "Sâmbătă"], dayNamesShort: ["Dum", "Lun", "Mar", "Mie", "Joi", "Vin", "Sâm"], dayNamesMin: ["Du", "Lu", "Ma", "Mi", "Jo", "Vi", "Sâ"], weekHeader: "Săpt", dateFormat: "dd.mm.yy", firstDay: 1, isRTL: !1, showMonthAfterYear: !1, yearSuffix: "" }), e.fullCalendar.lang("ro", {
            defaultButtonText: { prev: "precedentă", next: "următoare", month: "Lună", week: "Săptămână", day: "Zi", list: "Agendă" }, allDayText: "Toată ziua", eventLimitText: function (e) {
                return "+alte " + e
            }
        })
    }(), function () { function a(e, t) { var a = e.split("_"); return 1 === t % 10 && 11 !== t % 100 ? a[0] : t % 10 >= 2 && 4 >= t % 10 && (10 > t % 100 || t % 100 >= 20) ? a[1] : a[2] } function n(e, t, n) { var r = { mm: t ? "минута_минуты_минут" : "минуту_минуты_минут", hh: "час_часа_часов", dd: "день_дня_дней", MM: "месяц_месяца_месяцев", yy: "год_года_лет" }; return "m" === n ? t ? "минута" : "минуту" : e + " " + a(r[n], +e) } function r(e, t) { var a = { nominative: "январь_февраль_март_апрель_май_июнь_июль_август_сентябрь_октябрь_ноябрь_декабрь".split("_"), accusative: "января_февраля_марта_апреля_мая_июня_июля_августа_сентября_октября_ноября_декабря".split("_") }, n = /D[oD]?(\[[^\[\]]*\]|\s+)+MMMM?/.test(t) ? "accusative" : "nominative"; return a[n][e.month()] } function i(e, t) { var a = { nominative: "янв_фев_мар_апр_май_июнь_июль_авг_сен_окт_ноя_дек".split("_"), accusative: "янв_фев_мар_апр_мая_июня_июля_авг_сен_окт_ноя_дек".split("_") }, n = /D[oD]?(\[[^\[\]]*\]|\s+)+MMMM?/.test(t) ? "accusative" : "nominative"; return a[n][e.month()] } function s(e, t) { var a = { nominative: "воскресенье_понедельник_вторник_среда_четверг_пятница_суббота".split("_"), accusative: "воскресенье_понедельник_вторник_среду_четверг_пятницу_субботу".split("_") }, n = /\[ ?[Вв] ?(?:прошлую|следующую)? ?\] ?dddd/.test(t) ? "accusative" : "nominative"; return a[n][e.day()] } (t.defineLocale || t.lang).call(t, "ru", { months: r, monthsShort: i, weekdays: s, weekdaysShort: "вс_пн_вт_ср_чт_пт_сб".split("_"), weekdaysMin: "вс_пн_вт_ср_чт_пт_сб".split("_"), monthsParse: [/^янв/i, /^фев/i, /^мар/i, /^апр/i, /^ма[й|я]/i, /^июн/i, /^июл/i, /^авг/i, /^сен/i, /^окт/i, /^ноя/i, /^дек/i], longDateFormat: { LT: "HH:mm", L: "DD.MM.YYYY", LL: "D MMMM YYYY г.", LLL: "D MMMM YYYY г., LT", LLLL: "dddd, D MMMM YYYY г., LT" }, calendar: { sameDay: "[Сегодня в] LT", nextDay: "[Завтра в] LT", lastDay: "[Вчера в] LT", nextWeek: function () { return 2 === this.day() ? "[Во] dddd [в] LT" : "[В] dddd [в] LT" }, lastWeek: function () { switch (this.day()) { case 0: return "[В прошлое] dddd [в] LT"; case 1: case 2: case 4: return "[В прошлый] dddd [в] LT"; case 3: case 5: case 6: return "[В прошлую] dddd [в] LT" } }, sameElse: "L" }, relativeTime: { future: "через %s", past: "%s назад", s: "несколько секунд", m: n, mm: n, h: "час", hh: n, d: "день", dd: n, M: "месяц", MM: n, y: "год", yy: n }, meridiemParse: /ночи|утра|дня|вечера/i, isPM: function (e) { return /^(дня|вечера)$/.test(e) }, meridiem: function (e) { return 4 > e ? "ночи" : 12 > e ? "утра" : 17 > e ? "дня" : "вечера" }, ordinal: function (e, t) { switch (t) { case "M": case "d": case "DDD": return e + "-й"; case "D": return e + "-го"; case "w": case "W": return e + "-я"; default: return e } }, week: { dow: 1, doy: 7 } }), e.fullCalendar.datepickerLang("ru", "ru", { closeText: "Закрыть", prevText: "&#x3C;Пред", nextText: "След&#x3E;", currentText: "Сегодня", monthNames: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"], monthNamesShort: ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"], dayNames: ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"], dayNamesShort: ["вск", "пнд", "втр", "срд", "чтв", "птн", "сбт"], dayNamesMin: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"], weekHeader: "Нед", dateFormat: "dd.mm.yy", firstDay: 1, isRTL: !1, showMonthAfterYear: !1, yearSuffix: "" }), e.fullCalendar.lang("ru", { defaultButtonText: { month: "Месяц", week: "Неделя", day: "День", list: "Повестка дня" }, allDayText: "Весь день", eventLimitText: function (e) { return "+ ещё " + e } }) }(), function () { function a(e) { return e > 1 && 5 > e } function n(e, t, n, r) { var i = e + " "; switch (n) { case "s": return t || r ? "pár sekúnd" : "pár sekundami"; case "m": return t ? "minúta" : r ? "minútu" : "minútou"; case "mm": return t || r ? i + (a(e) ? "minúty" : "minút") : i + "minútami"; case "h": return t ? "hodina" : r ? "hodinu" : "hodinou"; case "hh": return t || r ? i + (a(e) ? "hodiny" : "hodín") : i + "hodinami"; case "d": return t || r ? "deň" : "dňom"; case "dd": return t || r ? i + (a(e) ? "dni" : "dní") : i + "dňami"; case "M": return t || r ? "mesiac" : "mesiacom"; case "MM": return t || r ? i + (a(e) ? "mesiace" : "mesiacov") : i + "mesiacmi"; case "y": return t || r ? "rok" : "rokom"; case "yy": return t || r ? i + (a(e) ? "roky" : "rokov") : i + "rokmi" } } var r = "január_február_marec_apríl_máj_jún_júl_august_september_október_november_december".split("_"), i = "jan_feb_mar_apr_máj_jún_júl_aug_sep_okt_nov_dec".split("_"); (t.defineLocale || t.lang).call(t, "sk", { months: r, monthsShort: i, monthsParse: function (e, t) { var a, n = []; for (a = 0; 12 > a; a++) n[a] = RegExp("^" + e[a] + "$|^" + t[a] + "$", "i"); return n }(r, i), weekdays: "nedeľa_pondelok_utorok_streda_štvrtok_piatok_sobota".split("_"), weekdaysShort: "ne_po_ut_st_št_pi_so".split("_"), weekdaysMin: "ne_po_ut_st_št_pi_so".split("_"), longDateFormat: { LT: "H:mm", L: "DD.MM.YYYY", LL: "D. MMMM YYYY", LLL: "D. MMMM YYYY LT", LLLL: "dddd D. MMMM YYYY LT" }, calendar: { sameDay: "[dnes o] LT", nextDay: "[zajtra o] LT", nextWeek: function () { switch (this.day()) { case 0: return "[v nedeľu o] LT"; case 1: case 2: return "[v] dddd [o] LT"; case 3: return "[v stredu o] LT"; case 4: return "[vo štvrtok o] LT"; case 5: return "[v piatok o] LT"; case 6: return "[v sobotu o] LT" } }, lastDay: "[včera o] LT", lastWeek: function () { switch (this.day()) { case 0: return "[minulú nedeľu o] LT"; case 1: case 2: return "[minulý] dddd [o] LT"; case 3: return "[minulú stredu o] LT"; case 4: case 5: return "[minulý] dddd [o] LT"; case 6: return "[minulú sobotu o] LT" } }, sameElse: "L" }, relativeTime: { future: "za %s", past: "pred %s", s: n, m: n, mm: n, h: n, hh: n, d: n, dd: n, M: n, MM: n, y: n, yy: n }, ordinal: "%d.", week: { dow: 1, doy: 4 } }), e.fullCalendar.datepickerLang("sk", "sk", { closeText: "Zavrieť", prevText: "&#x3C;Predchádzajúci", nextText: "Nasledujúci&#x3E;", currentText: "Dnes", monthNames: ["január", "február", "marec", "apríl", "máj", "jún", "júl", "august", "september", "október", "november", "december"], monthNamesShort: ["Jan", "Feb", "Mar", "Apr", "Máj", "Jún", "Júl", "Aug", "Sep", "Okt", "Nov", "Dec"], dayNames: ["nedeľa", "pondelok", "utorok", "streda", "štvrtok", "piatok", "sobota"], dayNamesShort: ["Ned", "Pon", "Uto", "Str", "Štv", "Pia", "Sob"], dayNamesMin: ["Ne", "Po", "Ut", "St", "Št", "Pia", "So"], weekHeader: "Ty", dateFormat: "dd.mm.yy", firstDay: 1, isRTL: !1, showMonthAfterYear: !1, yearSuffix: "" }), e.fullCalendar.lang("sk", { defaultButtonText: { month: "Mesiac", week: "Týždeň", day: "Deň", list: "Rozvrh" }, allDayText: "Celý deň", eventLimitText: function (e) { return "+ďalšie: " + e } }) }(), function () { function a(e, t, a) { var n = e + " "; switch (a) { case "m": return t ? "ena minuta" : "eno minuto"; case "mm": return n += 1 === e ? "minuta" : 2 === e ? "minuti" : 3 === e || 4 === e ? "minute" : "minut"; case "h": return t ? "ena ura" : "eno uro"; case "hh": return n += 1 === e ? "ura" : 2 === e ? "uri" : 3 === e || 4 === e ? "ure" : "ur"; case "dd": return n += 1 === e ? "dan" : "dni"; case "MM": return n += 1 === e ? "mesec" : 2 === e ? "meseca" : 3 === e || 4 === e ? "mesece" : "mesecev"; case "yy": return n += 1 === e ? "leto" : 2 === e ? "leti" : 3 === e || 4 === e ? "leta" : "let" } } (t.defineLocale || t.lang).call(t, "sl", { months: "januar_februar_marec_april_maj_junij_julij_avgust_september_oktober_november_december".split("_"), monthsShort: "jan._feb._mar._apr._maj._jun._jul._avg._sep._okt._nov._dec.".split("_"), weekdays: "nedelja_ponedeljek_torek_sreda_četrtek_petek_sobota".split("_"), weekdaysShort: "ned._pon._tor._sre._čet._pet._sob.".split("_"), weekdaysMin: "ne_po_to_sr_če_pe_so".split("_"), longDateFormat: { LT: "H:mm", L: "DD. MM. YYYY", LL: "D. MMMM YYYY", LLL: "D. MMMM YYYY LT", LLLL: "dddd, D. MMMM YYYY LT" }, calendar: { sameDay: "[danes ob] LT", nextDay: "[jutri ob] LT", nextWeek: function () { switch (this.day()) { case 0: return "[v] [nedeljo] [ob] LT"; case 3: return "[v] [sredo] [ob] LT"; case 6: return "[v] [soboto] [ob] LT"; case 1: case 2: case 4: case 5: return "[v] dddd [ob] LT" } }, lastDay: "[včeraj ob] LT", lastWeek: function () { switch (this.day()) { case 0: case 3: case 6: return "[prejšnja] dddd [ob] LT"; case 1: case 2: case 4: case 5: return "[prejšnji] dddd [ob] LT" } }, sameElse: "L" }, relativeTime: { future: "čez %s", past: "%s nazaj", s: "nekaj sekund", m: a, mm: a, h: a, hh: a, d: "en dan", dd: a, M: "en mesec", MM: a, y: "eno leto", yy: a }, ordinal: "%d.", week: { dow: 1, doy: 7 } }), e.fullCalendar.datepickerLang("sl", "sl", { closeText: "Zapri", prevText: "&#x3C;Prejšnji", nextText: "Naslednji&#x3E;", currentText: "Trenutni", monthNames: ["Januar", "Februar", "Marec", "April", "Maj", "Junij", "Julij", "Avgust", "September", "Oktober", "November", "December"], monthNamesShort: ["Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Avg", "Sep", "Okt", "Nov", "Dec"], dayNames: ["Nedelja", "Ponedeljek", "Torek", "Sreda", "Četrtek", "Petek", "Sobota"], dayNamesShort: ["Ned", "Pon", "Tor", "Sre", "Čet", "Pet", "Sob"], dayNamesMin: ["Ne", "Po", "To", "Sr", "Če", "Pe", "So"], weekHeader: "Teden", dateFormat: "dd.mm.yy", firstDay: 1, isRTL: !1, showMonthAfterYear: !1, yearSuffix: "" }), e.fullCalendar.lang("sl", { defaultButtonText: { month: "Mesec", week: "Teden", day: "Dan", list: "Dnevni red" }, allDayText: "Ves dan", eventLimitText: "več" }) }(), function () { var a = { words: { m: ["један минут", "једне минуте"], mm: ["минут", "минуте", "минута"], h: ["један сат", "једног сата"], hh: ["сат", "сата", "сати"], dd: ["дан", "дана", "дана"], MM: ["месец", "месеца", "месеци"], yy: ["година", "године", "година"] }, correctGrammaticalCase: function (e, t) { return 1 === e ? t[0] : e >= 2 && 4 >= e ? t[1] : t[2] }, translate: function (e, t, n) { var r = a.words[n]; return 1 === n.length ? t ? r[0] : r[1] : e + " " + a.correctGrammaticalCase(e, r) } }; (t.defineLocale || t.lang).call(t, "sr-cyrl", { months: ["јануар", "фебруар", "март", "април", "мај", "јун", "јул", "август", "септембар", "октобар", "новембар", "децембар"], monthsShort: ["јан.", "феб.", "мар.", "апр.", "мај", "јун", "јул", "авг.", "сеп.", "окт.", "нов.", "дец."], weekdays: ["недеља", "понедељак", "уторак", "среда", "четвртак", "петак", "субота"], weekdaysShort: ["нед.", "пон.", "уто.", "сре.", "чет.", "пет.", "суб."], weekdaysMin: ["не", "по", "ут", "ср", "че", "пе", "су"], longDateFormat: { LT: "H:mm", L: "DD. MM. YYYY", LL: "D. MMMM YYYY", LLL: "D. MMMM YYYY LT", LLLL: "dddd, D. MMMM YYYY LT" }, calendar: { sameDay: "[данас у] LT", nextDay: "[сутра у] LT", nextWeek: function () { switch (this.day()) { case 0: return "[у] [недељу] [у] LT"; case 3: return "[у] [среду] [у] LT"; case 6: return "[у] [суботу] [у] LT"; case 1: case 2: case 4: case 5: return "[у] dddd [у] LT" } }, lastDay: "[јуче у] LT", lastWeek: function () { var e = ["[прошле] [недеље] [у] LT", "[прошлог] [понедељка] [у] LT", "[прошлог] [уторка] [у] LT", "[прошле] [среде] [у] LT", "[прошлог] [четвртка] [у] LT", "[прошлог] [петка] [у] LT", "[прошле] [суботе] [у] LT"]; return e[this.day()] }, sameElse: "L" }, relativeTime: { future: "за %s", past: "пре %s", s: "неколико секунди", m: a.translate, mm: a.translate, h: a.translate, hh: a.translate, d: "дан", dd: a.translate, M: "месец", MM: a.translate, y: "годину", yy: a.translate }, ordinal: "%d.", week: { dow: 1, doy: 7 } }), e.fullCalendar.datepickerLang("sr-cyrl", "sr", { closeText: "Затвори", prevText: "&#x3C;", nextText: "&#x3E;", currentText: "Данас", monthNames: ["Јануар", "Фебруар", "Март", "Април", "Мај", "Јун", "Јул", "Август", "Септембар", "Октобар", "Новембар", "Децембар"], monthNamesShort: ["Јан", "Феб", "Мар", "Апр", "Мај", "Јун", "Јул", "Авг", "Сеп", "Окт", "Нов", "Дец"], dayNames: ["Недеља", "Понедељак", "Уторак", "Среда", "Четвртак", "Петак", "Субота"], dayNamesShort: ["Нед", "Пон", "Уто", "Сре", "Чет", "Пет", "Суб"], dayNamesMin: ["Не", "По", "Ут", "Ср", "Че", "Пе", "Су"], weekHeader: "Сед", dateFormat: "dd.mm.yy", firstDay: 1, isRTL: !1, showMonthAfterYear: !1, yearSuffix: "" }), e.fullCalendar.lang("sr-cyrl", { defaultButtonText: { month: "Месец", week: "Недеља", day: "Дан", list: "Планер" }, allDayText: "Цео дан", eventLimitText: function (e) { return "+ још " + e } }) }(), function () { var a = { words: { m: ["jedan minut", "jedne minute"], mm: ["minut", "minute", "minuta"], h: ["jedan sat", "jednog sata"], hh: ["sat", "sata", "sati"], dd: ["dan", "dana", "dana"], MM: ["mesec", "meseca", "meseci"], yy: ["godina", "godine", "godina"] }, correctGrammaticalCase: function (e, t) { return 1 === e ? t[0] : e >= 2 && 4 >= e ? t[1] : t[2] }, translate: function (e, t, n) { var r = a.words[n]; return 1 === n.length ? t ? r[0] : r[1] : e + " " + a.correctGrammaticalCase(e, r) } }; (t.defineLocale || t.lang).call(t, "sr", { months: ["januar", "februar", "mart", "april", "maj", "jun", "jul", "avgust", "septembar", "oktobar", "novembar", "decembar"], monthsShort: ["jan.", "feb.", "mar.", "apr.", "maj", "jun", "jul", "avg.", "sep.", "okt.", "nov.", "dec."], weekdays: ["nedelja", "ponedeljak", "utorak", "sreda", "četvrtak", "petak", "subota"], weekdaysShort: ["ned.", "pon.", "uto.", "sre.", "čet.", "pet.", "sub."], weekdaysMin: ["ne", "po", "ut", "sr", "če", "pe", "su"], longDateFormat: { LT: "H:mm", L: "DD. MM. YYYY", LL: "D. MMMM YYYY", LLL: "D. MMMM YYYY LT", LLLL: "dddd, D. MMMM YYYY LT" }, calendar: { sameDay: "[danas u] LT", nextDay: "[sutra u] LT", nextWeek: function () { switch (this.day()) { case 0: return "[u] [nedelju] [u] LT"; case 3: return "[u] [sredu] [u] LT"; case 6: return "[u] [subotu] [u] LT"; case 1: case 2: case 4: case 5: return "[u] dddd [u] LT" } }, lastDay: "[juče u] LT", lastWeek: function () { var e = ["[prošle] [nedelje] [u] LT", "[prošlog] [ponedeljka] [u] LT", "[prošlog] [utorka] [u] LT", "[prošle] [srede] [u] LT", "[prošlog] [četvrtka] [u] LT", "[prošlog] [petka] [u] LT", "[prošle] [subote] [u] LT"]; return e[this.day()] }, sameElse: "L" }, relativeTime: { future: "za %s", past: "pre %s", s: "nekoliko sekundi", m: a.translate, mm: a.translate, h: a.translate, hh: a.translate, d: "dan", dd: a.translate, M: "mesec", MM: a.translate, y: "godinu", yy: a.translate }, ordinal: "%d.", week: { dow: 1, doy: 7 } }), e.fullCalendar.datepickerLang("sr", "sr", { closeText: "Затвори", prevText: "&#x3C;", nextText: "&#x3E;", currentText: "Данас", monthNames: ["Јануар", "Фебруар", "Март", "Април", "Мај", "Јун", "Јул", "Август", "Септембар", "Октобар", "Новембар", "Децембар"], monthNamesShort: ["Јан", "Феб", "Мар", "Апр", "Мај", "Јун", "Јул", "Авг", "Сеп", "Окт", "Нов", "Дец"], dayNames: ["Недеља", "Понедељак", "Уторак", "Среда", "Четвртак", "Петак", "Субота"], dayNamesShort: ["Нед", "Пон", "Уто", "Сре", "Чет", "Пет", "Суб"], dayNamesMin: ["Не", "По", "Ут", "Ср", "Че", "Пе", "Су"], weekHeader: "Сед", dateFormat: "dd.mm.yy", firstDay: 1, isRTL: !1, showMonthAfterYear: !1, yearSuffix: "" }), e.fullCalendar.lang("sr", { defaultButtonText: { month: "Месец", week: "Недеља", day: "Дан", list: "Планер" }, allDayText: "Цео дан", eventLimitText: function (e) { return "+ још " + e } }) }(), function () { (t.defineLocale || t.lang).call(t, "sv", { months: "januari_februari_mars_april_maj_juni_juli_augusti_september_oktober_november_december".split("_"), monthsShort: "jan_feb_mar_apr_maj_jun_jul_aug_sep_okt_nov_dec".split("_"), weekdays: "söndag_måndag_tisdag_onsdag_torsdag_fredag_lördag".split("_"), weekdaysShort: "sön_mån_tis_ons_tor_fre_lör".split("_"), weekdaysMin: "sö_må_ti_on_to_fr_lö".split("_"), longDateFormat: { LT: "HH:mm", L: "YYYY-MM-DD", LL: "D MMMM YYYY", LLL: "D MMMM YYYY LT", LLLL: "dddd D MMMM YYYY LT" }, calendar: { sameDay: "[Idag] LT", nextDay: "[Imorgon] LT", lastDay: "[Igår] LT", nextWeek: "dddd LT", lastWeek: "[Förra] dddd[en] LT", sameElse: "L" }, relativeTime: { future: "om %s", past: "för %s sedan", s: "några sekunder", m: "en minut", mm: "%d minuter", h: "en timme", hh: "%d timmar", d: "en dag", dd: "%d dagar", M: "en månad", MM: "%d månader", y: "ett år", yy: "%d år" }, ordinal: function (e) { var t = e % 10, a = 1 === ~~(e % 100 / 10) ? "e" : 1 === t ? "a" : 2 === t ? "a" : 3 === t ? "e" : "e"; return e + a }, week: { dow: 1, doy: 4 } }), e.fullCalendar.datepickerLang("sv", "sv", { closeText: "Stäng", prevText: "&#xAB;Förra", nextText: "Nästa&#xBB;", currentText: "Idag", monthNames: ["Januari", "Februari", "Mars", "April", "Maj", "Juni", "Juli", "Augusti", "September", "Oktober", "November", "December"], monthNamesShort: ["Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"], dayNamesShort: ["Sön", "Mån", "Tis", "Ons", "Tor", "Fre", "Lör"], dayNames: ["Söndag", "Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag"], dayNamesMin: ["Sö", "Må", "Ti", "On", "To", "Fr", "Lö"], weekHeader: "Ve", dateFormat: "yy-mm-dd", firstDay: 1, isRTL: !1, showMonthAfterYear: !1, yearSuffix: "" }), e.fullCalendar.lang("sv", { defaultButtonText: { month: "Månad", week: "Vecka", day: "Dag", list: "Program" }, allDayText: "Heldag", eventLimitText: "till" }) }(), function () { (t.defineLocale || t.lang).call(t, "th", { months: "มกราคม_กุมภาพันธ์_มีนาคม_เมษายน_พฤษภาคม_มิถุนายน_กรกฎาคม_สิงหาคม_กันยายน_ตุลาคม_พฤศจิกายน_ธันวาคม".split("_"), monthsShort: "มกรา_กุมภา_มีนา_เมษา_พฤษภา_มิถุนา_กรกฎา_สิงหา_กันยา_ตุลา_พฤศจิกา_ธันวา".split("_"), weekdays: "อาทิตย์_จันทร์_อังคาร_พุธ_พฤหัสบดี_ศุกร์_เสาร์".split("_"), weekdaysShort: "อาทิตย์_จันทร์_อังคาร_พุธ_พฤหัส_ศุกร์_เสาร์".split("_"), weekdaysMin: "อา._จ._อ._พ._พฤ._ศ._ส.".split("_"), longDateFormat: { LT: "H นาฬิกา m นาที", L: "YYYY/MM/DD", LL: "D MMMM YYYY", LLL: "D MMMM YYYY เวลา LT", LLLL: "วันddddที่ D MMMM YYYY เวลา LT" }, meridiem: function (e) { return 12 > e ? "ก่อนเที่ยง" : "หลังเที่ยง" }, calendar: { sameDay: "[วันนี้ เวลา] LT", nextDay: "[พรุ่งนี้ เวลา] LT", nextWeek: "dddd[หน้า เวลา] LT", lastDay: "[เมื่อวานนี้ เวลา] LT", lastWeek: "[วัน]dddd[ที่แล้ว เวลา] LT", sameElse: "L" }, relativeTime: { future: "อีก %s", past: "%sที่แล้ว", s: "ไม่กี่วินาที", m: "1 นาที", mm: "%d นาที", h: "1 ชั่วโมง", hh: "%d ชั่วโมง", d: "1 วัน", dd: "%d วัน", M: "1 เดือน", MM: "%d เดือน", y: "1 ปี", yy: "%d ปี" } }), e.fullCalendar.datepickerLang("th", "th", { closeText: "ปิด", prevText: "&#xAB;&#xA0;ย้อน", nextText: "ถัดไป&#xA0;&#xBB;", currentText: "วันนี้", monthNames: ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"], monthNamesShort: ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."], dayNames: ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"], dayNamesShort: ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."], dayNamesMin: ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."], weekHeader: "Wk", dateFormat: "dd/mm/yy", firstDay: 0, isRTL: !1, showMonthAfterYear: !1, yearSuffix: "" }), e.fullCalendar.lang("th", { defaultButtonText: { month: "เดือน", week: "สัปดาห์", day: "วัน", list: "แผนงาน" }, allDayText: "ตลอดวัน", eventLimitText: "เพิ่มเติม" }) }(), function () { var a = { 1: "'inci", 5: "'inci", 8: "'inci", 70: "'inci", 80: "'inci", 2: "'nci", 7: "'nci", 20: "'nci", 50: "'nci", 3: "'üncü", 4: "'üncü", 100: "'üncü", 6: "'ncı", 9: "'uncu", 10: "'uncu", 30: "'uncu", 60: "'ıncı", 90: "'ıncı" }; (t.defineLocale || t.lang).call(t, "tr", { months: "Ocak_Şubat_Mart_Nisan_Mayıs_Haziran_Temmuz_Ağustos_Eylül_Ekim_Kasım_Aralık".split("_"), monthsShort: "Oca_Şub_Mar_Nis_May_Haz_Tem_Ağu_Eyl_Eki_Kas_Ara".split("_"), weekdays: "Pazar_Pazartesi_Salı_Çarşamba_Perşembe_Cuma_Cumartesi".split("_"), weekdaysShort: "Paz_Pts_Sal_Çar_Per_Cum_Cts".split("_"), weekdaysMin: "Pz_Pt_Sa_Ça_Pe_Cu_Ct".split("_"), longDateFormat: { LT: "HH:mm", L: "DD.MM.YYYY", LL: "D MMMM YYYY", LLL: "D MMMM YYYY LT", LLLL: "dddd, D MMMM YYYY LT" }, calendar: { sameDay: "[bugün saat] LT", nextDay: "[yarın saat] LT", nextWeek: "[haftaya] dddd [saat] LT", lastDay: "[dün] LT", lastWeek: "[geçen hafta] dddd [saat] LT", sameElse: "L" }, relativeTime: { future: "%s sonra", past: "%s önce", s: "birkaç saniye", m: "bir dakika", mm: "%d dakika", h: "bir saat", hh: "%d saat", d: "bir gün", dd: "%d gün", M: "bir ay", MM: "%d ay", y: "bir yıl", yy: "%d yıl" }, ordinal: function (e) { if (0 === e) return e + "'ıncı"; var t = e % 10, n = e % 100 - t, r = e >= 100 ? 100 : null; return e + (a[t] || a[n] || a[r]) }, week: { dow: 1, doy: 7 } }), e.fullCalendar.datepickerLang("tr", "tr", { closeText: "kapat", prevText: "&#x3C;geri", nextText: "ileri&#x3e", currentText: "bugün", monthNames: ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"], monthNamesShort: ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"], dayNames: ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"], dayNamesShort: ["Pz", "Pt", "Sa", "Ça", "Pe", "Cu", "Ct"], dayNamesMin: ["Pz", "Pt", "Sa", "Ça", "Pe", "Cu", "Ct"], weekHeader: "Hf", dateFormat: "dd.mm.yy", firstDay: 1, isRTL: !1, showMonthAfterYear: !1, yearSuffix: "" }), e.fullCalendar.lang("tr", { defaultButtonText: { next: "ileri", month: "Ay", week: "Hafta", day: "Gün", list: "Ajanda" }, allDayText: "Tüm gün", eventLimitText: "daha fazla" }) }(), function () { function a(e, t) { var a = e.split("_"); return 1 === t % 10 && 11 !== t % 100 ? a[0] : t % 10 >= 2 && 4 >= t % 10 && (10 > t % 100 || t % 100 >= 20) ? a[1] : a[2] } function n(e, t, n) { var r = { mm: "хвилина_хвилини_хвилин", hh: "година_години_годин", dd: "день_дні_днів", MM: "місяць_місяці_місяців", yy: "рік_роки_років" }; return "m" === n ? t ? "хвилина" : "хвилину" : "h" === n ? t ? "година" : "годину" : e + " " + a(r[n], +e) } function r(e, t) { var a = { nominative: "січень_лютий_березень_квітень_травень_червень_липень_серпень_вересень_жовтень_листопад_грудень".split("_"), accusative: "січня_лютого_березня_квітня_травня_червня_липня_серпня_вересня_жовтня_листопада_грудня".split("_") }, n = /D[oD]? *MMMM?/.test(t) ? "accusative" : "nominative"; return a[n][e.month()] } function i(e, t) { var a = { nominative: "неділя_понеділок_вівторок_середа_четвер_п’ятниця_субота".split("_"), accusative: "неділю_понеділок_вівторок_середу_четвер_п’ятницю_суботу".split("_"), genitive: "неділі_понеділка_вівторка_середи_четверга_п’ятниці_суботи".split("_") }, n = /(\[[ВвУу]\]) ?dddd/.test(t) ? "accusative" : /\[?(?:минулої|наступної)? ?\] ?dddd/.test(t) ? "genitive" : "nominative"; return a[n][e.day()] } function s(e) { return function () { return e + "о" + (11 === this.hours() ? "б" : "") + "] LT" } } (t.defineLocale || t.lang).call(t, "uk", { months: r, monthsShort: "січ_лют_бер_квіт_трав_черв_лип_серп_вер_жовт_лист_груд".split("_"), weekdays: i, weekdaysShort: "нд_пн_вт_ср_чт_пт_сб".split("_"), weekdaysMin: "нд_пн_вт_ср_чт_пт_сб".split("_"), longDateFormat: { LT: "HH:mm", L: "DD.MM.YYYY", LL: "D MMMM YYYY р.", LLL: "D MMMM YYYY р., LT", LLLL: "dddd, D MMMM YYYY р., LT" }, calendar: { sameDay: s("[Сьогодні "), nextDay: s("[Завтра "), lastDay: s("[Вчора "), nextWeek: s("[У] dddd ["), lastWeek: function () { switch (this.day()) { case 0: case 3: case 5: case 6: return s("[Минулої] dddd [").call(this); case 1: case 2: case 4: return s("[Минулого] dddd [").call(this) } }, sameElse: "L" }, relativeTime: { future: "за %s", past: "%s тому", s: "декілька секунд", m: n, mm: n, h: "годину", hh: n, d: "день", dd: n, M: "місяць", MM: n, y: "рік", yy: n }, meridiem: function (e) { return 4 > e ? "ночі" : 12 > e ? "ранку" : 17 > e ? "дня" : "вечора" }, ordinal: function (e, t) { switch (t) { case "M": case "d": case "DDD": case "w": case "W": return e + "-й"; case "D": return e + "-го"; default: return e } }, week: { dow: 1, doy: 7 } }), e.fullCalendar.datepickerLang("uk", "uk", { closeText: "Закрити", prevText: "&#x3C;", nextText: "&#x3E;", currentText: "Сьогодні", monthNames: ["Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень", "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень"], monthNamesShort: ["Січ", "Лют", "Бер", "Кві", "Тра", "Чер", "Лип", "Сер", "Вер", "Жов", "Лис", "Гру"], dayNames: ["неділя", "понеділок", "вівторок", "середа", "четвер", "п’ятниця", "субота"], dayNamesShort: ["нед", "пнд", "вів", "срд", "чтв", "птн", "сбт"], dayNamesMin: ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"], weekHeader: "Тиж", dateFormat: "dd.mm.yy", firstDay: 1, isRTL: !1, showMonthAfterYear: !1, yearSuffix: "" }), e.fullCalendar.lang("uk", { defaultButtonText: { month: "Місяць", week: "Тиждень", day: "День", list: "Порядок денний" }, allDayText: "Увесь день", eventLimitText: function (e) { return "+ще " + e + "..." } }) }(), function () { (t.defineLocale || t.lang).call(t, "vi", { months: "tháng 1_tháng 2_tháng 3_tháng 4_tháng 5_tháng 6_tháng 7_tháng 8_tháng 9_tháng 10_tháng 11_tháng 12".split("_"), monthsShort: "Th01_Th02_Th03_Th04_Th05_Th06_Th07_Th08_Th09_Th10_Th11_Th12".split("_"), weekdays: "chủ nhật_thứ hai_thứ ba_thứ tư_thứ năm_thứ sáu_thứ bảy".split("_"), weekdaysShort: "CN_T2_T3_T4_T5_T6_T7".split("_"), weekdaysMin: "CN_T2_T3_T4_T5_T6_T7".split("_"), longDateFormat: { LT: "HH:mm", L: "DD/MM/YYYY", LL: "D MMMM [năm] YYYY", LLL: "D MMMM [năm] YYYY LT", LLLL: "dddd, D MMMM [năm] YYYY LT", l: "DD/M/YYYY", ll: "D MMM YYYY", lll: "D MMM YYYY LT", llll: "ddd, D MMM YYYY LT" }, calendar: { sameDay: "[Hôm nay lúc] LT", nextDay: "[Ngày mai lúc] LT", nextWeek: "dddd [tuần tới lúc] LT", lastDay: "[Hôm qua lúc] LT", lastWeek: "dddd [tuần rồi lúc] LT", sameElse: "L" }, relativeTime: { future: "%s tới", past: "%s trước", s: "vài giây", m: "một phút", mm: "%d phút", h: "một giờ", hh: "%d giờ", d: "một ngày", dd: "%d ngày", M: "một tháng", MM: "%d tháng", y: "một năm", yy: "%d năm" }, ordinal: function (e) { return e }, week: { dow: 1, doy: 4 } }), e.fullCalendar.datepickerLang("vi", "vi", { closeText: "Đóng", prevText: "&#x3C;Trước", nextText: "Tiếp&#x3E;", currentText: "Hôm nay", monthNames: ["Tháng Một", "Tháng Hai", "Tháng Ba", "Tháng Tư", "Tháng Năm", "Tháng Sáu", "Tháng Bảy", "Tháng Tám", "Tháng Chín", "Tháng Mười", "Tháng Mười Một", "Tháng Mười Hai"], monthNamesShort: ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"], dayNames: ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"], dayNamesShort: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"], dayNamesMin: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"], weekHeader: "Tu", dateFormat: "dd/mm/yy", firstDay: 0, isRTL: !1, showMonthAfterYear: !1, yearSuffix: "" }), e.fullCalendar.lang("vi", { defaultButtonText: { month: "Tháng", week: "Tuần", day: "Ngày", list: "Lịch biểu" }, allDayText: "Cả ngày", eventLimitText: function (e) { return "+ thêm " + e } }) }(), function () { (t.defineLocale || t.lang).call(t, "zh-cn", { months: "一月_二月_三月_四月_五月_六月_七月_八月_九月_十月_十一月_十二月".split("_"), monthsShort: "1月_2月_3月_4月_5月_6月_7月_8月_9月_10月_11月_12月".split("_"), weekdays: "星期日_星期一_星期二_星期三_星期四_星期五_星期六".split("_"), weekdaysShort: "周日_周一_周二_周三_周四_周五_周六".split("_"), weekdaysMin: "日_一_二_三_四_五_六".split("_"), longDateFormat: { LT: "Ah点mm", L: "YYYY-MM-DD", LL: "YYYY年MMMD日", LLL: "YYYY年MMMD日LT", LLLL: "YYYY年MMMD日ddddLT", l: "YYYY-MM-DD", ll: "YYYY年MMMD日", lll: "YYYY年MMMD日LT", llll: "YYYY年MMMD日ddddLT" }, meridiem: function (e, t) { var a = 100 * e + t; return 600 > a ? "凌晨" : 900 > a ? "早上" : 1130 > a ? "上午" : 1230 > a ? "中午" : 1800 > a ? "下午" : "晚上" }, calendar: { sameDay: function () { return 0 === this.minutes() ? "[今天]Ah[点整]" : "[今天]LT" }, nextDay: function () { return 0 === this.minutes() ? "[明天]Ah[点整]" : "[明天]LT" }, lastDay: function () { return 0 === this.minutes() ? "[昨天]Ah[点整]" : "[昨天]LT" }, nextWeek: function () { var e, a; return e = t().startOf("week"), a = this.unix() - e.unix() >= 604800 ? "[下]" : "[本]", 0 === this.minutes() ? a + "dddAh点整" : a + "dddAh点mm" }, lastWeek: function () { var e, a; return e = t().startOf("week"), a = this.unix() < e.unix() ? "[上]" : "[本]", 0 === this.minutes() ? a + "dddAh点整" : a + "dddAh点mm" }, sameElse: "LL" }, ordinal: function (e, t) { switch (t) { case "d": case "D": case "DDD": return e + "日"; case "M": return e + "月"; case "w": case "W": return e + "周"; default: return e } }, relativeTime: { future: "%s内", past: "%s前", s: "几秒", m: "1分钟", mm: "%d分钟", h: "1小时", hh: "%d小时", d: "1天", dd: "%d天", M: "1个月", MM: "%d个月", y: "1年", yy: "%d年" }, week: { dow: 1, doy: 4 } }), e.fullCalendar.datepickerLang("zh-cn", "zh-CN", { closeText: "关闭", prevText: "&#x3C;上月", nextText: "下月&#x3E;", currentText: "今天", monthNames: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"], monthNamesShort: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"], dayNames: ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"], dayNamesShort: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"], dayNamesMin: ["日", "一", "二", "三", "四", "五", "六"], weekHeader: "周", dateFormat: "yy-mm-dd", firstDay: 1, isRTL: !1, showMonthAfterYear: !0, yearSuffix: "年" }), e.fullCalendar.lang("zh-cn", { defaultButtonText: { month: "月", week: "周", day: "日", list: "日程" }, allDayText: "全天", eventLimitText: function (e) { return "另外 " + e + " 个" } }) }(), function () { (t.defineLocale || t.lang).call(t, "zh-tw", { months: "一月_二月_三月_四月_五月_六月_七月_八月_九月_十月_十一月_十二月".split("_"), monthsShort: "1月_2月_3月_4月_5月_6月_7月_8月_9月_10月_11月_12月".split("_"), weekdays: "星期日_星期一_星期二_星期三_星期四_星期五_星期六".split("_"), weekdaysShort: "週日_週一_週二_週三_週四_週五_週六".split("_"), weekdaysMin: "日_一_二_三_四_五_六".split("_"), longDateFormat: { LT: "Ah點mm", L: "YYYY年MMMD日", LL: "YYYY年MMMD日", LLL: "YYYY年MMMD日LT", LLLL: "YYYY年MMMD日ddddLT", l: "YYYY年MMMD日", ll: "YYYY年MMMD日", lll: "YYYY年MMMD日LT", llll: "YYYY年MMMD日ddddLT" }, meridiem: function (e, t) { var a = 100 * e + t; return 900 > a ? "早上" : 1130 > a ? "上午" : 1230 > a ? "中午" : 1800 > a ? "下午" : "晚上" }, calendar: { sameDay: "[今天]LT", nextDay: "[明天]LT", nextWeek: "[下]ddddLT", lastDay: "[昨天]LT", lastWeek: "[上]ddddLT", sameElse: "L" }, ordinal: function (e, t) { switch (t) { case "d": case "D": case "DDD": return e + "日"; case "M": return e + "月"; case "w": case "W": return e + "週"; default: return e } }, relativeTime: { future: "%s內", past: "%s前", s: "幾秒", m: "一分鐘", mm: "%d分鐘", h: "一小時", hh: "%d小時", d: "一天", dd: "%d天", M: "一個月", MM: "%d個月", y: "一年", yy: "%d年" } }), e.fullCalendar.datepickerLang("zh-tw", "zh-TW", { closeText: "關閉", prevText: "&#x3C;上月", nextText: "下月&#x3E;", currentText: "今天", monthNames: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"], monthNamesShort: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"], dayNames: ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"], dayNamesShort: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"], dayNamesMin: ["日", "一", "二", "三", "四", "五", "六"], weekHeader: "周", dateFormat: "yy/mm/dd", firstDay: 1, isRTL: !1, showMonthAfterYear: !0, yearSuffix: "年" }), e.fullCalendar.lang("zh-tw", { defaultButtonText: { month: "月", week: "週", day: "天", list: "待辦事項" }, allDayText: "全天", eventLimitText: "更多" }) }(), (t.locale || t.lang).call(t, "en"), e.fullCalendar.lang("en"), e.datepicker && e.datepicker.setDefaults(e.datepicker.regional[""])
});

/*! jQuery v1.11.1 | (c) 2005, 2014 jQuery Foundation, Inc. | jquery.org/license */
!function (a, b) { "object" == typeof module && "object" == typeof module.exports ? module.exports = a.document ? b(a, !0) : function (a) { if (!a.document) throw new Error("jQuery requires a window with a document"); return b(a) } : b(a) }("undefined" != typeof window ? window : this, function (a, b) {
    var c = [], d = c.slice, e = c.concat, f = c.push, g = c.indexOf, h = {}, i = h.toString, j = h.hasOwnProperty, k = {}, l = "1.11.1", m = function (a, b) { return new m.fn.init(a, b) }, n = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, o = /^-ms-/, p = /-([\da-z])/gi, q = function (a, b) { return b.toUpperCase() }; m.fn = m.prototype = { jquery: l, constructor: m, selector: "", length: 0, toArray: function () { return d.call(this) }, get: function (a) { return null != a ? 0 > a ? this[a + this.length] : this[a] : d.call(this) }, pushStack: function (a) { var b = m.merge(this.constructor(), a); return b.prevObject = this, b.context = this.context, b }, each: function (a, b) { return m.each(this, a, b) }, map: function (a) { return this.pushStack(m.map(this, function (b, c) { return a.call(b, c, b) })) }, slice: function () { return this.pushStack(d.apply(this, arguments)) }, first: function () { return this.eq(0) }, last: function () { return this.eq(-1) }, eq: function (a) { var b = this.length, c = +a + (0 > a ? b : 0); return this.pushStack(c >= 0 && b > c ? [this[c]] : []) }, end: function () { return this.prevObject || this.constructor(null) }, push: f, sort: c.sort, splice: c.splice }, m.extend = m.fn.extend = function () { var a, b, c, d, e, f, g = arguments[0] || {}, h = 1, i = arguments.length, j = !1; for ("boolean" == typeof g && (j = g, g = arguments[h] || {}, h++), "object" == typeof g || m.isFunction(g) || (g = {}), h === i && (g = this, h--) ; i > h; h++) if (null != (e = arguments[h])) for (d in e) a = g[d], c = e[d], g !== c && (j && c && (m.isPlainObject(c) || (b = m.isArray(c))) ? (b ? (b = !1, f = a && m.isArray(a) ? a : []) : f = a && m.isPlainObject(a) ? a : {}, g[d] = m.extend(j, f, c)) : void 0 !== c && (g[d] = c)); return g }, m.extend({ expando: "jQuery" + (l + Math.random()).replace(/\D/g, ""), isReady: !0, error: function (a) { throw new Error(a) }, noop: function () { }, isFunction: function (a) { return "function" === m.type(a) }, isArray: Array.isArray || function (a) { return "array" === m.type(a) }, isWindow: function (a) { return null != a && a == a.window }, isNumeric: function (a) { return !m.isArray(a) && a - parseFloat(a) >= 0 }, isEmptyObject: function (a) { var b; for (b in a) return !1; return !0 }, isPlainObject: function (a) { var b; if (!a || "object" !== m.type(a) || a.nodeType || m.isWindow(a)) return !1; try { if (a.constructor && !j.call(a, "constructor") && !j.call(a.constructor.prototype, "isPrototypeOf")) return !1 } catch (c) { return !1 } if (k.ownLast) for (b in a) return j.call(a, b); for (b in a); return void 0 === b || j.call(a, b) }, type: function (a) { return null == a ? a + "" : "object" == typeof a || "function" == typeof a ? h[i.call(a)] || "object" : typeof a }, globalEval: function (b) { b && m.trim(b) && (a.execScript || function (b) { a.eval.call(a, b) })(b) }, camelCase: function (a) { return a.replace(o, "ms-").replace(p, q) }, nodeName: function (a, b) { return a.nodeName && a.nodeName.toLowerCase() === b.toLowerCase() }, each: function (a, b, c) { var d, e = 0, f = a.length, g = r(a); if (c) { if (g) { for (; f > e; e++) if (d = b.apply(a[e], c), d === !1) break } else for (e in a) if (d = b.apply(a[e], c), d === !1) break } else if (g) { for (; f > e; e++) if (d = b.call(a[e], e, a[e]), d === !1) break } else for (e in a) if (d = b.call(a[e], e, a[e]), d === !1) break; return a }, trim: function (a) { return null == a ? "" : (a + "").replace(n, "") }, makeArray: function (a, b) { var c = b || []; return null != a && (r(Object(a)) ? m.merge(c, "string" == typeof a ? [a] : a) : f.call(c, a)), c }, inArray: function (a, b, c) { var d; if (b) { if (g) return g.call(b, a, c); for (d = b.length, c = c ? 0 > c ? Math.max(0, d + c) : c : 0; d > c; c++) if (c in b && b[c] === a) return c } return -1 }, merge: function (a, b) { var c = +b.length, d = 0, e = a.length; while (c > d) a[e++] = b[d++]; if (c !== c) while (void 0 !== b[d]) a[e++] = b[d++]; return a.length = e, a }, grep: function (a, b, c) { for (var d, e = [], f = 0, g = a.length, h = !c; g > f; f++) d = !b(a[f], f), d !== h && e.push(a[f]); return e }, map: function (a, b, c) { var d, f = 0, g = a.length, h = r(a), i = []; if (h) for (; g > f; f++) d = b(a[f], f, c), null != d && i.push(d); else for (f in a) d = b(a[f], f, c), null != d && i.push(d); return e.apply([], i) }, guid: 1, proxy: function (a, b) { var c, e, f; return "string" == typeof b && (f = a[b], b = a, a = f), m.isFunction(a) ? (c = d.call(arguments, 2), e = function () { return a.apply(b || this, c.concat(d.call(arguments))) }, e.guid = a.guid = a.guid || m.guid++, e) : void 0 }, now: function () { return +new Date }, support: k }), m.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function (a, b) { h["[object " + b + "]"] = b.toLowerCase() }); function r(a) { var b = a.length, c = m.type(a); return "function" === c || m.isWindow(a) ? !1 : 1 === a.nodeType && b ? !0 : "array" === c || 0 === b || "number" == typeof b && b > 0 && b - 1 in a } var s = function (a) { var b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r, s, t, u = "sizzle" + -new Date, v = a.document, w = 0, x = 0, y = gb(), z = gb(), A = gb(), B = function (a, b) { return a === b && (l = !0), 0 }, C = "undefined", D = 1 << 31, E = {}.hasOwnProperty, F = [], G = F.pop, H = F.push, I = F.push, J = F.slice, K = F.indexOf || function (a) { for (var b = 0, c = this.length; c > b; b++) if (this[b] === a) return b; return -1 }, L = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped", M = "[\\x20\\t\\r\\n\\f]", N = "(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+", O = N.replace("w", "w#"), P = "\\[" + M + "*(" + N + ")(?:" + M + "*([*^$|!~]?=)" + M + "*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|(" + O + "))|)" + M + "*\\]", Q = ":(" + N + ")(?:\\((('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|((?:\\\\.|[^\\\\()[\\]]|" + P + ")*)|.*)\\)|)", R = new RegExp("^" + M + "+|((?:^|[^\\\\])(?:\\\\.)*)" + M + "+$", "g"), S = new RegExp("^" + M + "*," + M + "*"), T = new RegExp("^" + M + "*([>+~]|" + M + ")" + M + "*"), U = new RegExp("=" + M + "*([^\\]'\"]*?)" + M + "*\\]", "g"), V = new RegExp(Q), W = new RegExp("^" + O + "$"), X = { ID: new RegExp("^#(" + N + ")"), CLASS: new RegExp("^\\.(" + N + ")"), TAG: new RegExp("^(" + N.replace("w", "w*") + ")"), ATTR: new RegExp("^" + P), PSEUDO: new RegExp("^" + Q), CHILD: new RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + M + "*(even|odd|(([+-]|)(\\d*)n|)" + M + "*(?:([+-]|)" + M + "*(\\d+)|))" + M + "*\\)|)", "i"), bool: new RegExp("^(?:" + L + ")$", "i"), needsContext: new RegExp("^" + M + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" + M + "*((?:-\\d)?\\d*)" + M + "*\\)|)(?=[^-]|$)", "i") }, Y = /^(?:input|select|textarea|button)$/i, Z = /^h\d$/i, $ = /^[^{]+\{\s*\[native \w/, _ = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/, ab = /[+~]/, bb = /'|\\/g, cb = new RegExp("\\\\([\\da-f]{1,6}" + M + "?|(" + M + ")|.)", "ig"), db = function (a, b, c) { var d = "0x" + b - 65536; return d !== d || c ? b : 0 > d ? String.fromCharCode(d + 65536) : String.fromCharCode(d >> 10 | 55296, 1023 & d | 56320) }; try { I.apply(F = J.call(v.childNodes), v.childNodes), F[v.childNodes.length].nodeType } catch (eb) { I = { apply: F.length ? function (a, b) { H.apply(a, J.call(b)) } : function (a, b) { var c = a.length, d = 0; while (a[c++] = b[d++]); a.length = c - 1 } } } function fb(a, b, d, e) { var f, h, j, k, l, o, r, s, w, x; if ((b ? b.ownerDocument || b : v) !== n && m(b), b = b || n, d = d || [], !a || "string" != typeof a) return d; if (1 !== (k = b.nodeType) && 9 !== k) return []; if (p && !e) { if (f = _.exec(a)) if (j = f[1]) { if (9 === k) { if (h = b.getElementById(j), !h || !h.parentNode) return d; if (h.id === j) return d.push(h), d } else if (b.ownerDocument && (h = b.ownerDocument.getElementById(j)) && t(b, h) && h.id === j) return d.push(h), d } else { if (f[2]) return I.apply(d, b.getElementsByTagName(a)), d; if ((j = f[3]) && c.getElementsByClassName && b.getElementsByClassName) return I.apply(d, b.getElementsByClassName(j)), d } if (c.qsa && (!q || !q.test(a))) { if (s = r = u, w = b, x = 9 === k && a, 1 === k && "object" !== b.nodeName.toLowerCase()) { o = g(a), (r = b.getAttribute("id")) ? s = r.replace(bb, "\\$&") : b.setAttribute("id", s), s = "[id='" + s + "'] ", l = o.length; while (l--) o[l] = s + qb(o[l]); w = ab.test(a) && ob(b.parentNode) || b, x = o.join(",") } if (x) try { return I.apply(d, w.querySelectorAll(x)), d } catch (y) { } finally { r || b.removeAttribute("id") } } } return i(a.replace(R, "$1"), b, d, e) } function gb() { var a = []; function b(c, e) { return a.push(c + " ") > d.cacheLength && delete b[a.shift()], b[c + " "] = e } return b } function hb(a) { return a[u] = !0, a } function ib(a) { var b = n.createElement("div"); try { return !!a(b) } catch (c) { return !1 } finally { b.parentNode && b.parentNode.removeChild(b), b = null } } function jb(a, b) { var c = a.split("|"), e = a.length; while (e--) d.attrHandle[c[e]] = b } function kb(a, b) { var c = b && a, d = c && 1 === a.nodeType && 1 === b.nodeType && (~b.sourceIndex || D) - (~a.sourceIndex || D); if (d) return d; if (c) while (c = c.nextSibling) if (c === b) return -1; return a ? 1 : -1 } function lb(a) { return function (b) { var c = b.nodeName.toLowerCase(); return "input" === c && b.type === a } } function mb(a) { return function (b) { var c = b.nodeName.toLowerCase(); return ("input" === c || "button" === c) && b.type === a } } function nb(a) { return hb(function (b) { return b = +b, hb(function (c, d) { var e, f = a([], c.length, b), g = f.length; while (g--) c[e = f[g]] && (c[e] = !(d[e] = c[e])) }) }) } function ob(a) { return a && typeof a.getElementsByTagName !== C && a } c = fb.support = {}, f = fb.isXML = function (a) { var b = a && (a.ownerDocument || a).documentElement; return b ? "HTML" !== b.nodeName : !1 }, m = fb.setDocument = function (a) { var b, e = a ? a.ownerDocument || a : v, g = e.defaultView; return e !== n && 9 === e.nodeType && e.documentElement ? (n = e, o = e.documentElement, p = !f(e), g && g !== g.top && (g.addEventListener ? g.addEventListener("unload", function () { m() }, !1) : g.attachEvent && g.attachEvent("onunload", function () { m() })), c.attributes = ib(function (a) { return a.className = "i", !a.getAttribute("className") }), c.getElementsByTagName = ib(function (a) { return a.appendChild(e.createComment("")), !a.getElementsByTagName("*").length }), c.getElementsByClassName = $.test(e.getElementsByClassName) && ib(function (a) { return a.innerHTML = "<div class='a'></div><div class='a i'></div>", a.firstChild.className = "i", 2 === a.getElementsByClassName("i").length }), c.getById = ib(function (a) { return o.appendChild(a).id = u, !e.getElementsByName || !e.getElementsByName(u).length }), c.getById ? (d.find.ID = function (a, b) { if (typeof b.getElementById !== C && p) { var c = b.getElementById(a); return c && c.parentNode ? [c] : [] } }, d.filter.ID = function (a) { var b = a.replace(cb, db); return function (a) { return a.getAttribute("id") === b } }) : (delete d.find.ID, d.filter.ID = function (a) { var b = a.replace(cb, db); return function (a) { var c = typeof a.getAttributeNode !== C && a.getAttributeNode("id"); return c && c.value === b } }), d.find.TAG = c.getElementsByTagName ? function (a, b) { return typeof b.getElementsByTagName !== C ? b.getElementsByTagName(a) : void 0 } : function (a, b) { var c, d = [], e = 0, f = b.getElementsByTagName(a); if ("*" === a) { while (c = f[e++]) 1 === c.nodeType && d.push(c); return d } return f }, d.find.CLASS = c.getElementsByClassName && function (a, b) { return typeof b.getElementsByClassName !== C && p ? b.getElementsByClassName(a) : void 0 }, r = [], q = [], (c.qsa = $.test(e.querySelectorAll)) && (ib(function (a) { a.innerHTML = "<select msallowclip=''><option selected=''></option></select>", a.querySelectorAll("[msallowclip^='']").length && q.push("[*^$]=" + M + "*(?:''|\"\")"), a.querySelectorAll("[selected]").length || q.push("\\[" + M + "*(?:value|" + L + ")"), a.querySelectorAll(":checked").length || q.push(":checked") }), ib(function (a) { var b = e.createElement("input"); b.setAttribute("type", "hidden"), a.appendChild(b).setAttribute("name", "D"), a.querySelectorAll("[name=d]").length && q.push("name" + M + "*[*^$|!~]?="), a.querySelectorAll(":enabled").length || q.push(":enabled", ":disabled"), a.querySelectorAll("*,:x"), q.push(",.*:") })), (c.matchesSelector = $.test(s = o.matches || o.webkitMatchesSelector || o.mozMatchesSelector || o.oMatchesSelector || o.msMatchesSelector)) && ib(function (a) { c.disconnectedMatch = s.call(a, "div"), s.call(a, "[s!='']:x"), r.push("!=", Q) }), q = q.length && new RegExp(q.join("|")), r = r.length && new RegExp(r.join("|")), b = $.test(o.compareDocumentPosition), t = b || $.test(o.contains) ? function (a, b) { var c = 9 === a.nodeType ? a.documentElement : a, d = b && b.parentNode; return a === d || !(!d || 1 !== d.nodeType || !(c.contains ? c.contains(d) : a.compareDocumentPosition && 16 & a.compareDocumentPosition(d))) } : function (a, b) { if (b) while (b = b.parentNode) if (b === a) return !0; return !1 }, B = b ? function (a, b) { if (a === b) return l = !0, 0; var d = !a.compareDocumentPosition - !b.compareDocumentPosition; return d ? d : (d = (a.ownerDocument || a) === (b.ownerDocument || b) ? a.compareDocumentPosition(b) : 1, 1 & d || !c.sortDetached && b.compareDocumentPosition(a) === d ? a === e || a.ownerDocument === v && t(v, a) ? -1 : b === e || b.ownerDocument === v && t(v, b) ? 1 : k ? K.call(k, a) - K.call(k, b) : 0 : 4 & d ? -1 : 1) } : function (a, b) { if (a === b) return l = !0, 0; var c, d = 0, f = a.parentNode, g = b.parentNode, h = [a], i = [b]; if (!f || !g) return a === e ? -1 : b === e ? 1 : f ? -1 : g ? 1 : k ? K.call(k, a) - K.call(k, b) : 0; if (f === g) return kb(a, b); c = a; while (c = c.parentNode) h.unshift(c); c = b; while (c = c.parentNode) i.unshift(c); while (h[d] === i[d]) d++; return d ? kb(h[d], i[d]) : h[d] === v ? -1 : i[d] === v ? 1 : 0 }, e) : n }, fb.matches = function (a, b) { return fb(a, null, null, b) }, fb.matchesSelector = function (a, b) { if ((a.ownerDocument || a) !== n && m(a), b = b.replace(U, "='$1']"), !(!c.matchesSelector || !p || r && r.test(b) || q && q.test(b))) try { var d = s.call(a, b); if (d || c.disconnectedMatch || a.document && 11 !== a.document.nodeType) return d } catch (e) { } return fb(b, n, null, [a]).length > 0 }, fb.contains = function (a, b) { return (a.ownerDocument || a) !== n && m(a), t(a, b) }, fb.attr = function (a, b) { (a.ownerDocument || a) !== n && m(a); var e = d.attrHandle[b.toLowerCase()], f = e && E.call(d.attrHandle, b.toLowerCase()) ? e(a, b, !p) : void 0; return void 0 !== f ? f : c.attributes || !p ? a.getAttribute(b) : (f = a.getAttributeNode(b)) && f.specified ? f.value : null }, fb.error = function (a) { throw new Error("Syntax error, unrecognized expression: " + a) }, fb.uniqueSort = function (a) { var b, d = [], e = 0, f = 0; if (l = !c.detectDuplicates, k = !c.sortStable && a.slice(0), a.sort(B), l) { while (b = a[f++]) b === a[f] && (e = d.push(f)); while (e--) a.splice(d[e], 1) } return k = null, a }, e = fb.getText = function (a) { var b, c = "", d = 0, f = a.nodeType; if (f) { if (1 === f || 9 === f || 11 === f) { if ("string" == typeof a.textContent) return a.textContent; for (a = a.firstChild; a; a = a.nextSibling) c += e(a) } else if (3 === f || 4 === f) return a.nodeValue } else while (b = a[d++]) c += e(b); return c }, d = fb.selectors = { cacheLength: 50, createPseudo: hb, match: X, attrHandle: {}, find: {}, relative: { ">": { dir: "parentNode", first: !0 }, " ": { dir: "parentNode" }, "+": { dir: "previousSibling", first: !0 }, "~": { dir: "previousSibling" } }, preFilter: { ATTR: function (a) { return a[1] = a[1].replace(cb, db), a[3] = (a[3] || a[4] || a[5] || "").replace(cb, db), "~=" === a[2] && (a[3] = " " + a[3] + " "), a.slice(0, 4) }, CHILD: function (a) { return a[1] = a[1].toLowerCase(), "nth" === a[1].slice(0, 3) ? (a[3] || fb.error(a[0]), a[4] = +(a[4] ? a[5] + (a[6] || 1) : 2 * ("even" === a[3] || "odd" === a[3])), a[5] = +(a[7] + a[8] || "odd" === a[3])) : a[3] && fb.error(a[0]), a }, PSEUDO: function (a) { var b, c = !a[6] && a[2]; return X.CHILD.test(a[0]) ? null : (a[3] ? a[2] = a[4] || a[5] || "" : c && V.test(c) && (b = g(c, !0)) && (b = c.indexOf(")", c.length - b) - c.length) && (a[0] = a[0].slice(0, b), a[2] = c.slice(0, b)), a.slice(0, 3)) } }, filter: { TAG: function (a) { var b = a.replace(cb, db).toLowerCase(); return "*" === a ? function () { return !0 } : function (a) { return a.nodeName && a.nodeName.toLowerCase() === b } }, CLASS: function (a) { var b = y[a + " "]; return b || (b = new RegExp("(^|" + M + ")" + a + "(" + M + "|$)")) && y(a, function (a) { return b.test("string" == typeof a.className && a.className || typeof a.getAttribute !== C && a.getAttribute("class") || "") }) }, ATTR: function (a, b, c) { return function (d) { var e = fb.attr(d, a); return null == e ? "!=" === b : b ? (e += "", "=" === b ? e === c : "!=" === b ? e !== c : "^=" === b ? c && 0 === e.indexOf(c) : "*=" === b ? c && e.indexOf(c) > -1 : "$=" === b ? c && e.slice(-c.length) === c : "~=" === b ? (" " + e + " ").indexOf(c) > -1 : "|=" === b ? e === c || e.slice(0, c.length + 1) === c + "-" : !1) : !0 } }, CHILD: function (a, b, c, d, e) { var f = "nth" !== a.slice(0, 3), g = "last" !== a.slice(-4), h = "of-type" === b; return 1 === d && 0 === e ? function (a) { return !!a.parentNode } : function (b, c, i) { var j, k, l, m, n, o, p = f !== g ? "nextSibling" : "previousSibling", q = b.parentNode, r = h && b.nodeName.toLowerCase(), s = !i && !h; if (q) { if (f) { while (p) { l = b; while (l = l[p]) if (h ? l.nodeName.toLowerCase() === r : 1 === l.nodeType) return !1; o = p = "only" === a && !o && "nextSibling" } return !0 } if (o = [g ? q.firstChild : q.lastChild], g && s) { k = q[u] || (q[u] = {}), j = k[a] || [], n = j[0] === w && j[1], m = j[0] === w && j[2], l = n && q.childNodes[n]; while (l = ++n && l && l[p] || (m = n = 0) || o.pop()) if (1 === l.nodeType && ++m && l === b) { k[a] = [w, n, m]; break } } else if (s && (j = (b[u] || (b[u] = {}))[a]) && j[0] === w) m = j[1]; else while (l = ++n && l && l[p] || (m = n = 0) || o.pop()) if ((h ? l.nodeName.toLowerCase() === r : 1 === l.nodeType) && ++m && (s && ((l[u] || (l[u] = {}))[a] = [w, m]), l === b)) break; return m -= e, m === d || m % d === 0 && m / d >= 0 } } }, PSEUDO: function (a, b) { var c, e = d.pseudos[a] || d.setFilters[a.toLowerCase()] || fb.error("unsupported pseudo: " + a); return e[u] ? e(b) : e.length > 1 ? (c = [a, a, "", b], d.setFilters.hasOwnProperty(a.toLowerCase()) ? hb(function (a, c) { var d, f = e(a, b), g = f.length; while (g--) d = K.call(a, f[g]), a[d] = !(c[d] = f[g]) }) : function (a) { return e(a, 0, c) }) : e } }, pseudos: { not: hb(function (a) { var b = [], c = [], d = h(a.replace(R, "$1")); return d[u] ? hb(function (a, b, c, e) { var f, g = d(a, null, e, []), h = a.length; while (h--) (f = g[h]) && (a[h] = !(b[h] = f)) }) : function (a, e, f) { return b[0] = a, d(b, null, f, c), !c.pop() } }), has: hb(function (a) { return function (b) { return fb(a, b).length > 0 } }), contains: hb(function (a) { return function (b) { return (b.textContent || b.innerText || e(b)).indexOf(a) > -1 } }), lang: hb(function (a) { return W.test(a || "") || fb.error("unsupported lang: " + a), a = a.replace(cb, db).toLowerCase(), function (b) { var c; do if (c = p ? b.lang : b.getAttribute("xml:lang") || b.getAttribute("lang")) return c = c.toLowerCase(), c === a || 0 === c.indexOf(a + "-"); while ((b = b.parentNode) && 1 === b.nodeType); return !1 } }), target: function (b) { var c = a.location && a.location.hash; return c && c.slice(1) === b.id }, root: function (a) { return a === o }, focus: function (a) { return a === n.activeElement && (!n.hasFocus || n.hasFocus()) && !!(a.type || a.href || ~a.tabIndex) }, enabled: function (a) { return a.disabled === !1 }, disabled: function (a) { return a.disabled === !0 }, checked: function (a) { var b = a.nodeName.toLowerCase(); return "input" === b && !!a.checked || "option" === b && !!a.selected }, selected: function (a) { return a.parentNode && a.parentNode.selectedIndex, a.selected === !0 }, empty: function (a) { for (a = a.firstChild; a; a = a.nextSibling) if (a.nodeType < 6) return !1; return !0 }, parent: function (a) { return !d.pseudos.empty(a) }, header: function (a) { return Z.test(a.nodeName) }, input: function (a) { return Y.test(a.nodeName) }, button: function (a) { var b = a.nodeName.toLowerCase(); return "input" === b && "button" === a.type || "button" === b }, text: function (a) { var b; return "input" === a.nodeName.toLowerCase() && "text" === a.type && (null == (b = a.getAttribute("type")) || "text" === b.toLowerCase()) }, first: nb(function () { return [0] }), last: nb(function (a, b) { return [b - 1] }), eq: nb(function (a, b, c) { return [0 > c ? c + b : c] }), even: nb(function (a, b) { for (var c = 0; b > c; c += 2) a.push(c); return a }), odd: nb(function (a, b) { for (var c = 1; b > c; c += 2) a.push(c); return a }), lt: nb(function (a, b, c) { for (var d = 0 > c ? c + b : c; --d >= 0;) a.push(d); return a }), gt: nb(function (a, b, c) { for (var d = 0 > c ? c + b : c; ++d < b;) a.push(d); return a }) } }, d.pseudos.nth = d.pseudos.eq; for (b in { radio: !0, checkbox: !0, file: !0, password: !0, image: !0 }) d.pseudos[b] = lb(b); for (b in { submit: !0, reset: !0 }) d.pseudos[b] = mb(b); function pb() { } pb.prototype = d.filters = d.pseudos, d.setFilters = new pb, g = fb.tokenize = function (a, b) { var c, e, f, g, h, i, j, k = z[a + " "]; if (k) return b ? 0 : k.slice(0); h = a, i = [], j = d.preFilter; while (h) { (!c || (e = S.exec(h))) && (e && (h = h.slice(e[0].length) || h), i.push(f = [])), c = !1, (e = T.exec(h)) && (c = e.shift(), f.push({ value: c, type: e[0].replace(R, " ") }), h = h.slice(c.length)); for (g in d.filter) !(e = X[g].exec(h)) || j[g] && !(e = j[g](e)) || (c = e.shift(), f.push({ value: c, type: g, matches: e }), h = h.slice(c.length)); if (!c) break } return b ? h.length : h ? fb.error(a) : z(a, i).slice(0) }; function qb(a) { for (var b = 0, c = a.length, d = ""; c > b; b++) d += a[b].value; return d } function rb(a, b, c) { var d = b.dir, e = c && "parentNode" === d, f = x++; return b.first ? function (b, c, f) { while (b = b[d]) if (1 === b.nodeType || e) return a(b, c, f) } : function (b, c, g) { var h, i, j = [w, f]; if (g) { while (b = b[d]) if ((1 === b.nodeType || e) && a(b, c, g)) return !0 } else while (b = b[d]) if (1 === b.nodeType || e) { if (i = b[u] || (b[u] = {}), (h = i[d]) && h[0] === w && h[1] === f) return j[2] = h[2]; if (i[d] = j, j[2] = a(b, c, g)) return !0 } } } function sb(a) { return a.length > 1 ? function (b, c, d) { var e = a.length; while (e--) if (!a[e](b, c, d)) return !1; return !0 } : a[0] } function tb(a, b, c) { for (var d = 0, e = b.length; e > d; d++) fb(a, b[d], c); return c } function ub(a, b, c, d, e) { for (var f, g = [], h = 0, i = a.length, j = null != b; i > h; h++) (f = a[h]) && (!c || c(f, d, e)) && (g.push(f), j && b.push(h)); return g } function vb(a, b, c, d, e, f) { return d && !d[u] && (d = vb(d)), e && !e[u] && (e = vb(e, f)), hb(function (f, g, h, i) { var j, k, l, m = [], n = [], o = g.length, p = f || tb(b || "*", h.nodeType ? [h] : h, []), q = !a || !f && b ? p : ub(p, m, a, h, i), r = c ? e || (f ? a : o || d) ? [] : g : q; if (c && c(q, r, h, i), d) { j = ub(r, n), d(j, [], h, i), k = j.length; while (k--) (l = j[k]) && (r[n[k]] = !(q[n[k]] = l)) } if (f) { if (e || a) { if (e) { j = [], k = r.length; while (k--) (l = r[k]) && j.push(q[k] = l); e(null, r = [], j, i) } k = r.length; while (k--) (l = r[k]) && (j = e ? K.call(f, l) : m[k]) > -1 && (f[j] = !(g[j] = l)) } } else r = ub(r === g ? r.splice(o, r.length) : r), e ? e(null, g, r, i) : I.apply(g, r) }) } function wb(a) { for (var b, c, e, f = a.length, g = d.relative[a[0].type], h = g || d.relative[" "], i = g ? 1 : 0, k = rb(function (a) { return a === b }, h, !0), l = rb(function (a) { return K.call(b, a) > -1 }, h, !0), m = [function (a, c, d) { return !g && (d || c !== j) || ((b = c).nodeType ? k(a, c, d) : l(a, c, d)) }]; f > i; i++) if (c = d.relative[a[i].type]) m = [rb(sb(m), c)]; else { if (c = d.filter[a[i].type].apply(null, a[i].matches), c[u]) { for (e = ++i; f > e; e++) if (d.relative[a[e].type]) break; return vb(i > 1 && sb(m), i > 1 && qb(a.slice(0, i - 1).concat({ value: " " === a[i - 2].type ? "*" : "" })).replace(R, "$1"), c, e > i && wb(a.slice(i, e)), f > e && wb(a = a.slice(e)), f > e && qb(a)) } m.push(c) } return sb(m) } function xb(a, b) { var c = b.length > 0, e = a.length > 0, f = function (f, g, h, i, k) { var l, m, o, p = 0, q = "0", r = f && [], s = [], t = j, u = f || e && d.find.TAG("*", k), v = w += null == t ? 1 : Math.random() || .1, x = u.length; for (k && (j = g !== n && g) ; q !== x && null != (l = u[q]) ; q++) { if (e && l) { m = 0; while (o = a[m++]) if (o(l, g, h)) { i.push(l); break } k && (w = v) } c && ((l = !o && l) && p--, f && r.push(l)) } if (p += q, c && q !== p) { m = 0; while (o = b[m++]) o(r, s, g, h); if (f) { if (p > 0) while (q--) r[q] || s[q] || (s[q] = G.call(i)); s = ub(s) } I.apply(i, s), k && !f && s.length > 0 && p + b.length > 1 && fb.uniqueSort(i) } return k && (w = v, j = t), r }; return c ? hb(f) : f } return h = fb.compile = function (a, b) { var c, d = [], e = [], f = A[a + " "]; if (!f) { b || (b = g(a)), c = b.length; while (c--) f = wb(b[c]), f[u] ? d.push(f) : e.push(f); f = A(a, xb(e, d)), f.selector = a } return f }, i = fb.select = function (a, b, e, f) { var i, j, k, l, m, n = "function" == typeof a && a, o = !f && g(a = n.selector || a); if (e = e || [], 1 === o.length) { if (j = o[0] = o[0].slice(0), j.length > 2 && "ID" === (k = j[0]).type && c.getById && 9 === b.nodeType && p && d.relative[j[1].type]) { if (b = (d.find.ID(k.matches[0].replace(cb, db), b) || [])[0], !b) return e; n && (b = b.parentNode), a = a.slice(j.shift().value.length) } i = X.needsContext.test(a) ? 0 : j.length; while (i--) { if (k = j[i], d.relative[l = k.type]) break; if ((m = d.find[l]) && (f = m(k.matches[0].replace(cb, db), ab.test(j[0].type) && ob(b.parentNode) || b))) { if (j.splice(i, 1), a = f.length && qb(j), !a) return I.apply(e, f), e; break } } } return (n || h(a, o))(f, b, !p, e, ab.test(a) && ob(b.parentNode) || b), e }, c.sortStable = u.split("").sort(B).join("") === u, c.detectDuplicates = !!l, m(), c.sortDetached = ib(function (a) { return 1 & a.compareDocumentPosition(n.createElement("div")) }), ib(function (a) { return a.innerHTML = "<a href='#'></a>", "#" === a.firstChild.getAttribute("href") }) || jb("type|href|height|width", function (a, b, c) { return c ? void 0 : a.getAttribute(b, "type" === b.toLowerCase() ? 1 : 2) }), c.attributes && ib(function (a) { return a.innerHTML = "<input/>", a.firstChild.setAttribute("value", ""), "" === a.firstChild.getAttribute("value") }) || jb("value", function (a, b, c) { return c || "input" !== a.nodeName.toLowerCase() ? void 0 : a.defaultValue }), ib(function (a) { return null == a.getAttribute("disabled") }) || jb(L, function (a, b, c) { var d; return c ? void 0 : a[b] === !0 ? b.toLowerCase() : (d = a.getAttributeNode(b)) && d.specified ? d.value : null }), fb }(a); m.find = s, m.expr = s.selectors, m.expr[":"] = m.expr.pseudos, m.unique = s.uniqueSort, m.text = s.getText, m.isXMLDoc = s.isXML, m.contains = s.contains; var t = m.expr.match.needsContext, u = /^<(\w+)\s*\/?>(?:<\/\1>|)$/, v = /^.[^:#\[\.,]*$/; function w(a, b, c) { if (m.isFunction(b)) return m.grep(a, function (a, d) { return !!b.call(a, d, a) !== c }); if (b.nodeType) return m.grep(a, function (a) { return a === b !== c }); if ("string" == typeof b) { if (v.test(b)) return m.filter(b, a, c); b = m.filter(b, a) } return m.grep(a, function (a) { return m.inArray(a, b) >= 0 !== c }) } m.filter = function (a, b, c) { var d = b[0]; return c && (a = ":not(" + a + ")"), 1 === b.length && 1 === d.nodeType ? m.find.matchesSelector(d, a) ? [d] : [] : m.find.matches(a, m.grep(b, function (a) { return 1 === a.nodeType })) }, m.fn.extend({ find: function (a) { var b, c = [], d = this, e = d.length; if ("string" != typeof a) return this.pushStack(m(a).filter(function () { for (b = 0; e > b; b++) if (m.contains(d[b], this)) return !0 })); for (b = 0; e > b; b++) m.find(a, d[b], c); return c = this.pushStack(e > 1 ? m.unique(c) : c), c.selector = this.selector ? this.selector + " " + a : a, c }, filter: function (a) { return this.pushStack(w(this, a || [], !1)) }, not: function (a) { return this.pushStack(w(this, a || [], !0)) }, is: function (a) { return !!w(this, "string" == typeof a && t.test(a) ? m(a) : a || [], !1).length } }); var x, y = a.document, z = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/, A = m.fn.init = function (a, b) { var c, d; if (!a) return this; if ("string" == typeof a) { if (c = "<" === a.charAt(0) && ">" === a.charAt(a.length - 1) && a.length >= 3 ? [null, a, null] : z.exec(a), !c || !c[1] && b) return !b || b.jquery ? (b || x).find(a) : this.constructor(b).find(a); if (c[1]) { if (b = b instanceof m ? b[0] : b, m.merge(this, m.parseHTML(c[1], b && b.nodeType ? b.ownerDocument || b : y, !0)), u.test(c[1]) && m.isPlainObject(b)) for (c in b) m.isFunction(this[c]) ? this[c](b[c]) : this.attr(c, b[c]); return this } if (d = y.getElementById(c[2]), d && d.parentNode) { if (d.id !== c[2]) return x.find(a); this.length = 1, this[0] = d } return this.context = y, this.selector = a, this } return a.nodeType ? (this.context = this[0] = a, this.length = 1, this) : m.isFunction(a) ? "undefined" != typeof x.ready ? x.ready(a) : a(m) : (void 0 !== a.selector && (this.selector = a.selector, this.context = a.context), m.makeArray(a, this)) }; A.prototype = m.fn, x = m(y); var B = /^(?:parents|prev(?:Until|All))/, C = { children: !0, contents: !0, next: !0, prev: !0 }; m.extend({ dir: function (a, b, c) { var d = [], e = a[b]; while (e && 9 !== e.nodeType && (void 0 === c || 1 !== e.nodeType || !m(e).is(c))) 1 === e.nodeType && d.push(e), e = e[b]; return d }, sibling: function (a, b) { for (var c = []; a; a = a.nextSibling) 1 === a.nodeType && a !== b && c.push(a); return c } }), m.fn.extend({ has: function (a) { var b, c = m(a, this), d = c.length; return this.filter(function () { for (b = 0; d > b; b++) if (m.contains(this, c[b])) return !0 }) }, closest: function (a, b) { for (var c, d = 0, e = this.length, f = [], g = t.test(a) || "string" != typeof a ? m(a, b || this.context) : 0; e > d; d++) for (c = this[d]; c && c !== b; c = c.parentNode) if (c.nodeType < 11 && (g ? g.index(c) > -1 : 1 === c.nodeType && m.find.matchesSelector(c, a))) { f.push(c); break } return this.pushStack(f.length > 1 ? m.unique(f) : f) }, index: function (a) { return a ? "string" == typeof a ? m.inArray(this[0], m(a)) : m.inArray(a.jquery ? a[0] : a, this) : this[0] && this[0].parentNode ? this.first().prevAll().length : -1 }, add: function (a, b) { return this.pushStack(m.unique(m.merge(this.get(), m(a, b)))) }, addBack: function (a) { return this.add(null == a ? this.prevObject : this.prevObject.filter(a)) } }); function D(a, b) { do a = a[b]; while (a && 1 !== a.nodeType); return a } m.each({ parent: function (a) { var b = a.parentNode; return b && 11 !== b.nodeType ? b : null }, parents: function (a) { return m.dir(a, "parentNode") }, parentsUntil: function (a, b, c) { return m.dir(a, "parentNode", c) }, next: function (a) { return D(a, "nextSibling") }, prev: function (a) { return D(a, "previousSibling") }, nextAll: function (a) { return m.dir(a, "nextSibling") }, prevAll: function (a) { return m.dir(a, "previousSibling") }, nextUntil: function (a, b, c) { return m.dir(a, "nextSibling", c) }, prevUntil: function (a, b, c) { return m.dir(a, "previousSibling", c) }, siblings: function (a) { return m.sibling((a.parentNode || {}).firstChild, a) }, children: function (a) { return m.sibling(a.firstChild) }, contents: function (a) { return m.nodeName(a, "iframe") ? a.contentDocument || a.contentWindow.document : m.merge([], a.childNodes) } }, function (a, b) { m.fn[a] = function (c, d) { var e = m.map(this, b, c); return "Until" !== a.slice(-5) && (d = c), d && "string" == typeof d && (e = m.filter(d, e)), this.length > 1 && (C[a] || (e = m.unique(e)), B.test(a) && (e = e.reverse())), this.pushStack(e) } }); var E = /\S+/g, F = {}; function G(a) { var b = F[a] = {}; return m.each(a.match(E) || [], function (a, c) { b[c] = !0 }), b } m.Callbacks = function (a) { a = "string" == typeof a ? F[a] || G(a) : m.extend({}, a); var b, c, d, e, f, g, h = [], i = !a.once && [], j = function (l) { for (c = a.memory && l, d = !0, f = g || 0, g = 0, e = h.length, b = !0; h && e > f; f++) if (h[f].apply(l[0], l[1]) === !1 && a.stopOnFalse) { c = !1; break } b = !1, h && (i ? i.length && j(i.shift()) : c ? h = [] : k.disable()) }, k = { add: function () { if (h) { var d = h.length; !function f(b) { m.each(b, function (b, c) { var d = m.type(c); "function" === d ? a.unique && k.has(c) || h.push(c) : c && c.length && "string" !== d && f(c) }) }(arguments), b ? e = h.length : c && (g = d, j(c)) } return this }, remove: function () { return h && m.each(arguments, function (a, c) { var d; while ((d = m.inArray(c, h, d)) > -1) h.splice(d, 1), b && (e >= d && e--, f >= d && f--) }), this }, has: function (a) { return a ? m.inArray(a, h) > -1 : !(!h || !h.length) }, empty: function () { return h = [], e = 0, this }, disable: function () { return h = i = c = void 0, this }, disabled: function () { return !h }, lock: function () { return i = void 0, c || k.disable(), this }, locked: function () { return !i }, fireWith: function (a, c) { return !h || d && !i || (c = c || [], c = [a, c.slice ? c.slice() : c], b ? i.push(c) : j(c)), this }, fire: function () { return k.fireWith(this, arguments), this }, fired: function () { return !!d } }; return k }, m.extend({ Deferred: function (a) { var b = [["resolve", "done", m.Callbacks("once memory"), "resolved"], ["reject", "fail", m.Callbacks("once memory"), "rejected"], ["notify", "progress", m.Callbacks("memory")]], c = "pending", d = { state: function () { return c }, always: function () { return e.done(arguments).fail(arguments), this }, then: function () { var a = arguments; return m.Deferred(function (c) { m.each(b, function (b, f) { var g = m.isFunction(a[b]) && a[b]; e[f[1]](function () { var a = g && g.apply(this, arguments); a && m.isFunction(a.promise) ? a.promise().done(c.resolve).fail(c.reject).progress(c.notify) : c[f[0] + "With"](this === d ? c.promise() : this, g ? [a] : arguments) }) }), a = null }).promise() }, promise: function (a) { return null != a ? m.extend(a, d) : d } }, e = {}; return d.pipe = d.then, m.each(b, function (a, f) { var g = f[2], h = f[3]; d[f[1]] = g.add, h && g.add(function () { c = h }, b[1 ^ a][2].disable, b[2][2].lock), e[f[0]] = function () { return e[f[0] + "With"](this === e ? d : this, arguments), this }, e[f[0] + "With"] = g.fireWith }), d.promise(e), a && a.call(e, e), e }, when: function (a) { var b = 0, c = d.call(arguments), e = c.length, f = 1 !== e || a && m.isFunction(a.promise) ? e : 0, g = 1 === f ? a : m.Deferred(), h = function (a, b, c) { return function (e) { b[a] = this, c[a] = arguments.length > 1 ? d.call(arguments) : e, c === i ? g.notifyWith(b, c) : --f || g.resolveWith(b, c) } }, i, j, k; if (e > 1) for (i = new Array(e), j = new Array(e), k = new Array(e) ; e > b; b++) c[b] && m.isFunction(c[b].promise) ? c[b].promise().done(h(b, k, c)).fail(g.reject).progress(h(b, j, i)) : --f; return f || g.resolveWith(k, c), g.promise() } }); var H; m.fn.ready = function (a) { return m.ready.promise().done(a), this }, m.extend({ isReady: !1, readyWait: 1, holdReady: function (a) { a ? m.readyWait++ : m.ready(!0) }, ready: function (a) { if (a === !0 ? !--m.readyWait : !m.isReady) { if (!y.body) return setTimeout(m.ready); m.isReady = !0, a !== !0 && --m.readyWait > 0 || (H.resolveWith(y, [m]), m.fn.triggerHandler && (m(y).triggerHandler("ready"), m(y).off("ready"))) } } }); function I() { y.addEventListener ? (y.removeEventListener("DOMContentLoaded", J, !1), a.removeEventListener("load", J, !1)) : (y.detachEvent("onreadystatechange", J), a.detachEvent("onload", J)) } function J() { (y.addEventListener || "load" === event.type || "complete" === y.readyState) && (I(), m.ready()) } m.ready.promise = function (b) { if (!H) if (H = m.Deferred(), "complete" === y.readyState) setTimeout(m.ready); else if (y.addEventListener) y.addEventListener("DOMContentLoaded", J, !1), a.addEventListener("load", J, !1); else { y.attachEvent("onreadystatechange", J), a.attachEvent("onload", J); var c = !1; try { c = null == a.frameElement && y.documentElement } catch (d) { } c && c.doScroll && !function e() { if (!m.isReady) { try { c.doScroll("left") } catch (a) { return setTimeout(e, 50) } I(), m.ready() } }() } return H.promise(b) }; var K = "undefined", L; for (L in m(k)) break; k.ownLast = "0" !== L, k.inlineBlockNeedsLayout = !1, m(function () { var a, b, c, d; c = y.getElementsByTagName("body")[0], c && c.style && (b = y.createElement("div"), d = y.createElement("div"), d.style.cssText = "position:absolute;border:0;width:0;height:0;top:0;left:-9999px", c.appendChild(d).appendChild(b), typeof b.style.zoom !== K && (b.style.cssText = "display:inline;margin:0;border:0;padding:1px;width:1px;zoom:1", k.inlineBlockNeedsLayout = a = 3 === b.offsetWidth, a && (c.style.zoom = 1)), c.removeChild(d)) }), function () { var a = y.createElement("div"); if (null == k.deleteExpando) { k.deleteExpando = !0; try { delete a.test } catch (b) { k.deleteExpando = !1 } } a = null }(), m.acceptData = function (a) { var b = m.noData[(a.nodeName + " ").toLowerCase()], c = +a.nodeType || 1; return 1 !== c && 9 !== c ? !1 : !b || b !== !0 && a.getAttribute("classid") === b }; var M = /^(?:\{[\w\W]*\}|\[[\w\W]*\])$/, N = /([A-Z])/g; function O(a, b, c) { if (void 0 === c && 1 === a.nodeType) { var d = "data-" + b.replace(N, "-$1").toLowerCase(); if (c = a.getAttribute(d), "string" == typeof c) { try { c = "true" === c ? !0 : "false" === c ? !1 : "null" === c ? null : +c + "" === c ? +c : M.test(c) ? m.parseJSON(c) : c } catch (e) { } m.data(a, b, c) } else c = void 0 } return c } function P(a) { var b; for (b in a) if (("data" !== b || !m.isEmptyObject(a[b])) && "toJSON" !== b) return !1; return !0 } function Q(a, b, d, e) {
        if (m.acceptData(a)) {
            var f, g, h = m.expando, i = a.nodeType, j = i ? m.cache : a, k = i ? a[h] : a[h] && h;
            if (k && j[k] && (e || j[k].data) || void 0 !== d || "string" != typeof b) return k || (k = i ? a[h] = c.pop() || m.guid++ : h), j[k] || (j[k] = i ? {} : { toJSON: m.noop }), ("object" == typeof b || "function" == typeof b) && (e ? j[k] = m.extend(j[k], b) : j[k].data = m.extend(j[k].data, b)), g = j[k], e || (g.data || (g.data = {}), g = g.data), void 0 !== d && (g[m.camelCase(b)] = d), "string" == typeof b ? (f = g[b], null == f && (f = g[m.camelCase(b)])) : f = g, f
        }
    } function R(a, b, c) { if (m.acceptData(a)) { var d, e, f = a.nodeType, g = f ? m.cache : a, h = f ? a[m.expando] : m.expando; if (g[h]) { if (b && (d = c ? g[h] : g[h].data)) { m.isArray(b) ? b = b.concat(m.map(b, m.camelCase)) : b in d ? b = [b] : (b = m.camelCase(b), b = b in d ? [b] : b.split(" ")), e = b.length; while (e--) delete d[b[e]]; if (c ? !P(d) : !m.isEmptyObject(d)) return } (c || (delete g[h].data, P(g[h]))) && (f ? m.cleanData([a], !0) : k.deleteExpando || g != g.window ? delete g[h] : g[h] = null) } } } m.extend({ cache: {}, noData: { "applet ": !0, "embed ": !0, "object ": "clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" }, hasData: function (a) { return a = a.nodeType ? m.cache[a[m.expando]] : a[m.expando], !!a && !P(a) }, data: function (a, b, c) { return Q(a, b, c) }, removeData: function (a, b) { return R(a, b) }, _data: function (a, b, c) { return Q(a, b, c, !0) }, _removeData: function (a, b) { return R(a, b, !0) } }), m.fn.extend({ data: function (a, b) { var c, d, e, f = this[0], g = f && f.attributes; if (void 0 === a) { if (this.length && (e = m.data(f), 1 === f.nodeType && !m._data(f, "parsedAttrs"))) { c = g.length; while (c--) g[c] && (d = g[c].name, 0 === d.indexOf("data-") && (d = m.camelCase(d.slice(5)), O(f, d, e[d]))); m._data(f, "parsedAttrs", !0) } return e } return "object" == typeof a ? this.each(function () { m.data(this, a) }) : arguments.length > 1 ? this.each(function () { m.data(this, a, b) }) : f ? O(f, a, m.data(f, a)) : void 0 }, removeData: function (a) { return this.each(function () { m.removeData(this, a) }) } }), m.extend({ queue: function (a, b, c) { var d; return a ? (b = (b || "fx") + "queue", d = m._data(a, b), c && (!d || m.isArray(c) ? d = m._data(a, b, m.makeArray(c)) : d.push(c)), d || []) : void 0 }, dequeue: function (a, b) { b = b || "fx"; var c = m.queue(a, b), d = c.length, e = c.shift(), f = m._queueHooks(a, b), g = function () { m.dequeue(a, b) }; "inprogress" === e && (e = c.shift(), d--), e && ("fx" === b && c.unshift("inprogress"), delete f.stop, e.call(a, g, f)), !d && f && f.empty.fire() }, _queueHooks: function (a, b) { var c = b + "queueHooks"; return m._data(a, c) || m._data(a, c, { empty: m.Callbacks("once memory").add(function () { m._removeData(a, b + "queue"), m._removeData(a, c) }) }) } }), m.fn.extend({ queue: function (a, b) { var c = 2; return "string" != typeof a && (b = a, a = "fx", c--), arguments.length < c ? m.queue(this[0], a) : void 0 === b ? this : this.each(function () { var c = m.queue(this, a, b); m._queueHooks(this, a), "fx" === a && "inprogress" !== c[0] && m.dequeue(this, a) }) }, dequeue: function (a) { return this.each(function () { m.dequeue(this, a) }) }, clearQueue: function (a) { return this.queue(a || "fx", []) }, promise: function (a, b) { var c, d = 1, e = m.Deferred(), f = this, g = this.length, h = function () { --d || e.resolveWith(f, [f]) }; "string" != typeof a && (b = a, a = void 0), a = a || "fx"; while (g--) c = m._data(f[g], a + "queueHooks"), c && c.empty && (d++, c.empty.add(h)); return h(), e.promise(b) } }); var S = /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source, T = ["Top", "Right", "Bottom", "Left"], U = function (a, b) { return a = b || a, "none" === m.css(a, "display") || !m.contains(a.ownerDocument, a) }, V = m.access = function (a, b, c, d, e, f, g) { var h = 0, i = a.length, j = null == c; if ("object" === m.type(c)) { e = !0; for (h in c) m.access(a, b, h, c[h], !0, f, g) } else if (void 0 !== d && (e = !0, m.isFunction(d) || (g = !0), j && (g ? (b.call(a, d), b = null) : (j = b, b = function (a, b, c) { return j.call(m(a), c) })), b)) for (; i > h; h++) b(a[h], c, g ? d : d.call(a[h], h, b(a[h], c))); return e ? a : j ? b.call(a) : i ? b(a[0], c) : f }, W = /^(?:checkbox|radio)$/i; !function () { var a = y.createElement("input"), b = y.createElement("div"), c = y.createDocumentFragment(); if (b.innerHTML = "  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>", k.leadingWhitespace = 3 === b.firstChild.nodeType, k.tbody = !b.getElementsByTagName("tbody").length, k.htmlSerialize = !!b.getElementsByTagName("link").length, k.html5Clone = "<:nav></:nav>" !== y.createElement("nav").cloneNode(!0).outerHTML, a.type = "checkbox", a.checked = !0, c.appendChild(a), k.appendChecked = a.checked, b.innerHTML = "<textarea>x</textarea>", k.noCloneChecked = !!b.cloneNode(!0).lastChild.defaultValue, c.appendChild(b), b.innerHTML = "<input type='radio' checked='checked' name='t'/>", k.checkClone = b.cloneNode(!0).cloneNode(!0).lastChild.checked, k.noCloneEvent = !0, b.attachEvent && (b.attachEvent("onclick", function () { k.noCloneEvent = !1 }), b.cloneNode(!0).click()), null == k.deleteExpando) { k.deleteExpando = !0; try { delete b.test } catch (d) { k.deleteExpando = !1 } } }(), function () { var b, c, d = y.createElement("div"); for (b in { submit: !0, change: !0, focusin: !0 }) c = "on" + b, (k[b + "Bubbles"] = c in a) || (d.setAttribute(c, "t"), k[b + "Bubbles"] = d.attributes[c].expando === !1); d = null }(); var X = /^(?:input|select|textarea)$/i, Y = /^key/, Z = /^(?:mouse|pointer|contextmenu)|click/, $ = /^(?:focusinfocus|focusoutblur)$/, _ = /^([^.]*)(?:\.(.+)|)$/; function ab() { return !0 } function bb() { return !1 } function cb() { try { return y.activeElement } catch (a) { } } m.event = { global: {}, add: function (a, b, c, d, e) { var f, g, h, i, j, k, l, n, o, p, q, r = m._data(a); if (r) { c.handler && (i = c, c = i.handler, e = i.selector), c.guid || (c.guid = m.guid++), (g = r.events) || (g = r.events = {}), (k = r.handle) || (k = r.handle = function (a) { return typeof m === K || a && m.event.triggered === a.type ? void 0 : m.event.dispatch.apply(k.elem, arguments) }, k.elem = a), b = (b || "").match(E) || [""], h = b.length; while (h--) f = _.exec(b[h]) || [], o = q = f[1], p = (f[2] || "").split(".").sort(), o && (j = m.event.special[o] || {}, o = (e ? j.delegateType : j.bindType) || o, j = m.event.special[o] || {}, l = m.extend({ type: o, origType: q, data: d, handler: c, guid: c.guid, selector: e, needsContext: e && m.expr.match.needsContext.test(e), namespace: p.join(".") }, i), (n = g[o]) || (n = g[o] = [], n.delegateCount = 0, j.setup && j.setup.call(a, d, p, k) !== !1 || (a.addEventListener ? a.addEventListener(o, k, !1) : a.attachEvent && a.attachEvent("on" + o, k))), j.add && (j.add.call(a, l), l.handler.guid || (l.handler.guid = c.guid)), e ? n.splice(n.delegateCount++, 0, l) : n.push(l), m.event.global[o] = !0); a = null } }, remove: function (a, b, c, d, e) { var f, g, h, i, j, k, l, n, o, p, q, r = m.hasData(a) && m._data(a); if (r && (k = r.events)) { b = (b || "").match(E) || [""], j = b.length; while (j--) if (h = _.exec(b[j]) || [], o = q = h[1], p = (h[2] || "").split(".").sort(), o) { l = m.event.special[o] || {}, o = (d ? l.delegateType : l.bindType) || o, n = k[o] || [], h = h[2] && new RegExp("(^|\\.)" + p.join("\\.(?:.*\\.|)") + "(\\.|$)"), i = f = n.length; while (f--) g = n[f], !e && q !== g.origType || c && c.guid !== g.guid || h && !h.test(g.namespace) || d && d !== g.selector && ("**" !== d || !g.selector) || (n.splice(f, 1), g.selector && n.delegateCount--, l.remove && l.remove.call(a, g)); i && !n.length && (l.teardown && l.teardown.call(a, p, r.handle) !== !1 || m.removeEvent(a, o, r.handle), delete k[o]) } else for (o in k) m.event.remove(a, o + b[j], c, d, !0); m.isEmptyObject(k) && (delete r.handle, m._removeData(a, "events")) } }, trigger: function (b, c, d, e) { var f, g, h, i, k, l, n, o = [d || y], p = j.call(b, "type") ? b.type : b, q = j.call(b, "namespace") ? b.namespace.split(".") : []; if (h = l = d = d || y, 3 !== d.nodeType && 8 !== d.nodeType && !$.test(p + m.event.triggered) && (p.indexOf(".") >= 0 && (q = p.split("."), p = q.shift(), q.sort()), g = p.indexOf(":") < 0 && "on" + p, b = b[m.expando] ? b : new m.Event(p, "object" == typeof b && b), b.isTrigger = e ? 2 : 3, b.namespace = q.join("."), b.namespace_re = b.namespace ? new RegExp("(^|\\.)" + q.join("\\.(?:.*\\.|)") + "(\\.|$)") : null, b.result = void 0, b.target || (b.target = d), c = null == c ? [b] : m.makeArray(c, [b]), k = m.event.special[p] || {}, e || !k.trigger || k.trigger.apply(d, c) !== !1)) { if (!e && !k.noBubble && !m.isWindow(d)) { for (i = k.delegateType || p, $.test(i + p) || (h = h.parentNode) ; h; h = h.parentNode) o.push(h), l = h; l === (d.ownerDocument || y) && o.push(l.defaultView || l.parentWindow || a) } n = 0; while ((h = o[n++]) && !b.isPropagationStopped()) b.type = n > 1 ? i : k.bindType || p, f = (m._data(h, "events") || {})[b.type] && m._data(h, "handle"), f && f.apply(h, c), f = g && h[g], f && f.apply && m.acceptData(h) && (b.result = f.apply(h, c), b.result === !1 && b.preventDefault()); if (b.type = p, !e && !b.isDefaultPrevented() && (!k._default || k._default.apply(o.pop(), c) === !1) && m.acceptData(d) && g && d[p] && !m.isWindow(d)) { l = d[g], l && (d[g] = null), m.event.triggered = p; try { d[p]() } catch (r) { } m.event.triggered = void 0, l && (d[g] = l) } return b.result } }, dispatch: function (a) { a = m.event.fix(a); var b, c, e, f, g, h = [], i = d.call(arguments), j = (m._data(this, "events") || {})[a.type] || [], k = m.event.special[a.type] || {}; if (i[0] = a, a.delegateTarget = this, !k.preDispatch || k.preDispatch.call(this, a) !== !1) { h = m.event.handlers.call(this, a, j), b = 0; while ((f = h[b++]) && !a.isPropagationStopped()) { a.currentTarget = f.elem, g = 0; while ((e = f.handlers[g++]) && !a.isImmediatePropagationStopped()) (!a.namespace_re || a.namespace_re.test(e.namespace)) && (a.handleObj = e, a.data = e.data, c = ((m.event.special[e.origType] || {}).handle || e.handler).apply(f.elem, i), void 0 !== c && (a.result = c) === !1 && (a.preventDefault(), a.stopPropagation())) } return k.postDispatch && k.postDispatch.call(this, a), a.result } }, handlers: function (a, b) { var c, d, e, f, g = [], h = b.delegateCount, i = a.target; if (h && i.nodeType && (!a.button || "click" !== a.type)) for (; i != this; i = i.parentNode || this) if (1 === i.nodeType && (i.disabled !== !0 || "click" !== a.type)) { for (e = [], f = 0; h > f; f++) d = b[f], c = d.selector + " ", void 0 === e[c] && (e[c] = d.needsContext ? m(c, this).index(i) >= 0 : m.find(c, this, null, [i]).length), e[c] && e.push(d); e.length && g.push({ elem: i, handlers: e }) } return h < b.length && g.push({ elem: this, handlers: b.slice(h) }), g }, fix: function (a) { if (a[m.expando]) return a; var b, c, d, e = a.type, f = a, g = this.fixHooks[e]; g || (this.fixHooks[e] = g = Z.test(e) ? this.mouseHooks : Y.test(e) ? this.keyHooks : {}), d = g.props ? this.props.concat(g.props) : this.props, a = new m.Event(f), b = d.length; while (b--) c = d[b], a[c] = f[c]; return a.target || (a.target = f.srcElement || y), 3 === a.target.nodeType && (a.target = a.target.parentNode), a.metaKey = !!a.metaKey, g.filter ? g.filter(a, f) : a }, props: "altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "), fixHooks: {}, keyHooks: { props: "char charCode key keyCode".split(" "), filter: function (a, b) { return null == a.which && (a.which = null != b.charCode ? b.charCode : b.keyCode), a } }, mouseHooks: { props: "button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement".split(" "), filter: function (a, b) { var c, d, e, f = b.button, g = b.fromElement; return null == a.pageX && null != b.clientX && (d = a.target.ownerDocument || y, e = d.documentElement, c = d.body, a.pageX = b.clientX + (e && e.scrollLeft || c && c.scrollLeft || 0) - (e && e.clientLeft || c && c.clientLeft || 0), a.pageY = b.clientY + (e && e.scrollTop || c && c.scrollTop || 0) - (e && e.clientTop || c && c.clientTop || 0)), !a.relatedTarget && g && (a.relatedTarget = g === a.target ? b.toElement : g), a.which || void 0 === f || (a.which = 1 & f ? 1 : 2 & f ? 3 : 4 & f ? 2 : 0), a } }, special: { load: { noBubble: !0 }, focus: { trigger: function () { if (this !== cb() && this.focus) try { return this.focus(), !1 } catch (a) { } }, delegateType: "focusin" }, blur: { trigger: function () { return this === cb() && this.blur ? (this.blur(), !1) : void 0 }, delegateType: "focusout" }, click: { trigger: function () { return m.nodeName(this, "input") && "checkbox" === this.type && this.click ? (this.click(), !1) : void 0 }, _default: function (a) { return m.nodeName(a.target, "a") } }, beforeunload: { postDispatch: function (a) { void 0 !== a.result && a.originalEvent && (a.originalEvent.returnValue = a.result) } } }, simulate: function (a, b, c, d) { var e = m.extend(new m.Event, c, { type: a, isSimulated: !0, originalEvent: {} }); d ? m.event.trigger(e, null, b) : m.event.dispatch.call(b, e), e.isDefaultPrevented() && c.preventDefault() } }, m.removeEvent = y.removeEventListener ? function (a, b, c) { a.removeEventListener && a.removeEventListener(b, c, !1) } : function (a, b, c) { var d = "on" + b; a.detachEvent && (typeof a[d] === K && (a[d] = null), a.detachEvent(d, c)) }, m.Event = function (a, b) { return this instanceof m.Event ? (a && a.type ? (this.originalEvent = a, this.type = a.type, this.isDefaultPrevented = a.defaultPrevented || void 0 === a.defaultPrevented && a.returnValue === !1 ? ab : bb) : this.type = a, b && m.extend(this, b), this.timeStamp = a && a.timeStamp || m.now(), void (this[m.expando] = !0)) : new m.Event(a, b) }, m.Event.prototype = { isDefaultPrevented: bb, isPropagationStopped: bb, isImmediatePropagationStopped: bb, preventDefault: function () { var a = this.originalEvent; this.isDefaultPrevented = ab, a && (a.preventDefault ? a.preventDefault() : a.returnValue = !1) }, stopPropagation: function () { var a = this.originalEvent; this.isPropagationStopped = ab, a && (a.stopPropagation && a.stopPropagation(), a.cancelBubble = !0) }, stopImmediatePropagation: function () { var a = this.originalEvent; this.isImmediatePropagationStopped = ab, a && a.stopImmediatePropagation && a.stopImmediatePropagation(), this.stopPropagation() } }, m.each({ mouseenter: "mouseover", mouseleave: "mouseout", pointerenter: "pointerover", pointerleave: "pointerout" }, function (a, b) { m.event.special[a] = { delegateType: b, bindType: b, handle: function (a) { var c, d = this, e = a.relatedTarget, f = a.handleObj; return (!e || e !== d && !m.contains(d, e)) && (a.type = f.origType, c = f.handler.apply(this, arguments), a.type = b), c } } }), k.submitBubbles || (m.event.special.submit = { setup: function () { return m.nodeName(this, "form") ? !1 : void m.event.add(this, "click._submit keypress._submit", function (a) { var b = a.target, c = m.nodeName(b, "input") || m.nodeName(b, "button") ? b.form : void 0; c && !m._data(c, "submitBubbles") && (m.event.add(c, "submit._submit", function (a) { a._submit_bubble = !0 }), m._data(c, "submitBubbles", !0)) }) }, postDispatch: function (a) { a._submit_bubble && (delete a._submit_bubble, this.parentNode && !a.isTrigger && m.event.simulate("submit", this.parentNode, a, !0)) }, teardown: function () { return m.nodeName(this, "form") ? !1 : void m.event.remove(this, "._submit") } }), k.changeBubbles || (m.event.special.change = { setup: function () { return X.test(this.nodeName) ? (("checkbox" === this.type || "radio" === this.type) && (m.event.add(this, "propertychange._change", function (a) { "checked" === a.originalEvent.propertyName && (this._just_changed = !0) }), m.event.add(this, "click._change", function (a) { this._just_changed && !a.isTrigger && (this._just_changed = !1), m.event.simulate("change", this, a, !0) })), !1) : void m.event.add(this, "beforeactivate._change", function (a) { var b = a.target; X.test(b.nodeName) && !m._data(b, "changeBubbles") && (m.event.add(b, "change._change", function (a) { !this.parentNode || a.isSimulated || a.isTrigger || m.event.simulate("change", this.parentNode, a, !0) }), m._data(b, "changeBubbles", !0)) }) }, handle: function (a) { var b = a.target; return this !== b || a.isSimulated || a.isTrigger || "radio" !== b.type && "checkbox" !== b.type ? a.handleObj.handler.apply(this, arguments) : void 0 }, teardown: function () { return m.event.remove(this, "._change"), !X.test(this.nodeName) } }), k.focusinBubbles || m.each({ focus: "focusin", blur: "focusout" }, function (a, b) { var c = function (a) { m.event.simulate(b, a.target, m.event.fix(a), !0) }; m.event.special[b] = { setup: function () { var d = this.ownerDocument || this, e = m._data(d, b); e || d.addEventListener(a, c, !0), m._data(d, b, (e || 0) + 1) }, teardown: function () { var d = this.ownerDocument || this, e = m._data(d, b) - 1; e ? m._data(d, b, e) : (d.removeEventListener(a, c, !0), m._removeData(d, b)) } } }), m.fn.extend({ on: function (a, b, c, d, e) { var f, g; if ("object" == typeof a) { "string" != typeof b && (c = c || b, b = void 0); for (f in a) this.on(f, b, c, a[f], e); return this } if (null == c && null == d ? (d = b, c = b = void 0) : null == d && ("string" == typeof b ? (d = c, c = void 0) : (d = c, c = b, b = void 0)), d === !1) d = bb; else if (!d) return this; return 1 === e && (g = d, d = function (a) { return m().off(a), g.apply(this, arguments) }, d.guid = g.guid || (g.guid = m.guid++)), this.each(function () { m.event.add(this, a, d, c, b) }) }, one: function (a, b, c, d) { return this.on(a, b, c, d, 1) }, off: function (a, b, c) { var d, e; if (a && a.preventDefault && a.handleObj) return d = a.handleObj, m(a.delegateTarget).off(d.namespace ? d.origType + "." + d.namespace : d.origType, d.selector, d.handler), this; if ("object" == typeof a) { for (e in a) this.off(e, b, a[e]); return this } return (b === !1 || "function" == typeof b) && (c = b, b = void 0), c === !1 && (c = bb), this.each(function () { m.event.remove(this, a, c, b) }) }, trigger: function (a, b) { return this.each(function () { m.event.trigger(a, b, this) }) }, triggerHandler: function (a, b) { var c = this[0]; return c ? m.event.trigger(a, b, c, !0) : void 0 } }); function db(a) { var b = eb.split("|"), c = a.createDocumentFragment(); if (c.createElement) while (b.length) c.createElement(b.pop()); return c } var eb = "abbr|article|aside|audio|bdi|canvas|data|datalist|details|figcaption|figure|footer|header|hgroup|mark|meter|nav|output|progress|section|summary|time|video", fb = / jQuery\d+="(?:null|\d+)"/g, gb = new RegExp("<(?:" + eb + ")[\\s/>]", "i"), hb = /^\s+/, ib = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi, jb = /<([\w:]+)/, kb = /<tbody/i, lb = /<|&#?\w+;/, mb = /<(?:script|style|link)/i, nb = /checked\s*(?:[^=]|=\s*.checked.)/i, ob = /^$|\/(?:java|ecma)script/i, pb = /^true\/(.*)/, qb = /^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g, rb = { option: [1, "<select multiple='multiple'>", "</select>"], legend: [1, "<fieldset>", "</fieldset>"], area: [1, "<map>", "</map>"], param: [1, "<object>", "</object>"], thead: [1, "<table>", "</table>"], tr: [2, "<table><tbody>", "</tbody></table>"], col: [2, "<table><tbody></tbody><colgroup>", "</colgroup></table>"], td: [3, "<table><tbody><tr>", "</tr></tbody></table>"], _default: k.htmlSerialize ? [0, "", ""] : [1, "X<div>", "</div>"] }, sb = db(y), tb = sb.appendChild(y.createElement("div")); rb.optgroup = rb.option, rb.tbody = rb.tfoot = rb.colgroup = rb.caption = rb.thead, rb.th = rb.td; function ub(a, b) { var c, d, e = 0, f = typeof a.getElementsByTagName !== K ? a.getElementsByTagName(b || "*") : typeof a.querySelectorAll !== K ? a.querySelectorAll(b || "*") : void 0; if (!f) for (f = [], c = a.childNodes || a; null != (d = c[e]) ; e++) !b || m.nodeName(d, b) ? f.push(d) : m.merge(f, ub(d, b)); return void 0 === b || b && m.nodeName(a, b) ? m.merge([a], f) : f } function vb(a) { W.test(a.type) && (a.defaultChecked = a.checked) } function wb(a, b) { return m.nodeName(a, "table") && m.nodeName(11 !== b.nodeType ? b : b.firstChild, "tr") ? a.getElementsByTagName("tbody")[0] || a.appendChild(a.ownerDocument.createElement("tbody")) : a } function xb(a) { return a.type = (null !== m.find.attr(a, "type")) + "/" + a.type, a } function yb(a) { var b = pb.exec(a.type); return b ? a.type = b[1] : a.removeAttribute("type"), a } function zb(a, b) { for (var c, d = 0; null != (c = a[d]) ; d++) m._data(c, "globalEval", !b || m._data(b[d], "globalEval")) } function Ab(a, b) { if (1 === b.nodeType && m.hasData(a)) { var c, d, e, f = m._data(a), g = m._data(b, f), h = f.events; if (h) { delete g.handle, g.events = {}; for (c in h) for (d = 0, e = h[c].length; e > d; d++) m.event.add(b, c, h[c][d]) } g.data && (g.data = m.extend({}, g.data)) } } function Bb(a, b) { var c, d, e; if (1 === b.nodeType) { if (c = b.nodeName.toLowerCase(), !k.noCloneEvent && b[m.expando]) { e = m._data(b); for (d in e.events) m.removeEvent(b, d, e.handle); b.removeAttribute(m.expando) } "script" === c && b.text !== a.text ? (xb(b).text = a.text, yb(b)) : "object" === c ? (b.parentNode && (b.outerHTML = a.outerHTML), k.html5Clone && a.innerHTML && !m.trim(b.innerHTML) && (b.innerHTML = a.innerHTML)) : "input" === c && W.test(a.type) ? (b.defaultChecked = b.checked = a.checked, b.value !== a.value && (b.value = a.value)) : "option" === c ? b.defaultSelected = b.selected = a.defaultSelected : ("input" === c || "textarea" === c) && (b.defaultValue = a.defaultValue) } } m.extend({ clone: function (a, b, c) { var d, e, f, g, h, i = m.contains(a.ownerDocument, a); if (k.html5Clone || m.isXMLDoc(a) || !gb.test("<" + a.nodeName + ">") ? f = a.cloneNode(!0) : (tb.innerHTML = a.outerHTML, tb.removeChild(f = tb.firstChild)), !(k.noCloneEvent && k.noCloneChecked || 1 !== a.nodeType && 11 !== a.nodeType || m.isXMLDoc(a))) for (d = ub(f), h = ub(a), g = 0; null != (e = h[g]) ; ++g) d[g] && Bb(e, d[g]); if (b) if (c) for (h = h || ub(a), d = d || ub(f), g = 0; null != (e = h[g]) ; g++) Ab(e, d[g]); else Ab(a, f); return d = ub(f, "script"), d.length > 0 && zb(d, !i && ub(a, "script")), d = h = e = null, f }, buildFragment: function (a, b, c, d) { for (var e, f, g, h, i, j, l, n = a.length, o = db(b), p = [], q = 0; n > q; q++) if (f = a[q], f || 0 === f) if ("object" === m.type(f)) m.merge(p, f.nodeType ? [f] : f); else if (lb.test(f)) { h = h || o.appendChild(b.createElement("div")), i = (jb.exec(f) || ["", ""])[1].toLowerCase(), l = rb[i] || rb._default, h.innerHTML = l[1] + f.replace(ib, "<$1></$2>") + l[2], e = l[0]; while (e--) h = h.lastChild; if (!k.leadingWhitespace && hb.test(f) && p.push(b.createTextNode(hb.exec(f)[0])), !k.tbody) { f = "table" !== i || kb.test(f) ? "<table>" !== l[1] || kb.test(f) ? 0 : h : h.firstChild, e = f && f.childNodes.length; while (e--) m.nodeName(j = f.childNodes[e], "tbody") && !j.childNodes.length && f.removeChild(j) } m.merge(p, h.childNodes), h.textContent = ""; while (h.firstChild) h.removeChild(h.firstChild); h = o.lastChild } else p.push(b.createTextNode(f)); h && o.removeChild(h), k.appendChecked || m.grep(ub(p, "input"), vb), q = 0; while (f = p[q++]) if ((!d || -1 === m.inArray(f, d)) && (g = m.contains(f.ownerDocument, f), h = ub(o.appendChild(f), "script"), g && zb(h), c)) { e = 0; while (f = h[e++]) ob.test(f.type || "") && c.push(f) } return h = null, o }, cleanData: function (a, b) { for (var d, e, f, g, h = 0, i = m.expando, j = m.cache, l = k.deleteExpando, n = m.event.special; null != (d = a[h]) ; h++) if ((b || m.acceptData(d)) && (f = d[i], g = f && j[f])) { if (g.events) for (e in g.events) n[e] ? m.event.remove(d, e) : m.removeEvent(d, e, g.handle); j[f] && (delete j[f], l ? delete d[i] : typeof d.removeAttribute !== K ? d.removeAttribute(i) : d[i] = null, c.push(f)) } } }), m.fn.extend({ text: function (a) { return V(this, function (a) { return void 0 === a ? m.text(this) : this.empty().append((this[0] && this[0].ownerDocument || y).createTextNode(a)) }, null, a, arguments.length) }, append: function () { return this.domManip(arguments, function (a) { if (1 === this.nodeType || 11 === this.nodeType || 9 === this.nodeType) { var b = wb(this, a); b.appendChild(a) } }) }, prepend: function () { return this.domManip(arguments, function (a) { if (1 === this.nodeType || 11 === this.nodeType || 9 === this.nodeType) { var b = wb(this, a); b.insertBefore(a, b.firstChild) } }) }, before: function () { return this.domManip(arguments, function (a) { this.parentNode && this.parentNode.insertBefore(a, this) }) }, after: function () { return this.domManip(arguments, function (a) { this.parentNode && this.parentNode.insertBefore(a, this.nextSibling) }) }, remove: function (a, b) { for (var c, d = a ? m.filter(a, this) : this, e = 0; null != (c = d[e]) ; e++) b || 1 !== c.nodeType || m.cleanData(ub(c)), c.parentNode && (b && m.contains(c.ownerDocument, c) && zb(ub(c, "script")), c.parentNode.removeChild(c)); return this }, empty: function () { for (var a, b = 0; null != (a = this[b]) ; b++) { 1 === a.nodeType && m.cleanData(ub(a, !1)); while (a.firstChild) a.removeChild(a.firstChild); a.options && m.nodeName(a, "select") && (a.options.length = 0) } return this }, clone: function (a, b) { return a = null == a ? !1 : a, b = null == b ? a : b, this.map(function () { return m.clone(this, a, b) }) }, html: function (a) { return V(this, function (a) { var b = this[0] || {}, c = 0, d = this.length; if (void 0 === a) return 1 === b.nodeType ? b.innerHTML.replace(fb, "") : void 0; if (!("string" != typeof a || mb.test(a) || !k.htmlSerialize && gb.test(a) || !k.leadingWhitespace && hb.test(a) || rb[(jb.exec(a) || ["", ""])[1].toLowerCase()])) { a = a.replace(ib, "<$1></$2>"); try { for (; d > c; c++) b = this[c] || {}, 1 === b.nodeType && (m.cleanData(ub(b, !1)), b.innerHTML = a); b = 0 } catch (e) { } } b && this.empty().append(a) }, null, a, arguments.length) }, replaceWith: function () { var a = arguments[0]; return this.domManip(arguments, function (b) { a = this.parentNode, m.cleanData(ub(this)), a && a.replaceChild(b, this) }), a && (a.length || a.nodeType) ? this : this.remove() }, detach: function (a) { return this.remove(a, !0) }, domManip: function (a, b) { a = e.apply([], a); var c, d, f, g, h, i, j = 0, l = this.length, n = this, o = l - 1, p = a[0], q = m.isFunction(p); if (q || l > 1 && "string" == typeof p && !k.checkClone && nb.test(p)) return this.each(function (c) { var d = n.eq(c); q && (a[0] = p.call(this, c, d.html())), d.domManip(a, b) }); if (l && (i = m.buildFragment(a, this[0].ownerDocument, !1, this), c = i.firstChild, 1 === i.childNodes.length && (i = c), c)) { for (g = m.map(ub(i, "script"), xb), f = g.length; l > j; j++) d = i, j !== o && (d = m.clone(d, !0, !0), f && m.merge(g, ub(d, "script"))), b.call(this[j], d, j); if (f) for (h = g[g.length - 1].ownerDocument, m.map(g, yb), j = 0; f > j; j++) d = g[j], ob.test(d.type || "") && !m._data(d, "globalEval") && m.contains(h, d) && (d.src ? m._evalUrl && m._evalUrl(d.src) : m.globalEval((d.text || d.textContent || d.innerHTML || "").replace(qb, ""))); i = c = null } return this } }), m.each({ appendTo: "append", prependTo: "prepend", insertBefore: "before", insertAfter: "after", replaceAll: "replaceWith" }, function (a, b) { m.fn[a] = function (a) { for (var c, d = 0, e = [], g = m(a), h = g.length - 1; h >= d; d++) c = d === h ? this : this.clone(!0), m(g[d])[b](c), f.apply(e, c.get()); return this.pushStack(e) } }); var Cb, Db = {}; function Eb(b, c) { var d, e = m(c.createElement(b)).appendTo(c.body), f = a.getDefaultComputedStyle && (d = a.getDefaultComputedStyle(e[0])) ? d.display : m.css(e[0], "display"); return e.detach(), f } function Fb(a) { var b = y, c = Db[a]; return c || (c = Eb(a, b), "none" !== c && c || (Cb = (Cb || m("<iframe frameborder='0' width='0' height='0'/>")).appendTo(b.documentElement), b = (Cb[0].contentWindow || Cb[0].contentDocument).document, b.write(), b.close(), c = Eb(a, b), Cb.detach()), Db[a] = c), c } !function () { var a; k.shrinkWrapBlocks = function () { if (null != a) return a; a = !1; var b, c, d; return c = y.getElementsByTagName("body")[0], c && c.style ? (b = y.createElement("div"), d = y.createElement("div"), d.style.cssText = "position:absolute;border:0;width:0;height:0;top:0;left:-9999px", c.appendChild(d).appendChild(b), typeof b.style.zoom !== K && (b.style.cssText = "-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box;display:block;margin:0;border:0;padding:1px;width:1px;zoom:1", b.appendChild(y.createElement("div")).style.width = "5px", a = 3 !== b.offsetWidth), c.removeChild(d), a) : void 0 } }(); var Gb = /^margin/, Hb = new RegExp("^(" + S + ")(?!px)[a-z%]+$", "i"), Ib, Jb, Kb = /^(top|right|bottom|left)$/; a.getComputedStyle ? (Ib = function (a) { return a.ownerDocument.defaultView.getComputedStyle(a, null) }, Jb = function (a, b, c) { var d, e, f, g, h = a.style; return c = c || Ib(a), g = c ? c.getPropertyValue(b) || c[b] : void 0, c && ("" !== g || m.contains(a.ownerDocument, a) || (g = m.style(a, b)), Hb.test(g) && Gb.test(b) && (d = h.width, e = h.minWidth, f = h.maxWidth, h.minWidth = h.maxWidth = h.width = g, g = c.width, h.width = d, h.minWidth = e, h.maxWidth = f)), void 0 === g ? g : g + "" }) : y.documentElement.currentStyle && (Ib = function (a) { return a.currentStyle }, Jb = function (a, b, c) { var d, e, f, g, h = a.style; return c = c || Ib(a), g = c ? c[b] : void 0, null == g && h && h[b] && (g = h[b]), Hb.test(g) && !Kb.test(b) && (d = h.left, e = a.runtimeStyle, f = e && e.left, f && (e.left = a.currentStyle.left), h.left = "fontSize" === b ? "1em" : g, g = h.pixelLeft + "px", h.left = d, f && (e.left = f)), void 0 === g ? g : g + "" || "auto" }); function Lb(a, b) { return { get: function () { var c = a(); if (null != c) return c ? void delete this.get : (this.get = b).apply(this, arguments) } } } !function () { var b, c, d, e, f, g, h; if (b = y.createElement("div"), b.innerHTML = "  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>", d = b.getElementsByTagName("a")[0], c = d && d.style) { c.cssText = "float:left;opacity:.5", k.opacity = "0.5" === c.opacity, k.cssFloat = !!c.cssFloat, b.style.backgroundClip = "content-box", b.cloneNode(!0).style.backgroundClip = "", k.clearCloneStyle = "content-box" === b.style.backgroundClip, k.boxSizing = "" === c.boxSizing || "" === c.MozBoxSizing || "" === c.WebkitBoxSizing, m.extend(k, { reliableHiddenOffsets: function () { return null == g && i(), g }, boxSizingReliable: function () { return null == f && i(), f }, pixelPosition: function () { return null == e && i(), e }, reliableMarginRight: function () { return null == h && i(), h } }); function i() { var b, c, d, i; c = y.getElementsByTagName("body")[0], c && c.style && (b = y.createElement("div"), d = y.createElement("div"), d.style.cssText = "position:absolute;border:0;width:0;height:0;top:0;left:-9999px", c.appendChild(d).appendChild(b), b.style.cssText = "-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;display:block;margin-top:1%;top:1%;border:1px;padding:1px;width:4px;position:absolute", e = f = !1, h = !0, a.getComputedStyle && (e = "1%" !== (a.getComputedStyle(b, null) || {}).top, f = "4px" === (a.getComputedStyle(b, null) || { width: "4px" }).width, i = b.appendChild(y.createElement("div")), i.style.cssText = b.style.cssText = "-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box;display:block;margin:0;border:0;padding:0", i.style.marginRight = i.style.width = "0", b.style.width = "1px", h = !parseFloat((a.getComputedStyle(i, null) || {}).marginRight)), b.innerHTML = "<table><tr><td></td><td>t</td></tr></table>", i = b.getElementsByTagName("td"), i[0].style.cssText = "margin:0;border:0;padding:0;display:none", g = 0 === i[0].offsetHeight, g && (i[0].style.display = "", i[1].style.display = "none", g = 0 === i[0].offsetHeight), c.removeChild(d)) } } }(), m.swap = function (a, b, c, d) { var e, f, g = {}; for (f in b) g[f] = a.style[f], a.style[f] = b[f]; e = c.apply(a, d || []); for (f in b) a.style[f] = g[f]; return e }; var Mb = /alpha\([^)]*\)/i, Nb = /opacity\s*=\s*([^)]*)/, Ob = /^(none|table(?!-c[ea]).+)/, Pb = new RegExp("^(" + S + ")(.*)$", "i"), Qb = new RegExp("^([+-])=(" + S + ")", "i"), Rb = { position: "absolute", visibility: "hidden", display: "block" }, Sb = { letterSpacing: "0", fontWeight: "400" }, Tb = ["Webkit", "O", "Moz", "ms"]; function Ub(a, b) { if (b in a) return b; var c = b.charAt(0).toUpperCase() + b.slice(1), d = b, e = Tb.length; while (e--) if (b = Tb[e] + c, b in a) return b; return d } function Vb(a, b) { for (var c, d, e, f = [], g = 0, h = a.length; h > g; g++) d = a[g], d.style && (f[g] = m._data(d, "olddisplay"), c = d.style.display, b ? (f[g] || "none" !== c || (d.style.display = ""), "" === d.style.display && U(d) && (f[g] = m._data(d, "olddisplay", Fb(d.nodeName)))) : (e = U(d), (c && "none" !== c || !e) && m._data(d, "olddisplay", e ? c : m.css(d, "display")))); for (g = 0; h > g; g++) d = a[g], d.style && (b && "none" !== d.style.display && "" !== d.style.display || (d.style.display = b ? f[g] || "" : "none")); return a } function Wb(a, b, c) { var d = Pb.exec(b); return d ? Math.max(0, d[1] - (c || 0)) + (d[2] || "px") : b } function Xb(a, b, c, d, e) { for (var f = c === (d ? "border" : "content") ? 4 : "width" === b ? 1 : 0, g = 0; 4 > f; f += 2) "margin" === c && (g += m.css(a, c + T[f], !0, e)), d ? ("content" === c && (g -= m.css(a, "padding" + T[f], !0, e)), "margin" !== c && (g -= m.css(a, "border" + T[f] + "Width", !0, e))) : (g += m.css(a, "padding" + T[f], !0, e), "padding" !== c && (g += m.css(a, "border" + T[f] + "Width", !0, e))); return g } function Yb(a, b, c) { var d = !0, e = "width" === b ? a.offsetWidth : a.offsetHeight, f = Ib(a), g = k.boxSizing && "border-box" === m.css(a, "boxSizing", !1, f); if (0 >= e || null == e) { if (e = Jb(a, b, f), (0 > e || null == e) && (e = a.style[b]), Hb.test(e)) return e; d = g && (k.boxSizingReliable() || e === a.style[b]), e = parseFloat(e) || 0 } return e + Xb(a, b, c || (g ? "border" : "content"), d, f) + "px" } m.extend({ cssHooks: { opacity: { get: function (a, b) { if (b) { var c = Jb(a, "opacity"); return "" === c ? "1" : c } } } }, cssNumber: { columnCount: !0, fillOpacity: !0, flexGrow: !0, flexShrink: !0, fontWeight: !0, lineHeight: !0, opacity: !0, order: !0, orphans: !0, widows: !0, zIndex: !0, zoom: !0 }, cssProps: { "float": k.cssFloat ? "cssFloat" : "styleFloat" }, style: function (a, b, c, d) { if (a && 3 !== a.nodeType && 8 !== a.nodeType && a.style) { var e, f, g, h = m.camelCase(b), i = a.style; if (b = m.cssProps[h] || (m.cssProps[h] = Ub(i, h)), g = m.cssHooks[b] || m.cssHooks[h], void 0 === c) return g && "get" in g && void 0 !== (e = g.get(a, !1, d)) ? e : i[b]; if (f = typeof c, "string" === f && (e = Qb.exec(c)) && (c = (e[1] + 1) * e[2] + parseFloat(m.css(a, b)), f = "number"), null != c && c === c && ("number" !== f || m.cssNumber[h] || (c += "px"), k.clearCloneStyle || "" !== c || 0 !== b.indexOf("background") || (i[b] = "inherit"), !(g && "set" in g && void 0 === (c = g.set(a, c, d))))) try { i[b] = c } catch (j) { } } }, css: function (a, b, c, d) { var e, f, g, h = m.camelCase(b); return b = m.cssProps[h] || (m.cssProps[h] = Ub(a.style, h)), g = m.cssHooks[b] || m.cssHooks[h], g && "get" in g && (f = g.get(a, !0, c)), void 0 === f && (f = Jb(a, b, d)), "normal" === f && b in Sb && (f = Sb[b]), "" === c || c ? (e = parseFloat(f), c === !0 || m.isNumeric(e) ? e || 0 : f) : f } }), m.each(["height", "width"], function (a, b) { m.cssHooks[b] = { get: function (a, c, d) { return c ? Ob.test(m.css(a, "display")) && 0 === a.offsetWidth ? m.swap(a, Rb, function () { return Yb(a, b, d) }) : Yb(a, b, d) : void 0 }, set: function (a, c, d) { var e = d && Ib(a); return Wb(a, c, d ? Xb(a, b, d, k.boxSizing && "border-box" === m.css(a, "boxSizing", !1, e), e) : 0) } } }), k.opacity || (m.cssHooks.opacity = { get: function (a, b) { return Nb.test((b && a.currentStyle ? a.currentStyle.filter : a.style.filter) || "") ? .01 * parseFloat(RegExp.$1) + "" : b ? "1" : "" }, set: function (a, b) { var c = a.style, d = a.currentStyle, e = m.isNumeric(b) ? "alpha(opacity=" + 100 * b + ")" : "", f = d && d.filter || c.filter || ""; c.zoom = 1, (b >= 1 || "" === b) && "" === m.trim(f.replace(Mb, "")) && c.removeAttribute && (c.removeAttribute("filter"), "" === b || d && !d.filter) || (c.filter = Mb.test(f) ? f.replace(Mb, e) : f + " " + e) } }), m.cssHooks.marginRight = Lb(k.reliableMarginRight, function (a, b) { return b ? m.swap(a, { display: "inline-block" }, Jb, [a, "marginRight"]) : void 0 }), m.each({ margin: "", padding: "", border: "Width" }, function (a, b) { m.cssHooks[a + b] = { expand: function (c) { for (var d = 0, e = {}, f = "string" == typeof c ? c.split(" ") : [c]; 4 > d; d++) e[a + T[d] + b] = f[d] || f[d - 2] || f[0]; return e } }, Gb.test(a) || (m.cssHooks[a + b].set = Wb) }), m.fn.extend({ css: function (a, b) { return V(this, function (a, b, c) { var d, e, f = {}, g = 0; if (m.isArray(b)) { for (d = Ib(a), e = b.length; e > g; g++) f[b[g]] = m.css(a, b[g], !1, d); return f } return void 0 !== c ? m.style(a, b, c) : m.css(a, b) }, a, b, arguments.length > 1) }, show: function () { return Vb(this, !0) }, hide: function () { return Vb(this) }, toggle: function (a) { return "boolean" == typeof a ? a ? this.show() : this.hide() : this.each(function () { U(this) ? m(this).show() : m(this).hide() }) } }); function Zb(a, b, c, d, e) { return new Zb.prototype.init(a, b, c, d, e) } m.Tween = Zb, Zb.prototype = {
        constructor: Zb, init: function (a, b, c, d, e, f) {
            this.elem = a, this.prop = c, this.easing = e || "swing", this.options = b, this.start = this.now = this.cur(), this.end = d, this.unit = f || (m.cssNumber[c] ? "" : "px")
        }, cur: function () { var a = Zb.propHooks[this.prop]; return a && a.get ? a.get(this) : Zb.propHooks._default.get(this) }, run: function (a) { var b, c = Zb.propHooks[this.prop]; return this.pos = b = this.options.duration ? m.easing[this.easing](a, this.options.duration * a, 0, 1, this.options.duration) : a, this.now = (this.end - this.start) * b + this.start, this.options.step && this.options.step.call(this.elem, this.now, this), c && c.set ? c.set(this) : Zb.propHooks._default.set(this), this }
    }, Zb.prototype.init.prototype = Zb.prototype, Zb.propHooks = { _default: { get: function (a) { var b; return null == a.elem[a.prop] || a.elem.style && null != a.elem.style[a.prop] ? (b = m.css(a.elem, a.prop, ""), b && "auto" !== b ? b : 0) : a.elem[a.prop] }, set: function (a) { m.fx.step[a.prop] ? m.fx.step[a.prop](a) : a.elem.style && (null != a.elem.style[m.cssProps[a.prop]] || m.cssHooks[a.prop]) ? m.style(a.elem, a.prop, a.now + a.unit) : a.elem[a.prop] = a.now } } }, Zb.propHooks.scrollTop = Zb.propHooks.scrollLeft = { set: function (a) { a.elem.nodeType && a.elem.parentNode && (a.elem[a.prop] = a.now) } }, m.easing = { linear: function (a) { return a }, swing: function (a) { return .5 - Math.cos(a * Math.PI) / 2 } }, m.fx = Zb.prototype.init, m.fx.step = {}; var $b, _b, ac = /^(?:toggle|show|hide)$/, bc = new RegExp("^(?:([+-])=|)(" + S + ")([a-z%]*)$", "i"), cc = /queueHooks$/, dc = [ic], ec = { "*": [function (a, b) { var c = this.createTween(a, b), d = c.cur(), e = bc.exec(b), f = e && e[3] || (m.cssNumber[a] ? "" : "px"), g = (m.cssNumber[a] || "px" !== f && +d) && bc.exec(m.css(c.elem, a)), h = 1, i = 20; if (g && g[3] !== f) { f = f || g[3], e = e || [], g = +d || 1; do h = h || ".5", g /= h, m.style(c.elem, a, g + f); while (h !== (h = c.cur() / d) && 1 !== h && --i) } return e && (g = c.start = +g || +d || 0, c.unit = f, c.end = e[1] ? g + (e[1] + 1) * e[2] : +e[2]), c }] }; function fc() { return setTimeout(function () { $b = void 0 }), $b = m.now() } function gc(a, b) { var c, d = { height: a }, e = 0; for (b = b ? 1 : 0; 4 > e; e += 2 - b) c = T[e], d["margin" + c] = d["padding" + c] = a; return b && (d.opacity = d.width = a), d } function hc(a, b, c) { for (var d, e = (ec[b] || []).concat(ec["*"]), f = 0, g = e.length; g > f; f++) if (d = e[f].call(c, b, a)) return d } function ic(a, b, c) { var d, e, f, g, h, i, j, l, n = this, o = {}, p = a.style, q = a.nodeType && U(a), r = m._data(a, "fxshow"); c.queue || (h = m._queueHooks(a, "fx"), null == h.unqueued && (h.unqueued = 0, i = h.empty.fire, h.empty.fire = function () { h.unqueued || i() }), h.unqueued++, n.always(function () { n.always(function () { h.unqueued--, m.queue(a, "fx").length || h.empty.fire() }) })), 1 === a.nodeType && ("height" in b || "width" in b) && (c.overflow = [p.overflow, p.overflowX, p.overflowY], j = m.css(a, "display"), l = "none" === j ? m._data(a, "olddisplay") || Fb(a.nodeName) : j, "inline" === l && "none" === m.css(a, "float") && (k.inlineBlockNeedsLayout && "inline" !== Fb(a.nodeName) ? p.zoom = 1 : p.display = "inline-block")), c.overflow && (p.overflow = "hidden", k.shrinkWrapBlocks() || n.always(function () { p.overflow = c.overflow[0], p.overflowX = c.overflow[1], p.overflowY = c.overflow[2] })); for (d in b) if (e = b[d], ac.exec(e)) { if (delete b[d], f = f || "toggle" === e, e === (q ? "hide" : "show")) { if ("show" !== e || !r || void 0 === r[d]) continue; q = !0 } o[d] = r && r[d] || m.style(a, d) } else j = void 0; if (m.isEmptyObject(o)) "inline" === ("none" === j ? Fb(a.nodeName) : j) && (p.display = j); else { r ? "hidden" in r && (q = r.hidden) : r = m._data(a, "fxshow", {}), f && (r.hidden = !q), q ? m(a).show() : n.done(function () { m(a).hide() }), n.done(function () { var b; m._removeData(a, "fxshow"); for (b in o) m.style(a, b, o[b]) }); for (d in o) g = hc(q ? r[d] : 0, d, n), d in r || (r[d] = g.start, q && (g.end = g.start, g.start = "width" === d || "height" === d ? 1 : 0)) } } function jc(a, b) { var c, d, e, f, g; for (c in a) if (d = m.camelCase(c), e = b[d], f = a[c], m.isArray(f) && (e = f[1], f = a[c] = f[0]), c !== d && (a[d] = f, delete a[c]), g = m.cssHooks[d], g && "expand" in g) { f = g.expand(f), delete a[d]; for (c in f) c in a || (a[c] = f[c], b[c] = e) } else b[d] = e } function kc(a, b, c) { var d, e, f = 0, g = dc.length, h = m.Deferred().always(function () { delete i.elem }), i = function () { if (e) return !1; for (var b = $b || fc(), c = Math.max(0, j.startTime + j.duration - b), d = c / j.duration || 0, f = 1 - d, g = 0, i = j.tweens.length; i > g; g++) j.tweens[g].run(f); return h.notifyWith(a, [j, f, c]), 1 > f && i ? c : (h.resolveWith(a, [j]), !1) }, j = h.promise({ elem: a, props: m.extend({}, b), opts: m.extend(!0, { specialEasing: {} }, c), originalProperties: b, originalOptions: c, startTime: $b || fc(), duration: c.duration, tweens: [], createTween: function (b, c) { var d = m.Tween(a, j.opts, b, c, j.opts.specialEasing[b] || j.opts.easing); return j.tweens.push(d), d }, stop: function (b) { var c = 0, d = b ? j.tweens.length : 0; if (e) return this; for (e = !0; d > c; c++) j.tweens[c].run(1); return b ? h.resolveWith(a, [j, b]) : h.rejectWith(a, [j, b]), this } }), k = j.props; for (jc(k, j.opts.specialEasing) ; g > f; f++) if (d = dc[f].call(j, a, k, j.opts)) return d; return m.map(k, hc, j), m.isFunction(j.opts.start) && j.opts.start.call(a, j), m.fx.timer(m.extend(i, { elem: a, anim: j, queue: j.opts.queue })), j.progress(j.opts.progress).done(j.opts.done, j.opts.complete).fail(j.opts.fail).always(j.opts.always) } m.Animation = m.extend(kc, { tweener: function (a, b) { m.isFunction(a) ? (b = a, a = ["*"]) : a = a.split(" "); for (var c, d = 0, e = a.length; e > d; d++) c = a[d], ec[c] = ec[c] || [], ec[c].unshift(b) }, prefilter: function (a, b) { b ? dc.unshift(a) : dc.push(a) } }), m.speed = function (a, b, c) { var d = a && "object" == typeof a ? m.extend({}, a) : { complete: c || !c && b || m.isFunction(a) && a, duration: a, easing: c && b || b && !m.isFunction(b) && b }; return d.duration = m.fx.off ? 0 : "number" == typeof d.duration ? d.duration : d.duration in m.fx.speeds ? m.fx.speeds[d.duration] : m.fx.speeds._default, (null == d.queue || d.queue === !0) && (d.queue = "fx"), d.old = d.complete, d.complete = function () { m.isFunction(d.old) && d.old.call(this), d.queue && m.dequeue(this, d.queue) }, d }, m.fn.extend({ fadeTo: function (a, b, c, d) { return this.filter(U).css("opacity", 0).show().end().animate({ opacity: b }, a, c, d) }, animate: function (a, b, c, d) { var e = m.isEmptyObject(a), f = m.speed(b, c, d), g = function () { var b = kc(this, m.extend({}, a), f); (e || m._data(this, "finish")) && b.stop(!0) }; return g.finish = g, e || f.queue === !1 ? this.each(g) : this.queue(f.queue, g) }, stop: function (a, b, c) { var d = function (a) { var b = a.stop; delete a.stop, b(c) }; return "string" != typeof a && (c = b, b = a, a = void 0), b && a !== !1 && this.queue(a || "fx", []), this.each(function () { var b = !0, e = null != a && a + "queueHooks", f = m.timers, g = m._data(this); if (e) g[e] && g[e].stop && d(g[e]); else for (e in g) g[e] && g[e].stop && cc.test(e) && d(g[e]); for (e = f.length; e--;) f[e].elem !== this || null != a && f[e].queue !== a || (f[e].anim.stop(c), b = !1, f.splice(e, 1)); (b || !c) && m.dequeue(this, a) }) }, finish: function (a) { return a !== !1 && (a = a || "fx"), this.each(function () { var b, c = m._data(this), d = c[a + "queue"], e = c[a + "queueHooks"], f = m.timers, g = d ? d.length : 0; for (c.finish = !0, m.queue(this, a, []), e && e.stop && e.stop.call(this, !0), b = f.length; b--;) f[b].elem === this && f[b].queue === a && (f[b].anim.stop(!0), f.splice(b, 1)); for (b = 0; g > b; b++) d[b] && d[b].finish && d[b].finish.call(this); delete c.finish }) } }), m.each(["toggle", "show", "hide"], function (a, b) { var c = m.fn[b]; m.fn[b] = function (a, d, e) { return null == a || "boolean" == typeof a ? c.apply(this, arguments) : this.animate(gc(b, !0), a, d, e) } }), m.each({ slideDown: gc("show"), slideUp: gc("hide"), slideToggle: gc("toggle"), fadeIn: { opacity: "show" }, fadeOut: { opacity: "hide" }, fadeToggle: { opacity: "toggle" } }, function (a, b) { m.fn[a] = function (a, c, d) { return this.animate(b, a, c, d) } }), m.timers = [], m.fx.tick = function () { var a, b = m.timers, c = 0; for ($b = m.now() ; c < b.length; c++) a = b[c], a() || b[c] !== a || b.splice(c--, 1); b.length || m.fx.stop(), $b = void 0 }, m.fx.timer = function (a) { m.timers.push(a), a() ? m.fx.start() : m.timers.pop() }, m.fx.interval = 13, m.fx.start = function () { _b || (_b = setInterval(m.fx.tick, m.fx.interval)) }, m.fx.stop = function () { clearInterval(_b), _b = null }, m.fx.speeds = { slow: 600, fast: 200, _default: 400 }, m.fn.delay = function (a, b) { return a = m.fx ? m.fx.speeds[a] || a : a, b = b || "fx", this.queue(b, function (b, c) { var d = setTimeout(b, a); c.stop = function () { clearTimeout(d) } }) }, function () { var a, b, c, d, e; b = y.createElement("div"), b.setAttribute("className", "t"), b.innerHTML = "  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>", d = b.getElementsByTagName("a")[0], c = y.createElement("select"), e = c.appendChild(y.createElement("option")), a = b.getElementsByTagName("input")[0], d.style.cssText = "top:1px", k.getSetAttribute = "t" !== b.className, k.style = /top/.test(d.getAttribute("style")), k.hrefNormalized = "/a" === d.getAttribute("href"), k.checkOn = !!a.value, k.optSelected = e.selected, k.enctype = !!y.createElement("form").enctype, c.disabled = !0, k.optDisabled = !e.disabled, a = y.createElement("input"), a.setAttribute("value", ""), k.input = "" === a.getAttribute("value"), a.value = "t", a.setAttribute("type", "radio"), k.radioValue = "t" === a.value }(); var lc = /\r/g; m.fn.extend({ val: function (a) { var b, c, d, e = this[0]; { if (arguments.length) return d = m.isFunction(a), this.each(function (c) { var e; 1 === this.nodeType && (e = d ? a.call(this, c, m(this).val()) : a, null == e ? e = "" : "number" == typeof e ? e += "" : m.isArray(e) && (e = m.map(e, function (a) { return null == a ? "" : a + "" })), b = m.valHooks[this.type] || m.valHooks[this.nodeName.toLowerCase()], b && "set" in b && void 0 !== b.set(this, e, "value") || (this.value = e)) }); if (e) return b = m.valHooks[e.type] || m.valHooks[e.nodeName.toLowerCase()], b && "get" in b && void 0 !== (c = b.get(e, "value")) ? c : (c = e.value, "string" == typeof c ? c.replace(lc, "") : null == c ? "" : c) } } }), m.extend({ valHooks: { option: { get: function (a) { var b = m.find.attr(a, "value"); return null != b ? b : m.trim(m.text(a)) } }, select: { get: function (a) { for (var b, c, d = a.options, e = a.selectedIndex, f = "select-one" === a.type || 0 > e, g = f ? null : [], h = f ? e + 1 : d.length, i = 0 > e ? h : f ? e : 0; h > i; i++) if (c = d[i], !(!c.selected && i !== e || (k.optDisabled ? c.disabled : null !== c.getAttribute("disabled")) || c.parentNode.disabled && m.nodeName(c.parentNode, "optgroup"))) { if (b = m(c).val(), f) return b; g.push(b) } return g }, set: function (a, b) { var c, d, e = a.options, f = m.makeArray(b), g = e.length; while (g--) if (d = e[g], m.inArray(m.valHooks.option.get(d), f) >= 0) try { d.selected = c = !0 } catch (h) { d.scrollHeight } else d.selected = !1; return c || (a.selectedIndex = -1), e } } } }), m.each(["radio", "checkbox"], function () { m.valHooks[this] = { set: function (a, b) { return m.isArray(b) ? a.checked = m.inArray(m(a).val(), b) >= 0 : void 0 } }, k.checkOn || (m.valHooks[this].get = function (a) { return null === a.getAttribute("value") ? "on" : a.value }) }); var mc, nc, oc = m.expr.attrHandle, pc = /^(?:checked|selected)$/i, qc = k.getSetAttribute, rc = k.input; m.fn.extend({ attr: function (a, b) { return V(this, m.attr, a, b, arguments.length > 1) }, removeAttr: function (a) { return this.each(function () { m.removeAttr(this, a) }) } }), m.extend({ attr: function (a, b, c) { var d, e, f = a.nodeType; if (a && 3 !== f && 8 !== f && 2 !== f) return typeof a.getAttribute === K ? m.prop(a, b, c) : (1 === f && m.isXMLDoc(a) || (b = b.toLowerCase(), d = m.attrHooks[b] || (m.expr.match.bool.test(b) ? nc : mc)), void 0 === c ? d && "get" in d && null !== (e = d.get(a, b)) ? e : (e = m.find.attr(a, b), null == e ? void 0 : e) : null !== c ? d && "set" in d && void 0 !== (e = d.set(a, c, b)) ? e : (a.setAttribute(b, c + ""), c) : void m.removeAttr(a, b)) }, removeAttr: function (a, b) { var c, d, e = 0, f = b && b.match(E); if (f && 1 === a.nodeType) while (c = f[e++]) d = m.propFix[c] || c, m.expr.match.bool.test(c) ? rc && qc || !pc.test(c) ? a[d] = !1 : a[m.camelCase("default-" + c)] = a[d] = !1 : m.attr(a, c, ""), a.removeAttribute(qc ? c : d) }, attrHooks: { type: { set: function (a, b) { if (!k.radioValue && "radio" === b && m.nodeName(a, "input")) { var c = a.value; return a.setAttribute("type", b), c && (a.value = c), b } } } } }), nc = { set: function (a, b, c) { return b === !1 ? m.removeAttr(a, c) : rc && qc || !pc.test(c) ? a.setAttribute(!qc && m.propFix[c] || c, c) : a[m.camelCase("default-" + c)] = a[c] = !0, c } }, m.each(m.expr.match.bool.source.match(/\w+/g), function (a, b) { var c = oc[b] || m.find.attr; oc[b] = rc && qc || !pc.test(b) ? function (a, b, d) { var e, f; return d || (f = oc[b], oc[b] = e, e = null != c(a, b, d) ? b.toLowerCase() : null, oc[b] = f), e } : function (a, b, c) { return c ? void 0 : a[m.camelCase("default-" + b)] ? b.toLowerCase() : null } }), rc && qc || (m.attrHooks.value = { set: function (a, b, c) { return m.nodeName(a, "input") ? void (a.defaultValue = b) : mc && mc.set(a, b, c) } }), qc || (mc = { set: function (a, b, c) { var d = a.getAttributeNode(c); return d || a.setAttributeNode(d = a.ownerDocument.createAttribute(c)), d.value = b += "", "value" === c || b === a.getAttribute(c) ? b : void 0 } }, oc.id = oc.name = oc.coords = function (a, b, c) { var d; return c ? void 0 : (d = a.getAttributeNode(b)) && "" !== d.value ? d.value : null }, m.valHooks.button = { get: function (a, b) { var c = a.getAttributeNode(b); return c && c.specified ? c.value : void 0 }, set: mc.set }, m.attrHooks.contenteditable = { set: function (a, b, c) { mc.set(a, "" === b ? !1 : b, c) } }, m.each(["width", "height"], function (a, b) { m.attrHooks[b] = { set: function (a, c) { return "" === c ? (a.setAttribute(b, "auto"), c) : void 0 } } })), k.style || (m.attrHooks.style = { get: function (a) { return a.style.cssText || void 0 }, set: function (a, b) { return a.style.cssText = b + "" } }); var sc = /^(?:input|select|textarea|button|object)$/i, tc = /^(?:a|area)$/i; m.fn.extend({ prop: function (a, b) { return V(this, m.prop, a, b, arguments.length > 1) }, removeProp: function (a) { return a = m.propFix[a] || a, this.each(function () { try { this[a] = void 0, delete this[a] } catch (b) { } }) } }), m.extend({ propFix: { "for": "htmlFor", "class": "className" }, prop: function (a, b, c) { var d, e, f, g = a.nodeType; if (a && 3 !== g && 8 !== g && 2 !== g) return f = 1 !== g || !m.isXMLDoc(a), f && (b = m.propFix[b] || b, e = m.propHooks[b]), void 0 !== c ? e && "set" in e && void 0 !== (d = e.set(a, c, b)) ? d : a[b] = c : e && "get" in e && null !== (d = e.get(a, b)) ? d : a[b] }, propHooks: { tabIndex: { get: function (a) { var b = m.find.attr(a, "tabindex"); return b ? parseInt(b, 10) : sc.test(a.nodeName) || tc.test(a.nodeName) && a.href ? 0 : -1 } } } }), k.hrefNormalized || m.each(["href", "src"], function (a, b) { m.propHooks[b] = { get: function (a) { return a.getAttribute(b, 4) } } }), k.optSelected || (m.propHooks.selected = { get: function (a) { var b = a.parentNode; return b && (b.selectedIndex, b.parentNode && b.parentNode.selectedIndex), null } }), m.each(["tabIndex", "readOnly", "maxLength", "cellSpacing", "cellPadding", "rowSpan", "colSpan", "useMap", "frameBorder", "contentEditable"], function () { m.propFix[this.toLowerCase()] = this }), k.enctype || (m.propFix.enctype = "encoding"); var uc = /[\t\r\n\f]/g; m.fn.extend({ addClass: function (a) { var b, c, d, e, f, g, h = 0, i = this.length, j = "string" == typeof a && a; if (m.isFunction(a)) return this.each(function (b) { m(this).addClass(a.call(this, b, this.className)) }); if (j) for (b = (a || "").match(E) || []; i > h; h++) if (c = this[h], d = 1 === c.nodeType && (c.className ? (" " + c.className + " ").replace(uc, " ") : " ")) { f = 0; while (e = b[f++]) d.indexOf(" " + e + " ") < 0 && (d += e + " "); g = m.trim(d), c.className !== g && (c.className = g) } return this }, removeClass: function (a) { var b, c, d, e, f, g, h = 0, i = this.length, j = 0 === arguments.length || "string" == typeof a && a; if (m.isFunction(a)) return this.each(function (b) { m(this).removeClass(a.call(this, b, this.className)) }); if (j) for (b = (a || "").match(E) || []; i > h; h++) if (c = this[h], d = 1 === c.nodeType && (c.className ? (" " + c.className + " ").replace(uc, " ") : "")) { f = 0; while (e = b[f++]) while (d.indexOf(" " + e + " ") >= 0) d = d.replace(" " + e + " ", " "); g = a ? m.trim(d) : "", c.className !== g && (c.className = g) } return this }, toggleClass: function (a, b) { var c = typeof a; return "boolean" == typeof b && "string" === c ? b ? this.addClass(a) : this.removeClass(a) : this.each(m.isFunction(a) ? function (c) { m(this).toggleClass(a.call(this, c, this.className, b), b) } : function () { if ("string" === c) { var b, d = 0, e = m(this), f = a.match(E) || []; while (b = f[d++]) e.hasClass(b) ? e.removeClass(b) : e.addClass(b) } else (c === K || "boolean" === c) && (this.className && m._data(this, "__className__", this.className), this.className = this.className || a === !1 ? "" : m._data(this, "__className__") || "") }) }, hasClass: function (a) { for (var b = " " + a + " ", c = 0, d = this.length; d > c; c++) if (1 === this[c].nodeType && (" " + this[c].className + " ").replace(uc, " ").indexOf(b) >= 0) return !0; return !1 } }), m.each("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error contextmenu".split(" "), function (a, b) { m.fn[b] = function (a, c) { return arguments.length > 0 ? this.on(b, null, a, c) : this.trigger(b) } }), m.fn.extend({ hover: function (a, b) { return this.mouseenter(a).mouseleave(b || a) }, bind: function (a, b, c) { return this.on(a, null, b, c) }, unbind: function (a, b) { return this.off(a, null, b) }, delegate: function (a, b, c, d) { return this.on(b, a, c, d) }, undelegate: function (a, b, c) { return 1 === arguments.length ? this.off(a, "**") : this.off(b, a || "**", c) } }); var vc = m.now(), wc = /\?/, xc = /(,)|(\[|{)|(}|])|"(?:[^"\\\r\n]|\\["\\\/bfnrt]|\\u[\da-fA-F]{4})*"\s*:?|true|false|null|-?(?!0\d)\d+(?:\.\d+|)(?:[eE][+-]?\d+|)/g; m.parseJSON = function (b) { if (a.JSON && a.JSON.parse) return a.JSON.parse(b + ""); var c, d = null, e = m.trim(b + ""); return e && !m.trim(e.replace(xc, function (a, b, e, f) { return c && b && (d = 0), 0 === d ? a : (c = e || b, d += !f - !e, "") })) ? Function("return " + e)() : m.error("Invalid JSON: " + b) }, m.parseXML = function (b) { var c, d; if (!b || "string" != typeof b) return null; try { a.DOMParser ? (d = new DOMParser, c = d.parseFromString(b, "text/xml")) : (c = new ActiveXObject("Microsoft.XMLDOM"), c.async = "false", c.loadXML(b)) } catch (e) { c = void 0 } return c && c.documentElement && !c.getElementsByTagName("parsererror").length || m.error("Invalid XML: " + b), c }; var yc, zc, Ac = /#.*$/, Bc = /([?&])_=[^&]*/, Cc = /^(.*?):[ \t]*([^\r\n]*)\r?$/gm, Dc = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/, Ec = /^(?:GET|HEAD)$/, Fc = /^\/\//, Gc = /^([\w.+-]+:)(?:\/\/(?:[^\/?#]*@|)([^\/?#:]*)(?::(\d+)|)|)/, Hc = {}, Ic = {}, Jc = "*/".concat("*"); try { zc = location.href } catch (Kc) { zc = y.createElement("a"), zc.href = "", zc = zc.href } yc = Gc.exec(zc.toLowerCase()) || []; function Lc(a) { return function (b, c) { "string" != typeof b && (c = b, b = "*"); var d, e = 0, f = b.toLowerCase().match(E) || []; if (m.isFunction(c)) while (d = f[e++]) "+" === d.charAt(0) ? (d = d.slice(1) || "*", (a[d] = a[d] || []).unshift(c)) : (a[d] = a[d] || []).push(c) } } function Mc(a, b, c, d) { var e = {}, f = a === Ic; function g(h) { var i; return e[h] = !0, m.each(a[h] || [], function (a, h) { var j = h(b, c, d); return "string" != typeof j || f || e[j] ? f ? !(i = j) : void 0 : (b.dataTypes.unshift(j), g(j), !1) }), i } return g(b.dataTypes[0]) || !e["*"] && g("*") } function Nc(a, b) { var c, d, e = m.ajaxSettings.flatOptions || {}; for (d in b) void 0 !== b[d] && ((e[d] ? a : c || (c = {}))[d] = b[d]); return c && m.extend(!0, a, c), a } function Oc(a, b, c) { var d, e, f, g, h = a.contents, i = a.dataTypes; while ("*" === i[0]) i.shift(), void 0 === e && (e = a.mimeType || b.getResponseHeader("Content-Type")); if (e) for (g in h) if (h[g] && h[g].test(e)) { i.unshift(g); break } if (i[0] in c) f = i[0]; else { for (g in c) { if (!i[0] || a.converters[g + " " + i[0]]) { f = g; break } d || (d = g) } f = f || d } return f ? (f !== i[0] && i.unshift(f), c[f]) : void 0 } function Pc(a, b, c, d) { var e, f, g, h, i, j = {}, k = a.dataTypes.slice(); if (k[1]) for (g in a.converters) j[g.toLowerCase()] = a.converters[g]; f = k.shift(); while (f) if (a.responseFields[f] && (c[a.responseFields[f]] = b), !i && d && a.dataFilter && (b = a.dataFilter(b, a.dataType)), i = f, f = k.shift()) if ("*" === f) f = i; else if ("*" !== i && i !== f) { if (g = j[i + " " + f] || j["* " + f], !g) for (e in j) if (h = e.split(" "), h[1] === f && (g = j[i + " " + h[0]] || j["* " + h[0]])) { g === !0 ? g = j[e] : j[e] !== !0 && (f = h[0], k.unshift(h[1])); break } if (g !== !0) if (g && a["throws"]) b = g(b); else try { b = g(b) } catch (l) { return { state: "parsererror", error: g ? l : "No conversion from " + i + " to " + f } } } return { state: "success", data: b } } m.extend({ active: 0, lastModified: {}, etag: {}, ajaxSettings: { url: zc, type: "GET", isLocal: Dc.test(yc[1]), global: !0, processData: !0, async: !0, contentType: "application/x-www-form-urlencoded; charset=UTF-8", accepts: { "*": Jc, text: "text/plain", html: "text/html", xml: "application/xml, text/xml", json: "application/json, text/javascript" }, contents: { xml: /xml/, html: /html/, json: /json/ }, responseFields: { xml: "responseXML", text: "responseText", json: "responseJSON" }, converters: { "* text": String, "text html": !0, "text json": m.parseJSON, "text xml": m.parseXML }, flatOptions: { url: !0, context: !0 } }, ajaxSetup: function (a, b) { return b ? Nc(Nc(a, m.ajaxSettings), b) : Nc(m.ajaxSettings, a) }, ajaxPrefilter: Lc(Hc), ajaxTransport: Lc(Ic), ajax: function (a, b) { "object" == typeof a && (b = a, a = void 0), b = b || {}; var c, d, e, f, g, h, i, j, k = m.ajaxSetup({}, b), l = k.context || k, n = k.context && (l.nodeType || l.jquery) ? m(l) : m.event, o = m.Deferred(), p = m.Callbacks("once memory"), q = k.statusCode || {}, r = {}, s = {}, t = 0, u = "canceled", v = { readyState: 0, getResponseHeader: function (a) { var b; if (2 === t) { if (!j) { j = {}; while (b = Cc.exec(f)) j[b[1].toLowerCase()] = b[2] } b = j[a.toLowerCase()] } return null == b ? null : b }, getAllResponseHeaders: function () { return 2 === t ? f : null }, setRequestHeader: function (a, b) { var c = a.toLowerCase(); return t || (a = s[c] = s[c] || a, r[a] = b), this }, overrideMimeType: function (a) { return t || (k.mimeType = a), this }, statusCode: function (a) { var b; if (a) if (2 > t) for (b in a) q[b] = [q[b], a[b]]; else v.always(a[v.status]); return this }, abort: function (a) { var b = a || u; return i && i.abort(b), x(0, b), this } }; if (o.promise(v).complete = p.add, v.success = v.done, v.error = v.fail, k.url = ((a || k.url || zc) + "").replace(Ac, "").replace(Fc, yc[1] + "//"), k.type = b.method || b.type || k.method || k.type, k.dataTypes = m.trim(k.dataType || "*").toLowerCase().match(E) || [""], null == k.crossDomain && (c = Gc.exec(k.url.toLowerCase()), k.crossDomain = !(!c || c[1] === yc[1] && c[2] === yc[2] && (c[3] || ("http:" === c[1] ? "80" : "443")) === (yc[3] || ("http:" === yc[1] ? "80" : "443")))), k.data && k.processData && "string" != typeof k.data && (k.data = m.param(k.data, k.traditional)), Mc(Hc, k, b, v), 2 === t) return v; h = k.global, h && 0 === m.active++ && m.event.trigger("ajaxStart"), k.type = k.type.toUpperCase(), k.hasContent = !Ec.test(k.type), e = k.url, k.hasContent || (k.data && (e = k.url += (wc.test(e) ? "&" : "?") + k.data, delete k.data), k.cache === !1 && (k.url = Bc.test(e) ? e.replace(Bc, "$1_=" + vc++) : e + (wc.test(e) ? "&" : "?") + "_=" + vc++)), k.ifModified && (m.lastModified[e] && v.setRequestHeader("If-Modified-Since", m.lastModified[e]), m.etag[e] && v.setRequestHeader("If-None-Match", m.etag[e])), (k.data && k.hasContent && k.contentType !== !1 || b.contentType) && v.setRequestHeader("Content-Type", k.contentType), v.setRequestHeader("Accept", k.dataTypes[0] && k.accepts[k.dataTypes[0]] ? k.accepts[k.dataTypes[0]] + ("*" !== k.dataTypes[0] ? ", " + Jc + "; q=0.01" : "") : k.accepts["*"]); for (d in k.headers) v.setRequestHeader(d, k.headers[d]); if (k.beforeSend && (k.beforeSend.call(l, v, k) === !1 || 2 === t)) return v.abort(); u = "abort"; for (d in { success: 1, error: 1, complete: 1 }) v[d](k[d]); if (i = Mc(Ic, k, b, v)) { v.readyState = 1, h && n.trigger("ajaxSend", [v, k]), k.async && k.timeout > 0 && (g = setTimeout(function () { v.abort("timeout") }, k.timeout)); try { t = 1, i.send(r, x) } catch (w) { if (!(2 > t)) throw w; x(-1, w) } } else x(-1, "No Transport"); function x(a, b, c, d) { var j, r, s, u, w, x = b; 2 !== t && (t = 2, g && clearTimeout(g), i = void 0, f = d || "", v.readyState = a > 0 ? 4 : 0, j = a >= 200 && 300 > a || 304 === a, c && (u = Oc(k, v, c)), u = Pc(k, u, v, j), j ? (k.ifModified && (w = v.getResponseHeader("Last-Modified"), w && (m.lastModified[e] = w), w = v.getResponseHeader("etag"), w && (m.etag[e] = w)), 204 === a || "HEAD" === k.type ? x = "nocontent" : 304 === a ? x = "notmodified" : (x = u.state, r = u.data, s = u.error, j = !s)) : (s = x, (a || !x) && (x = "error", 0 > a && (a = 0))), v.status = a, v.statusText = (b || x) + "", j ? o.resolveWith(l, [r, x, v]) : o.rejectWith(l, [v, x, s]), v.statusCode(q), q = void 0, h && n.trigger(j ? "ajaxSuccess" : "ajaxError", [v, k, j ? r : s]), p.fireWith(l, [v, x]), h && (n.trigger("ajaxComplete", [v, k]), --m.active || m.event.trigger("ajaxStop"))) } return v }, getJSON: function (a, b, c) { return m.get(a, b, c, "json") }, getScript: function (a, b) { return m.get(a, void 0, b, "script") } }), m.each(["get", "post"], function (a, b) { m[b] = function (a, c, d, e) { return m.isFunction(c) && (e = e || d, d = c, c = void 0), m.ajax({ url: a, type: b, dataType: e, data: c, success: d }) } }), m.each(["ajaxStart", "ajaxStop", "ajaxComplete", "ajaxError", "ajaxSuccess", "ajaxSend"], function (a, b) { m.fn[b] = function (a) { return this.on(b, a) } }), m._evalUrl = function (a) { return m.ajax({ url: a, type: "GET", dataType: "script", async: !1, global: !1, "throws": !0 }) }, m.fn.extend({ wrapAll: function (a) { if (m.isFunction(a)) return this.each(function (b) { m(this).wrapAll(a.call(this, b)) }); if (this[0]) { var b = m(a, this[0].ownerDocument).eq(0).clone(!0); this[0].parentNode && b.insertBefore(this[0]), b.map(function () { var a = this; while (a.firstChild && 1 === a.firstChild.nodeType) a = a.firstChild; return a }).append(this) } return this }, wrapInner: function (a) { return this.each(m.isFunction(a) ? function (b) { m(this).wrapInner(a.call(this, b)) } : function () { var b = m(this), c = b.contents(); c.length ? c.wrapAll(a) : b.append(a) }) }, wrap: function (a) { var b = m.isFunction(a); return this.each(function (c) { m(this).wrapAll(b ? a.call(this, c) : a) }) }, unwrap: function () { return this.parent().each(function () { m.nodeName(this, "body") || m(this).replaceWith(this.childNodes) }).end() } }), m.expr.filters.hidden = function (a) { return a.offsetWidth <= 0 && a.offsetHeight <= 0 || !k.reliableHiddenOffsets() && "none" === (a.style && a.style.display || m.css(a, "display")) }, m.expr.filters.visible = function (a) { return !m.expr.filters.hidden(a) }; var Qc = /%20/g, Rc = /\[\]$/, Sc = /\r?\n/g, Tc = /^(?:submit|button|image|reset|file)$/i, Uc = /^(?:input|select|textarea|keygen)/i; function Vc(a, b, c, d) { var e; if (m.isArray(b)) m.each(b, function (b, e) { c || Rc.test(a) ? d(a, e) : Vc(a + "[" + ("object" == typeof e ? b : "") + "]", e, c, d) }); else if (c || "object" !== m.type(b)) d(a, b); else for (e in b) Vc(a + "[" + e + "]", b[e], c, d) } m.param = function (a, b) { var c, d = [], e = function (a, b) { b = m.isFunction(b) ? b() : null == b ? "" : b, d[d.length] = encodeURIComponent(a) + "=" + encodeURIComponent(b) }; if (void 0 === b && (b = m.ajaxSettings && m.ajaxSettings.traditional), m.isArray(a) || a.jquery && !m.isPlainObject(a)) m.each(a, function () { e(this.name, this.value) }); else for (c in a) Vc(c, a[c], b, e); return d.join("&").replace(Qc, "+") }, m.fn.extend({ serialize: function () { return m.param(this.serializeArray()) }, serializeArray: function () { return this.map(function () { var a = m.prop(this, "elements"); return a ? m.makeArray(a) : this }).filter(function () { var a = this.type; return this.name && !m(this).is(":disabled") && Uc.test(this.nodeName) && !Tc.test(a) && (this.checked || !W.test(a)) }).map(function (a, b) { var c = m(this).val(); return null == c ? null : m.isArray(c) ? m.map(c, function (a) { return { name: b.name, value: a.replace(Sc, "\r\n") } }) : { name: b.name, value: c.replace(Sc, "\r\n") } }).get() } }), m.ajaxSettings.xhr = void 0 !== a.ActiveXObject ? function () { return !this.isLocal && /^(get|post|head|put|delete|options)$/i.test(this.type) && Zc() || $c() } : Zc; var Wc = 0, Xc = {}, Yc = m.ajaxSettings.xhr(); a.ActiveXObject && m(a).on("unload", function () { for (var a in Xc) Xc[a](void 0, !0) }), k.cors = !!Yc && "withCredentials" in Yc, Yc = k.ajax = !!Yc, Yc && m.ajaxTransport(function (a) { if (!a.crossDomain || k.cors) { var b; return { send: function (c, d) { var e, f = a.xhr(), g = ++Wc; if (f.open(a.type, a.url, a.async, a.username, a.password), a.xhrFields) for (e in a.xhrFields) f[e] = a.xhrFields[e]; a.mimeType && f.overrideMimeType && f.overrideMimeType(a.mimeType), a.crossDomain || c["X-Requested-With"] || (c["X-Requested-With"] = "XMLHttpRequest"); for (e in c) void 0 !== c[e] && f.setRequestHeader(e, c[e] + ""); f.send(a.hasContent && a.data || null), b = function (c, e) { var h, i, j; if (b && (e || 4 === f.readyState)) if (delete Xc[g], b = void 0, f.onreadystatechange = m.noop, e) 4 !== f.readyState && f.abort(); else { j = {}, h = f.status, "string" == typeof f.responseText && (j.text = f.responseText); try { i = f.statusText } catch (k) { i = "" } h || !a.isLocal || a.crossDomain ? 1223 === h && (h = 204) : h = j.text ? 200 : 404 } j && d(h, i, j, f.getAllResponseHeaders()) }, a.async ? 4 === f.readyState ? setTimeout(b) : f.onreadystatechange = Xc[g] = b : b() }, abort: function () { b && b(void 0, !0) } } } }); function Zc() { try { return new a.XMLHttpRequest } catch (b) { } } function $c() { try { return new a.ActiveXObject("Microsoft.XMLHTTP") } catch (b) { } } m.ajaxSetup({ accepts: { script: "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript" }, contents: { script: /(?:java|ecma)script/ }, converters: { "text script": function (a) { return m.globalEval(a), a } } }), m.ajaxPrefilter("script", function (a) { void 0 === a.cache && (a.cache = !1), a.crossDomain && (a.type = "GET", a.global = !1) }), m.ajaxTransport("script", function (a) { if (a.crossDomain) { var b, c = y.head || m("head")[0] || y.documentElement; return { send: function (d, e) { b = y.createElement("script"), b.async = !0, a.scriptCharset && (b.charset = a.scriptCharset), b.src = a.url, b.onload = b.onreadystatechange = function (a, c) { (c || !b.readyState || /loaded|complete/.test(b.readyState)) && (b.onload = b.onreadystatechange = null, b.parentNode && b.parentNode.removeChild(b), b = null, c || e(200, "success")) }, c.insertBefore(b, c.firstChild) }, abort: function () { b && b.onload(void 0, !0) } } } }); var _c = [], ad = /(=)\?(?=&|$)|\?\?/; m.ajaxSetup({ jsonp: "callback", jsonpCallback: function () { var a = _c.pop() || m.expando + "_" + vc++; return this[a] = !0, a } }), m.ajaxPrefilter("json jsonp", function (b, c, d) { var e, f, g, h = b.jsonp !== !1 && (ad.test(b.url) ? "url" : "string" == typeof b.data && !(b.contentType || "").indexOf("application/x-www-form-urlencoded") && ad.test(b.data) && "data"); return h || "jsonp" === b.dataTypes[0] ? (e = b.jsonpCallback = m.isFunction(b.jsonpCallback) ? b.jsonpCallback() : b.jsonpCallback, h ? b[h] = b[h].replace(ad, "$1" + e) : b.jsonp !== !1 && (b.url += (wc.test(b.url) ? "&" : "?") + b.jsonp + "=" + e), b.converters["script json"] = function () { return g || m.error(e + " was not called"), g[0] }, b.dataTypes[0] = "json", f = a[e], a[e] = function () { g = arguments }, d.always(function () { a[e] = f, b[e] && (b.jsonpCallback = c.jsonpCallback, _c.push(e)), g && m.isFunction(f) && f(g[0]), g = f = void 0 }), "script") : void 0 }), m.parseHTML = function (a, b, c) { if (!a || "string" != typeof a) return null; "boolean" == typeof b && (c = b, b = !1), b = b || y; var d = u.exec(a), e = !c && []; return d ? [b.createElement(d[1])] : (d = m.buildFragment([a], b, e), e && e.length && m(e).remove(), m.merge([], d.childNodes)) }; var bd = m.fn.load; m.fn.load = function (a, b, c) { if ("string" != typeof a && bd) return bd.apply(this, arguments); var d, e, f, g = this, h = a.indexOf(" "); return h >= 0 && (d = m.trim(a.slice(h, a.length)), a = a.slice(0, h)), m.isFunction(b) ? (c = b, b = void 0) : b && "object" == typeof b && (f = "POST"), g.length > 0 && m.ajax({ url: a, type: f, dataType: "html", data: b }).done(function (a) { e = arguments, g.html(d ? m("<div>").append(m.parseHTML(a)).find(d) : a) }).complete(c && function (a, b) { g.each(c, e || [a.responseText, b, a]) }), this }, m.expr.filters.animated = function (a) { return m.grep(m.timers, function (b) { return a === b.elem }).length }; var cd = a.document.documentElement; function dd(a) { return m.isWindow(a) ? a : 9 === a.nodeType ? a.defaultView || a.parentWindow : !1 } m.offset = { setOffset: function (a, b, c) { var d, e, f, g, h, i, j, k = m.css(a, "position"), l = m(a), n = {}; "static" === k && (a.style.position = "relative"), h = l.offset(), f = m.css(a, "top"), i = m.css(a, "left"), j = ("absolute" === k || "fixed" === k) && m.inArray("auto", [f, i]) > -1, j ? (d = l.position(), g = d.top, e = d.left) : (g = parseFloat(f) || 0, e = parseFloat(i) || 0), m.isFunction(b) && (b = b.call(a, c, h)), null != b.top && (n.top = b.top - h.top + g), null != b.left && (n.left = b.left - h.left + e), "using" in b ? b.using.call(a, n) : l.css(n) } }, m.fn.extend({ offset: function (a) { if (arguments.length) return void 0 === a ? this : this.each(function (b) { m.offset.setOffset(this, a, b) }); var b, c, d = { top: 0, left: 0 }, e = this[0], f = e && e.ownerDocument; if (f) return b = f.documentElement, m.contains(b, e) ? (typeof e.getBoundingClientRect !== K && (d = e.getBoundingClientRect()), c = dd(f), { top: d.top + (c.pageYOffset || b.scrollTop) - (b.clientTop || 0), left: d.left + (c.pageXOffset || b.scrollLeft) - (b.clientLeft || 0) }) : d }, position: function () { if (this[0]) { var a, b, c = { top: 0, left: 0 }, d = this[0]; return "fixed" === m.css(d, "position") ? b = d.getBoundingClientRect() : (a = this.offsetParent(), b = this.offset(), m.nodeName(a[0], "html") || (c = a.offset()), c.top += m.css(a[0], "borderTopWidth", !0), c.left += m.css(a[0], "borderLeftWidth", !0)), { top: b.top - c.top - m.css(d, "marginTop", !0), left: b.left - c.left - m.css(d, "marginLeft", !0) } } }, offsetParent: function () { return this.map(function () { var a = this.offsetParent || cd; while (a && !m.nodeName(a, "html") && "static" === m.css(a, "position")) a = a.offsetParent; return a || cd }) } }), m.each({ scrollLeft: "pageXOffset", scrollTop: "pageYOffset" }, function (a, b) { var c = /Y/.test(b); m.fn[a] = function (d) { return V(this, function (a, d, e) { var f = dd(a); return void 0 === e ? f ? b in f ? f[b] : f.document.documentElement[d] : a[d] : void (f ? f.scrollTo(c ? m(f).scrollLeft() : e, c ? e : m(f).scrollTop()) : a[d] = e) }, a, d, arguments.length, null) } }), m.each(["top", "left"], function (a, b) { m.cssHooks[b] = Lb(k.pixelPosition, function (a, c) { return c ? (c = Jb(a, b), Hb.test(c) ? m(a).position()[b] + "px" : c) : void 0 }) }), m.each({ Height: "height", Width: "width" }, function (a, b) { m.each({ padding: "inner" + a, content: b, "": "outer" + a }, function (c, d) { m.fn[d] = function (d, e) { var f = arguments.length && (c || "boolean" != typeof d), g = c || (d === !0 || e === !0 ? "margin" : "border"); return V(this, function (b, c, d) { var e; return m.isWindow(b) ? b.document.documentElement["client" + a] : 9 === b.nodeType ? (e = b.documentElement, Math.max(b.body["scroll" + a], e["scroll" + a], b.body["offset" + a], e["offset" + a], e["client" + a])) : void 0 === d ? m.css(b, c, g) : m.style(b, c, d, g) }, b, f ? d : void 0, f, null) } }) }), m.fn.size = function () { return this.length }, m.fn.andSelf = m.fn.addBack, "function" == typeof define && define.amd && define("jquery", [], function () { return m }); var ed = a.jQuery, fd = a.$; return m.noConflict = function (b) { return a.$ === m && (a.$ = fd), b && a.jQuery === m && (a.jQuery = ed), m }, typeof b === K && (a.jQuery = a.$ = m), m
});
//# sourceMappingURL=jquery.min.map

/*! jQuery UI - v1.11.1 - 2014-08-13
* http://jqueryui.com
* Copyright 2014 jQuery Foundation and other contributors; Licensed MIT */
(function (t) { "function" == typeof define && define.amd ? define(["jquery"], t) : t(jQuery) })(function (t) { function e(e, i) { var r, o, u, s = e.nodeName.toLowerCase(); return "area" === s ? (r = e.parentNode, o = r.name, e.href && o && "map" === r.nodeName.toLowerCase() ? (u = t("img[usemap='#" + o + "']")[0], !!u && n(u)) : !1) : (/input|select|textarea|button|object/.test(s) ? !e.disabled : "a" === s ? e.href || i : i) && n(e) } function n(e) { return t.expr.filters.visible(e) && !t(e).parents().addBack().filter(function () { return "hidden" === t.css(this, "visibility") }).length } t.ui = t.ui || {}, t.extend(t.ui, { version: "1.11.1", keyCode: { BACKSPACE: 8, COMMA: 188, DELETE: 46, DOWN: 40, END: 35, ENTER: 13, ESCAPE: 27, HOME: 36, LEFT: 37, PAGE_DOWN: 34, PAGE_UP: 33, PERIOD: 190, RIGHT: 39, SPACE: 32, TAB: 9, UP: 38 } }), t.fn.extend({ scrollParent: function (e) { var n = this.css("position"), i = "absolute" === n, r = e ? /(auto|scroll|hidden)/ : /(auto|scroll)/, o = this.parents().filter(function () { var e = t(this); return i && "static" === e.css("position") ? !1 : r.test(e.css("overflow") + e.css("overflow-y") + e.css("overflow-x")) }).eq(0); return "fixed" !== n && o.length ? o : t(this[0].ownerDocument || document) }, uniqueId: function () { var t = 0; return function () { return this.each(function () { this.id || (this.id = "ui-id-" + ++t) }) } }(), removeUniqueId: function () { return this.each(function () { /^ui-id-\d+$/.test(this.id) && t(this).removeAttr("id") }) } }), t.extend(t.expr[":"], { data: t.expr.createPseudo ? t.expr.createPseudo(function (e) { return function (n) { return !!t.data(n, e) } }) : function (e, n, i) { return !!t.data(e, i[3]) }, focusable: function (n) { return e(n, !isNaN(t.attr(n, "tabindex"))) }, tabbable: function (n) { var i = t.attr(n, "tabindex"), r = isNaN(i); return (r || i >= 0) && e(n, !r) } }), t("<a>").outerWidth(1).jquery || t.each(["Width", "Height"], function (e, n) { function i(e, n, i, o) { return t.each(r, function () { n -= parseFloat(t.css(e, "padding" + this)) || 0, i && (n -= parseFloat(t.css(e, "border" + this + "Width")) || 0), o && (n -= parseFloat(t.css(e, "margin" + this)) || 0) }), n } var r = "Width" === n ? ["Left", "Right"] : ["Top", "Bottom"], o = n.toLowerCase(), u = { innerWidth: t.fn.innerWidth, innerHeight: t.fn.innerHeight, outerWidth: t.fn.outerWidth, outerHeight: t.fn.outerHeight }; t.fn["inner" + n] = function (e) { return void 0 === e ? u["inner" + n].call(this) : this.each(function () { t(this).css(o, i(this, e) + "px") }) }, t.fn["outer" + n] = function (e, r) { return "number" != typeof e ? u["outer" + n].call(this, e) : this.each(function () { t(this).css(o, i(this, e, !0, r) + "px") }) } }), t.fn.addBack || (t.fn.addBack = function (t) { return this.add(null == t ? this.prevObject : this.prevObject.filter(t)) }), t("<a>").data("a-b", "a").removeData("a-b").data("a-b") && (t.fn.removeData = function (e) { return function (n) { return arguments.length ? e.call(this, t.camelCase(n)) : e.call(this) } }(t.fn.removeData)), t.ui.ie = !!/msie [\w.]+/.exec(navigator.userAgent.toLowerCase()), t.fn.extend({ focus: function (e) { return function (n, i) { return "number" == typeof n ? this.each(function () { var e = this; setTimeout(function () { t(e).focus(), i && i.call(e) }, n) }) : e.apply(this, arguments) } }(t.fn.focus), disableSelection: function () { var t = "onselectstart" in document.createElement("div") ? "selectstart" : "mousedown"; return function () { return this.bind(t + ".ui-disableSelection", function (t) { t.preventDefault() }) } }(), enableSelection: function () { return this.unbind(".ui-disableSelection") }, zIndex: function (e) { if (void 0 !== e) return this.css("zIndex", e); if (this.length) for (var n, i, r = t(this[0]) ; r.length && r[0] !== document;) { if (n = r.css("position"), ("absolute" === n || "relative" === n || "fixed" === n) && (i = parseInt(r.css("zIndex"), 10), !isNaN(i) && 0 !== i)) return i; r = r.parent() } return 0 } }), t.ui.plugin = { add: function (e, n, i) { var r, o = t.ui[e].prototype; for (r in i) o.plugins[r] = o.plugins[r] || [], o.plugins[r].push([n, i[r]]) }, call: function (t, e, n, i) { var r, o = t.plugins[e]; if (o && (i || t.element[0].parentNode && 11 !== t.element[0].parentNode.nodeType)) for (r = 0; o.length > r; r++) t.options[o[r][0]] && o[r][1].apply(t.element, n) } } });
/*! jQuery UI - v1.11.1 - 2014-08-13
* http://jqueryui.com
* Copyright 2014 jQuery Foundation and other contributors; Licensed MIT */
(function (t) { "function" == typeof define && define.amd ? define(["jquery"], t) : t(jQuery) })(function (t) { var e = 0, i = Array.prototype.slice; return t.cleanData = function (e) { return function (i) { var n, s, r; for (r = 0; null != (s = i[r]) ; r++) try { n = t._data(s, "events"), n && n.remove && t(s).triggerHandler("remove") } catch (o) { } e(i) } }(t.cleanData), t.widget = function (e, i, n) { var s, r, o, a, u = {}, d = e.split(".")[0]; return e = e.split(".")[1], s = d + "-" + e, n || (n = i, i = t.Widget), t.expr[":"][s.toLowerCase()] = function (e) { return !!t.data(e, s) }, t[d] = t[d] || {}, r = t[d][e], o = t[d][e] = function (t, e) { return this._createWidget ? (arguments.length && this._createWidget(t, e), void 0) : new o(t, e) }, t.extend(o, r, { version: n.version, _proto: t.extend({}, n), _childConstructors: [] }), a = new i, a.options = t.widget.extend({}, a.options), t.each(n, function (e, n) { return t.isFunction(n) ? (u[e] = function () { var t = function () { return i.prototype[e].apply(this, arguments) }, s = function (t) { return i.prototype[e].apply(this, t) }; return function () { var e, i = this._super, r = this._superApply; return this._super = t, this._superApply = s, e = n.apply(this, arguments), this._super = i, this._superApply = r, e } }(), void 0) : (u[e] = n, void 0) }), o.prototype = t.widget.extend(a, { widgetEventPrefix: r ? a.widgetEventPrefix || e : e }, u, { constructor: o, namespace: d, widgetName: e, widgetFullName: s }), r ? (t.each(r._childConstructors, function (e, i) { var n = i.prototype; t.widget(n.namespace + "." + n.widgetName, o, i._proto) }), delete r._childConstructors) : i._childConstructors.push(o), t.widget.bridge(e, o), o }, t.widget.extend = function (e) { for (var n, s, r = i.call(arguments, 1), o = 0, a = r.length; a > o; o++) for (n in r[o]) s = r[o][n], r[o].hasOwnProperty(n) && void 0 !== s && (e[n] = t.isPlainObject(s) ? t.isPlainObject(e[n]) ? t.widget.extend({}, e[n], s) : t.widget.extend({}, s) : s); return e }, t.widget.bridge = function (e, n) { var s = n.prototype.widgetFullName || e; t.fn[e] = function (r) { var o = "string" == typeof r, a = i.call(arguments, 1), u = this; return r = !o && a.length ? t.widget.extend.apply(null, [r].concat(a)) : r, o ? this.each(function () { var i, n = t.data(this, s); return "instance" === r ? (u = n, !1) : n ? t.isFunction(n[r]) && "_" !== r.charAt(0) ? (i = n[r].apply(n, a), i !== n && void 0 !== i ? (u = i && i.jquery ? u.pushStack(i.get()) : i, !1) : void 0) : t.error("no such method '" + r + "' for " + e + " widget instance") : t.error("cannot call methods on " + e + " prior to initialization; " + "attempted to call method '" + r + "'") }) : this.each(function () { var e = t.data(this, s); e ? (e.option(r || {}), e._init && e._init()) : t.data(this, s, new n(r, this)) }), u } }, t.Widget = function () { }, t.Widget._childConstructors = [], t.Widget.prototype = { widgetName: "widget", widgetEventPrefix: "", defaultElement: "<div>", options: { disabled: !1, create: null }, _createWidget: function (i, n) { n = t(n || this.defaultElement || this)[0], this.element = t(n), this.uuid = e++, this.eventNamespace = "." + this.widgetName + this.uuid, this.options = t.widget.extend({}, this.options, this._getCreateOptions(), i), this.bindings = t(), this.hoverable = t(), this.focusable = t(), n !== this && (t.data(n, this.widgetFullName, this), this._on(!0, this.element, { remove: function (t) { t.target === n && this.destroy() } }), this.document = t(n.style ? n.ownerDocument : n.document || n), this.window = t(this.document[0].defaultView || this.document[0].parentWindow)), this._create(), this._trigger("create", null, this._getCreateEventData()), this._init() }, _getCreateOptions: t.noop, _getCreateEventData: t.noop, _create: t.noop, _init: t.noop, destroy: function () { this._destroy(), this.element.unbind(this.eventNamespace).removeData(this.widgetFullName).removeData(t.camelCase(this.widgetFullName)), this.widget().unbind(this.eventNamespace).removeAttr("aria-disabled").removeClass(this.widgetFullName + "-disabled " + "ui-state-disabled"), this.bindings.unbind(this.eventNamespace), this.hoverable.removeClass("ui-state-hover"), this.focusable.removeClass("ui-state-focus") }, _destroy: t.noop, widget: function () { return this.element }, option: function (e, i) { var n, s, r, o = e; if (0 === arguments.length) return t.widget.extend({}, this.options); if ("string" == typeof e) if (o = {}, n = e.split("."), e = n.shift(), n.length) { for (s = o[e] = t.widget.extend({}, this.options[e]), r = 0; n.length - 1 > r; r++) s[n[r]] = s[n[r]] || {}, s = s[n[r]]; if (e = n.pop(), 1 === arguments.length) return void 0 === s[e] ? null : s[e]; s[e] = i } else { if (1 === arguments.length) return void 0 === this.options[e] ? null : this.options[e]; o[e] = i } return this._setOptions(o), this }, _setOptions: function (t) { var e; for (e in t) this._setOption(e, t[e]); return this }, _setOption: function (t, e) { return this.options[t] = e, "disabled" === t && (this.widget().toggleClass(this.widgetFullName + "-disabled", !!e), e && (this.hoverable.removeClass("ui-state-hover"), this.focusable.removeClass("ui-state-focus"))), this }, enable: function () { return this._setOptions({ disabled: !1 }) }, disable: function () { return this._setOptions({ disabled: !0 }) }, _on: function (e, i, n) { var s, r = this; "boolean" != typeof e && (n = i, i = e, e = !1), n ? (i = s = t(i), this.bindings = this.bindings.add(i)) : (n = i, i = this.element, s = this.widget()), t.each(n, function (n, o) { function a() { return e || r.options.disabled !== !0 && !t(this).hasClass("ui-state-disabled") ? ("string" == typeof o ? r[o] : o).apply(r, arguments) : void 0 } "string" != typeof o && (a.guid = o.guid = o.guid || a.guid || t.guid++); var u = n.match(/^([\w:-]*)\s*(.*)$/), d = u[1] + r.eventNamespace, c = u[2]; c ? s.delegate(c, d, a) : i.bind(d, a) }) }, _off: function (t, e) { e = (e || "").split(" ").join(this.eventNamespace + " ") + this.eventNamespace, t.unbind(e).undelegate(e) }, _delay: function (t, e) { function i() { return ("string" == typeof t ? n[t] : t).apply(n, arguments) } var n = this; return setTimeout(i, e || 0) }, _hoverable: function (e) { this.hoverable = this.hoverable.add(e), this._on(e, { mouseenter: function (e) { t(e.currentTarget).addClass("ui-state-hover") }, mouseleave: function (e) { t(e.currentTarget).removeClass("ui-state-hover") } }) }, _focusable: function (e) { this.focusable = this.focusable.add(e), this._on(e, { focusin: function (e) { t(e.currentTarget).addClass("ui-state-focus") }, focusout: function (e) { t(e.currentTarget).removeClass("ui-state-focus") } }) }, _trigger: function (e, i, n) { var s, r, o = this.options[e]; if (n = n || {}, i = t.Event(i), i.type = (e === this.widgetEventPrefix ? e : this.widgetEventPrefix + e).toLowerCase(), i.target = this.element[0], r = i.originalEvent) for (s in r) s in i || (i[s] = r[s]); return this.element.trigger(i, n), !(t.isFunction(o) && o.apply(this.element[0], [i].concat(n)) === !1 || i.isDefaultPrevented()) } }, t.each({ show: "fadeIn", hide: "fadeOut" }, function (e, i) { t.Widget.prototype["_" + e] = function (n, s, r) { "string" == typeof s && (s = { effect: s }); var o, a = s ? s === !0 || "number" == typeof s ? i : s.effect || i : e; s = s || {}, "number" == typeof s && (s = { duration: s }), o = !t.isEmptyObject(s), s.complete = r, s.delay && n.delay(s.delay), o && t.effects && t.effects.effect[a] ? n[e](s) : a !== e && n[a] ? n[a](s.duration, s.easing, r) : n.queue(function (i) { t(this)[e](), r && r.call(n[0]), i() }) } }), t.widget });
/*! jQuery UI - v1.11.1 - 2014-08-13
* http://jqueryui.com
* Copyright 2014 jQuery Foundation and other contributors; Licensed MIT */
(function (t) { "function" == typeof define && define.amd ? define(["jquery", "./widget"], t) : t(jQuery) })(function (t) { var e = !1; return t(document).mouseup(function () { e = !1 }), t.widget("ui.mouse", { version: "1.11.1", options: { cancel: "input,textarea,button,select,option", distance: 1, delay: 0 }, _mouseInit: function () { var e = this; this.element.bind("mousedown." + this.widgetName, function (t) { return e._mouseDown(t) }).bind("click." + this.widgetName, function (i) { return !0 === t.data(i.target, e.widgetName + ".preventClickEvent") ? (t.removeData(i.target, e.widgetName + ".preventClickEvent"), i.stopImmediatePropagation(), !1) : void 0 }), this.started = !1 }, _mouseDestroy: function () { this.element.unbind("." + this.widgetName), this._mouseMoveDelegate && this.document.unbind("mousemove." + this.widgetName, this._mouseMoveDelegate).unbind("mouseup." + this.widgetName, this._mouseUpDelegate) }, _mouseDown: function (i) { if (!e) { this._mouseStarted && this._mouseUp(i), this._mouseDownEvent = i; var n = this, s = 1 === i.which, o = "string" == typeof this.options.cancel && i.target.nodeName ? t(i.target).closest(this.options.cancel).length : !1; return s && !o && this._mouseCapture(i) ? (this.mouseDelayMet = !this.options.delay, this.mouseDelayMet || (this._mouseDelayTimer = setTimeout(function () { n.mouseDelayMet = !0 }, this.options.delay)), this._mouseDistanceMet(i) && this._mouseDelayMet(i) && (this._mouseStarted = this._mouseStart(i) !== !1, !this._mouseStarted) ? (i.preventDefault(), !0) : (!0 === t.data(i.target, this.widgetName + ".preventClickEvent") && t.removeData(i.target, this.widgetName + ".preventClickEvent"), this._mouseMoveDelegate = function (t) { return n._mouseMove(t) }, this._mouseUpDelegate = function (t) { return n._mouseUp(t) }, this.document.bind("mousemove." + this.widgetName, this._mouseMoveDelegate).bind("mouseup." + this.widgetName, this._mouseUpDelegate), i.preventDefault(), e = !0, !0)) : !0 } }, _mouseMove: function (e) { return t.ui.ie && (!document.documentMode || 9 > document.documentMode) && !e.button ? this._mouseUp(e) : e.which ? this._mouseStarted ? (this._mouseDrag(e), e.preventDefault()) : (this._mouseDistanceMet(e) && this._mouseDelayMet(e) && (this._mouseStarted = this._mouseStart(this._mouseDownEvent, e) !== !1, this._mouseStarted ? this._mouseDrag(e) : this._mouseUp(e)), !this._mouseStarted) : this._mouseUp(e) }, _mouseUp: function (i) { return this.document.unbind("mousemove." + this.widgetName, this._mouseMoveDelegate).unbind("mouseup." + this.widgetName, this._mouseUpDelegate), this._mouseStarted && (this._mouseStarted = !1, i.target === this._mouseDownEvent.target && t.data(i.target, this.widgetName + ".preventClickEvent", !0), this._mouseStop(i)), e = !1, !1 }, _mouseDistanceMet: function (t) { return Math.max(Math.abs(this._mouseDownEvent.pageX - t.pageX), Math.abs(this._mouseDownEvent.pageY - t.pageY)) >= this.options.distance }, _mouseDelayMet: function () { return this.mouseDelayMet }, _mouseStart: function () { }, _mouseDrag: function () { }, _mouseStop: function () { }, _mouseCapture: function () { return !0 } }) });
/*! jQuery UI - v1.11.1 - 2014-08-13
* http://jqueryui.com
* Copyright 2014 jQuery Foundation and other contributors; Licensed MIT */
(function (t) { "function" == typeof define && define.amd ? define(["jquery", "./core", "./mouse", "./widget"], t) : t(jQuery) })(function (t) { return t.widget("ui.draggable", t.ui.mouse, { version: "1.11.1", widgetEventPrefix: "drag", options: { addClasses: !0, appendTo: "parent", axis: !1, connectToSortable: !1, containment: !1, cursor: "auto", cursorAt: !1, grid: !1, handle: !1, helper: "original", iframeFix: !1, opacity: !1, refreshPositions: !1, revert: !1, revertDuration: 500, scope: "default", scroll: !0, scrollSensitivity: 20, scrollSpeed: 20, snap: !1, snapMode: "both", snapTolerance: 20, stack: !1, zIndex: !1, drag: null, start: null, stop: null }, _create: function () { "original" !== this.options.helper || /^(?:r|a|f)/.test(this.element.css("position")) || (this.element[0].style.position = "relative"), this.options.addClasses && this.element.addClass("ui-draggable"), this.options.disabled && this.element.addClass("ui-draggable-disabled"), this._setHandleClassName(), this._mouseInit() }, _setOption: function (t, e) { this._super(t, e), "handle" === t && (this._removeHandleClassName(), this._setHandleClassName()) }, _destroy: function () { return (this.helper || this.element).is(".ui-draggable-dragging") ? (this.destroyOnClear = !0, void 0) : (this.element.removeClass("ui-draggable ui-draggable-dragging ui-draggable-disabled"), this._removeHandleClassName(), this._mouseDestroy(), void 0) }, _mouseCapture: function (e) { var i = this.document[0], s = this.options; try { i.activeElement && "body" !== i.activeElement.nodeName.toLowerCase() && t(i.activeElement).blur() } catch (n) { } return this.helper || s.disabled || t(e.target).closest(".ui-resizable-handle").length > 0 ? !1 : (this.handle = this._getHandle(e), this.handle ? (t(s.iframeFix === !0 ? "iframe" : s.iframeFix).each(function () { t("<div class='ui-draggable-iframeFix' style='background: #fff;'></div>").css({ width: this.offsetWidth + "px", height: this.offsetHeight + "px", position: "absolute", opacity: "0.001", zIndex: 1e3 }).css(t(this).offset()).appendTo("body") }), !0) : !1) }, _mouseStart: function (e) { var i = this.options; return this.helper = this._createHelper(e), this.helper.addClass("ui-draggable-dragging"), this._cacheHelperProportions(), t.ui.ddmanager && (t.ui.ddmanager.current = this), this._cacheMargins(), this.cssPosition = this.helper.css("position"), this.scrollParent = this.helper.scrollParent(!0), this.offsetParent = this.helper.offsetParent(), this.offsetParentCssPosition = this.offsetParent.css("position"), this.offset = this.positionAbs = this.element.offset(), this.offset = { top: this.offset.top - this.margins.top, left: this.offset.left - this.margins.left }, this.offset.scroll = !1, t.extend(this.offset, { click: { left: e.pageX - this.offset.left, top: e.pageY - this.offset.top }, parent: this._getParentOffset(), relative: this._getRelativeOffset() }), this.originalPosition = this.position = this._generatePosition(e, !1), this.originalPageX = e.pageX, this.originalPageY = e.pageY, i.cursorAt && this._adjustOffsetFromHelper(i.cursorAt), this._setContainment(), this._trigger("start", e) === !1 ? (this._clear(), !1) : (this._cacheHelperProportions(), t.ui.ddmanager && !i.dropBehaviour && t.ui.ddmanager.prepareOffsets(this, e), this._mouseDrag(e, !0), t.ui.ddmanager && t.ui.ddmanager.dragStart(this, e), !0) }, _mouseDrag: function (e, i) { if ("fixed" === this.offsetParentCssPosition && (this.offset.parent = this._getParentOffset()), this.position = this._generatePosition(e, !0), this.positionAbs = this._convertPositionTo("absolute"), !i) { var s = this._uiHash(); if (this._trigger("drag", e, s) === !1) return this._mouseUp({}), !1; this.position = s.position } return this.helper[0].style.left = this.position.left + "px", this.helper[0].style.top = this.position.top + "px", t.ui.ddmanager && t.ui.ddmanager.drag(this, e), !1 }, _mouseStop: function (e) { var i = this, s = !1; return t.ui.ddmanager && !this.options.dropBehaviour && (s = t.ui.ddmanager.drop(this, e)), this.dropped && (s = this.dropped, this.dropped = !1), "invalid" === this.options.revert && !s || "valid" === this.options.revert && s || this.options.revert === !0 || t.isFunction(this.options.revert) && this.options.revert.call(this.element, s) ? t(this.helper).animate(this.originalPosition, parseInt(this.options.revertDuration, 10), function () { i._trigger("stop", e) !== !1 && i._clear() }) : this._trigger("stop", e) !== !1 && this._clear(), !1 }, _mouseUp: function (e) { return t("div.ui-draggable-iframeFix").each(function () { this.parentNode.removeChild(this) }), t.ui.ddmanager && t.ui.ddmanager.dragStop(this, e), this.element.focus(), t.ui.mouse.prototype._mouseUp.call(this, e) }, cancel: function () { return this.helper.is(".ui-draggable-dragging") ? this._mouseUp({}) : this._clear(), this }, _getHandle: function (e) { return this.options.handle ? !!t(e.target).closest(this.element.find(this.options.handle)).length : !0 }, _setHandleClassName: function () { this.handleElement = this.options.handle ? this.element.find(this.options.handle) : this.element, this.handleElement.addClass("ui-draggable-handle") }, _removeHandleClassName: function () { this.handleElement.removeClass("ui-draggable-handle") }, _createHelper: function (e) { var i = this.options, s = t.isFunction(i.helper) ? t(i.helper.apply(this.element[0], [e])) : "clone" === i.helper ? this.element.clone().removeAttr("id") : this.element; return s.parents("body").length || s.appendTo("parent" === i.appendTo ? this.element[0].parentNode : i.appendTo), s[0] === this.element[0] || /(fixed|absolute)/.test(s.css("position")) || s.css("position", "absolute"), s }, _adjustOffsetFromHelper: function (e) { "string" == typeof e && (e = e.split(" ")), t.isArray(e) && (e = { left: +e[0], top: +e[1] || 0 }), "left" in e && (this.offset.click.left = e.left + this.margins.left), "right" in e && (this.offset.click.left = this.helperProportions.width - e.right + this.margins.left), "top" in e && (this.offset.click.top = e.top + this.margins.top), "bottom" in e && (this.offset.click.top = this.helperProportions.height - e.bottom + this.margins.top) }, _isRootNode: function (t) { return /(html|body)/i.test(t.tagName) || t === this.document[0] }, _getParentOffset: function () { var e = this.offsetParent.offset(), i = this.document[0]; return "absolute" === this.cssPosition && this.scrollParent[0] !== i && t.contains(this.scrollParent[0], this.offsetParent[0]) && (e.left += this.scrollParent.scrollLeft(), e.top += this.scrollParent.scrollTop()), this._isRootNode(this.offsetParent[0]) && (e = { top: 0, left: 0 }), { top: e.top + (parseInt(this.offsetParent.css("borderTopWidth"), 10) || 0), left: e.left + (parseInt(this.offsetParent.css("borderLeftWidth"), 10) || 0) } }, _getRelativeOffset: function () { if ("relative" !== this.cssPosition) return { top: 0, left: 0 }; var t = this.element.position(), e = this._isRootNode(this.scrollParent[0]); return { top: t.top - (parseInt(this.helper.css("top"), 10) || 0) + (e ? 0 : this.scrollParent.scrollTop()), left: t.left - (parseInt(this.helper.css("left"), 10) || 0) + (e ? 0 : this.scrollParent.scrollLeft()) } }, _cacheMargins: function () { this.margins = { left: parseInt(this.element.css("marginLeft"), 10) || 0, top: parseInt(this.element.css("marginTop"), 10) || 0, right: parseInt(this.element.css("marginRight"), 10) || 0, bottom: parseInt(this.element.css("marginBottom"), 10) || 0 } }, _cacheHelperProportions: function () { this.helperProportions = { width: this.helper.outerWidth(), height: this.helper.outerHeight() } }, _setContainment: function () { var e, i, s, n = this.options, o = this.document[0]; return this.relativeContainer = null, n.containment ? "window" === n.containment ? (this.containment = [t(window).scrollLeft() - this.offset.relative.left - this.offset.parent.left, t(window).scrollTop() - this.offset.relative.top - this.offset.parent.top, t(window).scrollLeft() + t(window).width() - this.helperProportions.width - this.margins.left, t(window).scrollTop() + (t(window).height() || o.body.parentNode.scrollHeight) - this.helperProportions.height - this.margins.top], void 0) : "document" === n.containment ? (this.containment = [0, 0, t(o).width() - this.helperProportions.width - this.margins.left, (t(o).height() || o.body.parentNode.scrollHeight) - this.helperProportions.height - this.margins.top], void 0) : n.containment.constructor === Array ? (this.containment = n.containment, void 0) : ("parent" === n.containment && (n.containment = this.helper[0].parentNode), i = t(n.containment), s = i[0], s && (e = "hidden" !== i.css("overflow"), this.containment = [(parseInt(i.css("borderLeftWidth"), 10) || 0) + (parseInt(i.css("paddingLeft"), 10) || 0), (parseInt(i.css("borderTopWidth"), 10) || 0) + (parseInt(i.css("paddingTop"), 10) || 0), (e ? Math.max(s.scrollWidth, s.offsetWidth) : s.offsetWidth) - (parseInt(i.css("borderRightWidth"), 10) || 0) - (parseInt(i.css("paddingRight"), 10) || 0) - this.helperProportions.width - this.margins.left - this.margins.right, (e ? Math.max(s.scrollHeight, s.offsetHeight) : s.offsetHeight) - (parseInt(i.css("borderBottomWidth"), 10) || 0) - (parseInt(i.css("paddingBottom"), 10) || 0) - this.helperProportions.height - this.margins.top - this.margins.bottom], this.relativeContainer = i), void 0) : (this.containment = null, void 0) }, _convertPositionTo: function (t, e) { e || (e = this.position); var i = "absolute" === t ? 1 : -1, s = this._isRootNode(this.scrollParent[0]); return { top: e.top + this.offset.relative.top * i + this.offset.parent.top * i - ("fixed" === this.cssPosition ? -this.offset.scroll.top : s ? 0 : this.offset.scroll.top) * i, left: e.left + this.offset.relative.left * i + this.offset.parent.left * i - ("fixed" === this.cssPosition ? -this.offset.scroll.left : s ? 0 : this.offset.scroll.left) * i } }, _generatePosition: function (t, e) { var i, s, n, o, r = this.options, a = this._isRootNode(this.scrollParent[0]), l = t.pageX, h = t.pageY; return a && this.offset.scroll || (this.offset.scroll = { top: this.scrollParent.scrollTop(), left: this.scrollParent.scrollLeft() }), e && (this.containment && (this.relativeContainer ? (s = this.relativeContainer.offset(), i = [this.containment[0] + s.left, this.containment[1] + s.top, this.containment[2] + s.left, this.containment[3] + s.top]) : i = this.containment, t.pageX - this.offset.click.left < i[0] && (l = i[0] + this.offset.click.left), t.pageY - this.offset.click.top < i[1] && (h = i[1] + this.offset.click.top), t.pageX - this.offset.click.left > i[2] && (l = i[2] + this.offset.click.left), t.pageY - this.offset.click.top > i[3] && (h = i[3] + this.offset.click.top)), r.grid && (n = r.grid[1] ? this.originalPageY + Math.round((h - this.originalPageY) / r.grid[1]) * r.grid[1] : this.originalPageY, h = i ? n - this.offset.click.top >= i[1] || n - this.offset.click.top > i[3] ? n : n - this.offset.click.top >= i[1] ? n - r.grid[1] : n + r.grid[1] : n, o = r.grid[0] ? this.originalPageX + Math.round((l - this.originalPageX) / r.grid[0]) * r.grid[0] : this.originalPageX, l = i ? o - this.offset.click.left >= i[0] || o - this.offset.click.left > i[2] ? o : o - this.offset.click.left >= i[0] ? o - r.grid[0] : o + r.grid[0] : o), "y" === r.axis && (l = this.originalPageX), "x" === r.axis && (h = this.originalPageY)), { top: h - this.offset.click.top - this.offset.relative.top - this.offset.parent.top + ("fixed" === this.cssPosition ? -this.offset.scroll.top : a ? 0 : this.offset.scroll.top), left: l - this.offset.click.left - this.offset.relative.left - this.offset.parent.left + ("fixed" === this.cssPosition ? -this.offset.scroll.left : a ? 0 : this.offset.scroll.left) } }, _clear: function () { this.helper.removeClass("ui-draggable-dragging"), this.helper[0] === this.element[0] || this.cancelHelperRemoval || this.helper.remove(), this.helper = null, this.cancelHelperRemoval = !1, this.destroyOnClear && this.destroy() }, _trigger: function (e, i, s) { return s = s || this._uiHash(), t.ui.plugin.call(this, e, [i, s, this], !0), "drag" === e && (this.positionAbs = this._convertPositionTo("absolute")), t.Widget.prototype._trigger.call(this, e, i, s) }, plugins: {}, _uiHash: function () { return { helper: this.helper, position: this.position, originalPosition: this.originalPosition, offset: this.positionAbs } } }), t.ui.plugin.add("draggable", "connectToSortable", { start: function (e, i, s) { var n = s.options, o = t.extend({}, i, { item: s.element }); s.sortables = [], t(n.connectToSortable).each(function () { var i = t(this).sortable("instance"); i && !i.options.disabled && (s.sortables.push({ instance: i, shouldRevert: i.options.revert }), i.refreshPositions(), i._trigger("activate", e, o)) }) }, stop: function (e, i, s) { var n = t.extend({}, i, { item: s.element }); t.each(s.sortables, function () { this.instance.isOver ? (this.instance.isOver = 0, s.cancelHelperRemoval = !0, this.instance.cancelHelperRemoval = !1, this.shouldRevert && (this.instance.options.revert = this.shouldRevert), this.instance._mouseStop(e), this.instance.options.helper = this.instance.options._helper, "original" === s.options.helper && this.instance.currentItem.css({ top: "auto", left: "auto" })) : (this.instance.cancelHelperRemoval = !1, this.instance._trigger("deactivate", e, n)) }) }, drag: function (e, i, s) { var n = this; t.each(s.sortables, function () { var o = !1, r = this; this.instance.positionAbs = s.positionAbs, this.instance.helperProportions = s.helperProportions, this.instance.offset.click = s.offset.click, this.instance._intersectsWith(this.instance.containerCache) && (o = !0, t.each(s.sortables, function () { return this.instance.positionAbs = s.positionAbs, this.instance.helperProportions = s.helperProportions, this.instance.offset.click = s.offset.click, this !== r && this.instance._intersectsWith(this.instance.containerCache) && t.contains(r.instance.element[0], this.instance.element[0]) && (o = !1), o })), o ? (this.instance.isOver || (this.instance.isOver = 1, this.instance.currentItem = t(n).clone().removeAttr("id").appendTo(this.instance.element).data("ui-sortable-item", !0), this.instance.options._helper = this.instance.options.helper, this.instance.options.helper = function () { return i.helper[0] }, e.target = this.instance.currentItem[0], this.instance._mouseCapture(e, !0), this.instance._mouseStart(e, !0, !0), this.instance.offset.click.top = s.offset.click.top, this.instance.offset.click.left = s.offset.click.left, this.instance.offset.parent.left -= s.offset.parent.left - this.instance.offset.parent.left, this.instance.offset.parent.top -= s.offset.parent.top - this.instance.offset.parent.top, s._trigger("toSortable", e), s.dropped = this.instance.element, s.currentItem = s.element, this.instance.fromOutside = s), this.instance.currentItem && this.instance._mouseDrag(e)) : this.instance.isOver && (this.instance.isOver = 0, this.instance.cancelHelperRemoval = !0, this.instance.options.revert = !1, this.instance._trigger("out", e, this.instance._uiHash(this.instance)), this.instance._mouseStop(e, !0), this.instance.options.helper = this.instance.options._helper, this.instance.currentItem.remove(), this.instance.placeholder && this.instance.placeholder.remove(), s._trigger("fromSortable", e), s.dropped = !1) }) } }), t.ui.plugin.add("draggable", "cursor", { start: function (e, i, s) { var n = t("body"), o = s.options; n.css("cursor") && (o._cursor = n.css("cursor")), n.css("cursor", o.cursor) }, stop: function (e, i, s) { var n = s.options; n._cursor && t("body").css("cursor", n._cursor) } }), t.ui.plugin.add("draggable", "opacity", { start: function (e, i, s) { var n = t(i.helper), o = s.options; n.css("opacity") && (o._opacity = n.css("opacity")), n.css("opacity", o.opacity) }, stop: function (e, i, s) { var n = s.options; n._opacity && t(i.helper).css("opacity", n._opacity) } }), t.ui.plugin.add("draggable", "scroll", { start: function (t, e, i) { i.scrollParentNotHidden || (i.scrollParentNotHidden = i.helper.scrollParent(!1)), i.scrollParentNotHidden[0] !== i.document[0] && "HTML" !== i.scrollParentNotHidden[0].tagName && (i.overflowOffset = i.scrollParentNotHidden.offset()) }, drag: function (e, i, s) { var n = s.options, o = !1, r = s.scrollParentNotHidden[0], a = s.document[0]; r !== a && "HTML" !== r.tagName ? (n.axis && "x" === n.axis || (s.overflowOffset.top + r.offsetHeight - e.pageY < n.scrollSensitivity ? r.scrollTop = o = r.scrollTop + n.scrollSpeed : e.pageY - s.overflowOffset.top < n.scrollSensitivity && (r.scrollTop = o = r.scrollTop - n.scrollSpeed)), n.axis && "y" === n.axis || (s.overflowOffset.left + r.offsetWidth - e.pageX < n.scrollSensitivity ? r.scrollLeft = o = r.scrollLeft + n.scrollSpeed : e.pageX - s.overflowOffset.left < n.scrollSensitivity && (r.scrollLeft = o = r.scrollLeft - n.scrollSpeed))) : (n.axis && "x" === n.axis || (e.pageY - t(a).scrollTop() < n.scrollSensitivity ? o = t(a).scrollTop(t(a).scrollTop() - n.scrollSpeed) : t(window).height() - (e.pageY - t(a).scrollTop()) < n.scrollSensitivity && (o = t(a).scrollTop(t(a).scrollTop() + n.scrollSpeed))), n.axis && "y" === n.axis || (e.pageX - t(a).scrollLeft() < n.scrollSensitivity ? o = t(a).scrollLeft(t(a).scrollLeft() - n.scrollSpeed) : t(window).width() - (e.pageX - t(a).scrollLeft()) < n.scrollSensitivity && (o = t(a).scrollLeft(t(a).scrollLeft() + n.scrollSpeed)))), o !== !1 && t.ui.ddmanager && !n.dropBehaviour && t.ui.ddmanager.prepareOffsets(s, e) } }), t.ui.plugin.add("draggable", "snap", { start: function (e, i, s) { var n = s.options; s.snapElements = [], t(n.snap.constructor !== String ? n.snap.items || ":data(ui-draggable)" : n.snap).each(function () { var e = t(this), i = e.offset(); this !== s.element[0] && s.snapElements.push({ item: this, width: e.outerWidth(), height: e.outerHeight(), top: i.top, left: i.left }) }) }, drag: function (e, i, s) { var n, o, r, a, l, h, c, p, u, d, f = s.options, g = f.snapTolerance, m = i.offset.left, v = m + s.helperProportions.width, _ = i.offset.top, b = _ + s.helperProportions.height; for (u = s.snapElements.length - 1; u >= 0; u--) l = s.snapElements[u].left, h = l + s.snapElements[u].width, c = s.snapElements[u].top, p = c + s.snapElements[u].height, l - g > v || m > h + g || c - g > b || _ > p + g || !t.contains(s.snapElements[u].item.ownerDocument, s.snapElements[u].item) ? (s.snapElements[u].snapping && s.options.snap.release && s.options.snap.release.call(s.element, e, t.extend(s._uiHash(), { snapItem: s.snapElements[u].item })), s.snapElements[u].snapping = !1) : ("inner" !== f.snapMode && (n = g >= Math.abs(c - b), o = g >= Math.abs(p - _), r = g >= Math.abs(l - v), a = g >= Math.abs(h - m), n && (i.position.top = s._convertPositionTo("relative", { top: c - s.helperProportions.height, left: 0 }).top - s.margins.top), o && (i.position.top = s._convertPositionTo("relative", { top: p, left: 0 }).top - s.margins.top), r && (i.position.left = s._convertPositionTo("relative", { top: 0, left: l - s.helperProportions.width }).left - s.margins.left), a && (i.position.left = s._convertPositionTo("relative", { top: 0, left: h }).left - s.margins.left)), d = n || o || r || a, "outer" !== f.snapMode && (n = g >= Math.abs(c - _), o = g >= Math.abs(p - b), r = g >= Math.abs(l - m), a = g >= Math.abs(h - v), n && (i.position.top = s._convertPositionTo("relative", { top: c, left: 0 }).top - s.margins.top), o && (i.position.top = s._convertPositionTo("relative", { top: p - s.helperProportions.height, left: 0 }).top - s.margins.top), r && (i.position.left = s._convertPositionTo("relative", { top: 0, left: l }).left - s.margins.left), a && (i.position.left = s._convertPositionTo("relative", { top: 0, left: h - s.helperProportions.width }).left - s.margins.left)), !s.snapElements[u].snapping && (n || o || r || a || d) && s.options.snap.snap && s.options.snap.snap.call(s.element, e, t.extend(s._uiHash(), { snapItem: s.snapElements[u].item })), s.snapElements[u].snapping = n || o || r || a || d) } }), t.ui.plugin.add("draggable", "stack", { start: function (e, i, s) { var n, o = s.options, r = t.makeArray(t(o.stack)).sort(function (e, i) { return (parseInt(t(e).css("zIndex"), 10) || 0) - (parseInt(t(i).css("zIndex"), 10) || 0) }); r.length && (n = parseInt(t(r[0]).css("zIndex"), 10) || 0, t(r).each(function (e) { t(this).css("zIndex", n + e) }), this.css("zIndex", n + r.length)) } }), t.ui.plugin.add("draggable", "zIndex", { start: function (e, i, s) { var n = t(i.helper), o = s.options; n.css("zIndex") && (o._zIndex = n.css("zIndex")), n.css("zIndex", o.zIndex) }, stop: function (e, i, s) { var n = s.options; n._zIndex && t(i.helper).css("zIndex", n._zIndex) } }), t.ui.draggable });

//! moment.js
//! version : 2.8.1
//! authors : Tim Wood, Iskren Chernev, Moment.js contributors
//! license : MIT
//! momentjs.com
(function (a) { function b(a, b, c) { switch (arguments.length) { case 2: return null != a ? a : b; case 3: return null != a ? a : null != b ? b : c; default: throw new Error("Implement me") } } function c() { return { empty: !1, unusedTokens: [], unusedInput: [], overflow: -2, charsLeftOver: 0, nullInput: !1, invalidMonth: null, invalidFormat: !1, userInvalidated: !1, iso: !1 } } function d(a) { rb.suppressDeprecationWarnings === !1 && "undefined" != typeof console && console.warn && console.warn("Deprecation warning: " + a) } function e(a, b) { var c = !0; return l(function () { return c && (d(a), c = !1), b.apply(this, arguments) }, b) } function f(a, b) { nc[a] || (d(b), nc[a] = !0) } function g(a, b) { return function (c) { return o(a.call(this, c), b) } } function h(a, b) { return function (c) { return this.localeData().ordinal(a.call(this, c), b) } } function i() { } function j(a, b) { b !== !1 && E(a), m(this, a), this._d = new Date(+a._d) } function k(a) { var b = x(a), c = b.year || 0, d = b.quarter || 0, e = b.month || 0, f = b.week || 0, g = b.day || 0, h = b.hour || 0, i = b.minute || 0, j = b.second || 0, k = b.millisecond || 0; this._milliseconds = +k + 1e3 * j + 6e4 * i + 36e5 * h, this._days = +g + 7 * f, this._months = +e + 3 * d + 12 * c, this._data = {}, this._locale = rb.localeData(), this._bubble() } function l(a, b) { for (var c in b) b.hasOwnProperty(c) && (a[c] = b[c]); return b.hasOwnProperty("toString") && (a.toString = b.toString), b.hasOwnProperty("valueOf") && (a.valueOf = b.valueOf), a } function m(a, b) { var c, d, e; if ("undefined" != typeof b._isAMomentObject && (a._isAMomentObject = b._isAMomentObject), "undefined" != typeof b._i && (a._i = b._i), "undefined" != typeof b._f && (a._f = b._f), "undefined" != typeof b._l && (a._l = b._l), "undefined" != typeof b._strict && (a._strict = b._strict), "undefined" != typeof b._tzm && (a._tzm = b._tzm), "undefined" != typeof b._isUTC && (a._isUTC = b._isUTC), "undefined" != typeof b._offset && (a._offset = b._offset), "undefined" != typeof b._pf && (a._pf = b._pf), "undefined" != typeof b._locale && (a._locale = b._locale), Fb.length > 0) for (c in Fb) d = Fb[c], e = b[d], "undefined" != typeof e && (a[d] = e); return a } function n(a) { return 0 > a ? Math.ceil(a) : Math.floor(a) } function o(a, b, c) { for (var d = "" + Math.abs(a), e = a >= 0; d.length < b;) d = "0" + d; return (e ? c ? "+" : "" : "-") + d } function p(a, b) { var c = { milliseconds: 0, months: 0 }; return c.months = b.month() - a.month() + 12 * (b.year() - a.year()), a.clone().add(c.months, "M").isAfter(b) && --c.months, c.milliseconds = +b - +a.clone().add(c.months, "M"), c } function q(a, b) { var c; return b = J(b, a), a.isBefore(b) ? c = p(a, b) : (c = p(b, a), c.milliseconds = -c.milliseconds, c.months = -c.months), c } function r(a, b) { return function (c, d) { var e, g; return null === d || isNaN(+d) || (f(b, "moment()." + b + "(period, number) is deprecated. Please use moment()." + b + "(number, period)."), g = c, c = d, d = g), c = "string" == typeof c ? +c : c, e = rb.duration(c, d), s(this, e, a), this } } function s(a, b, c, d) { var e = b._milliseconds, f = b._days, g = b._months; d = null == d ? !0 : d, e && a._d.setTime(+a._d + e * c), f && lb(a, "Date", kb(a, "Date") + f * c), g && jb(a, kb(a, "Month") + g * c), d && rb.updateOffset(a, f || g) } function t(a) { return "[object Array]" === Object.prototype.toString.call(a) } function u(a) { return "[object Date]" === Object.prototype.toString.call(a) || a instanceof Date } function v(a, b, c) { var d, e = Math.min(a.length, b.length), f = Math.abs(a.length - b.length), g = 0; for (d = 0; e > d; d++) (c && a[d] !== b[d] || !c && z(a[d]) !== z(b[d])) && g++; return g + f } function w(a) { if (a) { var b = a.toLowerCase().replace(/(.)s$/, "$1"); a = gc[a] || hc[b] || b } return a } function x(a) { var b, c, d = {}; for (c in a) a.hasOwnProperty(c) && (b = w(c), b && (d[b] = a[c])); return d } function y(b) { var c, d; if (0 === b.indexOf("week")) c = 7, d = "day"; else { if (0 !== b.indexOf("month")) return; c = 12, d = "month" } rb[b] = function (e, f) { var g, h, i = rb._locale[b], j = []; if ("number" == typeof e && (f = e, e = a), h = function (a) { var b = rb().utc().set(d, a); return i.call(rb._locale, b, e || "") }, null != f) return h(f); for (g = 0; c > g; g++) j.push(h(g)); return j } } function z(a) { var b = +a, c = 0; return 0 !== b && isFinite(b) && (c = b >= 0 ? Math.floor(b) : Math.ceil(b)), c } function A(a, b) { return new Date(Date.UTC(a, b + 1, 0)).getUTCDate() } function B(a, b, c) { return fb(rb([a, 11, 31 + b - c]), b, c).week } function C(a) { return D(a) ? 366 : 365 } function D(a) { return a % 4 === 0 && a % 100 !== 0 || a % 400 === 0 } function E(a) { var b; a._a && -2 === a._pf.overflow && (b = a._a[yb] < 0 || a._a[yb] > 11 ? yb : a._a[zb] < 1 || a._a[zb] > A(a._a[xb], a._a[yb]) ? zb : a._a[Ab] < 0 || a._a[Ab] > 23 ? Ab : a._a[Bb] < 0 || a._a[Bb] > 59 ? Bb : a._a[Cb] < 0 || a._a[Cb] > 59 ? Cb : a._a[Db] < 0 || a._a[Db] > 999 ? Db : -1, a._pf._overflowDayOfYear && (xb > b || b > zb) && (b = zb), a._pf.overflow = b) } function F(a) { return null == a._isValid && (a._isValid = !isNaN(a._d.getTime()) && a._pf.overflow < 0 && !a._pf.empty && !a._pf.invalidMonth && !a._pf.nullInput && !a._pf.invalidFormat && !a._pf.userInvalidated, a._strict && (a._isValid = a._isValid && 0 === a._pf.charsLeftOver && 0 === a._pf.unusedTokens.length)), a._isValid } function G(a) { return a ? a.toLowerCase().replace("_", "-") : a } function H(a) { for (var b, c, d, e, f = 0; f < a.length;) { for (e = G(a[f]).split("-"), b = e.length, c = G(a[f + 1]), c = c ? c.split("-") : null; b > 0;) { if (d = I(e.slice(0, b).join("-"))) return d; if (c && c.length >= b && v(e, c, !0) >= b - 1) break; b-- } f++ } return null } function I(a) { var b = null; if (!Eb[a] && Gb) try { b = rb.locale(), require("./locale/" + a), rb.locale(b) } catch (c) { } return Eb[a] } function J(a, b) { return b._isUTC ? rb(a).zone(b._offset || 0) : rb(a).local() } function K(a) { return a.match(/\[[\s\S]/) ? a.replace(/^\[|\]$/g, "") : a.replace(/\\/g, "") } function L(a) { var b, c, d = a.match(Kb); for (b = 0, c = d.length; c > b; b++) d[b] = mc[d[b]] ? mc[d[b]] : K(d[b]); return function (e) { var f = ""; for (b = 0; c > b; b++) f += d[b] instanceof Function ? d[b].call(e, a) : d[b]; return f } } function M(a, b) { return a.isValid() ? (b = N(b, a.localeData()), ic[b] || (ic[b] = L(b)), ic[b](a)) : a.localeData().invalidDate() } function N(a, b) { function c(a) { return b.longDateFormat(a) || a } var d = 5; for (Lb.lastIndex = 0; d >= 0 && Lb.test(a) ;) a = a.replace(Lb, c), Lb.lastIndex = 0, d -= 1; return a } function O(a, b) { var c, d = b._strict; switch (a) { case "Q": return Wb; case "DDDD": return Yb; case "YYYY": case "GGGG": case "gggg": return d ? Zb : Ob; case "Y": case "G": case "g": return _b; case "YYYYYY": case "YYYYY": case "GGGGG": case "ggggg": return d ? $b : Pb; case "S": if (d) return Wb; case "SS": if (d) return Xb; case "SSS": if (d) return Yb; case "DDD": return Nb; case "MMM": case "MMMM": case "dd": case "ddd": case "dddd": return Rb; case "a": case "A": return b._locale._meridiemParse; case "X": return Ub; case "Z": case "ZZ": return Sb; case "T": return Tb; case "SSSS": return Qb; case "MM": case "DD": case "YY": case "GG": case "gg": case "HH": case "hh": case "mm": case "ss": case "ww": case "WW": return d ? Xb : Mb; case "M": case "D": case "d": case "H": case "h": case "m": case "s": case "w": case "W": case "e": case "E": return Mb; case "Do": return Vb; default: return c = new RegExp(X(W(a.replace("\\", "")), "i")) } } function P(a) { a = a || ""; var b = a.match(Sb) || [], c = b[b.length - 1] || [], d = (c + "").match(ec) || ["-", 0, 0], e = +(60 * d[1]) + z(d[2]); return "+" === d[0] ? -e : e } function Q(a, b, c) { var d, e = c._a; switch (a) { case "Q": null != b && (e[yb] = 3 * (z(b) - 1)); break; case "M": case "MM": null != b && (e[yb] = z(b) - 1); break; case "MMM": case "MMMM": d = c._locale.monthsParse(b), null != d ? e[yb] = d : c._pf.invalidMonth = b; break; case "D": case "DD": null != b && (e[zb] = z(b)); break; case "Do": null != b && (e[zb] = z(parseInt(b, 10))); break; case "DDD": case "DDDD": null != b && (c._dayOfYear = z(b)); break; case "YY": e[xb] = rb.parseTwoDigitYear(b); break; case "YYYY": case "YYYYY": case "YYYYYY": e[xb] = z(b); break; case "a": case "A": c._isPm = c._locale.isPM(b); break; case "H": case "HH": case "h": case "hh": e[Ab] = z(b); break; case "m": case "mm": e[Bb] = z(b); break; case "s": case "ss": e[Cb] = z(b); break; case "S": case "SS": case "SSS": case "SSSS": e[Db] = z(1e3 * ("0." + b)); break; case "X": c._d = new Date(1e3 * parseFloat(b)); break; case "Z": case "ZZ": c._useUTC = !0, c._tzm = P(b); break; case "dd": case "ddd": case "dddd": d = c._locale.weekdaysParse(b), null != d ? (c._w = c._w || {}, c._w.d = d) : c._pf.invalidWeekday = b; break; case "w": case "ww": case "W": case "WW": case "d": case "e": case "E": a = a.substr(0, 1); case "gggg": case "GGGG": case "GGGGG": a = a.substr(0, 2), b && (c._w = c._w || {}, c._w[a] = z(b)); break; case "gg": case "GG": c._w = c._w || {}, c._w[a] = rb.parseTwoDigitYear(b) } } function R(a) { var c, d, e, f, g, h, i; c = a._w, null != c.GG || null != c.W || null != c.E ? (g = 1, h = 4, d = b(c.GG, a._a[xb], fb(rb(), 1, 4).year), e = b(c.W, 1), f = b(c.E, 1)) : (g = a._locale._week.dow, h = a._locale._week.doy, d = b(c.gg, a._a[xb], fb(rb(), g, h).year), e = b(c.w, 1), null != c.d ? (f = c.d, g > f && ++e) : f = null != c.e ? c.e + g : g), i = gb(d, e, f, h, g), a._a[xb] = i.year, a._dayOfYear = i.dayOfYear } function S(a) { var c, d, e, f, g = []; if (!a._d) { for (e = U(a), a._w && null == a._a[zb] && null == a._a[yb] && R(a), a._dayOfYear && (f = b(a._a[xb], e[xb]), a._dayOfYear > C(f) && (a._pf._overflowDayOfYear = !0), d = bb(f, 0, a._dayOfYear), a._a[yb] = d.getUTCMonth(), a._a[zb] = d.getUTCDate()), c = 0; 3 > c && null == a._a[c]; ++c) a._a[c] = g[c] = e[c]; for (; 7 > c; c++) a._a[c] = g[c] = null == a._a[c] ? 2 === c ? 1 : 0 : a._a[c]; a._d = (a._useUTC ? bb : ab).apply(null, g), null != a._tzm && a._d.setUTCMinutes(a._d.getUTCMinutes() + a._tzm) } } function T(a) { var b; a._d || (b = x(a._i), a._a = [b.year, b.month, b.day, b.hour, b.minute, b.second, b.millisecond], S(a)) } function U(a) { var b = new Date; return a._useUTC ? [b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate()] : [b.getFullYear(), b.getMonth(), b.getDate()] } function V(a) { if (a._f === rb.ISO_8601) return void Z(a); a._a = [], a._pf.empty = !0; var b, c, d, e, f, g = "" + a._i, h = g.length, i = 0; for (d = N(a._f, a._locale).match(Kb) || [], b = 0; b < d.length; b++) e = d[b], c = (g.match(O(e, a)) || [])[0], c && (f = g.substr(0, g.indexOf(c)), f.length > 0 && a._pf.unusedInput.push(f), g = g.slice(g.indexOf(c) + c.length), i += c.length), mc[e] ? (c ? a._pf.empty = !1 : a._pf.unusedTokens.push(e), Q(e, c, a)) : a._strict && !c && a._pf.unusedTokens.push(e); a._pf.charsLeftOver = h - i, g.length > 0 && a._pf.unusedInput.push(g), a._isPm && a._a[Ab] < 12 && (a._a[Ab] += 12), a._isPm === !1 && 12 === a._a[Ab] && (a._a[Ab] = 0), S(a), E(a) } function W(a) { return a.replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g, function (a, b, c, d, e) { return b || c || d || e }) } function X(a) { return a.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&") } function Y(a) { var b, d, e, f, g; if (0 === a._f.length) return a._pf.invalidFormat = !0, void (a._d = new Date(0 / 0)); for (f = 0; f < a._f.length; f++) g = 0, b = m({}, a), b._pf = c(), b._f = a._f[f], V(b), F(b) && (g += b._pf.charsLeftOver, g += 10 * b._pf.unusedTokens.length, b._pf.score = g, (null == e || e > g) && (e = g, d = b)); l(a, d || b) } function Z(a) { var b, c, d = a._i, e = ac.exec(d); if (e) { for (a._pf.iso = !0, b = 0, c = cc.length; c > b; b++) if (cc[b][1].exec(d)) { a._f = cc[b][0] + (e[6] || " "); break } for (b = 0, c = dc.length; c > b; b++) if (dc[b][1].exec(d)) { a._f += dc[b][0]; break } d.match(Sb) && (a._f += "Z"), V(a) } else a._isValid = !1 } function $(a) { Z(a), a._isValid === !1 && (delete a._isValid, rb.createFromInputFallback(a)) } function _(b) { var c, d = b._i; d === a ? b._d = new Date : u(d) ? b._d = new Date(+d) : null !== (c = Hb.exec(d)) ? b._d = new Date(+c[1]) : "string" == typeof d ? $(b) : t(d) ? (b._a = d.slice(0), S(b)) : "object" == typeof d ? T(b) : "number" == typeof d ? b._d = new Date(d) : rb.createFromInputFallback(b) } function ab(a, b, c, d, e, f, g) { var h = new Date(a, b, c, d, e, f, g); return 1970 > a && h.setFullYear(a), h } function bb(a) { var b = new Date(Date.UTC.apply(null, arguments)); return 1970 > a && b.setUTCFullYear(a), b } function cb(a, b) { if ("string" == typeof a) if (isNaN(a)) { if (a = b.weekdaysParse(a), "number" != typeof a) return null } else a = parseInt(a, 10); return a } function db(a, b, c, d, e) { return e.relativeTime(b || 1, !!c, a, d) } function eb(a, b, c) { var d = rb.duration(a).abs(), e = wb(d.as("s")), f = wb(d.as("m")), g = wb(d.as("h")), h = wb(d.as("d")), i = wb(d.as("M")), j = wb(d.as("y")), k = e < jc.s && ["s", e] || 1 === f && ["m"] || f < jc.m && ["mm", f] || 1 === g && ["h"] || g < jc.h && ["hh", g] || 1 === h && ["d"] || h < jc.d && ["dd", h] || 1 === i && ["M"] || i < jc.M && ["MM", i] || 1 === j && ["y"] || ["yy", j]; return k[2] = b, k[3] = +a > 0, k[4] = c, db.apply({}, k) } function fb(a, b, c) { var d, e = c - b, f = c - a.day(); return f > e && (f -= 7), e - 7 > f && (f += 7), d = rb(a).add(f, "d"), { week: Math.ceil(d.dayOfYear() / 7), year: d.year() } } function gb(a, b, c, d, e) { var f, g, h = bb(a, 0, 1).getUTCDay(); return h = 0 === h ? 7 : h, c = null != c ? c : e, f = e - h + (h > d ? 7 : 0) - (e > h ? 7 : 0), g = 7 * (b - 1) + (c - e) + f + 1, { year: g > 0 ? a : a - 1, dayOfYear: g > 0 ? g : C(a - 1) + g } } function hb(b) { var c = b._i, d = b._f; return b._locale = b._locale || rb.localeData(b._l), null === c || d === a && "" === c ? rb.invalid({ nullInput: !0 }) : ("string" == typeof c && (b._i = c = b._locale.preparse(c)), rb.isMoment(c) ? new j(c, !0) : (d ? t(d) ? Y(b) : V(b) : _(b), new j(b))) } function ib(a, b) { var c, d; if (1 === b.length && t(b[0]) && (b = b[0]), !b.length) return rb(); for (c = b[0], d = 1; d < b.length; ++d) b[d][a](c) && (c = b[d]); return c } function jb(a, b) { var c; return "string" == typeof b && (b = a.localeData().monthsParse(b), "number" != typeof b) ? a : (c = Math.min(a.date(), A(a.year(), b)), a._d["set" + (a._isUTC ? "UTC" : "") + "Month"](b, c), a) } function kb(a, b) { return a._d["get" + (a._isUTC ? "UTC" : "") + b]() } function lb(a, b, c) { return "Month" === b ? jb(a, c) : a._d["set" + (a._isUTC ? "UTC" : "") + b](c) } function mb(a, b) { return function (c) { return null != c ? (lb(this, a, c), rb.updateOffset(this, b), this) : kb(this, a) } } function nb(a) { return 400 * a / 146097 } function ob(a) { return 146097 * a / 400 } function pb(a) { rb.duration.fn[a] = function () { return this._data[a] } } function qb(a) { "undefined" == typeof ender && (sb = vb.moment, vb.moment = a ? e("Accessing Moment through the global scope is deprecated, and will be removed in an upcoming release.", rb) : rb) } for (var rb, sb, tb, ub = "2.8.1", vb = "undefined" != typeof global ? global : this, wb = Math.round, xb = 0, yb = 1, zb = 2, Ab = 3, Bb = 4, Cb = 5, Db = 6, Eb = {}, Fb = [], Gb = "undefined" != typeof module && module.exports, Hb = /^\/?Date\((\-?\d+)/i, Ib = /(\-)?(?:(\d*)\.)?(\d+)\:(\d+)(?:\:(\d+)\.?(\d{3})?)?/, Jb = /^(-)?P(?:(?:([0-9,.]*)Y)?(?:([0-9,.]*)M)?(?:([0-9,.]*)D)?(?:T(?:([0-9,.]*)H)?(?:([0-9,.]*)M)?(?:([0-9,.]*)S)?)?|([0-9,.]*)W)$/, Kb = /(\[[^\[]*\])|(\\)?(Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Q|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|mm?|ss?|S{1,4}|X|zz?|ZZ?|.)/g, Lb = /(\[[^\[]*\])|(\\)?(LT|LL?L?L?|l{1,4})/g, Mb = /\d\d?/, Nb = /\d{1,3}/, Ob = /\d{1,4}/, Pb = /[+\-]?\d{1,6}/, Qb = /\d+/, Rb = /[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i, Sb = /Z|[\+\-]\d\d:?\d\d/gi, Tb = /T/i, Ub = /[\+\-]?\d+(\.\d{1,3})?/, Vb = /\d{1,2}/, Wb = /\d/, Xb = /\d\d/, Yb = /\d{3}/, Zb = /\d{4}/, $b = /[+-]?\d{6}/, _b = /[+-]?\d+/, ac = /^\s*(?:[+-]\d{6}|\d{4})-(?:(\d\d-\d\d)|(W\d\d$)|(W\d\d-\d)|(\d\d\d))((T| )(\d\d(:\d\d(:\d\d(\.\d+)?)?)?)?([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/, bc = "YYYY-MM-DDTHH:mm:ssZ", cc = [["YYYYYY-MM-DD", /[+-]\d{6}-\d{2}-\d{2}/], ["YYYY-MM-DD", /\d{4}-\d{2}-\d{2}/], ["GGGG-[W]WW-E", /\d{4}-W\d{2}-\d/], ["GGGG-[W]WW", /\d{4}-W\d{2}/], ["YYYY-DDD", /\d{4}-\d{3}/]], dc = [["HH:mm:ss.SSSS", /(T| )\d\d:\d\d:\d\d\.\d+/], ["HH:mm:ss", /(T| )\d\d:\d\d:\d\d/], ["HH:mm", /(T| )\d\d:\d\d/], ["HH", /(T| )\d\d/]], ec = /([\+\-]|\d\d)/gi, fc = ("Date|Hours|Minutes|Seconds|Milliseconds".split("|"), { Milliseconds: 1, Seconds: 1e3, Minutes: 6e4, Hours: 36e5, Days: 864e5, Months: 2592e6, Years: 31536e6 }), gc = { ms: "millisecond", s: "second", m: "minute", h: "hour", d: "day", D: "date", w: "week", W: "isoWeek", M: "month", Q: "quarter", y: "year", DDD: "dayOfYear", e: "weekday", E: "isoWeekday", gg: "weekYear", GG: "isoWeekYear" }, hc = { dayofyear: "dayOfYear", isoweekday: "isoWeekday", isoweek: "isoWeek", weekyear: "weekYear", isoweekyear: "isoWeekYear" }, ic = {}, jc = { s: 45, m: 45, h: 22, d: 26, M: 11 }, kc = "DDD w W M D d".split(" "), lc = "M D H h m s w W".split(" "), mc = { M: function () { return this.month() + 1 }, MMM: function (a) { return this.localeData().monthsShort(this, a) }, MMMM: function (a) { return this.localeData().months(this, a) }, D: function () { return this.date() }, DDD: function () { return this.dayOfYear() }, d: function () { return this.day() }, dd: function (a) { return this.localeData().weekdaysMin(this, a) }, ddd: function (a) { return this.localeData().weekdaysShort(this, a) }, dddd: function (a) { return this.localeData().weekdays(this, a) }, w: function () { return this.week() }, W: function () { return this.isoWeek() }, YY: function () { return o(this.year() % 100, 2) }, YYYY: function () { return o(this.year(), 4) }, YYYYY: function () { return o(this.year(), 5) }, YYYYYY: function () { var a = this.year(), b = a >= 0 ? "+" : "-"; return b + o(Math.abs(a), 6) }, gg: function () { return o(this.weekYear() % 100, 2) }, gggg: function () { return o(this.weekYear(), 4) }, ggggg: function () { return o(this.weekYear(), 5) }, GG: function () { return o(this.isoWeekYear() % 100, 2) }, GGGG: function () { return o(this.isoWeekYear(), 4) }, GGGGG: function () { return o(this.isoWeekYear(), 5) }, e: function () { return this.weekday() }, E: function () { return this.isoWeekday() }, a: function () { return this.localeData().meridiem(this.hours(), this.minutes(), !0) }, A: function () { return this.localeData().meridiem(this.hours(), this.minutes(), !1) }, H: function () { return this.hours() }, h: function () { return this.hours() % 12 || 12 }, m: function () { return this.minutes() }, s: function () { return this.seconds() }, S: function () { return z(this.milliseconds() / 100) }, SS: function () { return o(z(this.milliseconds() / 10), 2) }, SSS: function () { return o(this.milliseconds(), 3) }, SSSS: function () { return o(this.milliseconds(), 3) }, Z: function () { var a = -this.zone(), b = "+"; return 0 > a && (a = -a, b = "-"), b + o(z(a / 60), 2) + ":" + o(z(a) % 60, 2) }, ZZ: function () { var a = -this.zone(), b = "+"; return 0 > a && (a = -a, b = "-"), b + o(z(a / 60), 2) + o(z(a) % 60, 2) }, z: function () { return this.zoneAbbr() }, zz: function () { return this.zoneName() }, X: function () { return this.unix() }, Q: function () { return this.quarter() } }, nc = {}, oc = ["months", "monthsShort", "weekdays", "weekdaysShort", "weekdaysMin"]; kc.length;) tb = kc.pop(), mc[tb + "o"] = h(mc[tb], tb); for (; lc.length;) tb = lc.pop(), mc[tb + tb] = g(mc[tb], 2); mc.DDDD = g(mc.DDD, 3), l(i.prototype, { set: function (a) { var b, c; for (c in a) b = a[c], "function" == typeof b ? this[c] = b : this["_" + c] = b }, _months: "January_February_March_April_May_June_July_August_September_October_November_December".split("_"), months: function (a) { return this._months[a.month()] }, _monthsShort: "Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"), monthsShort: function (a) { return this._monthsShort[a.month()] }, monthsParse: function (a) { var b, c, d; for (this._monthsParse || (this._monthsParse = []), b = 0; 12 > b; b++) if (this._monthsParse[b] || (c = rb.utc([2e3, b]), d = "^" + this.months(c, "") + "|^" + this.monthsShort(c, ""), this._monthsParse[b] = new RegExp(d.replace(".", ""), "i")), this._monthsParse[b].test(a)) return b }, _weekdays: "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"), weekdays: function (a) { return this._weekdays[a.day()] }, _weekdaysShort: "Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"), weekdaysShort: function (a) { return this._weekdaysShort[a.day()] }, _weekdaysMin: "Su_Mo_Tu_We_Th_Fr_Sa".split("_"), weekdaysMin: function (a) { return this._weekdaysMin[a.day()] }, weekdaysParse: function (a) { var b, c, d; for (this._weekdaysParse || (this._weekdaysParse = []), b = 0; 7 > b; b++) if (this._weekdaysParse[b] || (c = rb([2e3, 1]).day(b), d = "^" + this.weekdays(c, "") + "|^" + this.weekdaysShort(c, "") + "|^" + this.weekdaysMin(c, ""), this._weekdaysParse[b] = new RegExp(d.replace(".", ""), "i")), this._weekdaysParse[b].test(a)) return b }, _longDateFormat: { LT: "h:mm A", L: "MM/DD/YYYY", LL: "MMMM D, YYYY", LLL: "MMMM D, YYYY LT", LLLL: "dddd, MMMM D, YYYY LT" }, longDateFormat: function (a) { var b = this._longDateFormat[a]; return !b && this._longDateFormat[a.toUpperCase()] && (b = this._longDateFormat[a.toUpperCase()].replace(/MMMM|MM|DD|dddd/g, function (a) { return a.slice(1) }), this._longDateFormat[a] = b), b }, isPM: function (a) { return "p" === (a + "").toLowerCase().charAt(0) }, _meridiemParse: /[ap]\.?m?\.?/i, meridiem: function (a, b, c) { return a > 11 ? c ? "pm" : "PM" : c ? "am" : "AM" }, _calendar: { sameDay: "[Today at] LT", nextDay: "[Tomorrow at] LT", nextWeek: "dddd [at] LT", lastDay: "[Yesterday at] LT", lastWeek: "[Last] dddd [at] LT", sameElse: "L" }, calendar: function (a, b) { var c = this._calendar[a]; return "function" == typeof c ? c.apply(b) : c }, _relativeTime: { future: "in %s", past: "%s ago", s: "a few seconds", m: "a minute", mm: "%d minutes", h: "an hour", hh: "%d hours", d: "a day", dd: "%d days", M: "a month", MM: "%d months", y: "a year", yy: "%d years" }, relativeTime: function (a, b, c, d) { var e = this._relativeTime[c]; return "function" == typeof e ? e(a, b, c, d) : e.replace(/%d/i, a) }, pastFuture: function (a, b) { var c = this._relativeTime[a > 0 ? "future" : "past"]; return "function" == typeof c ? c(b) : c.replace(/%s/i, b) }, ordinal: function (a) { return this._ordinal.replace("%d", a) }, _ordinal: "%d", preparse: function (a) { return a }, postformat: function (a) { return a }, week: function (a) { return fb(a, this._week.dow, this._week.doy).week }, _week: { dow: 0, doy: 6 }, _invalidDate: "Invalid date", invalidDate: function () { return this._invalidDate } }), rb = function (b, d, e, f) { var g; return "boolean" == typeof e && (f = e, e = a), g = {}, g._isAMomentObject = !0, g._i = b, g._f = d, g._l = e, g._strict = f, g._isUTC = !1, g._pf = c(), hb(g) }, rb.suppressDeprecationWarnings = !1, rb.createFromInputFallback = e("moment construction falls back to js Date. This is discouraged and will be removed in upcoming major release. Please refer to https://github.com/moment/moment/issues/1407 for more info.", function (a) { a._d = new Date(a._i) }), rb.min = function () { var a = [].slice.call(arguments, 0); return ib("isBefore", a) }, rb.max = function () { var a = [].slice.call(arguments, 0); return ib("isAfter", a) }, rb.utc = function (b, d, e, f) { var g; return "boolean" == typeof e && (f = e, e = a), g = {}, g._isAMomentObject = !0, g._useUTC = !0, g._isUTC = !0, g._l = e, g._i = b, g._f = d, g._strict = f, g._pf = c(), hb(g).utc() }, rb.unix = function (a) { return rb(1e3 * a) }, rb.duration = function (a, b) { var c, d, e, f, g = a, h = null; return rb.isDuration(a) ? g = { ms: a._milliseconds, d: a._days, M: a._months } : "number" == typeof a ? (g = {}, b ? g[b] = a : g.milliseconds = a) : (h = Ib.exec(a)) ? (c = "-" === h[1] ? -1 : 1, g = { y: 0, d: z(h[zb]) * c, h: z(h[Ab]) * c, m: z(h[Bb]) * c, s: z(h[Cb]) * c, ms: z(h[Db]) * c }) : (h = Jb.exec(a)) ? (c = "-" === h[1] ? -1 : 1, e = function (a) { var b = a && parseFloat(a.replace(",", ".")); return (isNaN(b) ? 0 : b) * c }, g = { y: e(h[2]), M: e(h[3]), d: e(h[4]), h: e(h[5]), m: e(h[6]), s: e(h[7]), w: e(h[8]) }) : "object" == typeof g && ("from" in g || "to" in g) && (f = q(rb(g.from), rb(g.to)), g = {}, g.ms = f.milliseconds, g.M = f.months), d = new k(g), rb.isDuration(a) && a.hasOwnProperty("_locale") && (d._locale = a._locale), d }, rb.version = ub, rb.defaultFormat = bc, rb.ISO_8601 = function () { }, rb.momentProperties = Fb, rb.updateOffset = function () { }, rb.relativeTimeThreshold = function (b, c) { return jc[b] === a ? !1 : c === a ? jc[b] : (jc[b] = c, !0) }, rb.lang = e("moment.lang is deprecated. Use moment.locale instead.", function (a, b) { return rb.locale(a, b) }), rb.locale = function (a, b) { var c; return a && (c = "undefined" != typeof b ? rb.defineLocale(a, b) : rb.localeData(a), c && (rb.duration._locale = rb._locale = c)), rb._locale._abbr }, rb.defineLocale = function (a, b) { return null !== b ? (b.abbr = a, Eb[a] || (Eb[a] = new i), Eb[a].set(b), rb.locale(a), Eb[a]) : (delete Eb[a], null) }, rb.langData = e("moment.langData is deprecated. Use moment.localeData instead.", function (a) { return rb.localeData(a) }), rb.localeData = function (a) { var b; if (a && a._locale && a._locale._abbr && (a = a._locale._abbr), !a) return rb._locale; if (!t(a)) { if (b = I(a)) return b; a = [a] } return H(a) }, rb.isMoment = function (a) { return a instanceof j || null != a && a.hasOwnProperty("_isAMomentObject") }, rb.isDuration = function (a) { return a instanceof k }; for (tb = oc.length - 1; tb >= 0; --tb) y(oc[tb]); rb.normalizeUnits = function (a) { return w(a) }, rb.invalid = function (a) { var b = rb.utc(0 / 0); return null != a ? l(b._pf, a) : b._pf.userInvalidated = !0, b }, rb.parseZone = function () { return rb.apply(null, arguments).parseZone() }, rb.parseTwoDigitYear = function (a) { return z(a) + (z(a) > 68 ? 1900 : 2e3) }, l(rb.fn = j.prototype, { clone: function () { return rb(this) }, valueOf: function () { return +this._d + 6e4 * (this._offset || 0) }, unix: function () { return Math.floor(+this / 1e3) }, toString: function () { return this.clone().locale("en").format("ddd MMM DD YYYY HH:mm:ss [GMT]ZZ") }, toDate: function () { return this._offset ? new Date(+this) : this._d }, toISOString: function () { var a = rb(this).utc(); return 0 < a.year() && a.year() <= 9999 ? M(a, "YYYY-MM-DD[T]HH:mm:ss.SSS[Z]") : M(a, "YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]") }, toArray: function () { var a = this; return [a.year(), a.month(), a.date(), a.hours(), a.minutes(), a.seconds(), a.milliseconds()] }, isValid: function () { return F(this) }, isDSTShifted: function () { return this._a ? this.isValid() && v(this._a, (this._isUTC ? rb.utc(this._a) : rb(this._a)).toArray()) > 0 : !1 }, parsingFlags: function () { return l({}, this._pf) }, invalidAt: function () { return this._pf.overflow }, utc: function (a) { return this.zone(0, a) }, local: function (a) { return this._isUTC && (this.zone(0, a), this._isUTC = !1, a && this.add(this._d.getTimezoneOffset(), "m")), this }, format: function (a) { var b = M(this, a || rb.defaultFormat); return this.localeData().postformat(b) }, add: r(1, "add"), subtract: r(-1, "subtract"), diff: function (a, b, c) { var d, e, f = J(a, this), g = 6e4 * (this.zone() - f.zone()); return b = w(b), "year" === b || "month" === b ? (d = 432e5 * (this.daysInMonth() + f.daysInMonth()), e = 12 * (this.year() - f.year()) + (this.month() - f.month()), e += (this - rb(this).startOf("month") - (f - rb(f).startOf("month"))) / d, e -= 6e4 * (this.zone() - rb(this).startOf("month").zone() - (f.zone() - rb(f).startOf("month").zone())) / d, "year" === b && (e /= 12)) : (d = this - f, e = "second" === b ? d / 1e3 : "minute" === b ? d / 6e4 : "hour" === b ? d / 36e5 : "day" === b ? (d - g) / 864e5 : "week" === b ? (d - g) / 6048e5 : d), c ? e : n(e) }, from: function (a, b) { return rb.duration({ to: this, from: a }).locale(this.locale()).humanize(!b) }, fromNow: function (a) { return this.from(rb(), a) }, calendar: function (a) { var b = a || rb(), c = J(b, this).startOf("day"), d = this.diff(c, "days", !0), e = -6 > d ? "sameElse" : -1 > d ? "lastWeek" : 0 > d ? "lastDay" : 1 > d ? "sameDay" : 2 > d ? "nextDay" : 7 > d ? "nextWeek" : "sameElse"; return this.format(this.localeData().calendar(e, this)) }, isLeapYear: function () { return D(this.year()) }, isDST: function () { return this.zone() < this.clone().month(0).zone() || this.zone() < this.clone().month(5).zone() }, day: function (a) { var b = this._isUTC ? this._d.getUTCDay() : this._d.getDay(); return null != a ? (a = cb(a, this.localeData()), this.add(a - b, "d")) : b }, month: mb("Month", !0), startOf: function (a) { switch (a = w(a)) { case "year": this.month(0); case "quarter": case "month": this.date(1); case "week": case "isoWeek": case "day": this.hours(0); case "hour": this.minutes(0); case "minute": this.seconds(0); case "second": this.milliseconds(0) } return "week" === a ? this.weekday(0) : "isoWeek" === a && this.isoWeekday(1), "quarter" === a && this.month(3 * Math.floor(this.month() / 3)), this }, endOf: function (a) { return a = w(a), this.startOf(a).add(1, "isoWeek" === a ? "week" : a).subtract(1, "ms") }, isAfter: function (a, b) { return b = "undefined" != typeof b ? b : "millisecond", +this.clone().startOf(b) > +rb(a).startOf(b) }, isBefore: function (a, b) { return b = "undefined" != typeof b ? b : "millisecond", +this.clone().startOf(b) < +rb(a).startOf(b) }, isSame: function (a, b) { return b = b || "ms", +this.clone().startOf(b) === +J(a, this).startOf(b) }, min: e("moment().min is deprecated, use moment.min instead. https://github.com/moment/moment/issues/1548", function (a) { return a = rb.apply(null, arguments), this > a ? this : a }), max: e("moment().max is deprecated, use moment.max instead. https://github.com/moment/moment/issues/1548", function (a) { return a = rb.apply(null, arguments), a > this ? this : a }), zone: function (a, b) { var c, d = this._offset || 0; return null == a ? this._isUTC ? d : this._d.getTimezoneOffset() : ("string" == typeof a && (a = P(a)), Math.abs(a) < 16 && (a = 60 * a), !this._isUTC && b && (c = this._d.getTimezoneOffset()), this._offset = a, this._isUTC = !0, null != c && this.subtract(c, "m"), d !== a && (!b || this._changeInProgress ? s(this, rb.duration(d - a, "m"), 1, !1) : this._changeInProgress || (this._changeInProgress = !0, rb.updateOffset(this, !0), this._changeInProgress = null)), this) }, zoneAbbr: function () { return this._isUTC ? "UTC" : "" }, zoneName: function () { return this._isUTC ? "Coordinated Universal Time" : "" }, parseZone: function () { return this._tzm ? this.zone(this._tzm) : "string" == typeof this._i && this.zone(this._i), this }, hasAlignedHourOffset: function (a) { return a = a ? rb(a).zone() : 0, (this.zone() - a) % 60 === 0 }, daysInMonth: function () { return A(this.year(), this.month()) }, dayOfYear: function (a) { var b = wb((rb(this).startOf("day") - rb(this).startOf("year")) / 864e5) + 1; return null == a ? b : this.add(a - b, "d") }, quarter: function (a) { return null == a ? Math.ceil((this.month() + 1) / 3) : this.month(3 * (a - 1) + this.month() % 3) }, weekYear: function (a) { var b = fb(this, this.localeData()._week.dow, this.localeData()._week.doy).year; return null == a ? b : this.add(a - b, "y") }, isoWeekYear: function (a) { var b = fb(this, 1, 4).year; return null == a ? b : this.add(a - b, "y") }, week: function (a) { var b = this.localeData().week(this); return null == a ? b : this.add(7 * (a - b), "d") }, isoWeek: function (a) { var b = fb(this, 1, 4).week; return null == a ? b : this.add(7 * (a - b), "d") }, weekday: function (a) { var b = (this.day() + 7 - this.localeData()._week.dow) % 7; return null == a ? b : this.add(a - b, "d") }, isoWeekday: function (a) { return null == a ? this.day() || 7 : this.day(this.day() % 7 ? a : a - 7) }, isoWeeksInYear: function () { return B(this.year(), 1, 4) }, weeksInYear: function () { var a = this.localeData()._week; return B(this.year(), a.dow, a.doy) }, get: function (a) { return a = w(a), this[a]() }, set: function (a, b) { return a = w(a), "function" == typeof this[a] && this[a](b), this }, locale: function (b) { return b === a ? this._locale._abbr : (this._locale = rb.localeData(b), this) }, lang: e("moment().lang() is deprecated. Use moment().localeData() instead.", function (b) { return b === a ? this.localeData() : (this._locale = rb.localeData(b), this) }), localeData: function () { return this._locale } }), rb.fn.millisecond = rb.fn.milliseconds = mb("Milliseconds", !1), rb.fn.second = rb.fn.seconds = mb("Seconds", !1), rb.fn.minute = rb.fn.minutes = mb("Minutes", !1), rb.fn.hour = rb.fn.hours = mb("Hours", !0), rb.fn.date = mb("Date", !0), rb.fn.dates = e("dates accessor is deprecated. Use date instead.", mb("Date", !0)), rb.fn.year = mb("FullYear", !0), rb.fn.years = e("years accessor is deprecated. Use year instead.", mb("FullYear", !0)), rb.fn.days = rb.fn.day, rb.fn.months = rb.fn.month, rb.fn.weeks = rb.fn.week, rb.fn.isoWeeks = rb.fn.isoWeek, rb.fn.quarters = rb.fn.quarter, rb.fn.toJSON = rb.fn.toISOString, l(rb.duration.fn = k.prototype, { _bubble: function () { var a, b, c, d = this._milliseconds, e = this._days, f = this._months, g = this._data, h = 0; g.milliseconds = d % 1e3, a = n(d / 1e3), g.seconds = a % 60, b = n(a / 60), g.minutes = b % 60, c = n(b / 60), g.hours = c % 24, e += n(c / 24), h = n(nb(e)), e -= n(ob(h)), f += n(e / 30), e %= 30, h += n(f / 12), f %= 12, g.days = e, g.months = f, g.years = h }, abs: function () { return this._milliseconds = Math.abs(this._milliseconds), this._days = Math.abs(this._days), this._months = Math.abs(this._months), this._data.milliseconds = Math.abs(this._data.milliseconds), this._data.seconds = Math.abs(this._data.seconds), this._data.minutes = Math.abs(this._data.minutes), this._data.hours = Math.abs(this._data.hours), this._data.months = Math.abs(this._data.months), this._data.years = Math.abs(this._data.years), this }, weeks: function () { return n(this.days() / 7) }, valueOf: function () { return this._milliseconds + 864e5 * this._days + this._months % 12 * 2592e6 + 31536e6 * z(this._months / 12) }, humanize: function (a) { var b = eb(this, !a, this.localeData()); return a && (b = this.localeData().pastFuture(+this, b)), this.localeData().postformat(b) }, add: function (a, b) { var c = rb.duration(a, b); return this._milliseconds += c._milliseconds, this._days += c._days, this._months += c._months, this._bubble(), this }, subtract: function (a, b) { var c = rb.duration(a, b); return this._milliseconds -= c._milliseconds, this._days -= c._days, this._months -= c._months, this._bubble(), this }, get: function (a) { return a = w(a), this[a.toLowerCase() + "s"]() }, as: function (a) { var b, c; if (a = w(a), b = this._days + this._milliseconds / 864e5, "month" === a || "year" === a) return c = this._months + 12 * nb(b), "month" === a ? c : c / 12; switch (b += ob(this._months / 12), a) { case "week": return b / 7; case "day": return b; case "hour": return 24 * b; case "minute": return 24 * b * 60; case "second": return 24 * b * 60 * 60; case "millisecond": return 24 * b * 60 * 60 * 1e3; default: throw new Error("Unknown unit " + a) } }, lang: rb.fn.lang, locale: rb.fn.locale, toIsoString: e("toIsoString() is deprecated. Please use toISOString() instead (notice the capitals)", function () { return this.toISOString() }), toISOString: function () { var a = Math.abs(this.years()), b = Math.abs(this.months()), c = Math.abs(this.days()), d = Math.abs(this.hours()), e = Math.abs(this.minutes()), f = Math.abs(this.seconds() + this.milliseconds() / 1e3); return this.asSeconds() ? (this.asSeconds() < 0 ? "-" : "") + "P" + (a ? a + "Y" : "") + (b ? b + "M" : "") + (c ? c + "D" : "") + (d || e || f ? "T" : "") + (d ? d + "H" : "") + (e ? e + "M" : "") + (f ? f + "S" : "") : "P0D" }, localeData: function () { return this._locale } }); for (tb in fc) fc.hasOwnProperty(tb) && pb(tb.toLowerCase()); rb.duration.fn.asMilliseconds = function () { return this.as("ms") }, rb.duration.fn.asSeconds = function () { return this.as("s") }, rb.duration.fn.asMinutes = function () { return this.as("m") }, rb.duration.fn.asHours = function () { return this.as("h") }, rb.duration.fn.asDays = function () { return this.as("d") }, rb.duration.fn.asWeeks = function () { return this.as("weeks") }, rb.duration.fn.asMonths = function () { return this.as("M") }, rb.duration.fn.asYears = function () { return this.as("y") }, rb.locale("en", { ordinal: function (a) { var b = a % 10, c = 1 === z(a % 100 / 10) ? "th" : 1 === b ? "st" : 2 === b ? "nd" : 3 === b ? "rd" : "th"; return a + c } }), Gb ? module.exports = rb : "function" == typeof define && define.amd ? (define("moment", function (a, b, c) { return c.config && c.config() && c.config().noGlobal === !0 && (vb.moment = sb), rb }), qb(!0)) : qb() }).call(this);

/*! jQuery UI - v1.11.1 - 2014-08-13
* http://jqueryui.com
* Includes: core.css, accordion.css, autocomplete.css, button.css, datepicker.css, dialog.css, draggable.css, menu.css, progressbar.css, resizable.css, selectable.css, selectmenu.css, slider.css, sortable.css, spinner.css, tabs.css, tooltip.css, theme.css
* To view and modify this theme, visit http://jqueryui.com/themeroller/?ffDefault=Lucida%20Grande%2CLucida%20Sans%2CArial%2Csans-serif&fwDefault=bold&fsDefault=1.1em&cornerRadius=6px&bgColorHeader=deedf7&bgTextureHeader=highlight_soft&bgImgOpacityHeader=100&borderColorHeader=aed0ea&fcHeader=222222&iconColorHeader=72a7cf&bgColorContent=f2f5f7&bgTextureContent=highlight_hard&bgImgOpacityContent=100&borderColorContent=dddddd&fcContent=362b36&iconColorContent=72a7cf&bgColorDefault=d7ebf9&bgTextureDefault=glass&bgImgOpacityDefault=80&borderColorDefault=aed0ea&fcDefault=2779aa&iconColorDefault=3d80b3&bgColorHover=e4f1fb&bgTextureHover=glass&bgImgOpacityHover=100&borderColorHover=74b2e2&fcHover=0070a3&iconColorHover=2694e8&bgColorActive=3baae3&bgTextureActive=glass&bgImgOpacityActive=50&borderColorActive=2694e8&fcActive=ffffff&iconColorActive=ffffff&bgColorHighlight=ffef8f&bgTextureHighlight=highlight_soft&bgImgOpacityHighlight=25&borderColorHighlight=f9dd34&fcHighlight=363636&iconColorHighlight=2e83ff&bgColorError=cd0a0a&bgTextureError=flat&bgImgOpacityError=15&borderColorError=cd0a0a&fcError=ffffff&iconColorError=ffffff&bgColorOverlay=eeeeee&bgTextureOverlay=diagonals_thick&bgImgOpacityOverlay=90&opacityOverlay=80&bgColorShadow=000000&bgTextureShadow=highlight_hard&bgImgOpacityShadow=70&opacityShadow=30&thicknessShadow=7px&offsetTopShadow=-7px&offsetLeftShadow=-7px&cornerRadiusShadow=8px
* Copyright 2014 jQuery Foundation and other contributors; Licensed MIT */

.ui-helper-hidden{display:none}.ui-helper-hidden-accessible{border:0;clip:rect(0 0 0 0);height:1px;margin:-1px;overflow:hidden;padding:0;position:absolute;width:1px}.ui-helper-reset{margin:0;padding:0;border:0;outline:0;line-height:1.3;text-decoration:none;font-size:100%;list-style:none}.ui-helper-clearfix:before,.ui-helper-clearfix:after{content:"";display:table;border-collapse:collapse}.ui-helper-clearfix:after{clear:both}.ui-helper-clearfix{min-height:0}.ui-helper-zfix{width:100%;height:100%;top:0;left:0;position:absolute;opacity:0;filter:Alpha(Opacity=0)}.ui-front{z-index:100}.ui-state-disabled{cursor:default!important}.ui-icon{display:block;text-indent:-99999px;overflow:hidden;background-repeat:no-repeat}.ui-widget-overlay{position:fixed;top:0;left:0;width:100%;height:100%}.ui-accordion .ui-accordion-header{display:block;cursor:pointer;position:relative;margin:2px 0 0 0;padding:.5em .5em .5em .7em;min-height:0;font-size:100%}.ui-accordion .ui-accordion-icons{padding-left:2.2em}.ui-accordion .ui-accordion-icons .ui-accordion-icons{padding-left:2.2em}.ui-accordion .ui-accordion-header .ui-accordion-header-icon{position:absolute;left:.5em;top:50%;margin-top:-8px}.ui-accordion .ui-accordion-content{padding:1em 2.2em;border-top:0;overflow:auto}.ui-autocomplete{position:absolute;top:0;left:0;cursor:default}.ui-button{display:inline-block;position:relative;padding:0;line-height:normal;margin-right:.1em;cursor:pointer;vertical-align:middle;text-align:center;overflow:visible}.ui-button,.ui-button:link,.ui-button:visited,.ui-button:hover,.ui-button:active{text-decoration:none}.ui-button-icon-only{width:2.2em}button.ui-button-icon-only{width:2.4em}.ui-button-icons-only{width:3.4em}button.ui-button-icons-only{width:3.7em}.ui-button .ui-button-text{display:block;line-height:normal}.ui-button-text-only .ui-button-text{padding:.4em 1em}.ui-button-icon-only .ui-button-text,.ui-button-icons-only .ui-button-text{padding:.4em;text-indent:-9999999px}.ui-button-text-icon-primary .ui-button-text,.ui-button-text-icons .ui-button-text{padding:.4em 1em .4em 2.1em}.ui-button-text-icon-secondary .ui-button-text,.ui-button-text-icons .ui-button-text{padding:.4em 2.1em .4em 1em}.ui-button-text-icons .ui-button-text{padding-left:2.1em;padding-right:2.1em}input.ui-button{padding:.4em 1em}.ui-button-icon-only .ui-icon,.ui-button-text-icon-primary .ui-icon,.ui-button-text-icon-secondary .ui-icon,.ui-button-text-icons .ui-icon,.ui-button-icons-only .ui-icon{position:absolute;top:50%;margin-top:-8px}.ui-button-icon-only .ui-icon{left:50%;margin-left:-8px}.ui-button-text-icon-primary .ui-button-icon-primary,.ui-button-text-icons .ui-button-icon-primary,.ui-button-icons-only .ui-button-icon-primary{left:.5em}.ui-button-text-icon-secondary .ui-button-icon-secondary,.ui-button-text-icons .ui-button-icon-secondary,.ui-button-icons-only .ui-button-icon-secondary{right:.5em}.ui-buttonset{margin-right:7px}.ui-buttonset .ui-button{margin-left:0;margin-right:-.3em}input.ui-button::-moz-focus-inner,button.ui-button::-moz-focus-inner{border:0;padding:0}.ui-datepicker{width:17em;padding:.2em .2em 0;display:none}.ui-datepicker .ui-datepicker-header{position:relative;padding:.2em 0}.ui-datepicker .ui-datepicker-prev,.ui-datepicker .ui-datepicker-next{position:absolute;top:2px;width:1.8em;height:1.8em}.ui-datepicker .ui-datepicker-prev-hover,.ui-datepicker .ui-datepicker-next-hover{top:1px}.ui-datepicker .ui-datepicker-prev{left:2px}.ui-datepicker .ui-datepicker-next{right:2px}.ui-datepicker .ui-datepicker-prev-hover{left:1px}.ui-datepicker .ui-datepicker-next-hover{right:1px}.ui-datepicker .ui-datepicker-prev span,.ui-datepicker .ui-datepicker-next span{display:block;position:absolute;left:50%;margin-left:-8px;top:50%;margin-top:-8px}.ui-datepicker .ui-datepicker-title{margin:0 2.3em;line-height:1.8em;text-align:center}.ui-datepicker .ui-datepicker-title select{font-size:1em;margin:1px 0}.ui-datepicker select.ui-datepicker-month,.ui-datepicker select.ui-datepicker-year{width:45%}.ui-datepicker table{width:100%;font-size:.9em;border-collapse:collapse;margin:0 0 .4em}.ui-datepicker th{padding:.7em .3em;text-align:center;font-weight:bold;border:0}.ui-datepicker td{border:0;padding:1px}.ui-datepicker td span,.ui-datepicker td a{display:block;padding:.2em;text-align:right;text-decoration:none}.ui-datepicker .ui-datepicker-buttonpane{background-image:none;margin:.7em 0 0 0;padding:0 .2em;border-left:0;border-right:0;border-bottom:0}.ui-datepicker .ui-datepicker-buttonpane button{float:right;margin:.5em .2em .4em;cursor:pointer;padding:.2em .6em .3em .6em;width:auto;overflow:visible}.ui-datepicker .ui-datepicker-buttonpane button.ui-datepicker-current{float:left}.ui-datepicker.ui-datepicker-multi{width:auto}.ui-datepicker-multi .ui-datepicker-group{float:left}.ui-datepicker-multi .ui-datepicker-group table{width:95%;margin:0 auto .4em}.ui-datepicker-multi-2 .ui-datepicker-group{width:50%}.ui-datepicker-multi-3 .ui-datepicker-group{width:33.3%}.ui-datepicker-multi-4 .ui-datepicker-group{width:25%}.ui-datepicker-multi .ui-datepicker-group-last .ui-datepicker-header,.ui-datepicker-multi .ui-datepicker-group-middle .ui-datepicker-header{border-left-width:0}.ui-datepicker-multi .ui-datepicker-buttonpane{clear:left}.ui-datepicker-row-break{clear:both;width:100%;font-size:0}.ui-datepicker-rtl{direction:rtl}.ui-datepicker-rtl .ui-datepicker-prev{right:2px;left:auto}.ui-datepicker-rtl .ui-datepicker-next{left:2px;right:auto}.ui-datepicker-rtl .ui-datepicker-prev:hover{right:1px;left:auto}.ui-datepicker-rtl .ui-datepicker-next:hover{left:1px;right:auto}.ui-datepicker-rtl .ui-datepicker-buttonpane{clear:right}.ui-datepicker-rtl .ui-datepicker-buttonpane button{float:left}.ui-datepicker-rtl .ui-datepicker-buttonpane button.ui-datepicker-current,.ui-datepicker-rtl .ui-datepicker-group{float:right}.ui-datepicker-rtl .ui-datepicker-group-last .ui-datepicker-header,.ui-datepicker-rtl .ui-datepicker-group-middle .ui-datepicker-header{border-right-width:0;border-left-width:1px}.ui-dialog{overflow:hidden;position:absolute;top:0;left:0;padding:.2em;outline:0}.ui-dialog .ui-dialog-titlebar{padding:.4em 1em;position:relative}.ui-dialog .ui-dialog-title{float:left;margin:.1em 0;white-space:nowrap;width:90%;overflow:hidden;text-overflow:ellipsis}.ui-dialog .ui-dialog-titlebar-close{position:absolute;right:.3em;top:50%;width:20px;margin:-10px 0 0 0;padding:1px;height:20px}.ui-dialog .ui-dialog-content{position:relative;border:0;padding:.5em 1em;background:none;overflow:auto}.ui-dialog .ui-dialog-buttonpane{text-align:left;border-width:1px 0 0 0;background-image:none;margin-top:.5em;padding:.3em 1em .5em .4em}.ui-dialog .ui-dialog-buttonpane .ui-dialog-buttonset{float:right}.ui-dialog .ui-dialog-buttonpane button{margin:.5em .4em .5em 0;cursor:pointer}.ui-dialog .ui-resizable-se{width:12px;height:12px;right:-5px;bottom:-5px;background-position:16px 16px}.ui-draggable .ui-dialog-titlebar{cursor:move}.ui-draggable-handle{-ms-touch-action:none;touch-action:none}.ui-menu{list-style:none;padding:0;margin:0;display:block;outline:none}.ui-menu .ui-menu{position:absolute}.ui-menu .ui-menu-item{position:relative;margin:0;padding:3px 1em 3px .4em;cursor:pointer;min-height:0;list-style-image:url("data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7")}.ui-menu .ui-menu-divider{margin:5px 0;height:0;font-size:0;line-height:0;border-width:1px 0 0 0}.ui-menu .ui-state-focus,.ui-menu .ui-state-active{margin:-1px}.ui-menu-icons{position:relative}.ui-menu-icons .ui-menu-item{padding-left:2em}.ui-menu .ui-icon{position:absolute;top:0;bottom:0;left:.2em;margin:auto 0}.ui-menu .ui-menu-icon{left:auto;right:0}.ui-progressbar{height:2em;text-align:left;overflow:hidden}.ui-progressbar .ui-progressbar-value{margin:-1px;height:100%}.ui-progressbar .ui-progressbar-overlay{background:url("data:image/gif;base64,R0lGODlhKAAoAIABAAAAAP///yH/C05FVFNDQVBFMi4wAwEAAAAh+QQJAQABACwAAAAAKAAoAAACkYwNqXrdC52DS06a7MFZI+4FHBCKoDeWKXqymPqGqxvJrXZbMx7Ttc+w9XgU2FB3lOyQRWET2IFGiU9m1frDVpxZZc6bfHwv4c1YXP6k1Vdy292Fb6UkuvFtXpvWSzA+HycXJHUXiGYIiMg2R6W459gnWGfHNdjIqDWVqemH2ekpObkpOlppWUqZiqr6edqqWQAAIfkECQEAAQAsAAAAACgAKAAAApSMgZnGfaqcg1E2uuzDmmHUBR8Qil95hiPKqWn3aqtLsS18y7G1SzNeowWBENtQd+T1JktP05nzPTdJZlR6vUxNWWjV+vUWhWNkWFwxl9VpZRedYcflIOLafaa28XdsH/ynlcc1uPVDZxQIR0K25+cICCmoqCe5mGhZOfeYSUh5yJcJyrkZWWpaR8doJ2o4NYq62lAAACH5BAkBAAEALAAAAAAoACgAAAKVDI4Yy22ZnINRNqosw0Bv7i1gyHUkFj7oSaWlu3ovC8GxNso5fluz3qLVhBVeT/Lz7ZTHyxL5dDalQWPVOsQWtRnuwXaFTj9jVVh8pma9JjZ4zYSj5ZOyma7uuolffh+IR5aW97cHuBUXKGKXlKjn+DiHWMcYJah4N0lYCMlJOXipGRr5qdgoSTrqWSq6WFl2ypoaUAAAIfkECQEAAQAsAAAAACgAKAAAApaEb6HLgd/iO7FNWtcFWe+ufODGjRfoiJ2akShbueb0wtI50zm02pbvwfWEMWBQ1zKGlLIhskiEPm9R6vRXxV4ZzWT2yHOGpWMyorblKlNp8HmHEb/lCXjcW7bmtXP8Xt229OVWR1fod2eWqNfHuMjXCPkIGNileOiImVmCOEmoSfn3yXlJWmoHGhqp6ilYuWYpmTqKUgAAIfkECQEAAQAsAAAAACgAKAAAApiEH6kb58biQ3FNWtMFWW3eNVcojuFGfqnZqSebuS06w5V80/X02pKe8zFwP6EFWOT1lDFk8rGERh1TTNOocQ61Hm4Xm2VexUHpzjymViHrFbiELsefVrn6XKfnt2Q9G/+Xdie499XHd2g4h7ioOGhXGJboGAnXSBnoBwKYyfioubZJ2Hn0RuRZaflZOil56Zp6iioKSXpUAAAh+QQJAQABACwAAAAAKAAoAAACkoQRqRvnxuI7kU1a1UU5bd5tnSeOZXhmn5lWK3qNTWvRdQxP8qvaC+/yaYQzXO7BMvaUEmJRd3TsiMAgswmNYrSgZdYrTX6tSHGZO73ezuAw2uxuQ+BbeZfMxsexY35+/Qe4J1inV0g4x3WHuMhIl2jXOKT2Q+VU5fgoSUI52VfZyfkJGkha6jmY+aaYdirq+lQAACH5BAkBAAEALAAAAAAoACgAAAKWBIKpYe0L3YNKToqswUlvznigd4wiR4KhZrKt9Upqip61i9E3vMvxRdHlbEFiEXfk9YARYxOZZD6VQ2pUunBmtRXo1Lf8hMVVcNl8JafV38aM2/Fu5V16Bn63r6xt97j09+MXSFi4BniGFae3hzbH9+hYBzkpuUh5aZmHuanZOZgIuvbGiNeomCnaxxap2upaCZsq+1kAACH5BAkBAAEALAAAAAAoACgAAAKXjI8By5zf4kOxTVrXNVlv1X0d8IGZGKLnNpYtm8Lr9cqVeuOSvfOW79D9aDHizNhDJidFZhNydEahOaDH6nomtJjp1tutKoNWkvA6JqfRVLHU/QUfau9l2x7G54d1fl995xcIGAdXqMfBNadoYrhH+Mg2KBlpVpbluCiXmMnZ2Sh4GBqJ+ckIOqqJ6LmKSllZmsoq6wpQAAAh+QQJAQABACwAAAAAKAAoAAAClYx/oLvoxuJDkU1a1YUZbJ59nSd2ZXhWqbRa2/gF8Gu2DY3iqs7yrq+xBYEkYvFSM8aSSObE+ZgRl1BHFZNr7pRCavZ5BW2142hY3AN/zWtsmf12p9XxxFl2lpLn1rseztfXZjdIWIf2s5dItwjYKBgo9yg5pHgzJXTEeGlZuenpyPmpGQoKOWkYmSpaSnqKileI2FAAACH5BAkBAAEALAAAAAAoACgAAAKVjB+gu+jG4kORTVrVhRlsnn2dJ3ZleFaptFrb+CXmO9OozeL5VfP99HvAWhpiUdcwkpBH3825AwYdU8xTqlLGhtCosArKMpvfa1mMRae9VvWZfeB2XfPkeLmm18lUcBj+p5dnN8jXZ3YIGEhYuOUn45aoCDkp16hl5IjYJvjWKcnoGQpqyPlpOhr3aElaqrq56Bq7VAAAOw==");height:100%;filter:alpha(opacity=25);opacity:0.25}.ui-progressbar-indeterminate .ui-progressbar-value{background-image:none}.ui-resizable{position:relative}.ui-resizable-handle{position:absolute;font-size:0.1px;display:block;-ms-touch-action:none;touch-action:none}.ui-resizable-disabled .ui-resizable-handle,.ui-resizable-autohide .ui-resizable-handle{display:none}.ui-resizable-n{cursor:n-resize;height:7px;width:100%;top:-5px;left:0}.ui-resizable-s{cursor:s-resize;height:7px;width:100%;bottom:-5px;left:0}.ui-resizable-e{cursor:e-resize;width:7px;right:-5px;top:0;height:100%}.ui-resizable-w{cursor:w-resize;width:7px;left:-5px;top:0;height:100%}.ui-resizable-se{cursor:se-resize;width:12px;height:12px;right:1px;bottom:1px}.ui-resizable-sw{cursor:sw-resize;width:9px;height:9px;left:-5px;bottom:-5px}.ui-resizable-nw{cursor:nw-resize;width:9px;height:9px;left:-5px;top:-5px}.ui-resizable-ne{cursor:ne-resize;width:9px;height:9px;right:-5px;top:-5px}.ui-selectable{-ms-touch-action:none;touch-action:none}.ui-selectable-helper{position:absolute;z-index:100;border:1px dotted black}.ui-selectmenu-menu{padding:0;margin:0;position:absolute;top:0;left:0;display:none}.ui-selectmenu-menu .ui-menu{overflow:auto;overflow-x:hidden;padding-bottom:1px}.ui-selectmenu-menu .ui-menu .ui-selectmenu-optgroup{font-size:1em;font-weight:bold;line-height:1.5;padding:2px 0.4em;margin:0.5em 0 0 0;height:auto;border:0}.ui-selectmenu-open{display:block}.ui-selectmenu-button{display:inline-block;overflow:hidden;position:relative;text-decoration:none;cursor:pointer}.ui-selectmenu-button span.ui-icon{right:0.5em;left:auto;margin-top:-8px;position:absolute;top:50%}.ui-selectmenu-button span.ui-selectmenu-text{text-align:left;padding:0.4em 2.1em 0.4em 1em;display:block;line-height:1.4;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ui-slider{position:relative;text-align:left}.ui-slider .ui-slider-handle{position:absolute;z-index:2;width:1.2em;height:1.2em;cursor:default;-ms-touch-action:none;touch-action:none}.ui-slider .ui-slider-range{position:absolute;z-index:1;font-size:.7em;display:block;border:0;background-position:0 0}.ui-slider.ui-state-disabled .ui-slider-handle,.ui-slider.ui-state-disabled .ui-slider-range{filter:inherit}.ui-slider-horizontal{height:.8em}.ui-slider-horizontal .ui-slider-handle{top:-.3em;margin-left:-.6em}.ui-slider-horizontal .ui-slider-range{top:0;height:100%}.ui-slider-horizontal .ui-slider-range-min{left:0}.ui-slider-horizontal .ui-slider-range-max{right:0}.ui-slider-vertical{width:.8em;height:100px}.ui-slider-vertical .ui-slider-handle{left:-.3em;margin-left:0;margin-bottom:-.6em}.ui-slider-vertical .ui-slider-range{left:0;width:100%}.ui-slider-vertical .ui-slider-range-min{bottom:0}.ui-slider-vertical .ui-slider-range-max{top:0}.ui-sortable-handle{-ms-touch-action:none;touch-action:none}.ui-spinner{position:relative;display:inline-block;overflow:hidden;padding:0;vertical-align:middle}.ui-spinner-input{border:none;background:none;color:inherit;padding:0;margin:.2em 0;vertical-align:middle;margin-left:.4em;margin-right:22px}.ui-spinner-button{width:16px;height:50%;font-size:.5em;padding:0;margin:0;text-align:center;position:absolute;cursor:default;display:block;overflow:hidden;right:0}.ui-spinner a.ui-spinner-button{border-top:none;border-bottom:none;border-right:none}.ui-spinner .ui-icon{position:absolute;margin-top:-8px;top:50%;left:0}.ui-spinner-up{top:0}.ui-spinner-down{bottom:0}.ui-spinner .ui-icon-triangle-1-s{background-position:-65px -16px}.ui-tabs{position:relative;padding:.2em}.ui-tabs .ui-tabs-nav{margin:0;padding:.2em .2em 0}.ui-tabs .ui-tabs-nav li{list-style:none;float:left;position:relative;top:0;margin:1px .2em 0 0;border-bottom-width:0;padding:0;white-space:nowrap}.ui-tabs .ui-tabs-nav .ui-tabs-anchor{float:left;padding:.5em 1em;text-decoration:none}.ui-tabs .ui-tabs-nav li.ui-tabs-active{margin-bottom:-1px;padding-bottom:1px}.ui-tabs .ui-tabs-nav li.ui-tabs-active .ui-tabs-anchor,.ui-tabs .ui-tabs-nav li.ui-state-disabled .ui-tabs-anchor,.ui-tabs .ui-tabs-nav li.ui-tabs-loading .ui-tabs-anchor{cursor:text}.ui-tabs-collapsible .ui-tabs-nav li.ui-tabs-active .ui-tabs-anchor{cursor:pointer}.ui-tabs .ui-tabs-panel{display:block;border-width:0;padding:1em 1.4em;background:none}.ui-tooltip{padding:8px;position:absolute;z-index:9999;max-width:300px;-webkit-box-shadow:0 0 5px #aaa;box-shadow:0 0 5px #aaa}body .ui-tooltip{border-width:2px}.ui-widget{font-family:Lucida Grande,Lucida Sans,Arial,sans-serif;font-size:1.1em}.ui-widget .ui-widget{font-size:1em}.ui-widget input,.ui-widget select,.ui-widget textarea,.ui-widget button{font-family:Lucida Grande,Lucida Sans,Arial,sans-serif;font-size:1em}.ui-widget-content{border:1px solid #ddd;background:#f2f5f7 url("images/ui-bg_highlight-hard_100_f2f5f7_1x100.png") 50% top repeat-x;color:#362b36}.ui-widget-content a{color:#362b36}.ui-widget-header{border:1px solid #aed0ea;background:#deedf7 url("images/ui-bg_highlight-soft_100_deedf7_1x100.png") 50% 50% repeat-x;color:#222;font-weight:bold}.ui-widget-header a{color:#222}.ui-state-default,.ui-widget-content .ui-state-default,.ui-widget-header .ui-state-default{border:1px solid #aed0ea;background:#d7ebf9 url("images/ui-bg_glass_80_d7ebf9_1x400.png") 50% 50% repeat-x;font-weight:bold;color:#2779aa}.ui-state-default a,.ui-state-default a:link,.ui-state-default a:visited{color:#2779aa;text-decoration:none}.ui-state-hover,.ui-widget-content .ui-state-hover,.ui-widget-header .ui-state-hover,.ui-state-focus,.ui-widget-content .ui-state-focus,.ui-widget-header .ui-state-focus{border:1px solid #74b2e2;background:#e4f1fb url("images/ui-bg_glass_100_e4f1fb_1x400.png") 50% 50% repeat-x;font-weight:bold;color:#0070a3}.ui-state-hover a,.ui-state-hover a:hover,.ui-state-hover a:link,.ui-state-hover a:visited,.ui-state-focus a,.ui-state-focus a:hover,.ui-state-focus a:link,.ui-state-focus a:visited{color:#0070a3;text-decoration:none}.ui-state-active,.ui-widget-content .ui-state-active,.ui-widget-header .ui-state-active{border:1px solid #2694e8;background:#3baae3 url("images/ui-bg_glass_50_3baae3_1x400.png") 50% 50% repeat-x;font-weight:bold;color:#fff}.ui-state-active a,.ui-state-active a:link,.ui-state-active a:visited{color:#fff;text-decoration:none}.ui-state-highlight,.ui-widget-content .ui-state-highlight,.ui-widget-header .ui-state-highlight{border:1px solid #f9dd34;background:#ffef8f url("images/ui-bg_highlight-soft_25_ffef8f_1x100.png") 50% top repeat-x;color:#363636}.ui-state-highlight a,.ui-widget-content .ui-state-highlight a,.ui-widget-header .ui-state-highlight a{color:#363636}.ui-state-error,.ui-widget-content .ui-state-error,.ui-widget-header .ui-state-error{border:1px solid #cd0a0a;background:#cd0a0a url("images/ui-bg_flat_15_cd0a0a_40x100.png") 50% 50% repeat-x;color:#fff}.ui-state-error a,.ui-widget-content .ui-state-error a,.ui-widget-header .ui-state-error a{color:#fff}.ui-state-error-text,.ui-widget-content .ui-state-error-text,.ui-widget-header .ui-state-error-text{color:#fff}.ui-priority-primary,.ui-widget-content .ui-priority-primary,.ui-widget-header .ui-priority-primary{font-weight:bold}.ui-priority-secondary,.ui-widget-content .ui-priority-secondary,.ui-widget-header .ui-priority-secondary{opacity:.7;filter:Alpha(Opacity=70);font-weight:normal}.ui-state-disabled,.ui-widget-content .ui-state-disabled,.ui-widget-header .ui-state-disabled{opacity:.35;filter:Alpha(Opacity=35);background-image:none}.ui-state-disabled .ui-icon{filter:Alpha(Opacity=35)}.ui-icon{width:16px;height:16px}.ui-icon,.ui-widget-content .ui-icon{background-image:url("images/ui-icons_72a7cf_256x240.png")}.ui-widget-header .ui-icon{background-image:url("images/ui-icons_72a7cf_256x240.png")}.ui-state-default .ui-icon{background-image:url("images/ui-icons_3d80b3_256x240.png")}.ui-state-hover .ui-icon,.ui-state-focus .ui-icon{background-image:url("images/ui-icons_2694e8_256x240.png")}.ui-state-active .ui-icon{background-image:url("images/ui-icons_ffffff_256x240.png")}.ui-state-highlight .ui-icon{background-image:url("images/ui-icons_2e83ff_256x240.png")}.ui-state-error .ui-icon,.ui-state-error-text .ui-icon{background-image:url("images/ui-icons_ffffff_256x240.png")}.ui-icon-blank{background-position:16px 16px}.ui-icon-carat-1-n{background-position:0 0}.ui-icon-carat-1-ne{background-position:-16px 0}.ui-icon-carat-1-e{background-position:-32px 0}.ui-icon-carat-1-se{background-position:-48px 0}.ui-icon-carat-1-s{background-position:-64px 0}.ui-icon-carat-1-sw{background-position:-80px 0}.ui-icon-carat-1-w{background-position:-96px 0}.ui-icon-carat-1-nw{background-position:-112px 0}.ui-icon-carat-2-n-s{background-position:-128px 0}.ui-icon-carat-2-e-w{background-position:-144px 0}.ui-icon-triangle-1-n{background-position:0 -16px}.ui-icon-triangle-1-ne{background-position:-16px -16px}.ui-icon-triangle-1-e{background-position:-32px -16px}.ui-icon-triangle-1-se{background-position:-48px -16px}.ui-icon-triangle-1-s{background-position:-64px -16px}.ui-icon-triangle-1-sw{background-position:-80px -16px}.ui-icon-triangle-1-w{background-position:-96px -16px}.ui-icon-triangle-1-nw{background-position:-112px -16px}.ui-icon-triangle-2-n-s{background-position:-128px -16px}.ui-icon-triangle-2-e-w{background-position:-144px -16px}.ui-icon-arrow-1-n{background-position:0 -32px}.ui-icon-arrow-1-ne{background-position:-16px -32px}.ui-icon-arrow-1-e{background-position:-32px -32px}.ui-icon-arrow-1-se{background-position:-48px -32px}.ui-icon-arrow-1-s{background-position:-64px -32px}.ui-icon-arrow-1-sw{background-position:-80px -32px}.ui-icon-arrow-1-w{background-position:-96px -32px}.ui-icon-arrow-1-nw{background-position:-112px -32px}.ui-icon-arrow-2-n-s{background-position:-128px -32px}.ui-icon-arrow-2-ne-sw{background-position:-144px -32px}.ui-icon-arrow-2-e-w{background-position:-160px -32px}.ui-icon-arrow-2-se-nw{background-position:-176px -32px}.ui-icon-arrowstop-1-n{background-position:-192px -32px}.ui-icon-arrowstop-1-e{background-position:-208px -32px}.ui-icon-arrowstop-1-s{background-position:-224px -32px}.ui-icon-arrowstop-1-w{background-position:-240px -32px}.ui-icon-arrowthick-1-n{background-position:0 -48px}.ui-icon-arrowthick-1-ne{background-position:-16px -48px}.ui-icon-arrowthick-1-e{background-position:-32px -48px}.ui-icon-arrowthick-1-se{background-position:-48px -48px}.ui-icon-arrowthick-1-s{background-position:-64px -48px}.ui-icon-arrowthick-1-sw{background-position:-80px -48px}.ui-icon-arrowthick-1-w{background-position:-96px -48px}.ui-icon-arrowthick-1-nw{background-position:-112px -48px}.ui-icon-arrowthick-2-n-s{background-position:-128px -48px}.ui-icon-arrowthick-2-ne-sw{background-position:-144px -48px}.ui-icon-arrowthick-2-e-w{background-position:-160px -48px}.ui-icon-arrowthick-2-se-nw{background-position:-176px -48px}.ui-icon-arrowthickstop-1-n{background-position:-192px -48px}.ui-icon-arrowthickstop-1-e{background-position:-208px -48px}.ui-icon-arrowthickstop-1-s{background-position:-224px -48px}.ui-icon-arrowthickstop-1-w{background-position:-240px -48px}.ui-icon-arrowreturnthick-1-w{background-position:0 -64px}.ui-icon-arrowreturnthick-1-n{background-position:-16px -64px}.ui-icon-arrowreturnthick-1-e{background-position:-32px -64px}.ui-icon-arrowreturnthick-1-s{background-position:-48px -64px}.ui-icon-arrowreturn-1-w{background-position:-64px -64px}.ui-icon-arrowreturn-1-n{background-position:-80px -64px}.ui-icon-arrowreturn-1-e{background-position:-96px -64px}.ui-icon-arrowreturn-1-s{background-position:-112px -64px}.ui-icon-arrowrefresh-1-w{background-position:-128px -64px}.ui-icon-arrowrefresh-1-n{background-position:-144px -64px}.ui-icon-arrowrefresh-1-e{background-position:-160px -64px}.ui-icon-arrowrefresh-1-s{background-position:-176px -64px}.ui-icon-arrow-4{background-position:0 -80px}.ui-icon-arrow-4-diag{background-position:-16px -80px}.ui-icon-extlink{background-position:-32px -80px}.ui-icon-newwin{background-position:-48px -80px}.ui-icon-refresh{background-position:-64px -80px}.ui-icon-shuffle{background-position:-80px -80px}.ui-icon-transfer-e-w{background-position:-96px -80px}.ui-icon-transferthick-e-w{background-position:-112px -80px}.ui-icon-folder-collapsed{background-position:0 -96px}.ui-icon-folder-open{background-position:-16px -96px}.ui-icon-document{background-position:-32px -96px}.ui-icon-document-b{background-position:-48px -96px}.ui-icon-note{background-position:-64px -96px}.ui-icon-mail-closed{background-position:-80px -96px}.ui-icon-mail-open{background-position:-96px -96px}.ui-icon-suitcase{background-position:-112px -96px}.ui-icon-comment{background-position:-128px -96px}.ui-icon-person{background-position:-144px -96px}.ui-icon-print{background-position:-160px -96px}.ui-icon-trash{background-position:-176px -96px}.ui-icon-locked{background-position:-192px -96px}.ui-icon-unlocked{background-position:-208px -96px}.ui-icon-bookmark{background-position:-224px -96px}.ui-icon-tag{background-position:-240px -96px}.ui-icon-home{background-position:0 -112px}.ui-icon-flag{background-position:-16px -112px}.ui-icon-calendar{background-position:-32px -112px}.ui-icon-cart{background-position:-48px -112px}.ui-icon-pencil{background-position:-64px -112px}.ui-icon-clock{background-position:-80px -112px}.ui-icon-disk{background-position:-96px -112px}.ui-icon-calculator{background-position:-112px -112px}.ui-icon-zoomin{background-position:-128px -112px}.ui-icon-zoomout{background-position:-144px -112px}.ui-icon-search{background-position:-160px -112px}.ui-icon-wrench{background-position:-176px -112px}.ui-icon-gear{background-position:-192px -112px}.ui-icon-heart{background-position:-208px -112px}.ui-icon-star{background-position:-224px -112px}.ui-icon-link{background-position:-240px -112px}.ui-icon-cancel{background-position:0 -128px}.ui-icon-plus{background-position:-16px -128px}.ui-icon-plusthick{background-position:-32px -128px}.ui-icon-minus{background-position:-48px -128px}.ui-icon-minusthick{background-position:-64px -128px}.ui-icon-close{background-position:-80px -128px}.ui-icon-closethick{background-position:-96px -128px}.ui-icon-key{background-position:-112px -128px}.ui-icon-lightbulb{background-position:-128px -128px}.ui-icon-scissors{background-position:-144px -128px}.ui-icon-clipboard{background-position:-160px -128px}.ui-icon-copy{background-position:-176px -128px}.ui-icon-contact{background-position:-192px -128px}.ui-icon-image{background-position:-208px -128px}.ui-icon-video{background-position:-224px -128px}.ui-icon-script{background-position:-240px -128px}.ui-icon-alert{background-position:0 -144px}.ui-icon-info{background-position:-16px -144px}.ui-icon-notice{background-position:-32px -144px}.ui-icon-help{background-position:-48px -144px}.ui-icon-check{background-position:-64px -144px}.ui-icon-bullet{background-position:-80px -144px}.ui-icon-radio-on{background-position:-96px -144px}.ui-icon-radio-off{background-position:-112px -144px}.ui-icon-pin-w{background-position:-128px -144px}.ui-icon-pin-s{background-position:-144px -144px}.ui-icon-play{background-position:0 -160px}.ui-icon-pause{background-position:-16px -160px}.ui-icon-seek-next{background-position:-32px -160px}.ui-icon-seek-prev{background-position:-48px -160px}.ui-icon-seek-end{background-position:-64px -160px}.ui-icon-seek-start{background-position:-80px -160px}.ui-icon-seek-first{background-position:-80px -160px}.ui-icon-stop{background-position:-96px -160px}.ui-icon-eject{background-position:-112px -160px}.ui-icon-volume-off{background-position:-128px -160px}.ui-icon-volume-on{background-position:-144px -160px}.ui-icon-power{background-position:0 -176px}.ui-icon-signal-diag{background-position:-16px -176px}.ui-icon-signal{background-position:-32px -176px}.ui-icon-battery-0{background-position:-48px -176px}.ui-icon-battery-1{background-position:-64px -176px}.ui-icon-battery-2{background-position:-80px -176px}.ui-icon-battery-3{background-position:-96px -176px}.ui-icon-circle-plus{background-position:0 -192px}.ui-icon-circle-minus{background-position:-16px -192px}.ui-icon-circle-close{background-position:-32px -192px}.ui-icon-circle-triangle-e{background-position:-48px -192px}.ui-icon-circle-triangle-s{background-position:-64px -192px}.ui-icon-circle-triangle-w{background-position:-80px -192px}.ui-icon-circle-triangle-n{background-position:-96px -192px}.ui-icon-circle-arrow-e{background-position:-112px -192px}.ui-icon-circle-arrow-s{background-position:-128px -192px}.ui-icon-circle-arrow-w{background-position:-144px -192px}.ui-icon-circle-arrow-n{background-position:-160px -192px}.ui-icon-circle-zoomin{background-position:-176px -192px}.ui-icon-circle-zoomout{background-position:-192px -192px}.ui-icon-circle-check{background-position:-208px -192px}.ui-icon-circlesmall-plus{background-position:0 -208px}.ui-icon-circlesmall-minus{background-position:-16px -208px}.ui-icon-circlesmall-close{background-position:-32px -208px}.ui-icon-squaresmall-plus{background-position:-48px -208px}.ui-icon-squaresmall-minus{background-position:-64px -208px}.ui-icon-squaresmall-close{background-position:-80px -208px}.ui-icon-grip-dotted-vertical{background-position:0 -224px}.ui-icon-grip-dotted-horizontal{background-position:-16px -224px}.ui-icon-grip-solid-vertical{background-position:-32px -224px}.ui-icon-grip-solid-horizontal{background-position:-48px -224px}.ui-icon-gripsmall-diagonal-se{background-position:-64px -224px}.ui-icon-grip-diagonal-se{background-position:-80px -224px}.ui-corner-all,.ui-corner-top,.ui-corner-left,.ui-corner-tl{border-top-left-radius:6px}.ui-corner-all,.ui-corner-top,.ui-corner-right,.ui-corner-tr{border-top-right-radius:6px}.ui-corner-all,.ui-corner-bottom,.ui-corner-left,.ui-corner-bl{border-bottom-left-radius:6px}.ui-corner-all,.ui-corner-bottom,.ui-corner-right,.ui-corner-br{border-bottom-right-radius:6px}.ui-widget-overlay{background:#eee url("images/ui-bg_diagonals-thick_90_eeeeee_40x40.png") 50% 50% repeat;opacity:.8;filter:Alpha(Opacity=80)}.ui-widget-shadow{margin:-7px 0 0 -7px;padding:7px;background:#000 url("images/ui-bg_highlight-hard_70_000000_1x100.png") 50% top repeat-x;opacity:.3;filter:Alpha(Opacity=30);border-radius:8px}

