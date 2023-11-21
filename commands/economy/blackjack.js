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

let activeGameIds = [];

// Also do this for a set member
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
			.setStyle(ButtonStyle.Danger);

		const splitButton = new ButtonBuilder()
			.setCustomId("split")
			.setLabel("Split")
			.setStyle(ButtonStyle.Primary);

		if (activeGameIds.includes(interaction.user.id))
			return interaction.reply(
				"You can't do that, there's already a game going on!"
			);

		const economyDB = DatabaseManager.InitialiseDatabase("economy.db");

		const row = await economyDB.Get(
			"SELECT * FROM Balance WHERE Guild = ? AND User = ?",
			[interaction.guild.id, interaction.user.id]
		);

		if (!row) {
			settings.CreateBalance(interaction.guild.id, interaction.user.id);
			return interaction.reply(
				"You didn't have a balance, I've given you the default now, please try again"
			);
		}

		let amount = interaction.options.getInteger("amount");

		let balance = row.Balance;
		let loseBalance = balance - amount;

		if (loseBalance < 0)
			return interaction.reply(
				"You don't have enough money to bet that much, ya muppet"
			);
		if (amount < 0)
			return interaction.reply(
				"What, you want to give me money if you win?"
			);

		if (amount * 2 > balance) doubleButton.setDisabled(true);

		economyDB.RunValues(
			"UPDATE Balance SET Balance = ? WHERE Guild = ? AND User = ?",
			[loseBalance, interaction.guild.id, interaction.user.id]
		);
		//Sets lose balance now to prevent the user from abandoning the game when dealt a bad hand

		economyDB.Close();

		const cardPool = CreateCardPool();

		class Player {
			constructor(cards = [], draws = 0) {
				this.cards = cards;
				this.draws = draws;
			}

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

			GetTotalValue() {
				let total = 0;
				this.cards.forEach((card) => {
					total += card.value;
				});

				return total;
			}

			HasAces() {
				this.cards.forEach((card) => {
					if (card.value === 11) return true;
				});

				return false;
			}

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

			IsBust() {
				if (this.GetAcesLowValue() <= 21) return false;
				else return true;
			}
			IsAceBust() {
				if (this.GetTotalValue() <= 21) return false;
				else return true;
			}

			StringifyCards() {
				if (this.cards.length === 0) return " None";

				let cardsStr = "";
				this.cards.forEach((card) => {
					cardsStr += ` ${card.displayName}, `;
				});

				return cardsStr;
			}
		}

		let player = new Player();
		let computer = new Player();
		computer.DrawCard();
		player.DrawCard(2);

		activeGameIds.push(interaction.user.id);

		function RefreshGameEmbed() {
			return new EmbedBuilder()
				.setTitle(`Blackjack: ${interaction.user.globalName}`)
				.setColor("Blurple")
				.setFooter({
					text: `Betting $${amount}`,
					iconURL: interaction.member.displayAvatarURL(),
				}).setDescription(`
                **Dealer Cards**:${computer.StringifyCards()}???
    
                **Your Cards**:${player.StringifyCards()}
                **Card Value**: ${player.GetTotalValue()} / ${player.GetAcesLowValue()}
            
            `);
		}

		function ComputerDraw() {
			if (computer.GetAcesLowValue() <= 17) {
				computer.DrawCard();
				ComputerDraw();
			}
		}

		const actionRow = new ActionRowBuilder().addComponents(
			drawButton,
			stickButton,
			doubleButton,
			splitButton
		);

		const resp = await interaction.reply({
			embeds: [RefreshGameEmbed()],
			components: [actionRow],
		});

		async function AwaitButton() {
			const collectFilter = (x) => x.user.id === interaction.user.id;
			try {
				const c = await resp.awaitMessageComponent({
					filter: collectFilter,
					time: 120_000,
				});

				switch (c.customId) {
					case "draw":
						player.DrawCard();

						if (player.IsBust()) {
							return CheckWinConditions();
						}

						break;

					case "stick":
						return CheckWinConditions();
					case "double":
						amount *= 2;
						loseBalance = balance - amount;

						economyDB.Open();
						await economyDB.RunValues(
							"UPDATE Balance SET Balance = ? WHERE Guild = ? AND User = ?",
							[
								loseBalance,
								interaction.guild.id,
								interaction.user.id,
							]
						);
						economyDB.Close();

						player.DrawCard();
						return CheckWinConditions();

					case "split":
						break;

					default:
						break;
				}

				c.deferUpdate();
				interaction.editReply({ embeds: [RefreshGameEmbed()] });
				AwaitButton();
			} catch (e) {
				console.log(e);
				await interaction.editReply({
					content: "No action received within 2 minutes, cancelling",
					components: [],
				});
			}
		}

		await AwaitButton();

		function CheckWinConditions() {
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

			const isPlayerBlackjack = player.IsAceBust()
				? player.GetAcesLowValue() === 21
				: player.GetTotalValue() === 21;

			const amountWon = isPlayerBlackjack ? 3 * amount : 2 * amount;

			if (playerIsBust) {
				const value = player.GetAcesLowValue();

				return interaction.editReply({
					embeds: [
						new EmbedBuilder()
							.setTitle("You Lose!")
							.setColor("LightGrey")
							.setDescription(
								`You bust by ${value - 21} point${
									value - 21 > 1 ? "s" : ""
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
							.setFooter({ text: `You've won $${amountWon}` }),
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
							.setFooter({ text: `You've won $${amountWon}` }),
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

			function PlayerWin() {
				economyDB.Open();
				economyDB.RunValues(
					"UPDATE Balance SET Balance = ? WHERE Guild = ? AND User = ?",
					[
						loseBalance + amountWon,
						interaction.guild.id,
						interaction.user.id,
					]
				);
				economyDB.Close();
			}
		}

		activeGameIds.splice(activeGameIds.indexOf(interaction.user.id), 1);
	},
};
