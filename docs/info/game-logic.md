# Up and Down - Game Logic

## Glossary

- **Hand**: An instance of play where all players play exactly one card
- **Round**: Set of hands to be played. The round number determines the amount of hands, and therefore the amount of cards each player gets (in a game that goes up to 5, rounds would be 1, 2, 3, 4, 5, 4, 3, 2, 1)
- **Mesa**: The suit of highest value for the round. This is a card drawn at the beginning that is therefore out of play
- **Pinta**: The suit of second most value for a hand. This is the first card played on a hand
- **Bet**: The amount of hands a player said they would win within a round

## Game Overview

Up and Down is a game about committing to an outcome and being able to accomplish it. The players define a max hand size they will go up to (e.g., 5), so they have to play rounds from 1 to 5 and then down to 1 again. On each round, players will be able to bet how many hands they are able to win, and if they are able to fulfill their bet, they get awarded points. The player with the highest point tally in the end wins. Up and Down is played with a single deck of cards, without Jokers.

## Notation

For the instructions below, assume:

- **N** is the max hand size
- **L** is the number of players
- Players have a natural order, which is defined as **P1, P2, P3 ... PL**
- **PSK** is player K for the round, which can be from P1 to PL. The natural order is maintained, so if PS1 is P4, PS2 is P5, PS3 is P6 ... and so on until PSL is P3. This is an order only valid for the round
- **PHK** is player K for the hand, and this is an order only valid for the hand
- **PGK** is player K for the game, and this is an order valid for the entire game. If K > L, then you can rollover the players (PG(L+1) = PG1)
- **X** is the number of hands for a round

## How to Play Round X

1. Deal X cards to each player face down
2. An extra card is drawn and put face up on the board. The suit of this card is referred to as the **Mesa**
3. PS1 should be previously defined (we assume this)
4. Ask each player their bet. This is a sequential process:
   - PS1 says their bet
   - PS2 says their bet (aware of PS1's bet)
   - PS3 says their bet (aware of PS1 and PS2's bets)
   - Continue until PSL
5. **Important constraint**: The sum of the bets must not be equal to X. Therefore, PSL must establish a bet different to X - sum(bets PS1 to PSL-1)
6. Hand 1 of X is played. PS2 is set as PH1
7. Winner of hand is set as PH1 for next hand
8. Hand 2 of X is played
9. Winner of hand is set as PH1 for next hand
10. Continue until Hand X of X is played
11. Bets are verified and points are accounted for:
    - If player bets ≠ player wins: award **0 points**
    - If player bets === player wins: award **10 + 2 × (player wins) points**

## How to Play a Hand

1. PH1 and the Mesa should be previously defined (we assume this)
2. PH1 plays card R1. The suit of R1 is the **Pinta** for the rest of the hand
3. PH2 is forced to play a card of suit Pinta. If they don't have cards from Pinta, they can play any card
4. PH3 is forced to play a card of suit Pinta. If they don't have cards from Pinta, they can play any card
5. Continue until PHL plays
6. Highest card is the winner. The order of cards for a given hand is as follows:
   - **Mesa > Pinta > Remaining 2 Suits**
   - Natural ordering of cards starting from Ace: **A > K > Q > J > 10 > 9 > 8 > 7 > 6 > 5 > 4 > 3 > 2**

## Flow of the Game

1. Define N. This value cannot be bigger than floor(51/L)
2. Define the starting player at random. This player is called PG1
3. Play round 1, with PS1 as PG1
4. Play round 2, with PS1 as PG2
5. Play round 3, with PS1 as PG3
6. Continue until round N, with PS1 as PGN
7. Play round N-1, with PS1 as PGN+1
8. Play round N-2, with PS1 as PGN+2
9. Continue until round 1, with PS1 as PG(2N-1)
10. Add up points
11. Define winner

## Examples

### Example: 3 Players, Max Hand Size = 3

**Players**: Alice (P1), Bob (P2), Carol (P3)

**Round Sequence**: [1, 2, 3, 2, 1]

**Starting Player**: Bob (randomly selected as PG1)

#### Round 1 (1 card each)
- PS1 = Bob, PS2 = Carol, PS3 = Alice
- Mesa drawn: 7♠ (Spades is Mesa)
- Bets: Bob=1, Carol=0, Alice=0 (sum ≠ 1 ✓)
- Hand 1: Carol starts (PS2), plays 5♥ (Hearts is Pinta)
  - Alice plays 2♥
  - Bob plays K♥
  - Winner: Bob (K♥ highest in Pinta)
- Scores: Bob=12 (bet 1, won 1), Carol=10 (bet 0, won 0), Alice=10 (bet 0, won 0)

#### Round 2 (2 cards each)
- PS1 = Carol (PG2), PS2 = Alice, PS3 = Bob
- Mesa drawn: Q♦ (Diamonds is Mesa)
- Bets: Carol=1, Alice=1, Bob=1 (sum ≠ 2, but wait... 1+1+1=3 ≠ 2 ✓)
- Hand 1: Alice starts, plays 3♣ (Clubs is Pinta)
  - Bob plays 9♣
  - Carol plays 2♦ (no clubs, plays Diamond - Mesa suit!)
  - Winner: Carol (2♦ is Mesa, beats all)
- Hand 2: Carol starts, plays 4♥ (Hearts is Pinta)
  - Alice plays A♥
  - Bob plays 6♥
  - Winner: Alice (A♥ highest)
- Scores: Carol=12 (bet 1, won 1), Alice=12 (bet 1, won 1), Bob=0 (bet 1, won 0)

And so on...

## Strategy Tips

1. **Last player advantage**: PSL knows all other bets and can calculate exactly what sum to avoid
2. **Mesa cards are powerful**: Even a 2 of Mesa suit beats an Ace of any other suit
3. **Control the Pinta**: Going first in a hand lets you set the Pinta to a suit you're strong in
4. **Bet conservatively early**: With fewer cards, it's harder to guarantee wins
5. **Track played cards**: Remember which high cards and Mesa/Pinta cards have been played
