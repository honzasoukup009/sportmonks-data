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
}
