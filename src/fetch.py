import argparse
import sys
from datetime import date
from pathlib import Path

import pandas as pd
from dotenv import load_dotenv

from src.entities import ENTITY_ENDPOINTS
from src.sportmonks_client import SportmonksClient


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Fetch selected data from the Sportmonks API")
    parser.add_argument("--entity", required=True, choices=sorted(ENTITY_ENDPOINTS), help="What kind of data to pull")
    parser.add_argument(
        "--id",
        required=True,
        help="Sportmonks entity ID, or a name/query string for *-search entities",
    )
    parser.add_argument("--include", default=None, help="Override the default 'include' string")
    parser.add_argument(
        "--start",
        default=None,
        help="Start date (YYYY-MM-DD) for date-ranged entities like team-fixtures; defaults to Jan 1 of the current year",
    )
    parser.add_argument(
        "--end",
        default=None,
        help="End date (YYYY-MM-DD) for date-ranged entities like team-fixtures; defaults to Dec 31 of the current year",
    )
    parser.add_argument("--output", default="data/output.csv", help="Where to write the flattened CSV")
    return parser.parse_args(argv)


def split_nested_lists(records: list[dict]) -> dict[str, pd.DataFrame]:
    """Split records into a main table plus one companion table per nested list-of-dicts field.

    pandas.json_normalize only flattens nested dicts (e.g. venue -> venue.name); nested lists
    (e.g. a team's players/coaches) are left as unreadable stringified Python literals in a
    single cell. This pulls each such list out into its own table, one row per item, tagged
    with the parent record's id so it can still be joined back.
    """
    scalar_records = []
    child_rows: dict[str, list[dict]] = {}

    for record in records:
        parent_id = record.get("id")
        scalar_record = {}
        for key, value in record.items():
            if isinstance(value, list) and value and all(isinstance(item, dict) for item in value):
                for child in value:
                    child_rows.setdefault(key, []).append({"parent_id": parent_id, **child})
            else:
                scalar_record[key] = value
        scalar_records.append(scalar_record)

    tables = {"": pd.json_normalize(scalar_records, sep=".")}
    for key, rows in child_rows.items():
        tables[key] = pd.json_normalize(rows, sep=".")
    return tables


def main(argv: list[str] | None = None) -> int:
    load_dotenv()
    args = parse_args(argv)

    current_year = date.today().year
    start = args.start or f"{current_year}-01-01"
    end = args.end or f"{current_year}-12-31"

    config = ENTITY_ENDPOINTS[args.entity]
    path = config["path"].format(id=args.id, start=start, end=end)
    include = args.include or config["include"]

    client = SportmonksClient()
    records = client.get(path, include=include)

    if not records:
        print("No data returned.", file=sys.stderr)
        return 1

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    stem, suffix = output_path.stem, output_path.suffix or ".csv"

    rows_written = 0
    for name, df in split_nested_lists(records).items():
        if df.empty:
            continue
        table_path = output_path if not name else output_path.with_name(f"{stem}.{name}{suffix}")
        df.to_csv(table_path, index=False)
        print(f"Wrote {len(df)} row(s) to {table_path}")
        rows_written += len(df)

    if rows_written == 0:
        print("No data returned.", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
