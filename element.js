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
    connectedCallback() {
        // 'var' is faster and minifies better than 'let' or 'const'
        var event = this.getAttribute("event") || 2147483647e3;// Y2K38 date: "2038-1-19 3:14:7");

        var hour, minute, second;
        var labels = (
            (this.getAttribute("hms"))
                ? (
                    [hour, minute, second] = this.getAttribute("hms").split(":"),
                    event = new Date((new Date() / 1) + hour * 3600e3 + minute * 60e3 + second * 1e3),
                    "hour,minute,second"
                )
                : (this.getAttribute("count") || "year,day,hour,minute,second")
        ).split(",");

        // ********************************************************************
        // generic create DOM element with all content and properties
        // this[id] notation optimized for use in this Custom Element
        var element = ({
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
        var attr_CSSprop = (prefix, name, value) =>
            // to read value from attribues 
            name + ":" + (this.getAttribute(prefix + "-" + name)
                || // OR CSS property OR default value
                "var(--event-count-" + prefix + "-" + name + "," + value + ")") + ";";

        // ********************************************************************
        // create full shadowDOM
        this.attachShadow({ mode: "open" }).append(
            // ----------------------------------------------------------------
            element({
                create: "style",
                //id: "style", // prevent from setting default "undefined" string value
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
                    "[part*='text']{" +
                    attr_CSSprop("text", "padding", "0 1rem") +
                    attr_CSSprop("text", "font", "1rem arial") +
                    attr_CSSprop("text", "text-transform", "uppercase") +
                    "}"
            }),
            // --------------------------------------------------------------------
            element({
                id: "event",
                // innerHTML: "<slot>" + (this.getAttribute("event") || "Y2K38 Epochalypse") + "</slot>",
                // using append creates a 3 bytes smaller GZip file
                append: [
                    // fill with default empty <slot> content
                    element({ create: "slot", innerHTML: "Y2K38" })
                ]
            }),
            // --------------------------------------------------------------------
            element({
                id: "count",
                append: labels.map(label => element({ // = "year", "day", "hour", "minute", "second"
                    id: label + "count",
                    append: [
                        element({
                            id: label
                            //, innerHTML: "#" // saving some bytes, after a second the value will be set
                        }),
                        element({
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
        var intervalCounter = setInterval(() => {
            // ---------------------------------------------------------------- 
            var start = new Date();
            var future = new Date(event);
            future < start && ([start, future] = [future, start]); // if count UP swap dates
            var diff = future - start;
            // var day = 864e5; // 864e5 * 365 = 31536e6
            var time = { year: ~~(diff / 31536e6) };

            var leapYears = 0;
            for (var year = start.getFullYear(); year < future.getFullYear(); year++)
                ((year % 4 == 0 && year % 100 != 0) || year % 400 == 0)
                    && (future < start ? leapYears-- : leapYears++);

            //timediff.weeks = ~~((diff -= timediff.years * day * 7)/day);
            time.day = ~~((diff -= time.year * 31536e6) / 864e5) + leapYears;
            time.hour = ~~((diff -= (time.day - leapYears) * 864e5) / 36e5);
            time.minute = ~~((diff -= time.hour * 36e5) / (6e4));
            time.second = ~~((diff -= time.minute * 6e4) / 1e3);
            // ---------------------------------------------------------------- 
            if (labels.map(label => (
                this.setAttribute(label, time[label]),
                // update every counter in the DOM element this[label]
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