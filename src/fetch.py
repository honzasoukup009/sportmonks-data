import argparse
import sys
from pathlib import Path

import pandas as pd
from dotenv import load_dotenv

from src.entities import ENTITY_ENDPOINTS
from src.sportmonks_client import SportmonksClient


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Fetch selected data from the Sportmonks API")
    parser.add_argument("--entity", required=True, choices=sorted(ENTITY_ENDPOINTS), help="What kind of data to pull")
    parser.add_argument("--id", required=True, help="Sportmonks entity ID (team ID, player ID, etc.)")
    parser.add_argument("--include", default=None, help="Override the default 'include' string")
    parser.add_argument("--output", default="data/output.csv", help="Where to write the flattened CSV")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    load_dotenv()
    args = parse_args(argv)

    config = ENTITY_ENDPOINTS[args.entity]
    path = config["path"].format(id=args.id)
    include = args.include or config["include"]

    client = SportmonksClient()
    records = client.get(path, include=include)

    if not records:
        print("No data returned.", file=sys.stderr)
        return 1

    df = pd.json_normalize(records, sep=".")
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(output_path, index=False)
    print(f"Wrote {len(df)} row(s) to {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
