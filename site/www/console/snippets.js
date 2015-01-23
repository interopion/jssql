<snippets>
	<item name="DROP TABLE">
		<description>Drops a table if exists</description>
		<sql>
<![CDATA[
DROP TABLE IF EXISTS "City";
]]>
		</sql>
	</item>

	<item name="CREATE TABLE">
		<description>
		Creates a table called 'City' in the current DB.
		Requires a database to be selected first (see the USE example).    
		</description>
		<sql> 
<![CDATA[
CREATE TABLE "City" (
	"ID"          int(11)  NOT NULL AUTO_INCREMENT,
	"Name"        char(35) NOT NULL DEFAULT '',
	"CountryCode" char(3)  NOT NULL DEFAULT '',
	"District"    char(20) NOT NULL DEFAULT '',
	"Population"  int(11)  NOT NULL DEFAULT '0',
	PRIMARY KEY ("ID"),
	KEY "CountryCode" ("CountryCode")
);
]]>
		</sql>
	</item>
</snippets>
