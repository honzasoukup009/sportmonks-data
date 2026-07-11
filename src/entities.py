"""Known Sportmonks v3 football entities: endpoint path + default 'include' string."""

ENTITY_ENDPOINTS = {
    "team-search": {
        "path": "teams/search/{id}",
        "include": None,
    },
    "player-search": {
        "path": "players/search/{id}",
        "include": None,
    },
    "team": {
        "path": "teams/{id}",
        "include": "players.player;coaches;venue",
    },
    "player": {
        "path": "players/{id}",
        "include": "statistics.details.type;position;nationality",
    },
    "squad": {
        "path": "squads/teams/{id}",
        "include": "player;position",
    },
    "team-stats": {
        "path": "teams/{id}",
        "include": "statistics.details.type",
    },
    "team-fixtures": {
        "path": "fixtures/between/{start}/{end}/{id}",
        "include": "participants;scores;statistics.type;events.type;referees.referee;referees.type",
    },
    "head-to-head": {
        # --id = team1, --start = team2 (reusing existing CLI args for a one-off spike)
        "path": "fixtures/head-to-head/{id}/{start}",
        "include": "participants;scores",
    },
    "standings": {
        "path": "standings/seasons/{id}",
        "include": "participant",
    },
    "topscorers": {
        "path": "topscorers/seasons/{id}",
        "include": "player;participant",
    },
    "league-seasons": {
        "path": "leagues/{id}",
        "include": "seasons",
    },
    "league-search": {
        "path": "leagues/search/{id}",
        "include": None,
    },
    "fixture": {
        "path": "fixtures/{id}",
        "include": None,
    },
    "league-fixtures": {
        # --id = league id. All matches for a league within the date window
        # (max 100 days per request; the client still paginates within that
        # window automatically), with full per-participant statistics — far
        # fewer requests than fetching per-team.
        "path": "fixtures/between/{start}/{end}",
        "include": "participants;statistics.type",
        "extra_params": {"filters": "fixtureLeagues:{id}"},
    },
}
