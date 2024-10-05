
function AppViewModel() {
    var self = this;
    this.numberOfPlayers = ko.observable("4");
    this.player1 = ko.observable(localStorage.getItem('player1') || '');
    this.player2 = ko.observable(localStorage.getItem('player2') || '');
    this.player3 = ko.observable(localStorage.getItem('player3') || '');
    this.player4 = ko.observable(localStorage.getItem('player4') || '');
    this.playTo = ko.observable(11);
    this.scoringSystem = ko.observable('rally');
    this.serveToWin = ko.observable(false);
    this.has4Players = ko.computed(function() {
        return self.numberOfPlayers() === "4";
    });
    this.player1.subscribe(value => localStorage.setItem('player1', value));
    this.player2.subscribe(value => localStorage.setItem('player2', value));
    this.player3.subscribe(value => localStorage.setItem('player3', value));
    this.player4.subscribe(value => localStorage.setItem('player4', value));
    self.startGame = function() {
        // Create a unique game ID
        const gameId = Date.now(); // Use timestamp as a simple game ID
        
        // Gather game data
        const gameData = {
            id: gameId,
            numberOfPlayers: parseInt(this.numberOfPlayers()),
            playTo: parseInt(this.playTo()),
            scoringSystem: this.scoringSystem(),
            serveToWin: this.serveToWin(),
            players: {
                player1: this.player1(),
                player2: this.player2(),
                player3: this.numberOfPlayers() === "4" ? this.player3() : null,
                player4: this.numberOfPlayers() === "4" ? this.player4() : null,
            },
        };
        
        // Save to localStorage
        localStorage.setItem(`game-${gameId}`, JSON.stringify(gameData));
        
        // Redirect to the game page
        window.location.href = `pickleball.html?id=${gameId}`;
    }
}

ko.applyBindings(new AppViewModel());