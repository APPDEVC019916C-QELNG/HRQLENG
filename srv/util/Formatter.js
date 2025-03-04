class Formatter {
    constructor() { }


    formatDate = (sDate) => {
        const timestampMatch = sDate.match(/\/Date\((-?\d+)\)\//);

        if (!timestampMatch) {
            throw new Error("Invalid date format");
        }

        const timestamp = parseInt(timestampMatch[1], 10);

        // Convert timestamp to a Date object
        const date = new Date(timestamp);

        // Format the date as YYYY-MM-DD
        const formattedDate = date.toISOString().split('T')[0];

        return formattedDate;
    }
}

module.exports = Formatter;