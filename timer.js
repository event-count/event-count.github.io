let timer;
let countup = true;
let time = [0, 0, 0, 0, 0, 0]; // [years, weeks, days, hours, minutes, seconds]

function start() {
    timer = setInterval(() => {
        if (countup) {
            time[5]++; // Increment seconds
            for (let i = 5; i >= 0; i--) {
                if (i === 5 && time[i] >= 60) { // 60 seconds in a minute
                    time[i] = 0;
                    time[i - 1]++;
                } else if (i === 4 && time[i] >= 60) { // 60 minutes in an hour
                    time[i] = 0;
                    time[i - 1]++;
                } else if (i === 3 && time[i] >= 24) { // 24 hours in a day
                    time[i] = 0;
                    time[i - 1]++;
                } else if (i === 2 && time[i] >= 7) { // 7 days in a week
                    time[i] = 0;
                    time[i - 1]++;
                } else if (i === 1 && time[i] >= 52) { // Assuming 52 weeks in a year
                    time[i] = 0;
                    time[i - 1]++;
                }
            }
        } else {
            if (time.every((value) => value === 0)) return; // Stop if time reaches zero
            time[5]--; // Decrement seconds
            for (let i = 5; i >= 0; i--) {
                if (i === 5 && time[i] < 0) {
                    time[i] = 59;
                    time[i - 1]--;
                } else if (i === 4 && time[i] < 0) {
                    time[i] = 59;
                    time[i - 1]--;
                } else if (i === 3 && time[i] < 0) {
                    time[i] = 23;
                    time[i - 1]--;
                } else if (i === 2 && time[i] < 0) {
                    time[i] = 6;
                    time[i - 1]--;
                } else if (i === 1 && time[i] < 0) {
                    time[i] = 51;
                    time[i - 1]--;
                }
            }
        }
        console.log(time);
    }, 1000);
}

function stop() {
    clearInterval(timer);
}

// Example usage:
countup = true;
startTimer(); // Start counting up
setTimeout(() => {
    stopTimer(); // Stop timer after 10 seconds
    setTimeout(() => {
        countup = false;
        startTimer(); // Start counting down
        setTimeout(stopTimer, 10000); // Stop timer after another 10 seconds
    }, 2000);
}, 10000);
