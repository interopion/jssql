(function() {

	module("Date Utils");

	test("strftime", function() {
		var date = new Date(1974, 0, 4, 3, 5, 6, 57);

		$.each({
			"%%"   : "%",      // escaped %
			"%%%%" : "%%",     // escaped % (twice)
			"%d"   : "04",     // date (day of month)
			"%f"   : "06.057", // fractional secconds
			"%H"   : "03",     // Hours
			"%j"   : "004",    // Day of year
			"%M"   : "05",     // Minutes
			"%s"   : +date,    // Unix time
			"%S"   : "06",     // Seconds
			"%w"   : "5",      // Day of week
			"%W"   : "00",     // Week
			"%Y"   : "1974",   // Year
			"%z"   : ""        // Timezone
		}, function(pattern, replaced) {
			equal(jsSQL.strftime(pattern, date), replaced);
		});

		equal(jsSQL.strftime("%W", new Date(1974, 0, 1)), "00", "First Tuesday must be week 0");
		equal(jsSQL.strftime("%W", new Date(1974, 0, 2)), "00", "First Wednesday must be week 0");
		equal(jsSQL.strftime("%W", new Date(1974, 0, 3)), "00", "First Thursday must be week 0");
		equal(jsSQL.strftime("%W", new Date(1974, 0, 4)), "00", "First Friday must be week 0");
		equal(jsSQL.strftime("%W", new Date(1974, 0, 5)), "00", "First Saturday must be week 0");
		equal(jsSQL.strftime("%W", new Date(1974, 0, 6)), "00", "First Sunday must be week 0");
		equal(jsSQL.strftime("%W", new Date(1974, 0, 7)), "01", "First Monday must be week 1");
		equal(jsSQL.strftime("%W", new Date(1974, 0, 8)), "01", "Second Tuesday must be week 1");

		equal(jsSQL.strftime("%z", "00:00" ), "");
		equal(jsSQL.strftime("%z", "00:00z"), "Z");
		equal(jsSQL.strftime("%z", "00:00Z"), "Z");
		equal(jsSQL.strftime("%z", "00:00+0"), "Z");
		equal(jsSQL.strftime("%z", "00:00+00"), "Z");
		equal(jsSQL.strftime("%z", "00:00+0000"), "Z");
		equal(jsSQL.strftime("%z", "00:00+00:00"), "Z");
		equal(jsSQL.strftime("%z", "00:00-0000"), "Z");
		equal(jsSQL.strftime("%z", "00:00+1"   ), "+0100", "+1");
		equal(jsSQL.strftime("%z", "00:00-1"   ), "-0100", "-1");
		equal(jsSQL.strftime("%z", "00:00+005" ), "+0005", "+005");
		equal(jsSQL.strftime("%z", "00:00-005" ), "-0005", "-005");
		equal(jsSQL.strftime("%z", "00:00+0015"), "+0015", "+0015");
		equal(jsSQL.strftime("%z", "00:00-0015"), "-0015", "-0015");
		equal(jsSQL.strftime("%z", "00:00+0430"), "+0430", "+0430");
		equal(jsSQL.strftime("%z", "00:00-0430"), "-0430", "-0430");
	});

	test("parseISO8601", function() {

		var d;

		// Invalid input -------------------------------------------------------
		d = JSDB.parseISO8601("1974-07-24");

		equal(d.getFullYear(), 1974);
		equal(d.getMonth()   , 6);
		equal(d.getDate()    , 24);
		equal(d.toString()   , "1974-07-24T00:00:00.000");

		$.each([undefined, null, false, 0, ""], function(i, input) {
			d = JSDB.parseISO8601(input);
			equal(d.getFullYear(), 0);
			equal(d.getMonth()   , 0);
			equal(d.getDate()    , 1);
			equal(d.toString()   , "0000-01-01T00:00:00.000");
		});

		// Times ---------------------------------------------------------------
		$.each({
			"20:15:36.47+02:55" : "0000-01-01T20:15:36.047+0255",
			"20:15:36.47+0255"  : "0000-01-01T20:15:36.047+0255",
			"20:15:36.47+02"    : "0000-01-01T20:15:36.047+0200",
			"20:15:36.47+2"     : "0000-01-01T20:15:36.047+0200",
			"20:15:36.47"       : "0000-01-01T20:15:36.047",
			"20:15:36.4"        : "0000-01-01T20:15:36.004",
			"20:15:36"          : "0000-01-01T20:15:36.000",
			"20:15:3"           : "0000-01-01T20:15:03.000",
			"20:15"             : "0000-01-01T20:15:00.000",
			"20:15z"            : "0000-01-01T20:15:00.000Z",
			"20:15Z"            : "0000-01-01T20:15:00.000Z",
			"20:15:36z"         : "0000-01-01T20:15:36.000Z",
			"20:15:36Z"         : "0000-01-01T20:15:36.000Z",
			"20:15:36.4z"       : "0000-01-01T20:15:36.004Z",
			"20:15:36.4Z"       : "0000-01-01T20:15:36.004Z",
			"20:15:36.47z"      : "0000-01-01T20:15:36.047Z",
			"20:15:36.47Z"      : "0000-01-01T20:15:36.047Z",
			"20:15:36.478Z"     : "0000-01-01T20:15:36.478Z"
		}, function(input, output) {
			equal(JSDB.parseISO8601(input).toString(), output);
		});

		// Date-time -----------------------------------------------------------
		$.each({
			"1974-07-24T20:15:36.47+02:55" : "1974-07-24T20:15:36.047+0255",
			"1974-07-24T20:15:36.47+0255"  : "1974-07-24T20:15:36.047+0255",
			"1974-07-24T20:15:36.47+02"    : "1974-07-24T20:15:36.047+0200",
			"1974-07-24T20:15:36.47+2"     : "1974-07-24T20:15:36.047+0200",
			"1974-07-24T20:15:36.47"       : "1974-07-24T20:15:36.047",
			"1974-07-24T20:15:36.4"        : "1974-07-24T20:15:36.004",
			"1974-07-24T20:15:36"          : "1974-07-24T20:15:36.000",
			"1974-07-24T20:15:3"           : "1974-07-24T20:15:03.000",
			"1974-07-24T20:15"             : "1974-07-24T20:15:00.000",
			"1974-07-24 20:15:36.47+02:55" : "1974-07-24T20:15:36.047+0255",
			"1974-07-24 20:15:36.47+0255"  : "1974-07-24T20:15:36.047+0255",
			"1974-07-24 20:15:36.47+02"    : "1974-07-24T20:15:36.047+0200",
			"1974-07-24 20:15:36.47+2"     : "1974-07-24T20:15:36.047+0200",
			"1974-07-24 20:15:36.47"       : "1974-07-24T20:15:36.047",
			"1974-07-24 20:15:36.4"        : "1974-07-24T20:15:36.004",
			"1974-07-24 20:15:36"          : "1974-07-24T20:15:36.000",
			"1974-07-24 20:15:3"           : "1974-07-24T20:15:03.000",
			"1974-07-24 20:15"             : "1974-07-24T20:15:00.000"
		}, function(input, output) {
			equal(JSDB.parseISO8601(input).toString(), output);
		});

		// Invalid Dates -------------------------------------------------------
		$.each({
			"0000-00-00" : "0000-01-01T00:00:00.000",
			"0000-00-32" : "0000-01-01T00:00:00.000",
			"0000-00-01" : "0000-01-01T00:00:00.000",
			"0000-13-01" : "0000-01-01T00:00:00.000",
			"0000-01-01" : "0000-01-01T00:00:00.000",
			"a000-00-00" : "0000-01-01T00:00:00.000",
			"0000-a0-00" : "0000-01-01T00:00:00.000",
			"0000-00-a0" : "0000-01-01T00:00:00.000",
			"0000 01 01" : "0000-01-01T00:00:00.000"
		}, function(input, output) {
			equal(JSDB.parseISO8601(input).toString(), output);
		});

		// Invalid Times -------------------------------------------------------
		$.each({
			"20:15:36.47+02:556" : "0000-01-01T00:00:00.000",
			"20:15:36.47+024:55" : "0000-01-01T00:00:00.000",
			"20:15:36.106x+02:55": "0000-01-01T00:00:00.000",
			"20:15:66.47+02:55"  : "0000-01-01T00:00:00.000",
			"20:65:36.47+02:55"  : "0000-01-01T00:00:00.000",
			"30:15:36.47+02:55"  : "0000-01-01T00:00:00.000",
			"20 15:36.47+02:55"  : "0000-01-01T00:00:00.000",
			"20:15:36.47/02:55"  : "0000-01-01T00:00:00.000",
			"120:15:36.47"       : "0000-01-01T00:00:00.000"
		}, function(input, output) {
			equal(JSDB.parseISO8601(input).toString(), output);
		});
	});

	test("parseDate", function() {
		equal(jsSQL.parseDate().toString(), "0000-01-01T00:00:00.000");
		equal(jsSQL.parseDate(null).toString(), "0000-01-01T00:00:00.000");
		equal(jsSQL.parseDate(false).toString(), "0000-01-01T00:00:00.000");
		equal(jsSQL.parseDate(0  ).toString("%Y-%m-%d"), "1970-01-01");
		equal(jsSQL.parseDate("0").toString("%Y-%m-%d"), "1970-01-01");

		equal(
			jsSQL.parseDate("1974-07-24T20:15:36.47+02:55"), 
			"1974-07-24T20:15:36.047+0255"
		);

		equal(
			jsSQL.parseDate("1974-07-24T20:15:36.47+02:55", "+1 days"), 
			"1974-07-25T20:15:36.047+0255"
		);

		equal(
			jsSQL.parseDate("1974-07-24T20:15:36.47+02:55", "-1 days"), 
			"1974-07-23T20:15:36.047+0255"
		);

		equal(
			jsSQL.parseDate("1974-07-24T20:15:36.47+02:55", "+1 days", "+1 days"), 
			"1974-07-26T20:15:36.047+0255"
		);

		equal(
			jsSQL.parseDate("1974-07-24T20:15:36.47+02:55", "-1 days", "-1 days"), 
			"1974-07-22T20:15:36.047+0255"
		);

		equal(
			jsSQL.parseDate("1974-07-24T20:15:36.47+02:55", ["+1 days", "+1 days"]), 
			"1974-07-26T20:15:36.047+0255"
		);

		equal(
			jsSQL.parseDate("1974-07-24T20:15:36.47+02:55", ["-1 days", "-1 days"]), 
			"1974-07-22T20:15:36.047+0255"
		);

		equal(
			jsSQL.parseDate("1974-07-24T20:15:36.47+02:55", "+1 months"), 
			"1974-08-24T20:15:36.047+0255"
		);

		equal(
			jsSQL.parseDate("1974-07-24T20:15:36.47+02:55", "+1 years"), 
			"1975-07-24T20:15:36.047+0255"
		);

		equal(
			jsSQL.parseDate("1974-07-24T20:15:36.47+02:55", "+1 hours"), 
			"1974-07-24T21:15:36.047+0255"
		);

		equal(
			jsSQL.parseDate("1974-07-24T20:15:36.47+02:55", "+1 minutes"), 
			"1974-07-24T20:16:36.047+0255"
		);

		equal(
			jsSQL.parseDate("1974-07-24T20:15:36.47+02:55", "+1 seconds"), 
			"1974-07-24T20:15:37.047+0255"
		);

		equal(
			jsSQL.parseDate("1974-07-24T20:15:36.47+02:55", "start of month"), 
			"1974-07-01T00:00:00.000+0255"
		);

		equal(
			jsSQL.parseDate("1974-07-24T20:15:36.47+02:55", "start of year"), 
			"1974-01-01T00:00:00.000+0255"
		);

		equal(
			jsSQL.parseDate("1974-07-24T20:15:36.47+02:55", "localtime").getHours(), 
			18 + (new Date()).getTimezoneOffset() / 60
		);

		equal(
			jsSQL.parseDate("1974-07-24T20:15:36.47+02:55", "utc").getHours(), 
			20 + (new Date()).getTimezoneOffset() / 60
		);

		// Wed -> Sun
		equal(jsSQL.parseDate("1974-07-24T20:15:36.47+02:55", "weekday 0"), "1974-07-28T20:15:36.047+0255", "weekday 0");
		equal(jsSQL.parseDate("1974-07-24T20:15:36.47+02:55", "weekday 1"), "1974-07-29T20:15:36.047+0255", "weekday 1");
		equal(jsSQL.parseDate("1974-07-24T20:15:36.47+02:55", "weekday 2"), "1974-07-30T20:15:36.047+0255", "weekday 2");
		equal(jsSQL.parseDate("1974-07-24T20:15:36.47+02:55", "weekday 3"), "1974-07-24T20:15:36.047+0255", "weekday 3");
		equal(jsSQL.parseDate("1974-07-24T20:15:36.47+02:55", "weekday 4"), "1974-07-25T20:15:36.047+0255", "weekday 4");
		equal(jsSQL.parseDate("1974-07-24T20:15:36.47+02:55", "weekday 5"), "1974-07-26T20:15:36.047+0255", "weekday 5");
		equal(jsSQL.parseDate("1974-07-24T20:15:36.47+02:55", "weekday 6"), "1974-07-27T20:15:36.047+0255", "weekday 6");
	});

})();