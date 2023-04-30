// <event-count> custom element, displaying [year] [day] [hour] [minute] [second] countdown to a date
// counts UP for past dates
// attributes: date, count, noyear, noday, nohour, nominute, nosecond, locale
// date:    date to count down to, default Y2K38 Epochalypse date Counts UP for past dates
// event:   name of event, default "Y2K38 Epochalypse" OR all HTML specified in lightDOM!
// count:   comma separated list of labels to show, default "year,day,hour,minute,second"
// noyear, noday, nohour, nominute, nosecond: hide labels, default show all labels
// format:  language locale to use for labels, default "en" (English)

customElements.define("event-count", class extends HTMLElement {
    connectedCallback() {
        // naming all my variables VAR, they are slightly faster and minify well because CSS has a "var" keyword too
        // set count labels any of ["year", "day", "hour", "minute", "second"]
        // and filter away user defined "noyear" ... "nosecond" attributes
        var countlabels = (this.getAttribute("count") || "year,day,hour,minute,second")
            .split(",")
            .filter(label => !this.hasAttribute("no" + label));

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
                    "#count{display:grid;grid:1fr/repeat(" + countlabels.length + ",1fr);" +
                    attr_CSSprop("count", "color", "#fc0") + // gold
                    attr_CSSprop("count", "font", "2rem arial") +
                    attr_CSSprop("count", "text-align", "center") +
                    attr_CSSprop("count", "background", "#080") + // green
                    "}" +
                    // countdown labels
                    "[part*='label']{" +
                    attr_CSSprop("label", "padding", "0 1rem") +
                    attr_CSSprop("label", "font", "1rem arial") +
                    attr_CSSprop("label", "text-transform", "uppercase") +
                    "}"
            }),
            // --------------------------------------------------------------------
            element({
                id: "event",
                //innerHTML: "<slot>" + (this.getAttribute("event") || "Y2K38 Epochalypse") + "</slot>",
                // using append creates a 3 bytes smaller GZip file
                append: [
                    element({ create: "slot", innerHTML: "Y2K38 Epochalypse" })
                ]
            }),
            // --------------------------------------------------------------------
            element({
                id: "count",
                append: countlabels.map(label => element({ // = "year", "day", "hour", "minute", "second"
                    id: label + "count",
                    append: [
                        element({
                            id: label
                            //, innerHTML: "#" // saving some bytes, after a second the value will be set
                        }),
                        element({
                            id: label + "label",
                            innerHTML:
                                // --------------------------------------------------------------------
                                // get proper locale_labels for all count labels
                                new Intl.RelativeTimeFormat(
                                    this.getAttribute("format") || "en", // todo: query this default from CSS property?
                                    //{ numeric: "auto" }
                                ).formatToParts(
                                    2, // 2 for plural, 1 for singular
                                    label // label in "year,day,hour,minute,second"
                                )[2] // get time label name in locale as Object
                                    .value // get time name in locale as String)
                        })]
                }))
            }))// shadowDOM created

        // ********************************************************************
        var intervalCounter = setInterval(() => {
            
            // ---------------------------------------------------------------- 
            var start = new Date();
            var future = new Date(this.getAttribute("event") || 2147483647e3);// Y2K38 date: "2038-1-19 3:14:7");
            future < start && ([start, future] = [future, start]); // if count UP swap dates
            var diff = future - start;
            var leapYears = 0;
            for (var i = start.getFullYear(); i < future.getFullYear(); i++)
                ((i % 4 == 0 && i % 100 != 0) || i % 400 == 0)
                    && (future < start ? leapYears-- : leapYears++);

            var year = ~~(diff / 31536e6);
            //weeks = ~~((diff -= years * day * 7)/day);
            var day = ~~((diff -= year * 31536e6) / 864e5) + leapYears;
            var hour = ~~((diff -= (day - leapYears) * 864e5) / 36e5);
            var minute = ~~((diff -= hour * 36e5) / (6e4));
            var second = ~~((diff -= minute * 6e4) / 1e3);

            this.year && (this.year.innerHTML = year);
            this.day && (this.day.innerHTML = day);
            this.hour && (this.hour.innerHTML = hour);
            this.minute && (this.minute.innerHTML = minute);
            this.second && (this.second.innerHTML = second);

            if (year + day + hour + minute + second == 0) {
                clearInterval(intervalCounter);
                this.dispatchEvent(new Event(this.id))
            }
        }, 1e3);// ping every second

    } // connectedCallback

})