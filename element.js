// <event-count> custom element, displaying [years] [days] [hours] [minutes] [seconds] countdown to a date
// counts UP for past dates
// attributes: date, event, count, noyears, nodays, nohours, nominutes, noseconds, locale
// date:    date to count down to, default Y2K38 Epochalypse date Counts UP for past dates
// event:   name of event, default "Y2K38 Epochalypse" OR all HTML specified in lightDOM!
// count:   comma separated list of labels to show, default "years,days,hours,minutes,seconds"
// noyears, nodays, nohours, nominutes, noseconds: hide labels, default show all labels
// locale:  language to use for labels, default "en" (English)

customElements.define("event-count", class extends HTMLElement {

    // ********************************************************************
    connectedCallback() {
        // naming all my variables VAR, they are slightly faster and minify well because CSS has a "var" keyword too
        // set count labels any of ["years", "days", "hours", "minutes", "seconds"]
        // and filter away user defined "noyears" ... "noseconds" attributes
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
                    element({ create: "slot", innerHTML: this.getAttribute("event") || "Y2K38 Epochalypse" })
                ]
            }),
            // --------------------------------------------------------------------
            element({
                id: "count",
                append: countlabels.map(label => element({ // = "years", "days", "hours", "minutes", "seconds"
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
                                    label // label in "years,days,hours,minutes,seconds"
                                )[2] // get time label name in locale as Object
                                    .value // get time name in locale as String)
                        })]
                }))
            }))// shadowDOM created

        // ----------------------------------------------------------------
        // main interval timer
        // Hey! Its JavaScript! Reusing count variable, so we don't have to declare a new one! Now for a timer function
        var intervalCounter = setInterval(() => {
            // ---------------------------------------------------------------- 
            var start = new Date();
            var future = new Date(this.getAttribute("date") || 2147483647e3);// Y2K38 date: "2038-1-19 3:14:7");
            future < start && ([start, future] = [future, start]); // if count UP swap dates
            var diff = future - start;
            // var day = 864e5; // 864e5 * 365 = 31536e6
            var timediff = { year: ~~(diff / 31536e6) };

            var leapYears = 0;
            for (var year = start.getFullYear(); year < future.getFullYear(); year++)
                ((year % 4 == 0 && year % 100 != 0) || year % 400 == 0)
                    && (future < start ? leapYears-- : leapYears++);

            //timediff.weeks = ~~((diff -= timediff.years * day * 7)/day);
            timediff.day = ~~((diff -= timediff.year * 31536e6) / 864e5) + leapYears;
            timediff.hour = ~~((diff -= (timediff.day - leapYears) * 864e5) / 36e5);
            timediff.minute = ~~((diff -= timediff.hour * 36e5) / (6e4));
            timediff.second = ~~((diff -= timediff.minute * 6e4) / 1e3);
            // ---------------------------------------------------------------- 
            if (countlabels.map(label =>
            (
                this.setAttribute(label, timediff[label]),
                // update every counter in the DOM element this[label]
                /*.map RETURN value: */ this[label].innerHTML = timediff[label]

                // OR minimal DOM updates; update only counters that are not 0 OR the same value as before
                //(this["_" + label] == datedifference[label]) && (this[label].innerHTML = (this["_" + label] = datedifference[label]))

            )).every(value => !value)) {
                // counter is down to 0, stop interval timer
                clearInterval(intervalCounter);
                this.dispatchEvent(new Event(this.id)); // dispatch event
                //this.dispatchEvent(new CustomEvent("event-count", { bubbles: 1, composed: 1 })); // dispatch event
            }
        }, 1e3);// ping every second

    } // connectedCallback

})