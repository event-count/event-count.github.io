// <event-count> custom element, displaying [year] [day] [hour] [minute] [second] countdown to a date
// counts UP for past dates
// attributes: date, count, noyear, noday, nohour, nominute, nosecond, locale
// date:    date to count down to, default Y2K38 Epochalypse date Counts UP for past dates
// event:   name of event, default "Y2K38 Epochalypse" OR all HTML specified in lightDOM!
// count:   comma separated list of labels to show, default "year,day,hour,minute,second"
// noyear, noday, nohour, nominute, nosecond: hide labels, default show all labels
// format:  language locale to use for labels, default "en" (English)
// time:    time count down from HH:MM:SS

customElements.define("event-count", class extends HTMLElement {
    // static get observedAttributes() { return ["date", "count", "noyear", "noday", "nohour", "nominute", "nosecond", "locale", "time"]; }
    // attributeChangedCallback() {
    //     this.render();
    // }
    connectedCallback() {
        this.render();
    }
    render() {
        // ====================================================================
        let event;
        let labels;
        // ====================================================================
        const urlParams = new URLSearchParams(window.location.search);
        if (this.getAttribute("event") == "url") {
            if (urlParams.get('event')) event = urlParams.get('event');
            if (urlParams.get('labels')) labels = urlParams.get('labels');
            if (urlParams.get('title')) {
                setTimeout(() => {
                    this.innerHTML = urlParams.get('title');
                }, 1);
            }
        } else {
            event = this.getAttribute("event") || 2147483647e3;// default Y2K38 date: "2038-1-19 3:14:7"
        }
        if (event == "newyear") {
            event = new Date(new Date().getFullYear() + 1, 0, 1);
        } else if (event == "danny") {
            event = "1969/1/21";
        } else if (event == "48") {
            event = "2029/1/20";
            this.setAttribute("count", "year,day,hour,minute,second");
            setTimeout(() => {
                this.innerHTML = `<flagmeister-text word="48" iso="us,us" style="display:inline-block;text-align:center"></flagmeister-text>`;
            }, 1);
        }
        // ====================================================================
        let hour, minute, second;
        // ====================================================================
        if (!labels) {
            if (this.getAttribute("hms")) {
                [hour, minute, second] = this.getAttribute("hms").split(":");
                event = new Date((new Date() / 1) + hour * 3600e3 + minute * 60e3 + second * 1e3);
                labels = "hour,minute,second";
            } else {
                labels = (this.getAttribute("count") || "year,day,hour,minute,second");
            }
        }
        if (labels == "*") labels = "year,day,hour,minute,second";
        labels = labels.split(",");

        // ********************************************************************
        // generic create DOM element with all content and properties
        // this[id] notation optimized for use in this Custom Element
        let createElement = ({
            create = "div", // default element is a <div>
            id,// 
            append = [],// append array of child elements 
            ...p // all remaing props
        }) => (
            // I hate "return" statements they only take up bytes (x,y,z,return value) does the job

            Object.assign( // Object.assign is my favorite JS function
                create = document.createElement(create), // create a DOM element
                { id, part: id, ...p } // set ALL properties, eventhandlers etc.
            ).append(...append), // append all child elements

            // every id must be unique! and becomes a this.id reference
            /* Return value: */ this[id] = create
        );
        // ********************************************************************
        // generic function return CSS selector with attribute value OR CSS property OR default value
        let attr_CSSprop = (prefix, name, value) =>
            // to read value from attribues 
            name + ":" + (this.getAttribute(prefix + "-" + name)
                || // OR CSS property OR default value
                "var(--event-count-" + prefix + "-" + name + "," + value + ")") + ";";

        // ********************************************************************
        // create full shadowDOM
        (this.shadowRoot || this.attachShadow({ mode: "open" })).append(
            // ----------------------------------------------------------------
            createElement({
                create: "style",
                id: "style", // unused; prevent from setting default "undefined" string value
                innerHTML: ":host{display:inline-block}" +
                    // eventname
                    "#event{" +
                    attr_CSSprop("event", "color", "#0") + // black
                    attr_CSSprop("event", "padding", "0 1rem") +
                    attr_CSSprop("event", "font", "2rem arial") +
                    attr_CSSprop("event", "text-align", "center") +
                    attr_CSSprop("event", "background", "#fc0") + // gold
                    "}" +
                    // countdown counters
                    "#count{display:grid;grid:1fr/repeat(" + labels.length + ",1fr);" +
                    attr_CSSprop("count", "color", "#fc0") + // gold
                    attr_CSSprop("count", "font", "2rem arial") +
                    attr_CSSprop("count", "text-align", "center") +
                    attr_CSSprop("count", "background", "#080") + // green
                    "}" +
                    // countdown labels
                    "[part*=text]{" +
                    attr_CSSprop("text", "padding", "0 1rem") +
                    attr_CSSprop("text", "font", "1rem arial") +
                    attr_CSSprop("text", "text-transform", "uppercase") +
                    "}"
            }),
            // --------------------------------------------------------------------
            createElement({
                id: "event",
                append: [
                    // fill with default empty <slot> content
                    createElement({
                        //id: "slot",// do not set, creates slot reference in <event-count-example>
                        create: "slot", innerHTML: "Y2K38"
                    })
                ]
            }),
            // --------------------------------------------------------------------
            createElement({
                id: "count",
                append: labels.map(label => createElement({ // = "year", "day", "hour", "minute", "second"
                    id: label + "count",
                    append: [
                        createElement({
                            id: label
                            //, innerHTML: "#" // saving some bytes, after a second the value will be set
                        }),
                        createElement({
                            id: label + "text",
                            innerHTML:
                                // --------------------------------------------------------------------
                                // get proper locale label for all "year", "day", "hour", "minute", "second"
                                new Intl.RelativeTimeFormat(
                                    this.getAttribute("format") || "en", // todo: query this default from CSS property?
                                    //{ numeric: "auto" }
                                ).formatToParts(
                                    2, // 2 for plural, 1 for singular
                                    label // "year", "day", "hour", "minute", "second"
                                )[2] // get time label name in locale as Object
                                    .value // get time name in locale as String)
                        })]
                }))
            }))// shadowDOM created

        // ********************************************************************
        let intervalCounter = setInterval(() => {
            // === helper function ===
            const leapYears = (days, year, years = 0) => {
                while (days >= 365) {
                    days -= (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 366 : 365;
                    years++;
                    year++;
                }
                return years;
            }
            // === main function ===
            let startDate = new Date(), currentDate = new Date(event);
            // swap dates if countdown is in the past
            if (currentDate < startDate) [startDate, currentDate] = [currentDate, startDate];
            let seconds = Math.floor((currentDate - startDate) / 1000);
            let time = {
                year: leapYears(/* days */Math.floor(seconds / 86400), /* year */startDate.getFullYear()),
                day: Math.floor(seconds / 86400 % 365.25), // leapYear correction .25
                hour: Math.floor(seconds / 3600 % 24),
                minute: Math.floor(seconds / 60 % 60),
                second: seconds % 60
            };
        // ----------------------------------------------------------------
            // update every counter in the DOM element this[label]
            if (labels.map(label => (
                this.setAttribute(label, time[label]),
                /*.map RETURN value: */ this[label].innerHTML = time[label]

                // OR minimal DOM updates; update only counters that are not 0 OR the same value as before
                //(this["_" + label] == timediff[label]) && (this[label].innerHTML = (this["_" + label] = timediff[label]))

            )).every(value => !value)) { // counter is down to 0, stop interval timer
                clearInterval(intervalCounter);
                this.dispatchEvent(new Event(this.id)); // dispatch event
                //this.dispatchEvent(new CustomEvent(this.id, { bubbles: 1, composed: 1 })); // dispatch event
            }
        }, 1e3);// ping every second

    } // connectedCallback

})