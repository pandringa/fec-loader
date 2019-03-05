# fec-loader

A set of flexible command line utilities designed to discover, convert and load raw FEC filings into a database. Requires Node and Bash.

To convert a filing to newline-separated JSON without installing, try:
```bash
FILING_ID=1283013; curl -s "http://docquery.fec.gov/dcdev/posted/"$FILING_ID".fec" | npx -p github:PublicI/fec-loader#cli fec2json $FILING_ID > $FILING_ID".ndjson"
```

To install:
```bash
npm install -g github:PublicI/fec-loader#cli
```

To load a filing from the FEC into a Postgres database, run:
```bash
export PGHOST=<database host> PGDATABASE=<database name> PGUSER=<database user> PGPASSWORD=<database password>
FILING_ID=1283013; curl -s "http://docquery.fec.gov/dcdev/posted/"$FILING_ID".fec" | fec2psql $FILING_ID | psql
```

To list the filings available from the FEC's RSS feed run:
```bash
rss2fec
```

To load the most recent five filings from the FEC's RSS feed, run:

```bash
rss2psql | psql
```
