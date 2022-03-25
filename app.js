const Dex = new Pokedex.Pokedex();

const App = new Vue({
    el: "#app",
    data: {
        generation: 0,
        movesText: ["", "", "", ""],
        versionGroups: [],
        version: "",
        results: [],
    },
    methods: {
        async init() {
            groupList = await Dex.getVersionGroupsList();
            this.versionGroups = groupList.results.map(v => v.name);
            console.log(this.versionGroups);
        },
        async verifyMoveset(moves) {
            let moveset = (await Dex.getMovesList()).results.map(v => v.name);
            for (let move of moves) {
                if (!moveset.includes(move)) return false;
            }
            return true;
        },
        async getPokemon() {
            if (this.version === "") {
                this.results = ["ERR: Select a version"];
                return;
            }

            let moves = this.movesText.map(v => v.toLowerCase()).filter(v => v !== "").map(v => v.replace(" ", "-"));
            if (moves.length === 0) {
                this.results = ["ERR: Include at least one move"];
                return;
            }

            let legalMoveset = await this.verifyMoveset(moves);
            console.log(legalMoveset);
            if (!legalMoveset) {
                this.results = ["ERR: One or more moves is invalid"];
                return;
            }

            this.results = ["..."];
            let pkmnCount = (await Dex.getPokedexByName(1)).pokemon_entries.length;
            for (let i = 1; i <= pkmnCount; i++) {
                let pokemon = await Dex.getPokemonByName(i);
                console.log(pokemon.name);

                if (pokemon.game_indices.length > 0) {
                    let earliestVersion = pokemon.game_indices[0].version.name;
                    let earliestVersionGroup = (await Dex.getVersionByName(earliestVersion)).version_group.name;
                    if (this.versionGroups.indexOf(this.version) < this.versionGroups.indexOf(earliestVersionGroup)) {
                        this.results.pop();
                        return;
                    }
                }

                let moveset = pokemon.moves;
                let validPkmn = moves.every(move => {
                    return moveset.some(tested => {
                        return (tested.move.name === move && tested.version_group_details.some(version => {
                            {
                                return (version.version_group.name === this.version);
                            }
                        }));
                    })
                });
                if (validPkmn) {
                    this.results[this.results.length-1] = pokemon.name;
                    this.results.push("...");
                    if (this.results.length > 50) {
                        this.results[this.results.length-1] = "+ more";
                        return;
                    }
                }
            }
            this.results.pop();
        }
    },
    mounted() {
        this.init();
    }
});