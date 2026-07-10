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
}
