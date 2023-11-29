const {
	SlashCommandBuilder,
	EmbedBuilder,
	ActionRow,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
} = require("discord.js");
const DatabaseManager = require("../../Databases/databaseManager");
const { CreateBalance } = require("../../commands/utilities/settings.js");
const { InsertCommas } = require("../../utilities.js");
const settings = require("../../commands/utilities/settings.js");

function ConvertSuitNumToString(n) {
	switch (n) {
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
	switch (n) {
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
	}
}

function CreateCardPool() {
	let pool = [];

	// 2-10 Cards
	for (let s = 0; s <= 3; s++) {
		for (let v = 2; v <= 10; v++) {
			pool.push(
				new Card(NumToStringNum(v), v, ConvertSuitNumToString(s))
			);
		}
	}

	// Picture Cards
	for (let x = 0; x <= 2; x++) {
		for (let s = 0; s <= 3; s++) {
			let n;
			switch (x) {
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
	for (let s = 0; s <= 3; s++) {
		pool.push(new Card("Ace", 11, ConvertSuitNumToString(s)));
	}

	return pool;
}

let activeGameIds = []; // An array of active user ids to prevent the user from having multiple ongoing games
module.exports = {
	data: new SlashCommandBuilder()
		.setName("blackjack")
		.setDescription(
			"Bet money on blackjack against the computer. Also known as 21 or pontoon."
		)
		.addIntegerOption((option) => {
			return option
				.setName("amount")
				.setDescription(
					"The amount of money you are willing to bet, will be doubled if you win"
				)
				.setRequired(true);
		}),
	async execute(interaction) {
		// Buttons displayed on the embed when sent to the channel
		const drawButton = new ButtonBuilder()
			.setCustomId("draw")
			.setLabel("Draw")
			.setStyle(ButtonStyle.Success);

		const stickButton = new ButtonBuilder()
			.setCustomId("stick")
			.setLabel("Stick")
			.setStyle(ButtonStyle.Secondary);

		const doubleButton = new ButtonBuilder()
			.setCustomId("double")
			.setLabel("Double")
			.setStyle(ButtonStyle.Danger)
			.setDisabled(true);

		const splitButton = new ButtonBuilder()
			.setCustomId("split")
			.setLabel("Split")
			.setStyle(ButtonStyle.Primary)
			.setDisabled(true);

		// Checks for an active game in the activeGameIds array
		if (activeGameIds.includes(interaction.user.id))
			return interaction.reply(
				"You can't do that, there's already a game going on!"
			);

		const economyDB = DatabaseManager.InitialiseDatabase("economy.db");

		// Fetches user's balance
		const row = await economyDB.Get(
			"SELECT * FROM Balances WHERE Guild = ? AND User = ?",
			[interaction.guild.id, interaction.user.id]
		);

		// Gives user a balance if they dont presently have one
		if (!row) {
			CreateBalance(interaction.guild.id, interaction.user.id);
			return interaction.reply(
				"You didn't have a balance, I've given you the default now, please try again"
			);
		}

		// Amount specified by the user in the interaction
		let amount = interaction.options.getInteger("amount");

		// Balance from DB query previous
		let balance = row.Balance;
		let loseBalance = balance - amount;

		// Ensures user has sufficient funds and hasnt entered a negative value
		if (loseBalance < 0)
			return interaction.reply(
				"You don't have enough money to bet that much, ya muppet"
			);
		if (amount < 0)
			return interaction.reply(
				"What, you want to give me money if you win?"
			);

		//Sets lose balance before game start to prevent the user from abandoning the game when dealt a bad hand
		economyDB.RunValues(
			"UPDATE Balances SET Balance = ? WHERE Guild = ? AND User = ?",
			[loseBalance, interaction.guild.id, interaction.user.id]
		);

		economyDB.Close();
		const cardPool = CreateCardPool();

		// Player class containing an array of their cards and various functions for actions to take
		class Player {
			constructor(cards = [], draws = 0) {
				this.cards = cards;
				this.draws = draws;
			}

			// Draws a random card from the current card pool and stores it to the cards array
			DrawCard(q = 1) {
				for (let i = 0; i < q; i++) {
					const cardIndex = Math.floor(
						Math.random() * cardPool.length
					);
					const card = cardPool[cardIndex];

					cardPool.splice(cardIndex, 1);

					this.cards.push(card);
					this.draws++;
				}
			}

			// For testing purposes only, draws a specific card rather than it being random, will not remove from card pool
			DrawSetCard(card) {
				this.cards.push(card);
				this.draws++;
			}

			// Gets the total value of all cards the player has including max ace value
			GetTotalValue() {
				let total = 0;
				this.cards.forEach((card) => {
					total += card.value;
				});

				return total;
			}

			// Returns whether or not the user has any aces
			HasAces() {
				this.cards.forEach((card) => {
					if (card.value === 11) return true;
				});

				return false;
			}

			// Gets the value of cards based on aces' lowest value
			GetAcesLowValue() {
				let total = 0;
				this.cards.forEach((card) => {
					if (card.value === 11) {
						total++;
					} else {
						total += card.value;
					}
				});

				return total;
			}

			// Checks if the user is bust no matter what (assumes low ace values)
			IsBust() {
				if (this.GetAcesLowValue() <= 21) return false;
				else return true;
			}

			// Checks if the user is bust when not counting ace low values
			IsAceBust() {
				if (this.GetTotalValue() <= 21) return false;
				else return true;
			}

			// Checks if the user is able to double their bet
			CanDouble() {
				if ([9, 10, 11].includes(this.GetAcesLowValue())) return true;
				else return false;
			}

			// Returns a stringified version of the card array to display in the embed
			StringifyCards(retainComma = false) {
				if (this.cards.length === 0) return " None";

				let cardsStr = "";
				this.cards.forEach((card) => {
					cardsStr += ` ${card.displayName}, `;
				});

				if (retainComma) return cardsStr;
				else return cardsStr.slice(0, -2);
			}
		}

		// Instantiates a player and a computer Player object and draws the starting cards
		let player = new Player();
		let computer = new Player();
		computer.DrawCard();
		player.DrawCard(2);

		// Verifies the player has sufficient money and cards to double and enables the button if so
		if (amount * 2 <= balance && player.CanDouble())
			doubleButton.setDisabled(false);

		// Will automatically trigger natural win if the user manages to get an ace and a ten
		if (player.GetTotalValue() === 21) return CheckWinConditions(true);


		// Returns an updated embed to display when the game state changes
		function RefreshGameEmbed() {
			return new EmbedBuilder()
				.setTitle(`Blackjack: ${interaction.user.globalName}`)
				.setColor("Blurple")
				.setFooter({
					text: `Betting $${amount}`,
					iconURL: interaction.member.displayAvatarURL(),
				}).setDescription(`
                **Dealer Cards**:${computer.StringifyCards(true)}???
    
                **Your Cards**:${player.StringifyCards()}
                **Card Value**: ${player.GetTotalValue()} / ${player.GetAcesLowValue()}
            
            `);
		}

		function RefreshActionRow() {
			return (actionRow = new ActionRowBuilder().addComponents(
				drawButton,
				stickButton,
				doubleButton,
				splitButton
			));
		}

		// Draws as the dealer would until they have at least 17
		function ComputerDraw() {
			if (computer.GetAcesLowValue() <= 17) {
				computer.DrawCard();
				ComputerDraw();
			}
		}

		activeGameIds.push(interaction.user.id);
		const resp = await interaction.reply({
			embeds: [RefreshGameEmbed()],
			components: [RefreshActionRow()],
		});

		// Listens for button presses by the desginated user and repeats via recursion until broken out of when a game ending condition is met
		async function AwaitButton() {
			const collectFilter = (x) => x.user.id === interaction.user.id;
			try {
				// Sets the listener with a 2 minute timeout
				const c = await resp.awaitMessageComponent({
					filter: collectFilter,
					time: 120_000,
				});

				switch (c.customId) {
					case "draw":
						player.DrawCard();

						if (!doubleButton.data.disabled)
							doubleButton.setDisabled(true);
						if (player.IsBust()) {
							return CheckWinConditions();
						}

						break;

					case "stick":
						return CheckWinConditions();
					case "double":
						// Doubles the bet if they desire and updates the balance as appropriate
						amount *= 2;
						loseBalance = balance - amount;

						economyDB.Open();
						await economyDB.RunValues(
							"UPDATE Balances SET Balance = ? WHERE Guild = ? AND User = ?",
							[
								loseBalance,
								interaction.guild.id,
								interaction.user.id,
							]
						);
						economyDB.Close();

						player.DrawCard();
						return CheckWinConditions();

					// Not yet implemented
					case "split":
						break;

					default:
						break;
				}

				c.deferUpdate();
				interaction.editReply({
					embeds: [RefreshGameEmbed()],
					components: [RefreshActionRow()],
				});
				AwaitButton();
			} catch (e) {
				console.log(e);
				// Catches the error when no response is given is the 2m
				await interaction.editReply({
					content: "No action received within 2 minutes, cancelling",
					components: [],
				});
			}
		}

		await AwaitButton();

		// Checks wins conditions to determine whether or not the player or the dealer wins
		function CheckWinConditions(natural21 = false) {
			ComputerDraw();

			let finalComputerValue, finalPlayerValue;
			const computerIsBust = computer.IsBust();
			const playerIsBust = player.IsBust();

			finalComputerValue = computer.IsAceBust()
				? computer.GetAcesLowValue()
				: computer.GetTotalValue();
			finalPlayerValue = player.IsAceBust()
				? player.GetAcesLowValue()
				: player.GetTotalValue();

			let amountWon = 2 * amount;

			if (natural21) {
				amountWon = amount * 3;
				interaction.reply({
					embeds: [
						new EmbedBuilder()
							.setTitle("You Win!")
							.setColor("Green")
							.setDescription(
								`You got a natural blackjack on your first 2 cards:\n${player.StringifyCards()}\n\nEnjoy the free money!`
							)
							.setFooter({ text: `You won $${InsertCommas(amountWon)}` }),
					],
				});
				
				PlayerWin();
			} else if (playerIsBust) {
				return interaction.editReply({
					embeds: [
						new EmbedBuilder()
							.setTitle("You Lose!")
							.setColor("LightGrey")
							.setDescription(
								`You bust by ${finalPlayerValue - 21} point${
									finalPlayerValue - 21 > 1 ? "s" : ""
								}, unfortunate!`
							)
							.setFooter({ text: `You lost $${amount}!` }),
					],
					components: [],
				});
			} else if (computerIsBust) {
				// Computer busts

				interaction.editReply({
					embeds: [
						new EmbedBuilder()
							.setTitle("You Win!")
							.setColor("Green")
							.setDescription(
								`The dealer bust by ${
									computer.GetAcesLowValue() - 21
								}, you win!`
							)
							.setFooter({ text: `You've won $${InsertCommas(InsertCommas(amountWon))}` }),
					],
					components: [],
				});

				PlayerWin();
			} else if (finalPlayerValue > finalComputerValue) {
				interaction.editReply({
					embeds: [
						new EmbedBuilder()
							.setTitle("You Win!")
							.setColor("Green")
							.setDescription(
								`You beat the dealer by ${
									finalPlayerValue - finalComputerValue
								}! He had ${finalComputerValue} while you had ${finalPlayerValue}`
							)
							.setFooter({ text: `You've won $${InsertCommas(amountWon)}` }),
					],
					components: [],
				});

				PlayerWin();
			} else if (finalPlayerValue < finalComputerValue) {
				interaction.editReply({
					embeds: [
						new EmbedBuilder()
							.setTitle("You Lose!")
							.setColor("Red")
							.setDescription(
								`The dealer won by ${
									finalComputerValue - finalPlayerValue
								} with a total of ${finalComputerValue}!` 
							)
							.setFooter({ text: `You've lost $${amount}` }),
					],
					components: [],
				});
			} else if (finalPlayerValue === finalComputerValue) {
				interaction.editReply({
					embeds: [
						new EmbedBuilder()
							.setTitle("You Lose!")
							.setColor("Gold")
							.setDescription(
								`You drew with the dealer, how unfortunate!`
							)
							.setFooter({ text: `You've lost $${amount}` }),
					],
					components: [],
				});
			}

			// Runs in the event of the player winning and sets their new winning balance
			function PlayerWin() {
				economyDB.Open();
				economyDB.RunValues(
					"UPDATE Balances SET Balance = ? WHERE Guild = ? AND User = ?",
					[
						loseBalance + InsertCommas(amountWon),
						interaction.guild.id,
						interaction.user.id,
					]
				);
				economyDB.Close();
			}
		}

		// Removes the user's id from the ongoing games list
		activeGameIds.splice(activeGameIds.indexOf(interaction.user.id), 1);
	},
};
