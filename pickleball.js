function AppViewModel() {
    const self = this;
    // Extract game ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('id');

    // Read game details from localStorage
    if (gameId) {
        const gameDetails = localStorage.getItem(`game-${gameId}`);
        if (gameDetails) {
            this.gameDetails = JSON.parse(gameDetails);
            console.log(this.gameDetails)
        } else {
            this.gameDetails = {};
            console.warn('No game details found in localStorage for gameId:', gameId);
        }
    } else {
        this.gameDetails = {};
        console.warn('No gameId found in URL');
    }
    this.detailsShown = ko.observable(false);
    this.toggleDetails = function() {
        this.detailsShown(!this.detailsShown());
    }
    this.scoringHistory = ko.observableArray([]);
    this.scoreClick = function(side, box) {
        const scores = self.scores();
        const teamPositions = self.teamPositions();
        const outcome = updateRallyScore(scores.score, teamPositions[side], self.gameDetails.playTo, self.gameDetails.serveToWin);
        // Need to swap positions if no handout
        if(!outcome.handout) {
            const swappingTeam = self.teamPositions()[side];
            const positions = {...self.positions()[swappingTeam]};
            self.positions({...self.positions(), [swappingTeam]: {left: positions.right, right: positions.left}});
        }
        self.scores(outcome);
    }
    
    this.positions = ko.observable({A: {left: 2, right: 1}, B: {left: 4, right: 3}})
    this.teamPositions = ko.observable({left: 'A', right: 'B'});
    this.topLeftPlayer = ko.computed(function() {
        const p = self.positions()
        const t = self.teamPositions()
        return self.gameDetails.players[`player${p[t.left].left}`];
    })
    this.bottomLeftPlayer = ko.computed(function() {
        const p = self.positions()
        const t = self.teamPositions()
        return self.gameDetails.players[`player${p[t.left].right}`];
    })
    this.bottomRightPlayer = ko.computed(function() {
        const p = self.positions()
        const t = self.teamPositions()
        return self.gameDetails.players[`player${p[t.right].left}`];
    })
    this.topRightPlayer = ko.computed(function() {
        const p = self.positions()
        const t = self.teamPositions()
        return self.gameDetails.players[`player${p[t.right].right}`];
    })
    this.scores = ko.observable({score: {A: 6, B: 6, servingTeam: 'A', server: 1}, winner: '', handout: false, gameBall: false});
    this.hasServer = ko.computed(function() {
        return self.scores().servingTeam !== '';
    })
    this.leftScore = ko.computed(function() {
        return self.scores().score[self.teamPositions().left];
    })
    this.rightScore = ko.computed(function() {
        return self.scores().score[self.teamPositions().right];
    })
    this.leftTeamName = ko.computed(function() {
        return teamName('left', self);
    })
    this.rightTeamName = ko.computed(function() {
        return teamName('right', self);
    })
    this.swapTeamSide = function() {
        const teamPositions = self.teamPositions();
        self.teamPositions({left: teamPositions.right, right: teamPositions.left});
    }
    this.setServer = function(side) {
        const teamPositions = self.teamPositions();
        const scores = self.scores();
        scores.score.servingTeam = teamPositions[side];
        self.scores(scores);
    }
    this.isLeftTeamServing = ko.computed(function() {
        return self.scores().score.servingTeam === self.teamPositions().left;
    })
    this.isRightTeamServing = ko.computed(function() {
        return self.scores().score.servingTeam === self.teamPositions().right;
    })
    this.isTopLeftServer = ko.computed(function() {
        return self.isLeftTeamServing() && self.leftScore() % 2 === 1;
    })
    this.isBottomLeftServer = ko.computed(function() {
        return self.isLeftTeamServing() && self.leftScore() % 2 === 0;
    })
    this.isTopRightServer = ko.computed(function() {
        return self.isRightTeamServing() && self.rightScore() % 2 === 0;
    })
    this.isBottomRightServer = ko.computed(function() {
        return self.isRightTeamServing() && self.rightScore() % 2 === 1;
    })
    this.hasWinner = ko.computed(function() {
        return self.scores().winner !== '';
    })
    this.winnerName = ko.computed(function() {
        // Now we're going from team A/B to left/right which is a bit confusing, but just a few cases to handle
        const winner = self.scores().winner;
        if( !winner ) {
            return '';
        }
        const teamPositions = self.teamPositions();
        if (winner === 'A') {
            if(teamPositions.left === 'A') {
                return teamName('left', self);
            } else {
                return teamName('right', self);
            }
        } else if (winner === 'B') {
            if(teamPositions.left === 'B') {
                return teamName('left', self);
            } else {
                return teamName('right', self);
            }
        }
    })
}

const teamName = function(side, self) {
    const team = self.teamPositions()[side];
    if (team === 'A') {
        return `${self.gameDetails.players.player1} & ${self.gameDetails.players.player2}`;
    } else {
        return `${self.gameDetails.players.player3} & ${self.gameDetails.players.player4}`;
    }
}


function updateRallyScore(currentScore, scoringTeam, playTo, serveToWin) {
    let { A, B, servingTeam, server } = currentScore;
    let handout = false;
    let gameBall = false;
    let winner = '';

    if (servingTeam === scoringTeam) {
        // If the serving team scores
        if (scoringTeam === 'A') {
            A += 1;
        } else {
            B += 1;
        }
    } else {
        // Handout occurs, switch serving team
        handout = true;
        let scoringTeamGetsAPoint = true;
        // Exeption if they were one point away from winning, but not serving
        if(serveToWin) {
            if ((A === playTo - 1 && scoringTeam === 'A') || (B === playTo - 1 && scoringTeam === 'B')) {
                scoringTeamGetsAPoint = false;
            }
        }
        if(scoringTeamGetsAPoint) {
            if (scoringTeam === 'A') {
                A += 1;
            } else {
                B += 1;
            }
        }
        
        servingTeam = scoringTeam;

    }

    // Determine if game ball (one point away from winning)
    if(!serveToWin) {
        if ((A === playTo - 1) || (B === playTo - 1)) {
            gameBall = true;
        }
    } else {
        if ((A === playTo - 1 && servingTeam === 'A') || (B === playTo - 1 && servingTeam === 'B')) {
            gameBall = true;
        }
    }

    // Check if the serving team wins
    if (A === playTo) {
        winner = 'A'
    } else if (B === playTo) {
        winner = 'B'
    }

    
    return {
        score: { A, B, servingTeam, server },
        handout,
        gameBall,
        winner
    };
}


ko.applyBindings(new AppViewModel());
