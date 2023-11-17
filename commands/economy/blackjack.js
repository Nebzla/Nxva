const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const DatabaseManager = require("../../Databases/databaseManager");
const { CreateBalance } = require("../../commands/utilities/settings.js");
const { InsertCommas } = require("../../utilities.js")

function ConvertSuitNumToString(n) {
    switch(n) {
        case 0:
            return "Hearts";
        case 1:
            return "Diamonds";
        case 2:
            return "Clubs";
        case 3:
            return "Spades";
        default:
            return null;
    }
}
function NumToStringNum(n) {
    switch(n) {
        case 2:
            return "Two";
        case 3:
            return "Three";
        case 4:
            return "Four";
        case 5:
            return "Five";
        case 6:
            return "Six";
        case 7:
            return "Seven";
        case 8:
            return "Eight";
        case 9:
            return "Nine";
        case 10:
            return "Ten";
        default:
            return null;
    }
}

class Card {

    constructor(name, value, suit) {
        this.name = name; // Exp Two, Three etc
        this.displayName = `${name} of ${suit}`; 
        this.suit = suit; //Exp Heart, Diamond, etc
        this.value = value; // Exp actual card value
    };

}


function CreateCardPool() {
    let pool = []

    // 2-10 Cards
    for (let s = 0; s <= 3; s++) {
        for (let v = 2; v <= 10; v++) {
            pool.push(new Card(NumToStringNum(v), v, ConvertSuitNumToString(s)));
        }
        
    }

    // Picture Cards
    for(let x = 0; x <= 2; x++) {
        for(let s = 0; s <= 3; s++) {
            let n;
            switch(x) {
                case 0:
                    n = "Jack";
                    break;
                case 1:
                    n = "Queen";
                    break;
                case 2:
                    n = "King";
                    break;
                default:
                    n = "NULL";
                    break;
            }

            pool.push(new Card(n, 10, ConvertSuitNumToString(s)));

        }
    }
    // Aces
    for(let s = 0; s <= 3; s++) {
        pool.push(new Card("Ace", 11, ConvertSuitNumToString(s)));
    }

    return pool;



}

// Also do this for a set member
module.exports = {
	data: new SlashCommandBuilder()
    .setName('blackjack')
    .setDescription('Bet money on blackjack against the computer. Also known as 21 or pontoon.')
    .addIntegerOption(option => {
        return option
        .setName('amount')
        .setDescription('The amount of money you are willing to bet, will be doubled if you win')
        .setRequired(true)
    }),
    async execute(interaction) {
        const amount = interaction.options.getInteger('amount');
        const cardPool = CreateCardPool();

        class Player {
            constructor(cards = [], draws = 0) {
                this.cards = cards;
                this.draws = draws;
            };
        
            DrawCard(q = 1) {

                for (let i = 0; i < q; i++) {
                    const cardIndex = Math.floor(Math.random() * cardPool.length);
                    const card = cardPool[cardIndex];
            
                    cardPool.splice(cardIndex, 1);
            
                    this.cards.push(card);
                    this.draws ++;        
                };
            };

            GetTotalValue() {
                let total = 0;
                this.cards.forEach(card => {
                    total += card.value;
                });
            
                return total;
            
            };

            HasAces() {
                this.cards.forEach(card => {
                    if(card.value === 11) return true;
                });

                return false;
            }

            GetAcesLowValue() {
                let total = 0;
                this.cards.forEach(card => {
                    total += card.value;
                    if(card.value === 11) total ++;
                });
            
                return total;
            };

            StringifyCards() {
                if(this.cards.length === 0) return " None";

                let cardsStr = "";
                this.cards.forEach(card => {
                    cardsStr += ` ${card.displayName}, `;
                })

                cardsStr += "...";

                return cardsStr;
            } 
        
        
        };

        let player = new Player();
        let computer = new Player();
        computer.DrawCard();

        let gameEmbed = new EmbedBuilder()
        .setTitle(`Blackjack: ${interaction.user.globalName}`)
        .setColor('Blurple')
        .setFooter({text: `Betting $${amount}`, iconURL: interaction.member.displayAvatarURL()})
        .setDescription(`
Dealer Cards:${computer.StringifyCards()}

Your Cards:${player.StringifyCards()}
Card Value: ${player.GetTotalValue()}${player.HasAces() ? ` / ${player.GetAcesLowValue()}` : ""}
        
`)


        interaction.reply({embeds: [gameEmbed]});















    }
};
