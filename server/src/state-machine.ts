import { GameState, PlayerAction, GameStatus, RoundState, HandState, PlayerState, Card, PlayedCard, HandResult, RoundResult } from './game-types';
import { createDeck, shuffleDeck, getRankValue } from './deck';

export class GameStateMachine {
  
  // Initialize game from waiting room
  static startGame(state: GameState, action: PlayerAction): GameState {
    if (action.type !== 'START_GAME') throw new Error('Invalid action');
    if (action.playerId !== state.adminId) throw new Error('Only admin can start game');
    if (state.status !== 'waiting') throw new Error('Game already started');
    if (state.players.length < 2) throw new Error('Need at least 2 players');

    // Generate round sequence [1,2,3...N...3,2,1]
    const roundSequence: number[] = [];
    for (let i = 1; i <= state.maxRoundSize; i++) roundSequence.push(i);
    for (let i = state.maxRoundSize - 1; i >= 1; i--) roundSequence.push(i);

    // Randomly select starting player (PG1)
    const startingPlayerIndex = Math.floor(Math.random() * state.players.length);

    return {
      ...state,
      status: 'dealing',
      roundSequence,
      startedAt: Date.now(),
      playerOrder: state.players.map(p => p.id),
      players: state.players.map((p, idx) => ({
        ...p,
        naturalOrder: idx + 1,
        hand: [],
        bet: null,
        handsWon: 0,
        totalScore: 0
      })),
      currentRound: this.initializeRound(state, 0, state.players[startingPlayerIndex].id)
    };
  }

  // Initialize a new round
  private static initializeRound(state: GameState, roundIndex: number, startingPlayerId: string): RoundState {
    const roundNumber = state.roundSequence[roundIndex];
    const cardsPerPlayer = roundNumber;
    
    // Deal cards
    const deck = shuffleDeck(createDeck());
    const mesa = deck.pop()!;
    
    // Deal to players
    const updatedPlayers = state.players.map(p => ({
      ...p,
      hand: deck.splice(0, cardsPerPlayer),
      bet: null,
      handsWon: 0
    }));

    // Update state with dealt cards
    Object.assign(state, { players: updatedPlayers });

    // Determine betting order starting from PS1
    const startIdx = state.playerOrder.indexOf(startingPlayerId);
    const bettingOrder = [
      ...state.playerOrder.slice(startIdx),
      ...state.playerOrder.slice(0, startIdx)
    ];

    return {
      roundNumber,
      roundIndex,
      cardsPerPlayer,
      mesa,
      startingPlayerId,
      bettingOrder,
      currentBettingIndex: 0,
      handsPlayed: 0,
      currentHand: null,
      completedHands: []
    };
  }

  // Transition from dealing to betting
  static startBetting(state: GameState): GameState {
    if (state.status !== 'dealing') throw new Error('Not in dealing phase');
    return { ...state, status: 'betting' };
  }

  // Handle bet placement
  static placeBet(state: GameState, action: PlayerAction): GameState {
    if (action.type !== 'PLACE_BET') throw new Error('Invalid action');
    if (state.status !== 'betting') throw new Error('Not in betting phase');
    if (!state.currentRound) throw new Error('No active round');

    const { currentRound } = state;
    const expectedPlayerId = currentRound.bettingOrder[currentRound.currentBettingIndex];
    
    if (action.playerId !== expectedPlayerId) throw new Error('Not your turn to bet');
    if (action.bet < 0 || action.bet > currentRound.cardsPerPlayer) throw new Error('Invalid bet');

    // Check last player constraint
    const isLastPlayer = currentRound.currentBettingIndex === currentRound.bettingOrder.length - 1;
    if (isLastPlayer) {
      const sumOfBets = state.players
        .filter(p => p.bet !== null)
        .reduce((sum, p) => sum + p.bet!, 0);
      if (sumOfBets + action.bet === currentRound.cardsPerPlayer) {
        throw new Error('Last player cannot make sum equal to round size');
      }
    }

    // Update player bet
    const updatedPlayers = state.players.map(p =>
      p.id === action.playerId ? { ...p, bet: action.bet } : p
    );

    const nextBettingIndex = currentRound.currentBettingIndex + 1;
    const bettingComplete = nextBettingIndex >= currentRound.bettingOrder.length;

    return {
      ...state,
      players: updatedPlayers,
      currentRound: {
        ...currentRound,
        currentBettingIndex: nextBettingIndex
      },
      status: bettingComplete ? 'playing_hand' : 'betting'
    };
  }

  // Start a new hand
  static startHand(state: GameState): GameState {
    if (state.status !== 'playing_hand') throw new Error('Not ready to play hand');
    if (!state.currentRound) throw new Error('No active round');
    if (state.currentRound.currentHand) throw new Error('Hand already in progress');

    const currentRound = state.currentRound;
    const handNumber = currentRound.handsPlayed + 1;

    // Determine hand order (PH1 is winner of previous hand, or PS2 for first hand)
    let handOrder: string[];
    if (handNumber === 1) {
      // First hand: PS2 starts
      handOrder = [
        ...currentRound.bettingOrder.slice(1),
        currentRound.bettingOrder[0]
      ];
    } else {
      // Subsequent hands: previous winner starts
      const lastHand = currentRound.completedHands[currentRound.completedHands.length - 1];
      const winnerIdx = state.playerOrder.indexOf(lastHand.winnerId);
      handOrder = [
        ...state.playerOrder.slice(winnerIdx),
        ...state.playerOrder.slice(0, winnerIdx)
      ];
    }

    return {
      ...state,
      currentRound: {
        ...currentRound,
        currentHand: {
          handNumber,
          cardsPlayed: [],
          pinta: null,
          currentPlayerIndex: 0,
          handOrder
        }
      }
    };
  }

  // Handle card play
  static playCard(state: GameState, action: PlayerAction): GameState {
    if (action.type !== 'PLAY_CARD') throw new Error('Invalid action');
    if (state.status !== 'playing_hand') throw new Error('Not in playing phase');
    if (!state.currentRound?.currentHand) throw new Error('No active hand');

    const currentRound = state.currentRound;
    const currentHand = currentRound.currentHand!; // Non-null assertion after check
    const expectedPlayerId = currentHand.handOrder[currentHand.currentPlayerIndex];

    if (action.playerId !== expectedPlayerId) throw new Error('Not your turn');

    const player = state.players.find(p => p.id === action.playerId)!;
    const cardIndex = player.hand.findIndex(c => 
      c.suit === action.card.suit && c.rank === action.card.rank
    );
    
    if (cardIndex === -1) throw new Error('Card not in hand');

    // Validate suit following rules
    if (currentHand.pinta && currentHand.cardsPlayed.length > 0) {
      const hasPinta = player.hand.some(c => c.suit === currentHand.pinta);
      if (hasPinta && action.card.suit !== currentHand.pinta) {
        throw new Error('Must follow pinta suit');
      }
    }

    // Remove card from hand
    const updatedPlayers = state.players.map(p =>
      p.id === action.playerId
        ? { ...p, hand: p.hand.filter((_, idx) => idx !== cardIndex) }
        : p
    );

    const playedCard: PlayedCard = {
      playerId: action.playerId,
      card: action.card,
      playOrder: currentHand.cardsPlayed.length + 1,
      timestamp: Date.now()
    };

    const pinta = currentHand.pinta || action.card.suit;
    const nextPlayerIndex = currentHand.currentPlayerIndex + 1;
    const handComplete = nextPlayerIndex >= currentHand.handOrder.length;

    return {
      ...state,
      players: updatedPlayers,
      currentRound: {
        ...currentRound,
        currentHand: {
          handNumber: currentHand.handNumber,
          handOrder: currentHand.handOrder,
          cardsPlayed: [...currentHand.cardsPlayed, playedCard],
          pinta,
          currentPlayerIndex: nextPlayerIndex
        }
      },
      status: handComplete ? 'hand_complete' : 'playing_hand'
    };
  }

  // Determine hand winner
  static completeHand(state: GameState): GameState {
    if (state.status !== 'hand_complete') throw new Error('Hand not complete');
    if (!state.currentRound?.currentHand) throw new Error('No active hand');

    const currentRound = state.currentRound;
    const currentHand = currentRound.currentHand!; // Non-null assertion after check
    const mesaSuit = currentRound.mesa.suit;
    const pinta = currentHand.pinta!;

    // Determine winner
    let winningCard = currentHand.cardsPlayed[0];
    let winnerId = winningCard.playerId;

    for (const played of currentHand.cardsPlayed.slice(1)) {
      if (this.compareCards(played.card, winningCard.card, mesaSuit, pinta) > 0) {
        winningCard = played;
        winnerId = played.playerId;
      }
    }

    // Update winner's handsWon
    const updatedPlayers = state.players.map(p =>
      p.id === winnerId ? { ...p, handsWon: p.handsWon + 1 } : p
    );

    const handResult: HandResult = {
      handNumber: currentHand.handNumber,
      cardsPlayed: currentHand.cardsPlayed,
      pinta: pinta,
      winnerId,
      winningCard: winningCard.card,
      timestamp: Date.now()
    };

    const roundComplete = currentRound.handsPlayed + 1 >= currentRound.cardsPerPlayer;

    return {
      ...state,
      players: updatedPlayers,
      currentRound: {
        ...currentRound,
        handsPlayed: currentRound.handsPlayed + 1,
        currentHand: null,
        completedHands: [...currentRound.completedHands, handResult]
      },
      status: roundComplete ? 'round_complete' : 'playing_hand'
    };
  }

  // Compare two cards (returns positive if card1 wins)
  private static compareCards(card1: Card, card2: Card, mesa: string, pinta: string): number {
    const getSuitPriority = (suit: string) => {
      if (suit === mesa) return 3;
      if (suit === pinta) return 2;
      return 1;
    };

    const priority1 = getSuitPriority(card1.suit);
    const priority2 = getSuitPriority(card2.suit);

    if (priority1 !== priority2) return priority1 - priority2;
    return getRankValue(card1.rank) - getRankValue(card2.rank);
  }

  // Complete round and calculate scores
  static completeRound(state: GameState): GameState {
    if (state.status !== 'round_complete') throw new Error('Round not complete');
    if (!state.currentRound) throw new Error('No active round');

    const { currentRound } = state;

    // Calculate scores
    const scores = state.players.map(p => {
      const points = p.bet === p.handsWon ? 10 + 2 * p.handsWon : 0;
      return {
        playerId: p.id,
        handsWon: p.handsWon,
        points
      };
    });

    // Update total scores
    const updatedPlayers = state.players.map(p => {
      const score = scores.find(s => s.playerId === p.id)!;
      return { ...p, totalScore: p.totalScore + score.points };
    });

    const roundResult: RoundResult = {
      roundNumber: currentRound.roundNumber,
      roundIndex: currentRound.roundIndex,
      cardsPerPlayer: currentRound.cardsPerPlayer,
      mesa: currentRound.mesa,
      startingPlayerId: currentRound.startingPlayerId,
      bets: state.players.map(p => ({ playerId: p.id, bet: p.bet! })),
      hands: currentRound.completedHands,
      scores,
      timestamp: Date.now()
    };

    const nextRoundIndex = currentRound.roundIndex + 1;
    const gameComplete = nextRoundIndex >= state.roundSequence.length;

    if (gameComplete) {
      return {
        ...state,
        players: updatedPlayers,
        status: 'game_complete',
        completedAt: Date.now(),
        completedRounds: [...state.completedRounds, roundResult],
        currentRound: null
      };
    }

    // Determine next starting player (PG(roundIndex+1))
    const nextStartingPlayerIndex = nextRoundIndex % state.playerOrder.length;
    const nextStartingPlayerId = state.playerOrder[nextStartingPlayerIndex];

    return {
      ...state,
      players: updatedPlayers,
      status: 'dealing',
      completedRounds: [...state.completedRounds, roundResult],
      currentRound: this.initializeRound(
        { ...state, players: updatedPlayers },
        nextRoundIndex,
        nextStartingPlayerId
      )
    };
  }

  // Main action dispatcher
  static processAction(state: GameState, action: PlayerAction): GameState {
    switch (action.type) {
      case 'START_GAME':
        return this.startGame(state, action);
      case 'PLACE_BET':
        return this.placeBet(state, action);
      case 'PLAY_CARD':
        return this.playCard(state, action);
      default:
        throw new Error('Unknown action type');
    }
  }

  // Auto-transition states that don't require player input
  static autoTransition(state: GameState): GameState {
    switch (state.status) {
      case 'dealing':
        return this.startBetting(state);
      case 'playing_hand':
        if (!state.currentRound?.currentHand) {
          return this.startHand(state);
        }
        return state;
      case 'hand_complete':
        return this.completeHand(state);
      case 'round_complete':
        return this.completeRound(state);
      default:
        return state;
    }
  }
}
